### CM Invoice Tracking MVP 分布式实施计划（一次只执行一个任务）

说明：前端页面与交互不改动，仅逐步用真实后端替换 Mock。每个任务小而可测，有明确入口/出口，按顺序执行。



## 阶段 A：后端基础与数据层

1) 初始化 FastAPI 项目与依赖
- 目标：创建 `backend/app` 基础骨架与依赖安装。
- 前置：无
- 完成标准：`uvicorn app.main:app --reload` 可启动，`GET /healthz` 返回 200。
- 测试：浏览器/`curl http://localhost:8000/healthz` 返回 `{status:"ok"}`。

2) 配置 SQL Server 连接与会话
- 目标：实现 `db/session.py`，读取 `.env` 中 `SQLSERVER_DSN`。
- 前置：任务 1
- 完成标准：应用启动无连接错误，可获取会话。
- 测试：新增 `GET /db/ping` 在依赖中执行 `SELECT 1` 成功返回 `{db:"ok"}`。

3) 建模 WorkpackageTemplate
- 目标：`models/workpackage_template.py`，含 `id, name, sequence_order`，唯一约束。
- 前置：任务 2
- 完成标准：表可创建，插入/查询一条记录成功。
- 测试：临时 `POST /debug/templates` 插入后 `GET /debug/templates` 能看到记录。

4) 建模 Customer 与 User
- 目标：`models/customer.py`、`models/user.py`，含 ER 中必需字段与外键。
- 前置：任务 2
- 完成标准：表可创建，插入/查询一条记录成功。
- 测试：同 3 的调试接口或 `pytest` 简单 ORM 读写测试。

5) 建模 Invoice 与 Workpackage
- 目标：`models/invoice.py`、`models/workpackage.py`，`workpackage(invoice_id, template_id)` 唯一约束。
- 前置：任务 2
- 完成标准：表可创建，插入/查询一条记录成功。
- 测试：创建一张发票及 1 个工作包，查询返回一致。

6) 建模 DueDateRule
- 目标：`models/due_rule.py`，含 3 种规则字段与唯一约束 `(customer_id, template_id)`。
- 前置：任务 2、3、4
- 完成标准：表可创建，插入/查询一条记录成功。
- 测试：同上调试接口或 `pytest` ORM 用例。

7) 初始化种子数据（Templates/Users/Customers）
- 目标：`db/init_db.py`，插入默认 4 个模板与 1-2 个用户/客户。
- 前置：任务 3-6
- 完成标准：运行一次脚本后，`GET /debug/...` 能看到基础数据。
- 测试：打印/查询校验模板顺序、客户存在。

## 阶段 B：领域纯函数与规则

8) 实现 DueDate 计算纯函数
- 目标：`services/customer.py`）实现 `fixed_day/nth_weekday/last_day_offset`。
- 前置：任务 6
- 完成标准：有 6-9 条单测覆盖边界（闰月、月末、跨月）。
- 测试：`pytest` 运行通过。

9) 实现 Progress/Current Step 纯函数
- 目标：`services/invoice.py`计算 Normal/Abnormal/Done 与当前步骤。
- 前置：任务 5
- 完成标准：单测覆盖全部分支（全部完成、逾期、未逾期）。
- 测试：`pytest` 运行通过。

## 阶段 C：后端路由（替换前端 Mock 的契约）

10) 模板 API：列表/创建/更新/删除
- 目标：`GET/POST/PUT/DELETE /api/templates`（顺序唯一性校验）。
- 前置：任务 3
- 完成标准：Swagger 可调通；错误返回 409/422 合理。
- 测试：`curl` 新增/更新/列表顺序正确，重复顺序报错。

11) 客户 API：列表/详情/创建/更新
- 目标：`/api/customers`、`/api/customers/{id}`。
- 前置：任务 4
- 完成标准：CRUD 可用；返回字段与前端类型对齐。
- 测试：`curl` 跑通 CRUD。

12) 客户规则 API：批量读写
- 目标：`GET/PUT /api/customers/{id}/rules`（幂等覆盖）。
- 前置：任务 6、8
- 完成标准：保存后再次读取一致；模板维度唯一。
- 测试：`curl` PUT 一组规则，再 GET 验证。

13) 用户 API：列表/详情
- 目标：`GET /api/users`、`GET /api/users/{id}`。
- 前置：任务 4
- 完成标准：可分页列表与详情读取。
- 测试：`curl` 返回包含种子用户。

14) 发票创建：自动生成工作包
- 目标：`POST /api/invoices` 输入 `customer_id、created_time…`，按模板×规则生成 `workpackages`。
- 前置：任务 5、8、12
- 完成标准：创建后详情含正确数量与 `due_date`。
- 测试：`curl` POST 后 `GET /api/invoices/{id}` 校验。

15) 发票列表：分页+筛选
- 目标：`GET /api/invoices` 支持 `page,size,createdFrom,createdTo,ile,cm,status,progress,currentStep`。
- 前置：任务 14、9
- 完成标准：多条件组合可用；返回分页元信息。
- 测试：构造 2-3 条数据，验证筛选与分页。

16) 发票详情与更新
- 目标：`GET/PUT /api/invoices/{id}` 更新 `bn_release_status/status_comment/remark`。
- 前置：任务 14
- 完成标准：更新成功且详情返回变更。
- 测试：`curl` PUT 后 GET 校验。

