import os
import re
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import delete
from sqlmodel import Session, select

sys.path.append(str(Path(__file__).resolve().parent / "backend"))

os.environ.setdefault(
    "SQLSERVER_DSN",
    "mssql+pyodbc://@localhost/CMInvoiceTracking?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes",
)

from app.db import engine
from app.enums import RuleTypeEnum
from app.models import Customer, DueDateRule

EXCEL_PATH = r"D:\Bosch\CM Invoice Tracking\Customer.xlsx"
EXCEL_SHEET = "for digitalization"


WEEKDAY_MAP = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def _clean_value(value: any) -> str | None:
    if pd.isna(value):
        return None
    trimmed = str(value).strip()
    return trimmed if trimmed else None


def normalize_rule_type(value: str) -> str:
    cleaned = re.sub(r"\s+", "_", value.strip().lower())
    for enum_value in RuleTypeEnum:
        if cleaned == enum_value.value or cleaned == enum_value.name.lower():
            return enum_value.value
    return cleaned


def parse_nth_weekday(text: str) -> dict[str, int] | None:
    match = re.match(r"\(?\s*(\d+)\.?\s*([A-Za-z]+)\)?", text)
    if not match:
        return None
    nth = int(match.group(1))
    weekday_name = match.group(2).lower()
    weekday = WEEKDAY_MAP.get(weekday_name)
    if weekday is None:
        return None
    return {"nth": nth, "weekday": weekday}


def parse_day_of_month(text: str) -> dict[str, int] | None:
    match = re.search(r"(\d+)", text)
    if not match:
        return None
    return {"day_of_month": int(match.group(1))}


def parse_offset(text: str) -> dict[str, int] | None:
    match = re.search(r"(-?\d+)", text)
    if not match:
        return None
    return {"offset": int(match.group(1))}


def parse_rule_payload(rule_type: str, cell_value: any) -> dict | None:
    if pd.isna(cell_value) or str(cell_value).strip() == "":
        return None
    text = str(cell_value).strip()

    if rule_type == RuleTypeEnum.FIXED_DAY.value:
        return parse_day_of_month(text)
    if rule_type == RuleTypeEnum.NTH_WEEKDAY.value:
        return parse_nth_weekday(text)
    if rule_type == RuleTypeEnum.LAST_DAY_OFFSET.value:
        return parse_offset(text)
    return None


def load_data() -> pd.DataFrame:
    df = pd.read_excel(EXCEL_PATH, sheet_name=EXCEL_SHEET)
    if df.empty:
        raise SystemExit("Excel file is empty")
    print("Excel columns:", list(df.columns))
    if len(df.columns) < 9:
        raise SystemExit("Customer.xlsx 需要 9 列（4 列客户信息 + 5 列规则值）")
    return df


def _customer_key(row: pd.Series) -> str | None:
    remark = _clean_value(row.iloc[1])
    if remark:
        return remark
    name = _clean_value(row.iloc[0])
    return name


def main():
    df = load_data()
    rule_type_column = df.columns[4]
    template_columns = df.columns[5:]

    with Session(engine) as session:
        existing_customers = {
            (row.remark or row.customer_name): row
            for row in session.exec(select(Customer)).all()
        }

        for index, row in df.iterrows():
            customer_data = {
                "customer_name": _clean_value(row.iloc[0]),
                "remark": _clean_value(row.iloc[1]),
                "cm_id": _clean_value(row.iloc[2]),
                "lcm_id": _clean_value(row.iloc[3]),
            }
            title = customer_data["customer_name"]
            if pd.isna(title) or not title.strip():
                print(f"skip empty row {index}")
                continue
            title = title.strip()
            customer_data["customer_name"] = title

            customer_key = _customer_key(row)
            if not customer_key:
                print(f"skip row {index} because remark/name empty")
                continue
            customer = existing_customers.get(customer_key)
            if not customer:
                customer = Customer(**customer_data)
                session.add(customer)
                session.commit()
                session.refresh(customer)
                existing_customers[customer_key] = customer
            else:
                for key, value in customer_data.items():
                    if value is not None:
                        setattr(customer, key, value)
                session.add(customer)
                session.commit()

            session.exec(delete(DueDateRule).where(DueDateRule.customer_id == customer.id))
            session.commit()

            raw_rule_type = row[rule_type_column]
            if pd.isna(raw_rule_type):
                continue
            normalized_type = normalize_rule_type(str(raw_rule_type))
            if normalized_type not in [e.value for e in RuleTypeEnum]:
                print(f"skip unsupported rule type {normalized_type} for {title}")
                continue

            for template_id, column in enumerate(template_columns, start=1):
                payload = parse_rule_payload(normalized_type, row[column])
                if not payload:
                    continue
                rule = DueDateRule(
                    customer_id=customer.id,
                    template_id=template_id,
                    rule_type=normalized_type,
                    **payload,
                )
                session.add(rule)
            session.commit()

    print("导入完成。")


if __name__ == "__main__":
    main()

