# models/user.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .base import Base
from .enums import *

class Region(Base):
    __tablename__ = "region"

    code = Column(String(10), primary_key=True)  # e.g., 'CCN1'
    name = Column(String(50), nullable=False)

    users = relationship("User", back_populates="dept")

class User(Base):
    __tablename__ = "user"

    id = Column(Integer, primary_key=True, index=True)
    nt_account = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    region = Column(String(10), ForeignKey("region.code"), nullable=False)
    role = Column(String(10), nullable=False)  # CM | LCM
    lcm = Column(String(50))  # 可选：指向负责的 LCM 账号
    responsible_customer = Column(String(50))  # 可选：影响的客户

    dept = relationship("Region", back_populates="users")
    assigned_customers = relationship(
        "CustomerAssignment",
        back_populates="cm_user",
        cascade="all, delete-orphan"
    )
    managed_customers = relationship(
        "CustomerAssignment",
        back_populates="lcm_user",
        cascade="all, delete-orphan"
    )