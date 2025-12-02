from datetime import datetime, date
from uuid import UUID
from typing import Generic, TypeVar, Any, Optional
from pydantic import BaseModel
from app.enums import RegionEnum, RuleTypeEnum, UserRoleEnum, ScnEnum

# 分页响应
T = TypeVar('T')

class PageResponse(BaseModel, Generic[T]):
    """分页响应"""
    items: list[T]
    total: int
    page: int
    size: int
    pages: int


# 统一错误响应
class ErrorResponse(BaseModel):
    """统一错误响应格式"""
    code: int
    message: str
    details: Optional[Any] = None


# ============= WorkpackageTemplate Schemas =============

class WorkpackageTemplateBase(BaseModel):
    """工作包模板基础模型"""
    name: str
    sequence_order: int
    status: bool = True


class WorkpackageTemplateCreate(WorkpackageTemplateBase):
    """创建工作包模板"""
    pass


class WorkpackageTemplateUpdate(BaseModel):
    """更新工作包模板"""
    name: str | None = None
    sequence_order: int | None = None
    status: bool | None = None


class WorkpackageTemplateRead(WorkpackageTemplateBase):
    """读取工作包模板"""
    id: int
    
    class Config:
        from_attributes = True


# ============= User Schemas =============

class UserBase(BaseModel):
    """用户基础模型"""
    nt_account: str
    name: str
    region: RegionEnum
    role: UserRoleEnum = UserRoleEnum.CM
    scnx: ScnEnum | None = None


class UserCreate(UserBase):
    """创建用户"""
    pass


class UserUpdate(BaseModel):
    """更新用户"""
    nt_account: str | None = None
    name: str | None = None
    region: RegionEnum | None = None
    role: UserRoleEnum | None = None
    scnx: ScnEnum | None = None


class UserRead(UserBase):
    """读取用户"""
    
    class Config:
        from_attributes = True


class UserListItem(BaseModel):
    """用户列表项（统一）"""
    role: UserRoleEnum
    id: str
    nt_account: str
    name: str
    region: RegionEnum
    scnx: ScnEnum | None = None

# ============= Customer Schemas =============

class CustomerBase(BaseModel):
    """客户基础模型"""
    id: int
    customer_name: str
    remark: str | None = None
    cm_id: str
    lcm_id: str


class CustomerCreate(BaseModel):
    """创建客户"""
    customer_name: str
    remark: str | None = None
    cm_id: str
    lcm_id: str


class CustomerUpdate(BaseModel):
    """更新客户"""
    customer_name: str | None = None
    remark: str | None = None
    cm_id: str | None = None
    lcm_id: str | None = None


class CustomerRead(CustomerBase):
    """读取客户"""
    
    class Config:
        from_attributes = True


# ============= DueDateRule Schemas =============

class DueDateRuleBase(BaseModel):
    """到期日期规则基础模型"""
    template_id: int
    rule_type: RuleTypeEnum
    day_of_month: int | None = None
    nth: int | None = None
    weekday: int | None = None
    offset: int | None = None


class DueDateRuleCreate(DueDateRuleBase):
    """创建到期日期规则"""
    customer_id: int


class DueDateRuleUpdate(BaseModel):
    """更新到期日期规则"""
    rule_type: RuleTypeEnum | None = None
    day_of_month: int | None = None
    nth: int | None = None
    weekday: int | None = None
    offset: int | None = None


class DueDateRuleRead(DueDateRuleBase):
    """读取到期日期规则"""
    id: int
    customer_id: int
    
    class Config:
        from_attributes = True


# ============= Invoice Schemas =============

class InvoiceBase(BaseModel):
    """发票基础模型"""
    id: str
    customer_id: int
    cm_id: str
    lcm_id: str
    region: str
    ile: str
    bn_release_status: str
    status_comment: str | None = None
    created_time: datetime


class InvoiceCreate(BaseModel):
    """创建发票（简化输入）"""
    id: str
    customer_id: int
    cm_id: str
    lcm_id: str
    region: str
    ile: str
    bn_release_status: str
    status_comment: str | None = None
    created_time: datetime


class InvoiceUpdate(BaseModel):
    """更新发票"""
    customer_id: int | None = None
    cm_id: str | None = None
    lcm_id: str | None = None
    region: str | None = None
    ile: str | None = None
    bn_release_status: str | None = None
    status_comment: str | None = None
    progress: str | None = None
    current_workpackage: str | None = None


class InvoiceRead(BaseModel):
    """读取发票（含计算字段）"""
    id: str
    customer_id: int
    cm_id: str
    lcm_id: str
    region: str
    ile: str
    bn_release_status: str
    status_comment: str | None = None
    progress: str
    current_workpackage: str | None = None
    created_time: datetime
    workpackages: list["WorkpackageRead"] = []
    
    class Config:
        from_attributes = True


# ============= Workpackage Schemas =============

class WorkpackageBase(BaseModel):
    """工作包基础模型"""
    invoice_id: str
    template_id: int
    due_date: date | None = None
    actual_date: date | None = None
    is_completed: bool = False
    remark: str | None = None


class WorkpackageCreate(WorkpackageBase):
    """创建工作包"""
    pass


class WorkpackageUpdate(BaseModel):
    """更新工作包（只允许更新 actual_date 和 remark）"""
    actual_date: date | None = None
    remark: str | None = None


class WorkpackageRead(WorkpackageBase):
    """读取工作包（含模板信息）"""
    id: UUID
    template_name: str | None = None  # 模板名称（用于前端显示）
    template_sequence: int | None = None  # 模板序号（用于前端排序）
    
    class Config:
        from_attributes = True



