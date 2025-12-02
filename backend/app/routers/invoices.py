"""发票相关路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from sqlmodel import select
from typing import Optional
from app.db import get_db
from app.schemas import (
    InvoiceCreate, InvoiceRead, InvoiceUpdate,
    WorkpackageRead, WorkpackageUpdate, PageResponse
)
from app.services.invoices import InvoiceService
from app.models import Workpackage, WorkpackageTemplate

router = APIRouter(prefix="/api/invoices", tags=["invoices"])


def enrich_workpackages_with_template_info(workpackages: list, db: Session) -> list:
    """
    为工作包列表添加模板信息（name和sequence_order）并按sequence_order排序
    """
    # 获取所有模板
    templates = db.exec(select(WorkpackageTemplate)).all()
    template_dict = {t.id: t for t in templates}
    
    # 添加模板信息
    enriched_workpackages = []
    for wp in workpackages:
        wp_dict = WorkpackageRead.model_validate(wp).model_dump()
        if wp.template_id in template_dict:
            template = template_dict[wp.template_id]
            wp_dict["template_name"] = template.name
            wp_dict["template_sequence"] = template.sequence_order
        enriched_workpackages.append(wp_dict)
    
    # 按sequence_order排序
    enriched_workpackages.sort(key=lambda x: x.get("template_sequence", 9999))
    
    return enriched_workpackages


@router.post("", response_model=InvoiceRead, status_code=201)
def create_invoice(
    invoice: InvoiceCreate,
    db: Session = Depends(get_db)
):
    """
    创建发票并自动生成工作包
    
    根据客户的规则和模板自动生成工作包的due_date
    """
    try:
        db_invoice = InvoiceService.create_invoice_with_workpackages(db, invoice)
        
        # 重新查询以获取完整的关联数据
        result = InvoiceService.get_invoice_with_workpackages(db, db_invoice.id)
        if result:
            invoice_obj, workpackages = result
            
            # 添加模板信息并排序
            enriched_workpackages = enrich_workpackages_with_template_info(workpackages, db)
            
            # 构建响应
            invoice_dict = {
                "id": invoice_obj.id,
                "customer_id": invoice_obj.customer_id,
                "cm_id": invoice_obj.cm_id,
                "lcm_id": invoice_obj.lcm_id,
                "region": invoice_obj.region,
                "ile": invoice_obj.ile,
                "bn_release_status": invoice_obj.bn_release_status,
                "status_comment": invoice_obj.status_comment,
                "progress": invoice_obj.progress,
                "current_workpackage": invoice_obj.current_workpackage,
                "created_time": invoice_obj.created_time,
                "workpackages": enriched_workpackages
            }
            
            return invoice_dict
        
        return db_invoice
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=PageResponse[InvoiceRead])
def list_invoices(
    page: int = Query(1, ge=1, description="页码，从1开始"),
    size: int = Query(20, ge=1, le=100, description="每页数量"),
    created_from: Optional[str] = Query(None, description="创建时间起（YYYY-MM格式）"),
    created_to: Optional[str] = Query(None, description="创建时间止（YYYY-MM格式）"),
    ile: Optional[str] = Query(None, description="ILE筛选"),
    cm: Optional[str] = Query(None, description="CM ID筛选"),
    status: Optional[str] = Query(None, description="BN Release Status筛选"),
    progress: Optional[str] = Query(None, description="Progress筛选（Normal/Abnormal/Done）"),
    current_step: Optional[int] = Query(None, ge=1, le=4, description="当前步骤筛选（1-4）"),
    db: Session = Depends(get_db)
):
    """
    获取发票列表（分页和筛选）
    
    支持多种筛选条件和分页
    """
    result = InvoiceService.list_invoices(
        db=db,
        page=page,
        size=size,
        created_from=created_from,
        created_to=created_to,
        ile=ile,
        cm=cm,
        status=status,
        progress=progress,
        current_step=current_step
    )
    
    # 为每个发票加载工作包并添加模板信息
    items_with_workpackages = []
    for invoice in result["items"]:
        result_data = InvoiceService.get_invoice_with_workpackages(db, invoice.id)
        if result_data:
            invoice_obj, workpackages = result_data
            
            # 添加模板信息并排序
            enriched_workpackages = enrich_workpackages_with_template_info(workpackages, db)
            
            invoice_dict = {
                "id": invoice_obj.id,
                "customer_id": invoice_obj.customer_id,
                "cm_id": invoice_obj.cm_id,
                "lcm_id": invoice_obj.lcm_id,
                "region": invoice_obj.region,
                "ile": invoice_obj.ile,
                "bn_release_status": invoice_obj.bn_release_status,
                "status_comment": invoice_obj.status_comment,
                "progress": invoice_obj.progress,
                "current_workpackage": invoice_obj.current_workpackage,
                "created_time": invoice_obj.created_time,
                "workpackages": enriched_workpackages
            }
            items_with_workpackages.append(invoice_dict)
    
    return PageResponse(
        items=items_with_workpackages,
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"]
    )


@router.get("/{invoice_id}", response_model=InvoiceRead)
def get_invoice(
    invoice_id: str,
    db: Session = Depends(get_db)
):
    """获取发票详情（含工作包）"""
    result = InvoiceService.get_invoice_with_workpackages(db, invoice_id)
    
    if not result:
        raise HTTPException(status_code=404, detail=f"发票 {invoice_id} 不存在")
    
    invoice, workpackages = result
    
    # 添加模板信息并排序
    enriched_workpackages = enrich_workpackages_with_template_info(workpackages, db)
    
    invoice_dict = {
        "id": invoice.id,
        "customer_id": invoice.customer_id,
        "cm_id": invoice.cm_id,
        "lcm_id": invoice.lcm_id,
        "region": invoice.region,
        "ile": invoice.ile,
        "bn_release_status": invoice.bn_release_status,
        "status_comment": invoice.status_comment,
        "progress": invoice.progress,
        "current_workpackage": invoice.current_workpackage,
        "created_time": invoice.created_time,
        "workpackages": enriched_workpackages
    }
    
    return invoice_dict


@router.put("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(
    invoice_id: str,
    invoice_update: InvoiceUpdate,
    db: Session = Depends(get_db)
):
    """
    更新发票
    
    允许更新 bn_release_status、status_comment 等字段
    """
    db_invoice = InvoiceService.update_invoice(db, invoice_id, invoice_update)
    
    if not db_invoice:
        raise HTTPException(status_code=404, detail=f"发票 {invoice_id} 不存在")
    
    # 重新查询以获取完整的关联数据
    result = InvoiceService.get_invoice_with_workpackages(db, invoice_id)
    if result:
        invoice_obj, workpackages = result
        
        # 添加模板信息并排序
        enriched_workpackages = enrich_workpackages_with_template_info(workpackages, db)
        
        invoice_dict = {
            "id": invoice_obj.id,
            "customer_id": invoice_obj.customer_id,
            "cm_id": invoice_obj.cm_id,
            "lcm_id": invoice_obj.lcm_id,
            "region": invoice_obj.region,
            "ile": invoice_obj.ile,
            "bn_release_status": invoice_obj.bn_release_status,
            "status_comment": invoice_obj.status_comment,
            "progress": invoice_obj.progress,
            "current_workpackage": invoice_obj.current_workpackage,
            "created_time": invoice_obj.created_time,
            "workpackages": enriched_workpackages
        }
        
        return invoice_dict
    
    return db_invoice


@router.delete("/{invoice_id}", status_code=204)
def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db)
):
    """删除发票（及其关联的工作包）"""
    success = InvoiceService.delete_invoice(db, invoice_id)
    
    if not success:
        raise HTTPException(status_code=404, detail=f"发票 {invoice_id} 不存在")
    
    return None


@router.put("/{invoice_id}/workpackages/{workpackage_id}", response_model=WorkpackageRead)
def update_workpackage(
    invoice_id: str,
    workpackage_id: str,
    workpackage_update: WorkpackageUpdate,
    db: Session = Depends(get_db)
):
    """
    更新工作包（Mark as Complete）
    
    - 只能更新 actual_date 和 remark
    - 设置 actual_date 后自动标记为 is_completed=True
    - 更新后自动重新计算发票的 progress 和 current_workpackage
    """
    workpackage, error_msg = InvoiceService.update_workpackage(
        db, invoice_id, workpackage_id, workpackage_update
    )
    
    if error_msg:
        raise HTTPException(status_code=404, detail=error_msg)
    
    return workpackage
