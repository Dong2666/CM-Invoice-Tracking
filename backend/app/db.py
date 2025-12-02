from sqlmodel import Session, create_engine
from app.config import settings

# 创建数据库引擎
engine = create_engine(
    settings.sqlserver_dsn,
    echo=settings.log_level == "DEBUG",  # 调试模式下打印 SQL
    pool_pre_ping=True,  # 连接池健康检查
)

def get_db():
    """数据库会话依赖注入"""
    with Session(engine) as session:
        yield session




