"""客户相关路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from app.db import get_db
from app.schemas import (
    CustomerCreate,
    CustomerRead,
    CustomerUpdate,
    DueDateRuleCreate,
    DueDateRuleRead,
    PageResponse,
)
from app.services.customers import CustomerService

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.get("", response_model=PageResponse[CustomerRead])
def list_customers(
    page: int = Query(1, ge=1, description="页码，从1开始"),
    size: int = Query(20, ge=1, le=50, description="每页数量（最大50）"),
    db: Session = Depends(get_db),
):
    """获取客户列表（分页）"""
    result = CustomerService.list_paginated(db, page, size)
    return PageResponse(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"],
    )


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """获取指定客户详情"""
    customer = CustomerService.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    return customer


@router.post("", response_model=CustomerRead, status_code=201)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db)
):
    """创建新客户"""
    # 新主键自增，不再需要 ID 冲突校验
    
    try:
        return CustomerService.create(db, customer)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{customer_id}", response_model=CustomerRead)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db)
):
    """更新客户信息"""
    customer = CustomerService.update(db, customer_id, customer_update)
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    return customer


@router.delete("/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """删除客户"""
    success = CustomerService.delete(db, customer_id)
    if not success:
        raise HTTPException(status_code=404, detail="客户不存在")
    return None


# ============= 客户规则管理 =============

@router.get("/{customer_id}/rules", response_model=list[DueDateRuleRead])
def get_customer_rules(customer_id: int, db: Session = Depends(get_db)):
    """获取客户的所有到期日期规则"""
    # 先检查客户是否存在
    customer = CustomerService.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    rules = CustomerService.get_rules(db, customer_id)
    return rules


@router.put("/{customer_id}/rules", response_model=list[DueDateRuleRead])
def set_customer_rules(
    customer_id: int,
    rules: list[DueDateRuleCreate],
    db: Session = Depends(get_db)
):
    """
    设置客户的到期日期规则（幂等操作）
    
    会删除现有规则并创建新规则，确保规则与提交的数据一致
    """
    # 先检查客户是否存在
    customer = CustomerService.get_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="客户不存在")
    
    try:
        new_rules = CustomerService.set_rules(db, customer_id, rules)
        return new_rules
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
