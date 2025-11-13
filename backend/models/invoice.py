# models/invoice.py
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
from .enums import *
from .customer import Customer
from .rule import DueDateRule

class Invoice(Base):
    __tablename__ = "invoice"

    id = Column(String(50), primary_key=True, index=True)  # e.g., "INV-2025-10-001"
    customer_id = Column(String(50), ForeignKey("customer.id"), nullable=False)
    region = Column(String(10), ForeignKey("region.code"), nullable=False)
    ile = Column(String(100))
    cm = Column(String(50))  # 可选：冗余字段，用于快速查询
    bn_release_status = Column(String(20), nullable=False)  # All|Partial|None|Null
    status_comment = Column(Text)
    workflow_health = Column(String(20), nullable=False)  # Normal|Abnormal|Done
    created_time = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="invoices")
    workpackages = relationship("Workpackage", back_populates="invoice", cascade="all, delete-orphan")

class Workpackage(Base):
    __tablename__ = "workpackage"

    id = Column(Integer, primary_key=True, index=True)  # 独立主键
    invoice_id = Column(String(50), ForeignKey("invoice.id"), nullable=False)
    template_id = Column(Integer, ForeignKey("workpackage_template.id"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    actual_date = Column(DateTime)
    status = Column(String(10), nullable=False)  # green|yellow|red
    remark = Column(Text)

    invoice = relationship("Invoice", back_populates="workpackages")
    template = relationship("WorkpackageTemplate", back_populates="workpackages")

    @property
    def is_overdue(self):
        if self.actual_date:
            return False
        return self.due_date < datetime.utcnow().date()

    def update_status(self):
        if self.actual_date:
            self.status = "green"
        elif self.is_overdue:
            self.status = "red"
        else:
            self.status = "yellow"


# models/workpackage_template.py
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from .base import Base

class WorkpackageTemplate(Base):
    __tablename__ = "workpackage_template"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # e.g., "WP-A"
    display_name = Column(String(100))
    order = Column(Integer, nullable=False)

    workpackages = relationship("Workpackage", back_populates="template")
    rules = relationship("DueDateRule", back_populates="template")