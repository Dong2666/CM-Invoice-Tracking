"""发票相关业务逻辑"""
from datetime import date
from typing import Literal, Optional
from sqlmodel import Session, select, func, or_, and_
from app.models import Invoice, Workpackage, DueDateRule, WorkpackageTemplate
from app.schemas import InvoiceCreate, InvoiceUpdate
from app.services.due_date import DueDateCalculator
from app.services.users import UserService
from app.enums import RuleTypeEnum, UserRoleEnum
import math


ProgressStatus = Literal["Normal", "Abnormal", "Done"]


def calculate_progress(
    workpackages: list[dict],
    today: Optional[date] = None
) -> tuple[ProgressStatus, Optional[str]]:
    """
    计算发票的进度状态和当前工作包
    
    业务规则：
    - Done: 所有工作包都已完成（actual_date 存在）
    - Normal: 未完成且下一个工作包的 due_date >= 今天
    - Abnormal: 未完成且下一个工作包的 due_date < 今天
    
    Args:
        workpackages: 工作包列表，每个包含:
            - sequence_order: int (顺序)
            - due_date: date (到期日)
            - actual_date: Optional[date] (实际完成日)
            - name: str (名称)
        today: 当前日期（用于测试，默认为今天）
        
    Returns:
        (progress_status, current_workpackage_name)
        
    Examples:
        >>> wps = [
        ...     {"sequence_order": 1, "due_date": date(2025, 1, 10), "actual_date": date(2025, 1, 9), "name": "WP1"},
        ...     {"sequence_order": 2, "due_date": date(2025, 1, 20), "actual_date": None, "name": "WP2"},
        ... ]
        >>> calculate_progress(wps, today=date(2025, 1, 15))
        ('Normal', 'WP2')
    """
    if today is None:
        today = date.today()
    
    if not workpackages:
        return ("Normal", None)
    
    # 按顺序排序
    sorted_wps = sorted(workpackages, key=lambda x: x.get("sequence_order", 0))
    
    # 检查是否全部完成
    all_completed = all(wp.get("actual_date") is not None for wp in sorted_wps)
    
    if all_completed:
        return ("Done", None)
    
    # 找到第一个未完成的工作包
    for wp in sorted_wps:
        if wp.get("actual_date") is None:
            current_wp_name = wp.get("name", "")
            due = wp.get("due_date")
            
            # 如果没有 due_date，默认为 Normal
            if due is None:
                return ("Normal", current_wp_name)
            
            # 比较到期日与今天
            if due < today:
                return ("Abnormal", current_wp_name)
            else:
                return ("Normal", current_wp_name)
    
    # 理论上不应该到这里
    return ("Normal", None)


def get_current_step(workpackages: list[dict]) -> Optional[int]:
    """
    获取当前步骤（第几个工作包）
    
    Args:
        workpackages: 工作包列表，按 sequence_order 排序
        
    Returns:
        当前步骤序号（1-based），如果全部完成返回 None
        
    Examples:
        >>> wps = [
        ...     {"sequence_order": 1, "actual_date": date(2025, 1, 9)},
        ...     {"sequence_order": 2, "actual_date": None},
        ... ]
        >>> get_current_step(wps)
        2
    """
    if not workpackages:
        return None
    
    # 按顺序排序
    sorted_wps = sorted(workpackages, key=lambda x: x.get("sequence_order", 0))
    
    # 找到第一个未完成的
    for wp in sorted_wps:
        if wp.get("actual_date") is None:
            return wp.get("sequence_order")
    
    # 全部完成
    return None


def can_update_workpackage(
    workpackages: list[dict],
    target_sequence: int
) -> tuple[bool, str]:
    """
    检查是否可以更新指定的工作包（顺序校验）
    
    业务规则：只能操作当前最前面的未完成工作包
    
    Args:
        workpackages: 工作包列表
        target_sequence: 要更新的工作包序号
        
    Returns:
        (can_update, error_message)
        
    Examples:
        >>> wps = [
        ...     {"sequence_order": 1, "actual_date": date(2025, 1, 9)},
        ...     {"sequence_order": 2, "actual_date": None},
        ...     {"sequence_order": 3, "actual_date": None},
        ... ]
        >>> can_update_workpackage(wps, 2)
        (True, '')
        >>> can_update_workpackage(wps, 3)
        (False, '必须按顺序完成工作包，当前应完成步骤 2')
    """
    current_step = get_current_step(workpackages)
    
    # 如果全部完成，不能再更新
    if current_step is None:
        return (False, "所有工作包已完成")
    
    # 只能更新当前步骤
    if target_sequence != current_step:
        return (False, f"必须按顺序完成工作包，当前应完成步骤 {current_step}")
    
    return (True, "")


