from typing import Optional
from datetime import datetime, date
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, UniqueConstraint, Column, String, Integer
from sqlalchemy import CheckConstraint, ForeignKey
from sqlalchemy.dialects.mssql import UNIQUEIDENTIFIER
from app.enums import RegionEnum, RuleTypeEnum, UserRoleEnum, ScnEnum


class WorkpackageTemplate(SQLModel, table=True):
    """工作包模板表"""
    
    __tablename__ = "workpackage_templates"
    __table_args__ = (
        UniqueConstraint("sequence_order", name="uq_template_sequence"),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, nullable=False)
    sequence_order: int = Field(nullable=False)
    status: bool = Field(default=True, nullable=False)  # True=启用, False=禁用


class CM(SQLModel, table=True):
    """销售经理表"""
    
    __tablename__ = "CM"
    __table_args__ = (
        CheckConstraint("region IN ('CCN1', 'CCN2', 'CCN3', 'CCN4')", name="ck_cm_region"),
        CheckConstraint("role IN ('cm', 'lcm')", name="ck_cm_role"),
        CheckConstraint(
            "(scnx IS NULL) OR (scnx IN ('SCN1', 'SCN2'))",
            name="ck_cm_scnx_valid",
        ),
    )
    
    nt_account: str = Field(sa_column=Column(String(50), primary_key=True))
    name: str = Field(max_length=100, nullable=False)
    region: RegionEnum = Field(nullable=False)
    role: UserRoleEnum = Field(
        default=UserRoleEnum.CM,
        sa_column=Column(String(10), nullable=False, default=UserRoleEnum.CM.value),
    )
    scnx: Optional[ScnEnum] = Field(
        default=None,
        sa_column=Column(String(10), nullable=True),
    )


class Customer(SQLModel, table=True):
    """客户信息表"""
    
    __tablename__ = "Customer"
    
    id: Optional[int] = Field(
        default=None,
        sa_column=Column("id", Integer, primary_key=True, autoincrement=True),
    )
    customer_name: str = Field(max_length=200, nullable=False)
    remark: Optional[str] = Field(default=None, max_length=500)
    cm_id: str = Field(
        sa_column=Column("cm_id", String(50), ForeignKey("CM.nt_account"), nullable=False)
    )
    lcm_id: str = Field(
        sa_column=Column("lcm_id", String(50), ForeignKey("CM.nt_account"), nullable=False)
    )


class DueDateRule(SQLModel, table=True):
    """到期日期规则表"""
    
    __tablename__ = "DueDateRule"
    __table_args__ = (
        UniqueConstraint("customer_id", "template_id", name="uq_rule_customer_template"),
    )
    
    id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int = Field(
        sa_column=Column("customer_id", Integer, ForeignKey("Customer.id"), nullable=False)
    )
    template_id: int = Field(
        sa_column=Column("template_id", Integer, ForeignKey("workpackage_templates.id"), nullable=False)
    )
    rule_type: RuleTypeEnum = Field(nullable=False)
    
    # 固定日期规则参数
    day_of_month: Optional[int] = Field(default=None)
    
    # 第N个星期X规则参数
    nth: Optional[int] = Field(default=None)
    weekday: Optional[int] = Field(default=None)
    
    # 月末偏移规则参数
    offset: Optional[int] = Field(default=None)
    

class Invoice(SQLModel, table=True):
    """发票表"""
    
    __tablename__ = "Invoice"
    
    id: str = Field(sa_column=Column(String(50), primary_key=True))
    customer_id: int = Field(
        sa_column=Column("customer_id", Integer, ForeignKey("Customer.id"), nullable=False)
    )
    cm_id: str = Field(
        sa_column=Column("cm_id", String(50), ForeignKey("CM.nt_account"), nullable=False)
    )
    lcm_id: str = Field(
        sa_column=Column("lcm_id", String(50), ForeignKey("CM.nt_account"), nullable=False)
    )
    region: str = Field(max_length=50, nullable=False)
    ile: str = Field(max_length=100, nullable=False)
    bn_release_status: str = Field(max_length=50, nullable=False)
    status_comment: Optional[str] = Field(default=None, max_length=500)
    progress: str = Field(max_length=50, nullable=False)
    current_workpackage: Optional[str] = Field(default=None, max_length=100)
    created_time: datetime = Field(nullable=False)


class Workpackage(SQLModel, table=True):
    """工作包表"""
    
    __tablename__ = "Workpackage"
    __table_args__ = (
        UniqueConstraint("invoice_id", "template_id", name="uq_workpackage_invoice_template"),
    )
    
    id: UUID = Field(
        default_factory=uuid4,
        sa_column=Column(UNIQUEIDENTIFIER, primary_key=True, default=uuid4)
    )
    invoice_id: str = Field(
        sa_column=Column("invoice_id", String(50), ForeignKey("Invoice.id"), nullable=False)
    )
    template_id: int = Field(
        sa_column=Column("template_id", ForeignKey("workpackage_templates.id"), nullable=False)
    )
    due_date: Optional[date] = Field(default=None)
    actual_date: Optional[date] = Field(default=None)
    is_completed: bool = Field(default=False, nullable=False)
    remark: Optional[str] = Field(default=None, max_length=500)

