from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlmodel import Session, text, SQLModel, select
from apscheduler.schedulers.background import BackgroundScheduler
from app.config import settings
from app.db import get_db, engine
from app.jobs.monthly_invoice import run_scheduled_auto_invoice_job
from app.routers import templates, customers, users, invoices


# 创建数据库表
def create_db_tables():
    """创建所有数据库表"""
    SQLModel.metadata.create_all(engine)


app = FastAPI(
    title="CM Invoice Tracking API",
    version="1.0.0",
    description="CM Invoice Tracking System Backend API"
)
auto_scheduler: BackgroundScheduler | None = None

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 统一错误处理
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """处理 HTTPException，返回统一格式"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.status_code,
            "message": exc.detail,
            "details": None
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """处理请求验证错误（422），返回统一格式"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": 422,
            "message": "请求参数验证失败",
            "details": exc.errors()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """处理未捕获的异常，返回统一格式"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "code": 500,
            "message": "服务器内部错误",
            "details": str(exc) if settings.log_level == "DEBUG" else None
        }
    )


@app.on_event("startup")
def on_startup():
    """应用启动时创建表"""
    create_db_tables()
    if settings.auto_invoice_enabled:
        start_auto_scheduler()


def start_auto_scheduler():
    """初始化自动发票调度"""
    global auto_scheduler
    if auto_scheduler:
        return
    auto_scheduler = BackgroundScheduler(timezone=settings.auto_invoice_timezone)
    auto_scheduler.add_job(
        run_scheduled_auto_invoice_job,
        trigger="cron",
        hour=9,
        minute=0,
    )
    auto_scheduler.start()


@app.on_event("shutdown")
def on_shutdown():
    """应用关闭时清理调度器"""
    global auto_scheduler
    if auto_scheduler:
        auto_scheduler.shutdown(wait=False)
        auto_scheduler = None


# 挂载路由
app.include_router(templates.router)
app.include_router(customers.router)
app.include_router(users.router)
app.include_router(invoices.router)


@app.get("/healthz")
async def health_check():
    """健康检查端点"""
    return {"status": "ok"}


@app.get("/db/ping")
def db_ping(db: Session = Depends(get_db)):
    """数据库连接检查端点"""
    try:
        ping_value = db.exec(text("SELECT 1")).scalar()  # 关键：用 .scalar()
        return {"db": "ok", "ping": ping_value}
    except Exception as e:
        return {"db": "error", "message": str(e)}


@app.post("/db/init-seed")
def init_seed_data():
    """初始化种子数据"""
    try:
        from app.init_db import init_db
        init_db()
        return {"status": "ok", "message": "种子数据初始化完成"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

