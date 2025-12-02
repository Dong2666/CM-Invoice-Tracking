"""用户相关路由"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app.db import get_db
from app.enums import UserRoleEnum
from app.schemas import PageResponse, UserListItem, UserRead, UserCreate, UserUpdate
from app.services.users import UserService

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=PageResponse[UserListItem])
def list_users(
    role: UserRoleEnum | None = Query(None, description="可选：cm 或 lcm"),
    page: int = Query(1, ge=1, description="页码，从1开始"),
    size: int = Query(20, ge=1, le=50, description="每页数量（最大50）"),
    db: Session = Depends(get_db),
):
    """分页获取用户列表，支持角色筛选"""
    result = UserService.list_paginated(db, role, page, size)
    return PageResponse(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        size=result["size"],
        pages=result["pages"],
    )


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: str,
    role: UserRoleEnum | None = Query(
        None, description="可选角色，用于确保角色匹配"
    ),
    db: Session = Depends(get_db),
):
    """获取指定用户详情，可按角色加固校验"""
    user = UserService.get_user_by_id(db, user_id, role)
    if not user:
        suffix = f"（角色 {role}）" if role else ""
        raise HTTPException(status_code=404, detail=f"用户 {user_id}{suffix} 不存在")
    return user


def _create_user_record(user: UserCreate, db: Session) -> UserRead:
    try:
        return UserService.create_user(db, user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


def _update_user_record(user_id: str, user_update: UserUpdate, db: Session) -> UserRead:
    try:
        updated = UserService.update_user(db, user_id, user_update)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not updated:
        raise HTTPException(status_code=404, detail="用户不存在")
    return updated


def _delete_user_record(user_id: str, db: Session):
    if not UserService.delete_user(db, user_id):
        raise HTTPException(status_code=404, detail="用户不存在")


@router.post("", response_model=UserRead, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """创建任意角色用户"""
    return _create_user_record(user, db)


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: str,
    user_update: UserUpdate,
    db: Session = Depends(get_db),
):
    """更新用户"""
    return _update_user_record(user_id, user_update, db)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str, db: Session = Depends(get_db)):
    """删除用户"""
    _delete_user_record(user_id, db)
