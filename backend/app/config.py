from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """应用配置"""
    
    # 数据库配置
    sqlserver_dsn: str = ""
    
    # CORS 配置
    cors_origins: str = "http://localhost:3000"
    
    # 日志配置
    log_level: str = "INFO"

    # 自动发票任务
    auto_invoice_enabled: bool = False
    auto_invoice_timezone: str = "Asia/Shanghai"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# 全局配置实例
settings = Settings()





