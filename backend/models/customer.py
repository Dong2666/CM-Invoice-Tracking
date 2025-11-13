# models/customer.py
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
from .user import User

class Customer(Base):
    __tablename__ = "customer"

    id = Column(String(50), primary_key=True, index=True)  # e.g., "CUST-2025-001"
    ile_customer = Column(String(100), nullable=False)
    remark = Column(Text)
    region = Column(String(10), ForeignKey("region.code"), nullable=False)

    assignment = relationship("CustomerAssignment", back_populates="customer", uselist=False)
    rules = relationship("DueDateRule", back_populates="customer", cascade="all, delete-orphan")

class CustomerAssignment(Base):
    __tablename__ = "customer_assignment"

    customer_id = Column(String(50), ForeignKey("customer.id"), primary_key=True)
    cm_user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    lcm_user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="assignment")
    cm_user = relationship("User", foreign_keys=[cm_user_id], back_populates="assigned_customers")
    lcm_user = relationship("User", foreign_keys=[lcm_user_id], back_populates="managed_customers")

    # models/rule.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship, polymorphic_identity
from sqlalchemy.ext.declarative import declared_attr
from .base import Base
from .enums import Weekday

class DueDateRule(Base):
    __tablename__ = "due_date_rule"
    __mapper_args__ = {
        "polymorphic_on": "rule_type",
        "polymorphic_identity": "base"
    }

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), ForeignKey("customer.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("workpackage_template.id"), nullable=False)
    rule_type = Column(String(20), nullable=False)  # fixed_day | nth_weekday | last_day_offset

    # 共享字段
    days_from_month_start = Column(Integer, nullable=False)
    is_next_month = Column(Boolean, nullable=False, default=False)

    customer = relationship("Customer", back_populates="rules")
    template = relationship("WorkpackageTemplate", back_populates="rules")

    # 子类共享方法
    def calculate_due_date(self, ref_month):
        raise NotImplementedError("Subclasses must implement calculate_due_date")

class FixedDayRule(DueDateRule):
    __mapper_args__ = {
        "polymorphic_identity": "fixed_day"
    }

    day_of_month = Column(Integer, nullable=False)

    def calculate_due_date(self, ref_month):
        from calendar import monthrange
        year, month = ref_month.year, ref_month.month
        try:
            return datetime(year, month, self.day_of_month).date()
        except ValueError:
            last_day = monthrange(year, month)[1]
            return datetime(year, month, last_day).date()

class NthWeekdayRule(DueDateRule):
    __mapper_args__ = {
        "polymorphic_identity": "nth_weekday"
    }

    nth = Column(Integer, nullable=False)
    weekday = Column(Integer, nullable=False)  # 0=Monday...6=Sunday

    def calculate_due_date(self, ref_month):
        from calendar import monthrange
        year, month = ref_month.year, ref_month.month
        first_day = datetime(year, month, 1).weekday()
        offset = (self.weekday - first_day) % 7
        target_day = 1 + offset + (self.nth - 1) * 7
        last_day = monthrange(year, month)[1]
        if target_day > last_day:
            # 找该月最后一个该星期几
            for day in range(last_day, 0, -1):
                if datetime(year, month, day).weekday() == self.weekday:
                    return datetime(year, month, day).date()
        return datetime(year, month, target_day).date()

class LastDayOffsetRule(DueDateRule):
    __mapper_args__ = {
        "polymorphic_identity": "last_day_offset"
    }

    offset = Column(Integer, nullable=False)  # -1: 最后1天, -2: 倒数第2天...

    def calculate_due_date(self, ref_month):
        from calendar import monthrange
        year, month = ref_month.year, ref_month.month
        last_day = monthrange(year, month)[1]
        target_day = last_day + self.offset
        if target_day < 1:
            target_day = 1
        return datetime(year, month, target_day).date()

# 添加数据库约束（在迁移脚本中执行）
# CREATE TABLE due_date_rule (
#   ...
#   CHECK (
#     (rule_type = 'fixed_day' AND day_of_month IS NOT NULL AND nth IS NULL AND weekday IS NULL AND offset IS NULL)
#     OR

#     (rule_type = 'nth_weekday' AND day_of_month IS NULL AND nth IS NOT NULL AND weekday IS NOT NULL AND offset IS NULL)
#     OR
#     (rule_type = 'last_day_offset' AND day_of_month IS NULL AND nth IS NULL AND weekday IS NULL AND offset IS NOT NULL)
#   )
# );