17) 工作包更新（顺序校验 + Mark as Complete）
- 目标：`PUT /api/invoices/{id}/workpackages/{wpId}` 支持 `actual_date/remark`，校验“只能操作当前最前未完成步骤”。
- 前置：任务 9、14
- 完成标准：顺序不符返回 409；正确更新触发进度重算。
- 测试：构造两步，先更改第二步应报错；先改第一步再改第二步成功。

18) 概览接口：我的视图
- 目标：`GET /api/overview/my` 返回异常列表与 7 日 ToDo。
- 前置：任务 15、17
- 完成标准：规则符合产品定义；空数据不报错。
- 测试：造数据命中 Abnormal 与 7 日窗口。

19) 概览接口：团队视图
- 目标：`GET /api/overview/team` 支持 ILE/Region/LCM/CM/Status/Progress/Current Step 筛选与快捷按钮。
- 前置：任务 15、17
- 完成标准：筛选组合可用；快捷筛选命中。
- 测试：`curl` 不同参数返回符合预期。

20) 导出接口：发票 Excel
- 目标：`POST /api/exports/invoices` 按筛选导出文件流。
- 前置：任务 15
- 完成标准：头部 `Content-Disposition` 正确，Excel 列顺序符合文档。
- 测试：`curl -OJ` 下载并打开检查列。

21) 统一错误格式与 CORS
- 目标：统一 `{ code, message, details? }`；允许 `http://localhost:3000`。
- 前置：任务 1
- 完成标准：异常均按格式返回；前端可跨域请求。
- 测试：故意触发 422/409 验证结构；浏览器预检通过。

## 阶段 D：前端渐进接入真实 API（保持 UI/交互不变）

22) 配置环境变量与 MSW 透传
- 目标：设置 `NEXT_PUBLIC_API_BASE_URL`；在 MSW 中将 `/api/invoices` 列表改为“透传后端”。
- 前置：任务 15、21
- 完成标准：发票列表从数据库读取；其它仍用 Mock。
- 测试：页面刷新看到 DB 数据；断开后端即报网络错。

23) 发票详情透传
- 目标：将 `/api/invoices/{id}` 从 Mock 切到后端。
- 前置：任务 16
- 完成标准：详情页能展示数据库中的工作包。
- 测试：点击详情显示真实数据。

24) 工作包更新透传
- 目标：将 `PUT /api/invoices/{id}/workpackages/{wpId}` 透传。
- 前置：任务 17
- 完成标准：点击 “Mark as Complete” 能更新数据库并刷新状态。
- 测试：操作后刷新仍保持完成状态。

25) 概览我的视图透传
- 目标：将 `/api/overview/my` 透传。
- 前置：任务 18
- 完成标准：Dashboard 的异常与 ToDo 来自数据库。
- 测试：构造数据命中两块区域。

26) 概览团队视图透传
- 目标：将 `/api/overview/team` 透传。
- 前置：任务 19
- 完成标准：筛选与快捷按钮对真实数据生效。
- 测试：更换筛选结果变化正确。

27) 客户列表/详情透传
- 目标：将 `/api/customers` 与 `/api/customers/{id}` 透传；规则读取透传。
- 前置：任务 11、12
- 完成标准：客户页面显示数据库字段。
- 测试：刷新客户列表/详情校验。

28) 导出透传
- 目标：将 `/api/exports/invoices` 透传。
- 前置：任务 20
- 完成标准：点击导出下载真实 Excel。
- 测试：下载文件打开检查列与筛选范围。

29) 关闭 MSW（或保留仅开发 mock）
- 目标：`NEXT_PUBLIC_USE_MOCK=false`，前端全走后端。
- 前置：任务 22-28
- 完成标准：全站功能可用，无 Mock 依赖。
- 测试：禁用 MSW 后全流程回归。

## 阶段 E：性能、稳定性与回归

30) 分页与筛选边界测试
- 目标：覆盖空列表、超页码、组合筛选、非法参数。
- 前置：任务 15、19
- 完成标准：返回稳定、无 500。
- 测试：`pytest`/Postman 脚本集合。

31) 索引与约束校对                                                                                  
- 目标：为常用筛选字段建索引；确认唯一约束生效。
- 前置：任务 3-6、15
- 完成标准：慢查询消失；重复数据写入被拒。
- 测试：执行计划/插入重复用例。

32) 日志与错误可观测性
- 目标：结构化日志、请求 ID、关键错误栈。
- 前置：任务 1、21
- 完成标准：问题可追踪；隐私安全。
- 测试：触发错误日志检查输出。

33) 最小端到端回归
- 目标：从 Dashboard → 详情 → 完成一步 → 列表刷新 → 导出。
- 前置：任务 22-29
- 完成标准：步骤全绿；无控制台报错。
- 测试：手工路径 + 少量自动化脚本。

34) 文档与环境样例完善
- 目标：补充 `README`、`.env.example`、路由与字段对照表。
- 前置：全部 API 稳定
- 完成标准：新成员按文档 30 分钟内跑通。
- 测试：新人演练或自测从零搭建。

提示
- 若时间更紧，可将 10-13 合并为“只读接口优先”，先满足前端展示；写操作（14、16、17）随后补齐。
- 若暂不需要“模板/规则”可视化管理，保留后端接口与种子，前端保持只读展示，无需新增 UI。