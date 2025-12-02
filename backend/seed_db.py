#!/usr/bin/env python
"""
种子数据初始化脚本

使用方法：
    python seed_db.py

或者从项目根目录：
    python -m backend.seed_db
"""
import sys
from pathlib import Path

# 添加 backend 目录到 Python 路径
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.init_db import init_db

if __name__ == "__main__":
    init_db()









