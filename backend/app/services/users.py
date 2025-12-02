"""用户相关业务逻辑"""
from typing import Optional

from sqlalchemy import func
from sqlmodel import Session, select

from app.enums import UserRoleEnum
from app.models import CM
from app.schemas import UserCreate, UserUpdate


class UserService:
    """统一的用户服务（CM / LCM）"""

    @staticmethod
    def _normalize_role(role: Optional[str | UserRoleEnum]) -> Optional[UserRoleEnum]:
        if role is None:
            return None
        if isinstance(role, UserRoleEnum):
            return role
        value = role.lower()
        if value not in {UserRoleEnum.CM.value, UserRoleEnum.LCM.value}:
            raise ValueError("role 仅支持 cm / lcm")
        return UserRoleEnum(value)

    @staticmethod
    def _serialize_user(user: CM) -> dict:
        return {
            "role": user.role,
            "id": user.nt_account,
            "nt_account": user.nt_account,
            "name": user.name,
            "region": user.region,
            "scnx": user.scnx,
        }

    @staticmethod
    def list_paginated(db: Session, role: Optional[UserRoleEnum], page: int, size: int) -> dict:
        """分页获取用户列表（可按角色过滤）"""
        offset = (page - 1) * size
        filters = []
        if role:
            filters.append(CM.role == role)

        count_stmt = select(func.count()).select_from(CM)
        if filters:
            count_stmt = count_stmt.where(*filters)
        count_result = db.exec(count_stmt).one()
        total = count_result[0] if isinstance(count_result, tuple) else int(count_result or 0)

        query = select(CM).order_by(CM.nt_account)
        if filters:
            query = query.where(*filters)

        records = db.exec(query.offset(offset).limit(size)).all()
        items = [UserService._serialize_user(record) for record in records]

        pages = max(1, (total + size - 1) // size) if total > 0 else 1

        return {
            "items": items,
            "total": total,
            "page": page,
            "size": size,
            "pages": pages,
        }

    @staticmethod
    def get_user_by_id(db: Session, user_id: str, role: Optional[UserRoleEnum] = None) -> CM | None:
        """按 ID（可选角色）获取用户"""
        query = select(CM).where(CM.nt_account == user_id)
        if role:
            query = query.where(CM.role == role)
        return db.exec(query).first()

    @staticmethod
    def create_user(db: Session, user_data: UserCreate) -> CM:
        """创建用户"""
        payload = user_data.model_dump()
        role = UserService._normalize_role(payload.get("role")) or UserRoleEnum.CM
        payload["role"] = role

        if db.get(CM, payload["nt_account"]):
            raise ValueError(f"用户 {payload['nt_account']} 已存在")

        db_user = CM(**payload)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: str, user_update: UserUpdate) -> CM | None:
        """更新用户"""
        db_user = db.get(CM, user_id)
        if not db_user:
            return None

        update_data = user_update.model_dump(exclude_unset=True)

        if "nt_account" in update_data and update_data["nt_account"] != db_user.nt_account:
            new_nt = update_data["nt_account"]
            if db.get(CM, new_nt):
                raise ValueError(f"用户 {new_nt} 已存在")
            db_user.nt_account = new_nt

        if "name" in update_data:
            db_user.name = update_data["name"]
        if "region" in update_data:
            db_user.region = update_data["region"]

        if "role" in update_data:
            db_user.role = UserService._normalize_role(update_data["role"]) or db_user.role
        if "scnx" in update_data:
            db_user.scnx = update_data["scnx"]

        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete_user(db: Session, user_id: str) -> bool:
        """删除用户"""
        db_user = db.get(CM, user_id)
        if not db_user:
            return False
        db.delete(db_user)
        db.commit()
        return True

    @staticmethod
    def ensure_user_role(
        db: Session,
        user_id: str,
        allowed_roles: tuple[UserRoleEnum, ...],
        field_name: str = "用户",
    ) -> CM:
        """验证指定账号是否存在且角色在允许集合中"""
        user = db.get(CM, user_id)
        if not user:
            raise ValueError(f"{field_name} {user_id} 不存在")
        if user.role not in allowed_roles:
            allowed = "/".join(role.value.upper() for role in allowed_roles)
            raise ValueError(f"{field_name} {user_id} 必须属于角色 {allowed}")
        return user


