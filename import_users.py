import os
import pandas as pd
from sqlalchemy import create_engine

# 1. Excel 路径
EXCEL_PATH = r"D:\Bosch\CM Invoice Tracking\User.xlsx"

# 2. 构造 SQL Server 连接字符串（支持从环境变量读取）
conn_str = os.environ.get(
    "SQLSERVER_DSN",
    "mssql+pyodbc://@localhost/CMInvoiceTracking?driver=ODBC+Driver+17+for+SQL+Server&Trusted_Connection=yes&TrustServerCertificate=yes",
)
engine = create_engine(conn_str, fast_executemany=True)

# 3. 读取 Excel 第一个 sheet（可指定 sheet_name）
df = pd.read_excel(EXCEL_PATH)

# 3.1 去重（按照第一列值唯一）
first_column = df.columns[0]
df = df.drop_duplicates(subset=first_column, keep="first")

# 4. （可选）检查列名
print("准备导入的列：", df.columns.tolist())

# 5. 导入数据（如果表已有数据，可先清空或设 write_sql 的 if_exists）
df.to_sql(
    "CM",
    con=engine,
    if_exists="append",  # 或 "replace"（会清空后写入），确保行符合主键要求
    index=False,
    method="multi",
    chunksize=1000,
)
print("导入完成，共写入", len(df), "行")