"""通用工具函数"""


def format_error(code: str, message: str, details=None):
    """统一错误响应格式"""
    error = {"code": code, "message": message}
    if details:
        error["details"] = details
    return error












