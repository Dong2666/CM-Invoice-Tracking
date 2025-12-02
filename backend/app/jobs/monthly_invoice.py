"""每月自动创建 Invoice 的定时任务"""
from calendar import monthrange
from datetime import datetime, date, time
import logging
from typing import Iterable

from sqlmodel import Session

from app.db import engine
from app.models import Customer
from app.services.customers import CustomerService
from app.services.invoices import InvoiceService
from app.services.users import UserService
from app.enums import UserRoleEnum

logger = logging.getLogger(__name__)


def _generate_invoice_id(run_date: date, customer: Customer, seq: int) -> str:
    """生成唯一的发票 ID，可根据需要调整格式"""
    return f"AUTO-{run_date.strftime('%Y%m')}-{customer.id:05d}-{seq}"


def _normalize_datetime(run_date: date) -> datetime:
    """将日期合成指定的 9:00 datetime"""
    return datetime.combine(run_date, time(hour=9, minute=0))


def is_fifth_day_from_end(current_date: date | None = None) -> bool:
    """判断是否为当月倒数第 5 天"""
    current_date = current_date or date.today()
    last_day = monthrange(current_date.year, current_date.month)[1]
    return current_date.day == last_day - 4


def create_invoices_for_all_customers(db: Session, run_date: date | None = None) -> dict:
    """
    为所有客户创建当期发票。
    
    Args:
        db: 数据库 Session
        run_date: 逻辑日期（默认为今天），用于生成 ID/created_time

    Returns:
        dict: 统计信息与错误列表
    """
    run_date = run_date or date.today()
    created_time = _normalize_datetime(run_date)

    customers: Iterable[Customer] = CustomerService.get_all(db)
    created_count = 0
    skipped = []
    errors: list[str] = []

    for idx, customer in enumerate(customers, start=1):
        try:
            cm = UserService.ensure_user_role(db, customer.cm_id, (UserRoleEnum.CM,))
            lcm = UserService.ensure_user_role(db, customer.lcm_id, (UserRoleEnum.LCM,))

            invoice_id = _generate_invoice_id(run_date, customer, idx)

            payload = {
                "id": invoice_id,
                "customer_id": customer.id,
                "cm_id": cm.nt_account,
                "lcm_id": lcm.nt_account,
                "region": customer.region or lcm.region,
                "ile": customer.remark or "",
                "bn_release_status": "Pending",
                "status_comment": f"Auto generated at {created_time.isoformat()}",
                "created_time": created_time,
            }

            InvoiceService.create_invoice_with_workpackages(db, payload)
            created_count += 1
        except ValueError as exc:
            skipped.append({"customer_id": customer.id, "reason": str(exc)})
        except Exception as exc:
            logger.exception("Auto invoice failed for customer %s", customer.id)
            errors.append(f"Customer {customer.id}: {exc}")

    return {
        "created": created_count,
        "skipped": skipped,
        "errors": errors,
    }


def run_scheduled_auto_invoice_job(current_date: date | None = None):
    """供 APScheduler 调用的任务入口"""
    current_date = current_date or date.today()
    if not is_fifth_day_from_end(current_date):
        logger.info("Auto invoice job skipped: %s is not last-5 day", current_date)
        return {"skipped": True, "reason": "not last-5 day"}

    logger.info("Starting auto invoice job for date %s", current_date)
    with Session(engine) as session:
        result = create_invoices_for_all_customers(session, current_date)
    logger.info("Auto invoice job finished: %s", result)
    return result

