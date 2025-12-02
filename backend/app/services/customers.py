"""客户相关业务逻辑"""
from sqlmodel import Session, select
from sqlalchemy import func
from app.models import Customer, DueDateRule
from app.schemas import CustomerCreate, CustomerUpdate, DueDateRuleCreate
from app.enums import UserRoleEnum
from app.services.users import UserService


class CustomerService:
    """客户服务类"""
    
    @staticmethod
    def get_all(db: Session) -> list[Customer]:
        """获取所有客户"""
        return db.exec(select(Customer)).all()

    @staticmethod
    def list_paginated(db: Session, page: int, size: int) -> dict:
        """分页获取客户列表"""
        count_result = db.exec(select(func.count()).select_from(Customer)).one()
        total = int(count_result) if count_result is not None else 0
        offset = (page - 1) * size

        customers = db.exec(
            select(Customer)
            .order_by(Customer.id)
            .offset(offset)
            .limit(size)
        ).all()

        pages = max(1, (total + size - 1) // size) if total > 0 else 1

        return {
            "items": customers,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
        }
    
    @staticmethod
    def get_by_id(db: Session, customer_id: int) -> Customer | None:
        """根据ID获取客户"""
        return db.get(Customer, customer_id)
    
    @staticmethod
    def create(db: Session, customer: CustomerCreate) -> Customer:
        """创建客户"""
        customer_data = customer.model_dump()
        UserService.ensure_user_role(
            db, customer_data["cm_id"], (UserRoleEnum.CM,), "CM"
        )
        UserService.ensure_user_role(
            db, customer_data["lcm_id"], (UserRoleEnum.LCM,), "LCM"
        )
        db_customer = Customer(**customer_data)
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        return db_customer
    
    @staticmethod
    def update(db: Session, customer_id: int, customer_update: CustomerUpdate) -> Customer | None:
        """更新客户"""
        db_customer = db.get(Customer, customer_id)
        if not db_customer:
            return None
        
        update_data = customer_update.model_dump(exclude_unset=True)
        if "cm_id" in update_data:
            UserService.ensure_user_role(
                db, update_data["cm_id"], (UserRoleEnum.CM,), "CM"
            )
        if "lcm_id" in update_data:
            UserService.ensure_user_role(
                db, update_data["lcm_id"], (UserRoleEnum.LCM,), "LCM"
            )
        for key, value in update_data.items():
            setattr(db_customer, key, value)
        
        db.add(db_customer)
        db.commit()
        db.refresh(db_customer)
        return db_customer
    
    @staticmethod
    def delete(db: Session, customer_id: int) -> bool:
        """删除客户"""
        db_customer = db.get(Customer, customer_id)
        if not db_customer:
            return False
        
        db.delete(db_customer)
        db.commit()
        return True
    
    @staticmethod
    def get_rules(db: Session, customer_id: int) -> list[DueDateRule]:
        """获取客户的所有规则"""
        rules = db.exec(
            select(DueDateRule)
            .where(DueDateRule.customer_id == customer_id)
            .order_by(DueDateRule.template_id)
        ).all()
        return rules
    
    @staticmethod
    def set_rules(db: Session, customer_id: int, rules: list[DueDateRuleCreate]) -> list[DueDateRule]:
        """
        设置客户的规则（幂等操作）
        
        删除现有规则，创建新规则
        """
        # 获取现存规则
        existing_rules = db.exec(
            select(DueDateRule).where(DueDateRule.customer_id == customer_id)
        ).all()
        existing_map = {rule.template_id: rule for rule in existing_rules}

        # 去重：保留最后提交的那组（按原数组顺序 dedup）
        seen_template_ids = {}
        deduplicated_rules = []
        for rule_data in reversed(rules):
            template_id = rule_data.template_id
            if template_id not in seen_template_ids:
                seen_template_ids[template_id] = True
                deduplicated_rules.append(rule_data)
        deduplicated_rules.reverse()

        updated_rules = []
        processed_template_ids = set()

        def build_payload(rule_data: DueDateRuleCreate) -> dict:
            payload = {
                "customer_id": customer_id,
                "template_id": rule_data.template_id,
                "rule_type": rule_data.rule_type,
                "day_of_month": rule_data.day_of_month,
                "nth": rule_data.nth,
                "weekday": rule_data.weekday,
                "offset": rule_data.offset,
            }
            return payload

        for rule_data in deduplicated_rules:
            template_id = rule_data.template_id
            payload = build_payload(rule_data)
            processed_template_ids.add(template_id)

            if existing := existing_map.get(template_id):
                for key, value in payload.items():
                    setattr(existing, key, value)
                db.add(existing)
                updated_rules.append(existing)
            else:
                db_rule = DueDateRule(**payload)
                db.add(db_rule)
                updated_rules.append(db_rule)

        # 删除那些未在本次提交里出现的旧规则
        for template_id, rule in existing_map.items():
            if template_id not in processed_template_ids:
                db.delete(rule)

        db.commit()

        for rule in updated_rules:
            db.refresh(rule)

        return updated_rules




