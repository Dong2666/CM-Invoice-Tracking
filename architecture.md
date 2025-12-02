M Invoice Tracking 全栈架构设计（Next.js + FastAPI + SQLModel + SQL Server Express）
架构总览
前端（Next.js 14 App Router）：原型已就绪（使用 Mock 数据），逐步切换为真实后端 API。
后端（FastAPI + SQLModel）：面向资源的 REST API，内置工作流与进度计算逻辑。
数据库（SQL Server Express）：本地开发使用 .\SQLEXPRESS，生产可迁移至托管 SQL Server。
通信方式：前端通过 HTTP/HTTPS 调用后端 REST API；下载接口采用文件流；导出 Excel。
状态管理：前端使用 TanStack Query 管理 Server State，Zustand 管理 UI/Session；后端使用 SQL Server 存储业务数据。
Mock 方案：MSW（Mock Service Worker）对齐后端 API 设计，支持一键切换真实 API。
1. 目录结构与职责说明
1.1 前端（Next.js）目录结构
假设前端根目录：frontend/my-app
frontend/  my-app/    app/                              # App Router 路由层（SSR/SSG/ISR 组合）      layout.tsx      page.tsx                        # Dashboard（Overview）      invoices/        page.tsx                      # 发票列表视图        [id]/          page.tsx                    # 发票详情页      customers/        page.tsx                      # 客户列表视图        new/          page.tsx                    # 新建客户        [id]/          page.tsx                    # 客户详情页      users/        page.tsx                      # 用户列表        new/          page.tsx                    # 新建用户        [id]/          page.tsx                    # 用户详情    components/                       # 跨领域通用 UI 组件      DataTable.tsx      StatusBadge.tsx      FilterBar.tsx      DateField.tsx      ConfirmDialog.tsx      FileExportButton.tsx    features/                         # 按领域拆分（发票/客户/用户）      invoices/        components/          InvoiceHeaderCard.tsx          WorkpackageCard.tsx        hooks.ts                      # useQuery/useMutation（TanStack Query）        api.ts                        # 对应后端 invoices REST 调用        types.ts                      # 对应后端 schemas 的 TS 类型        utils.ts                      # 进度/状态计算（与后端算法保持一致）      customers/        components/          CustomerForm.tsx          DueRuleEditor.tsx        hooks.ts        api.ts        types.ts      users/        components/          UserForm.tsx        hooks.ts        api.ts        types.ts    lib/      apiClient.ts                    # 基于 fetch/axios 的客户端（带 baseURL/拦截器）      queryClient.ts                  # TanStack Query Client 单例      status.ts                       # 颜色/徽标映射      date.ts                         # 日期工具      env.ts                          # 读取 NEXT_PUBLIC_* 环境变量    mocks/      handlers.ts                     # MSW handlers（对齐后端路由）      server.ts                       # Node 环境 mock      browser.ts                      # 浏览器环境 mock      data/*.json                     # 开发期内置的 mock 数据    store/      uiStore.ts                      # UI 状态（筛选、弹窗等）      sessionStore.ts                 # 轻量会话（若无 SSO，可先存放当前用户）    styles/      globals.css      tailwind.css    public/      favicon.ico    next.config.js    tsconfig.json    package.json    .env.local.example                # NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_USE_MOCK
app/：页面路由，Dashboard/发票/客户/用户 4 大模块。
features/：领域化聚合（组件 + hooks + api + 类型 + 工具）。
lib/：共用基础库（API 客户端、Query、工具、环境）。
mocks/：MSW mock 数据与拦截器，便捷切换至真实 API。
store/：Zustand 存 UI/临时会话，不存服务端数据（避免与 Query 重叠）。
components/：通用 UI（表格、Badge、筛选条、日期控件、导出按钮）。
1.2 后端（FastAPI + SQLModel）目录结构
假设后端根目录：backend/
├── app/
│   ├── main.py                # ⬅️ 入口文件：启动应用、加载配置、挂载路由
│   ├── config.py              # ⬅️ 核心配置（合并 core/）
│   ├── db.py                  # ⬅️ 数据库连接和会话（合并 db/session.py）
│   ├── models.py              # ⬅️ 所有 SQLModel 模型（合并所有 models/*.py）
│   ├── schemas.py             # ⬅️ 所有 Pydantic/Schema（合并所有 schemas/*.py）
│   ├── services/              # ⬅️ 业务逻辑层（代替 domain/，功能更聚焦）
│   │   ├── users.py           # 用户的 CRUD 和业务逻辑
│   │   ├── invoices.py        # 发票的 CRUD 和业务逻辑
│   │   └── customers.py
│   ├── routers/               # ⬅️ API 路由层（保持不变）
│   │   ├── users.py
│   │   ├── invoices.py
│   │   └── customers.py
│   └── utils.py               # ⬅️ 通用工具函数（合并所有 utils/）
├── requirements.txt
└── .env.example
models/：SQLModel 表结构；Workpackage 以行方式存储（1:N Invoice）。
schemas/：严格区分 Create/Update/Read，避免外泄内部字段。
services/：业务核心（进度计算、到期规则、导出）。
routers/：REST API，薄控制器，委派给 services
db/：统一 Session/Engine 管理（SQL Server Express）。
migrations/：建议使用 Alembic 管控升级（生产可选）。
2. 数据模型（与产品文档对齐）
Invoice
字段：id, region, ile, cm, bnReleaseStatus, statusComment, workflowHealth, createdTime
关联：workpackages: List[Workpackage]
Workpackage
字段：id, invoice_id(FK), name, dueDate, actualDate, remark
状态色：由服务端按业务规则计算得到（不物化存储，作为读取时的计算字段返回）
Customer
字段：id, ileCustomer, remark, region, lcm, cm
关联：dueDateRules: List[DueDateRule]
DueDateRule
字段：id, customer_id(FK), workpackageName, daysFromMonthStart, isNextMonth
User
字段：id, name, dept, role, lcm, impactIleCustomer, nt
说明：
发票的 workflowHealth 由 services/progress.py 按工作包完成情况与 due/actual 关系计算。
BN Release Status 与颜色映射在前后端共用字典（前端 lib/status.ts，后端 models/enums.py）。
3. API 设计与服务连通
3.1 基础路由（REST）
/api/invoices
GET：分页与多条件筛选（date, ile, cm, status, progress）
POST：新建发票（依据 Customer 的 DueDateRule 自动生成工作包 dueDate）
/api/invoices/{id}
GET：发票详情（含工作包与计算后的状态）
PUT：更新发票（含备注、bnReleaseStatus、statusComment）
DELETE：删除发票
/api/invoices/{id}/workpackages/{wpId}
PUT：更新工作包（actualDate, remark，支持 “Mark as Complete” 语义）
/api/exports/invoices
POST/GET：按筛选导出 Excel（流式下载）
/api/customers
GET/POST/DELETE（批量）
/api/customers/{id}
GET/PUT
/api/users
GET/POST/DELETE（批量）
/api/users/{id}
GET/PUT
/api/overview/my：当前用户视角异常/待办聚合
/api/overview/team：LCM 视角团队发票（支持快捷筛选）
3.2 前后端连接方式
前端 lib/apiClient.ts 读取 NEXT_PUBLIC_API_BASE_URL，统一发起请求。
开发模式：
当 NEXT_PUBLIC_USE_MOCK=true 时启用 MSW，拦截 API，与后端对齐路由。
当 NEXT_PUBLIC_USE_MOCK=false 时直连 FastAPI。
CORS：
后端 core/cors.py 允许前端域名（如 http://localhost:3000）。
文件下载：
导出 API 返回 Content-Disposition: attachment，前端使用 FileExportButton 触发下载。
4. 状态管理与存储位置
前端
Server State：TanStack Query（features/*/hooks.ts）
缓存键与路由筛选参数绑定（保证列表与详情一致性）
变更后采用 invalidateQueries 精准失效
UI/Session State：Zustand（store/）
筛选项、弹窗开关、选中行、多选删除、导出参数等
轻量“当前用户”缓存（若无 SSO，先行可写死或从后端 /api/users/me 拉取）
表单校验：React Hook Form + Zod（前后端 schema 对齐，减少重复定义）
后端
业务数据：SQL Server Express（db/session.py 统一管理）
计算字段：services/progress.py 在读取时计算，不落库
导出：services/export.py 动态生成 Excel，不持久化文件（按需可引入临时缓存）
5. 关键业务实现位置
工作流顺序强制：services/progress.py
仅允许按序处理下个未完成工作包；上一个未完成则返回 409/422
进度计算（workflowHealth）：services/progress.py
Done：所有工作包 actualDate 均存在
Normal：未完成且下一个工作包 dueDate >= 今天
Abnormal：未完成且下一个工作包 dueDate < 今天 且 actualDate 为空
客户时间规则应用：services/due_date.py
新建发票时按客户 DueDateRule 生成 4 个标准工作包的 dueDate
导出 Excel：services/export.py
列/顺序严格对齐产品文档；按筛选导出
快捷筛选（释放异常/进度异常）：routers/overview.py
封装查询条件，前端用按钮一键触发
6. 环境与配置
6.1 前端环境变量（my-app/.env.local）
# 真实后端地址NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api# 是否启用 MSWNEXT_PUBLIC_USE_MOCK=true
6.2 后端环境变量（backend/app/.env）
# SQL Server Express（本机实例）SQLSERVER_DSN="mssql+pyodbc://@localhost\\SQLEXPRESS/CMInvoiceTracking?driver=ODBC+Driver+17+for+SQL+Server;Trusted_Connection=yes"# 或者使用用户名密码# SQLSERVER_DSN="mssql+pyodbc://sa:YourPassword@localhost\\SQLEXPRESS/CMInvoiceTracking?driver=ODBC+Driver+17+for+SQL+Server"CORS_ORIGINS=http://localhost:3000LOG_LEVEL=INFO
需要安装 Microsoft ODBC Driver 17/18 for SQL Server（Windows 开发机一般已具备/可下载安装）。
SQLModel/SQLAlchemy 连接通过 pyodbc 驱动。
7. 连接与运行流（端到端）
用户打开前端 Dashboard
前端通过 TanStack Query 调用 /api/overview/my 拉取异常与待办列表
点击某个 Invoice ID → 进入详情（/invoices/[id]）
用户点击 “Mark as Complete”
前端调用 PUT /api/invoices/{id}/workpackages/{wpId} 更新 actualDate=今天
后端校验顺序并持久化，返回更新后的发票详情（含重新计算的 workflowHealth）
返回列表时自动刷新 invoices 查询缓存；Dashboard 状态同步更新
管理视图（LCM）进入 Admin View，执行高级筛选并一键导出 Excel
8. 分页、筛选与导出规范
分页：统一 ?page=1&size=20（可用 fastapi-pagination）
筛选参数：
日期：createdFrom=YYYY-MM&createdTo=YYYY-MM
业务：ile=xxx&cm=xxx&status=All|Partial|None|Null&progress=Normal|Abnormal|Done
步骤：currentStep=1..4
导出：POST 传入与列表一致的筛选条件，返回文件流；前端以 Blob 下载
9. 错误处理与一致性
统一错误响应格式（后端 utils/errors.py）：
{ code: string, message: string, details?: any }
校验失败返回 422；业务规则冲突返回 409；未找到 404
前端 apiClient.ts 统一拦截错误，Toast/Alert 呈现
10. 测试与 Mock 策略
前端：MSW 保持与后端路由/数据结构一致；handlers.ts 复用 mocks/data/*.json
后端：pytest + httpx 测试 routers 与 services；使用测试库或本地独立测试数据库
对齐策略：以 schemas/* 为单一事实来源，前端 features/*/types.ts 由此映射生成（可后续接入代码生成以减少重复）
11. 渐进式从 Mock 切换到真实后端
阶段 1：保持 NEXT_PUBLIC_USE_MOCK=true，联调前端 UI/交互
阶段 2：对齐后端路由与 schemas，将 MSW 响应数据结构与真实 API 完全一致
阶段 3：切换 NEXT_PUBLIC_USE_MOCK=false，开启 CORS，联通数据库
阶段 4：对关键场景（Dashboard、详情、导出）做端到端回归
12. 依赖建议
前端
@tanstack/react-query, zod, react-hook-form, zustand, msw, axios/ky, dayjs
UI：tailwindcss 或 ant-design（按团队偏好）
后端
fastapi, uvicorn, sqlmodel, sqlalchemy, pyodbc, pydantic-settings, fastapi-pagination, openpyxl, python-multipart, httpx[tests], alembic(可选)
13. 简要架构图
[ Next.js (App Router) ]     |  TanStack Query / Zustand / MSW     v[ REST API (FastAPI Routers) ]     |  Services(Progress/DueRule/Export)     v[ SQLModel/SQLAlchemy ]     |[ SQL Server Express ]
14. 安全与扩展（可选后续）
身份与权限：内部系统可先使用网段/网关鉴权；后续可对接 AD/SSO，前端以 HttpOnly Cookie 携带会话。
审计：为 Invoice/Workpackage 重要变更记录审计表（changed_by, changed_at, before, after）。
性能：为常用筛选字段加索引；导出采用流式与后台任务（如数据量大）。
15. 关键文件职责对照表
前端
features/*/api.ts：集中封装该领域的 REST 请求
features/*/hooks.ts：封装 useQuery/useMutation，供页面复用
components/DataTable.tsx：表格渲染与分页/筛选交互
lib/status.ts：前后端颜色/状态映射保持一致
后端
services/progress.py：进度/健康度核心算法（单测覆盖）
services/due_date.py：客户规则生效点（新建发票）
routers/overview.py：Dashboard 聚合接口
db/session.py：SQL Server 连接与会话管理
16. 启动要点（开发）
数据库：确保 .\SQLEXPRESS 可用，并创建数据库 CMInvoiceTracking
后端：
激活 venv → pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
前端：
pnpm i / npm i
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_USE_MOCK=true（先用 Mock 联调 UI）
npm run dev（或 pnpm dev）
以上架构文档覆盖了目录结构、模块职责、状态存储、前后端连接与落地细节，能直接支撑从 Mock 到真实后端的平滑迁移与团队协作。
总结
定义了前后端清晰的分层与领域边界，落地到文件夹与文件级别。
前端以 TanStack Query 管理服务端状态，Zustand 存 UI/Session。
后端以 SQLModel 建模、Services 承载核心业务、Routers 暴露 REST。
SQL Server Express 作为本地开发数据库，连接串与驱动已给出。