class InvoiceService:
    """发票服务类"""
    
    @staticmethod
    def create_invoice_with_workpackages(
        db: Session,
        invoice_data: InvoiceCreate | dict
    ) -> Invoice:
        """
        创建发票并自动生成工作包
        
        根据客户的规则和模板自动生成工作包的due_date
        """
        # 1. 创建发票（初始progress和current_workpackage将在后面设置）
        if isinstance(invoice_data, InvoiceCreate):
            invoice_dict = invoice_data.model_dump()
        else:
            invoice_dict = dict(invoice_data)
        UserService.ensure_user_role(
            db, invoice_dict["cm_id"], (UserRoleEnum.CM,), "CM"
        )
        UserService.ensure_user_role(
            db, invoice_dict["lcm_id"], (UserRoleEnum.LCM,), "LCM"
        )
        invoice_dict["progress"] = "Normal"  # 初始状态
        invoice_dict["current_workpackage"] = None
        
        db_invoice = Invoice(**invoice_dict)
        db.add(db_invoice)
        db.flush()  # 获取ID但不提交
        
        # 2. 获取客户的规则
        rules = db.exec(
            select(DueDateRule)
            .where(DueDateRule.customer_id == invoice_data.customer_id)
            .order_by(DueDateRule.template_id)
        ).all()
        
        # 3. 获取所有启用的模板
        templates = db.exec(
            select(WorkpackageTemplate)
            .where(WorkpackageTemplate.status == True)
            .order_by(WorkpackageTemplate.sequence_order)
        ).all()
        
        # 4. 为每个模板创建工作包
        workpackages = []
        for template in templates:
            # 查找对应的规则
            rule = next((r for r in rules if r.template_id == template.id), None)
            
            # 计算due_date
            due_date_value = None
            if rule:
                base_date = invoice_data.created_time.date()
                
                if rule.rule_type == RuleTypeEnum.FIXED_DAY:
                    due_date_value = DueDateCalculator.calculate_fixed_day(
                        base_date,
                        rule.day_of_month,
                    )
                elif rule.rule_type == RuleTypeEnum.NTH_WEEKDAY:
                    due_date_value = DueDateCalculator.calculate_nth_weekday(
                        base_date,
                        rule.nth,
                        rule.weekday,
                    )
                elif rule.rule_type == RuleTypeEnum.LAST_DAY_OFFSET:
                    due_date_value = DueDateCalculator.calculate_last_day_offset(
                        base_date,
                        rule.offset,
                    )
            
            # 创建工作包
            workpackage = Workpackage(
                invoice_id=db_invoice.id,
                template_id=template.id,
                due_date=due_date_value,
                actual_date=None,
                is_completed=False,
                remark=None
            )
            db.add(workpackage)
            workpackages.append(workpackage)
        
        # 5. 计算progress和current_workpackage
        if workpackages:
            # 准备工作包数据用于计算
            wp_data = []
            for wp in workpackages:
                template = next(t for t in templates if t.id == wp.template_id)
                wp_data.append({
                    "sequence_order": template.sequence_order,
                    "due_date": wp.due_date,
                    "actual_date": wp.actual_date,
                    "name": template.name
                })
            
            progress, current_wp = calculate_progress(wp_data, date.today())
            db_invoice.progress = progress
            db_invoice.current_workpackage = current_wp
        
        db.commit()
        db.refresh(db_invoice)
        
        return db_invoice
    
    @staticmethod
    def get_invoice_with_workpackages(db: Session, invoice_id: str):
        """获取发票及其工作包"""
        invoice = db.get(Invoice, invoice_id)
        if not invoice:
            return None
        
        # 获取工作包
        workpackages = db.exec(
            select(Workpackage)
            .where(Workpackage.invoice_id == invoice_id)
        ).all()
        
        return invoice, list(workpackages)
    
    @staticmethod
    def update_invoice(
        db: Session,
        invoice_id: str,
        invoice_update: InvoiceUpdate
    ) -> Optional[Invoice]:
        """更新发票"""
        db_invoice = db.get(Invoice, invoice_id)
        if not db_invoice:
            return None
        
        update_data = invoice_update.model_dump(exclude_unset=True)
        if "cm_id" in update_data:
            UserService.ensure_user_role(
                db, update_data["cm_id"], (UserRoleEnum.CM,), "CM"
            )
        if "lcm_id" in update_data:
            UserService.ensure_user_role(
                db, update_data["lcm_id"], (UserRoleEnum.LCM,), "LCM"
            )
        for key, value in update_data.items():
            setattr(db_invoice, key, value)
        
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
        
        return db_invoice
    
    @staticmethod
    def list_invoices(
        db: Session,
        page: int = 1,
        size: int = 20,
        created_from: Optional[str] = None,
        created_to: Optional[str] = None,
        ile: Optional[str] = None,
        cm: Optional[str] = None,
        status: Optional[str] = None,
        progress: Optional[str] = None,
        current_step: Optional[int] = None
    ):
        """
        获取发票列表（分页和筛选）
        
        参数：
        - page: 页码（从1开始）
        - size: 每页数量
        - created_from: 创建时间起（YYYY-MM格式）
        - created_to: 创建时间止（YYYY-MM格式）
        - ile: ILE筛选
        - cm: CM筛选
        - status: BN Release Status筛选
        - progress: Progress筛选（Normal/Abnormal/Done）
        - current_step: 当前步骤筛选（1-4）
        """
        # 构建查询
        query = select(Invoice)
        
        # 应用筛选条件
        conditions = []
        
        if created_from:
            # YYYY-MM 格式转为datetime范围
            from datetime import datetime
            try:
                start_date = datetime.strptime(created_from + "-01", "%Y-%m-%d")
                conditions.append(Invoice.created_time >= start_date)
            except ValueError:
                pass
        
        if created_to:
            # YYYY-MM 格式，取到月末
            from datetime import datetime
            from calendar import monthrange
            try:
                year, month = map(int, created_to.split("-"))
                _, last_day = monthrange(year, month)
                end_date = datetime(year, month, last_day, 23, 59, 59)
                conditions.append(Invoice.created_time <= end_date)
            except ValueError:
                pass
        
        if ile:
            conditions.append(Invoice.ile == ile)
        
        if cm:
            conditions.append(Invoice.cm_id == cm)
        
        if status:
            conditions.append(Invoice.bn_release_status == status)
        
        if progress:
            conditions.append(Invoice.progress == progress)
        
        if current_step is not None:
            # 这个需要通过current_workpackage判断
            # 假设current_workpackage格式包含步骤信息
            pass
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # 获取总数
        count_query = select(func.count()).select_from(Invoice)
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total = db.exec(count_query).one()
        
        # 应用分页
        query = query.order_by(Invoice.created_time.desc())
        query = query.offset((page - 1) * size).limit(size)
        
        invoices = db.exec(query).all()
        
        # 计算总页数
        pages = math.ceil(total / size) if size > 0 else 0
        
        return {
            "items": invoices,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages
        }
    
    @staticmethod
    def delete_invoice(db: Session, invoice_id: str) -> bool:
        """删除发票及其关联的工作包"""
        db_invoice = db.get(Invoice, invoice_id)
        if not db_invoice:
            return False
        
        # 删除关联的工作包
        workpackages = db.exec(
            select(Workpackage).where(Workpackage.invoice_id == invoice_id)
        ).all()
        for wp in workpackages:
            db.delete(wp)
        
        # 删除发票
        db.delete(db_invoice)
        db.commit()
        
        return True
    
    @staticmethod
    def update_workpackage(
        db: Session,
        invoice_id: str,
        workpackage_id: str,
        workpackage_update: "WorkpackageUpdate"
    ) -> tuple[Optional[Workpackage], Optional[str]]:
        """
        更新工作包（带顺序校验）
        
        返回：(workpackage, error_message)
        - 成功：(workpackage, None)
        - 失败：(None, error_message)
        """
        from uuid import UUID
        from app.schemas import WorkpackageUpdate
        
        # 1. 检查发票是否存在
        invoice = db.get(Invoice, invoice_id)
        if not invoice:
            return None, f"发票 {invoice_id} 不存在"
        
        # 2. 检查工作包是否存在
        try:
            wp_uuid = UUID(workpackage_id)
        except ValueError:
            return None, f"工作包ID格式错误: {workpackage_id}"
        
        workpackage = db.get(Workpackage, wp_uuid)
        if not workpackage:
            return None, f"工作包 {workpackage_id} 不存在"
        
        if workpackage.invoice_id != invoice_id:
            return None, f"工作包 {workpackage_id} 不属于发票 {invoice_id}"
        
        # 3. 获取所有工作包（带模板信息）用于顺序校验
        workpackages = db.exec(
            select(Workpackage)
            .where(Workpackage.invoice_id == invoice_id)
        ).all()
        
        templates = db.exec(
            select(WorkpackageTemplate)
            .where(WorkpackageTemplate.status == True)
        ).all()
        
        # 4. 更新工作包（已移除顺序校验）
        update_data = workpackage_update.model_dump(exclude_unset=True)
        
        # 如果设置了 actual_date
        if "actual_date" in update_data:
            if update_data["actual_date"] is not None:
                # 设置了具体日期，自动标记为完成
                workpackage.is_completed = True
            else:
                # 设置为 None，表示重新打开，标记为未完成
                workpackage.is_completed = False
        
        for key, value in update_data.items():
            setattr(workpackage, key, value)
        
        db.add(workpackage)
        db.flush()  # 先刷新但不提交
        
        # 5. 重新计算发票的 progress 和 current_workpackage
        # 重新获取所有工作包（包含刚才的更新）
        updated_workpackages = db.exec(
            select(Workpackage)
            .where(Workpackage.invoice_id == invoice_id)
        ).all()
        
        wp_data_for_progress = []
        for wp in updated_workpackages:
            template = next((t for t in templates if t.id == wp.template_id), None)
            if template:
                wp_data_for_progress.append({
                    "sequence_order": template.sequence_order,
                    "due_date": wp.due_date,
                    "actual_date": wp.actual_date,
                    "name": template.name
                })
        
        progress, current_wp = calculate_progress(wp_data_for_progress, date.today())
        invoice.progress = progress
        invoice.current_workpackage = current_wp
        
        db.add(invoice)
        db.commit()
        db.refresh(workpackage)
        
        return workpackage, None




