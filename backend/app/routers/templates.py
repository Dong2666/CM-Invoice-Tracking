"""工作包模板路由"""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db import get_db
from app.models import WorkpackageTemplate
from app.schemas import WorkpackageTemplateCreate, WorkpackageTemplateRead, WorkpackageTemplateUpdate

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=list[WorkpackageTemplateRead])
def list_templates(db: Session = Depends(get_db)):
    """获取所有工作包模板列表（按顺序排序）"""
    templates = db.exec(
        select(WorkpackageTemplate).order_by(WorkpackageTemplate.sequence_order)
    ).all()
    return templates


@router.get("/{template_id}", response_model=WorkpackageTemplateRead)
def get_template(template_id: int, db: Session = Depends(get_db)):
    """获取指定工作包模板详情"""
    template = db.get(WorkpackageTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="模板不存在")
    return template


@router.post("", response_model=WorkpackageTemplateRead, status_code=201)
def create_template(
    template: WorkpackageTemplateCreate,
    db: Session = Depends(get_db)
):
    """创建新的工作包模板"""
    # 检查顺序是否已存在
    existing = db.exec(
        select(WorkpackageTemplate).where(
            WorkpackageTemplate.sequence_order == template.sequence_order
        )
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"顺序号 {template.sequence_order} 已被使用"
        )
    
    try:
        db_template = WorkpackageTemplate(**template.model_dump())
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{template_id}", response_model=WorkpackageTemplateRead)
def update_template(
    template_id: int,
    template_update: WorkpackageTemplateUpdate,
    db: Session = Depends(get_db)
):
    """更新工作包模板"""
    db_template = db.get(WorkpackageTemplate, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="模板不存在")
    
    # 如果更新顺序号，检查新顺序是否已被其他模板使用
    if template_update.sequence_order is not None:
        existing = db.exec(
            select(WorkpackageTemplate).where(
                WorkpackageTemplate.sequence_order == template_update.sequence_order,
                WorkpackageTemplate.id != template_id
            )
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"顺序号 {template_update.sequence_order} 已被其他模板使用"
            )
    
    # 更新字段
    update_data = template_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    try:
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """删除工作包模板"""
    db_template = db.get(WorkpackageTemplate, template_id)
    if not db_template:
        raise HTTPException(status_code=404, detail="模板不存在")
    
    try:
        db.delete(db_template)
        db.commit()
        return None
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))









