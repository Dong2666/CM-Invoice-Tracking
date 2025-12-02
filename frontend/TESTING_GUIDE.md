# 前端对接后端 API 测试指南

## 已完成的任务

### ✅ 任务22：发票列表透传（配置环境变量与API调用）
- **文件：** `frontend/my-app/.env.local`、`frontend/my-app/lib/api.ts`、`frontend/my-app/app/invoice/page.tsx`
- **功能：** 发票列表页面从后端数据库读取数据，不再使用Mock数据

### ✅ 任务23：发票详情透传
- **文件：** `frontend/my-app/app/invoice/[id]/page.tsx`、`frontend/my-app/components/invoice-detail-client.tsx`
- **功能：** 发票详情页面从后端数据库读取数据，工作包更新调用后端API

---

## 前置条件

### 1. 启动后端服务器
```powershell
# 在 backend 目录下
cd backend
uvicorn app.main:app --reload --port 8000
```

### 2. 初始化后端数据
```powershell
# 初始化种子数据
curl -X POST http://localhost:8000/db/init-seed

# 配置客户规则
curl -X PUT "http://localhost:8000/api/customers/byd_customer_001/rules" `
-H "Content-Type: application/json" `
-d '[
  {"template_id":1,"rule_type":"fixed_day","day_of_month":5},
  {"template_id":2,"rule_type":"nth_weekday","nth":2,"weekday":1},
  {"template_id":3,"rule_type":"last_day_offset","offset":-3},
  {"template_id":4,"rule_type":"fixed_day","day_of_month":15,"is_next_month":true}
]'

# 创建测试发票
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-2024-001",
  "customer_id": "byd_customer_001",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "CCN1",
  "ile": "ILE-2024-001",
  "bn_release_status": "Pending",
  "created_time": "2024-01-15T10:00:00"
}'

# 创建第二个测试发票
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-2024-002",
  "customer_id": "byd_customer_001",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "CCN2",
  "ile": "ILE-2024-002",
  "bn_release_status": "Released",
  "status_comment": "测试发票",
  "created_time": "2024-02-10T14:30:00"
}'
```

### 3. 启动前端开发服务器
```powershell
# 在 frontend/my-app 目录下
cd frontend/my-app
npm install  # 首次运行
npm run dev
```

访问：http://localhost:3000

---

## 测试步骤

### 任务22：发票列表测试

#### 1. 访问发票列表页面
**URL：** http://localhost:3000/invoice

**预期结果：**
- ✅ 页面显示从后端加载的发票列表
- ✅ 显示 "INV-2024-001" 和 "INV-2024-002" 两条发票
- ✅ 每条发票显示正确的字段：WorkID、Created Time、Region、ILE、CM、BN Release Status、Comment、Progress、Next Workpackage、Next Step Date

#### 2. 测试筛选功能

##### a) 按日期筛选
1. 选择 "Date (Year-Month)" 下拉框
2. 选择 "2024-01"
3. **预期：** 只显示 "INV-2024-001"

##### b) 按ILE搜索
1. 在 "ILE" 输入框中输入 "ILE-2024-002"
2. **预期：** 只显示 "INV-2024-002"
3. 清空输入框，**预期：** 显示所有发票

##### c) 按Progress筛选
1. 选择 "Progress" 下拉框
2. 选择 "Normal" 或 "Abnormal"
3. **预期：** 根据发票的 `progress` 字段筛选

#### 3. 测试错误处理

##### a) 停止后端服务器
1. 停止后端服务器（Ctrl+C）
2. 刷新页面
3. **预期：** 显示错误提示：
   ```
   Error: Failed to load invoices
   Make sure the backend server is running at http://localhost:8000
   ```

##### b) 重新启动后端
1. 重新启动后端服务器
2. 刷新页面
3. **预期：** 正常显示发票列表

#### 4. 测试加载状态
1. 打开浏览器开发者工具（F12）→ Network → Slow 3G（模拟慢网络）
2. 刷新页面
3. **预期：** 显示 "Loading invoices..."
4. 加载完成后显示数据

---

### 任务23：发票详情测试

#### 1. 访问发票详情页面
**URL：** http://localhost:3000/invoice/INV-2024-001

**预期结果：**
- ✅ 页面显示从后端加载的发票详细信息
- ✅ 显示发票基本信息（ID、Region、ILE、CM、BN Release Status、Progress、Created Time）
- ✅ 显示4个工作包（对应4个模板）
- ✅ 每个工作包显示：Workpackage Name、Completion、Due Date、Actual Date、Action、Remark

#### 2. 测试工作包顺序校验（核心功能）

##### a) 尝试跳步完成（应失败）
1. 找到第2个工作包（"2. RB internal mapping"）
2. 点击 "Mark as Complete" 按钮
3. **预期：** 按钮是禁用状态（灰色），无法点击
4. **原因：** 第1个工作包尚未完成，必须按顺序

##### b) 正确按顺序完成第1步
1. 找到第1个工作包（"1. Customer billing notification alignment"）
2. 点击 "Mark as Complete" 按钮
3. **预期：**
   - ✅ 弹出提示：`Workpackage marked as complete successfully!`
   - ✅ 第1个工作包的 "Completion" 列显示绿色勾号（✓）
   - ✅ 第1个工作包的 "Actual Date" 列显示今天的日期（可编辑）
   - ✅ 第1个工作包的 "Action" 按钮变为 "Re-open"
   - ✅ 第2个工作包的 "Mark as Complete" 按钮变为可点击（绿色）
   - ✅ 页面 "Progress" 字段自动更新（可能变为 "Abnormal" 如果逾期）

##### c) 完成第2步
1. 第1步完成后，点击第2个工作包的 "Mark as Complete"
2. **预期：** 第2个工作包被标记为完成，第3个工作包变为可点击

##### d) 完成所有工作包
1. 依次完成第3、第4个工作包
2. **预期：**
   - ✅ 所有工作包都显示绿色勾号
   - ✅ 页面 "Progress" 显示 "Done"

#### 3. 测试工作包更新功能

##### a) 修改实际完成日期
1. 选择已完成的工作包（如第1个）
2. 点击 "Actual Date" 日期选择器
3. 选择不同的日期（如选择晚于 Due Date 的日期）
4. **预期：**
   - ✅ 日期更新成功
   - ✅ 页面 "Progress" 可能变为 "Abnormal"（因为逾期完成）
   - ✅ 刷新页面后，日期保持修改后的值

##### b) 添加备注（批量保存）
1. 在多个工作包的 "Remark" 文本框中输入文本（如 "测试备注1"、"测试备注2"）
   - **注意：** Remark文本框现在是多行文本框（3行高度），支持更长的备注内容
   - **注意：** 没有单独的"Save"按钮
2. 点击页面底部的 "Save All (Status, Comment & Remarks)" 按钮
3. **预期：**
   - ✅ 弹出提示：`Invoice and workpackage remarks updated successfully!`
   - ✅ 刷新页面后，所有备注仍然存在

##### c) 重新打开工作包（Re-open）
1. 选择已完成的工作包（Completion列显示绿色✓）
2. 点击 "Re-open" 按钮
3. **预期：**
   - ✅ 按钮显示loading状态
   - ✅ 弹出提示：`Workpackage re-opened successfully!`
   - ✅ Completion列变为红色✗
   - ✅ Actual Date 变为空（显示 "-"）
   - ✅ Action 按钮变回 "Mark as Complete"
   - ✅ 页面 "Progress" 和 "Current Step" 重新计算
   - ✅ 刷新页面后，状态保持为未完成

#### 4. 测试发票状态更新

##### a) 修改BN Release Status
1. 点击 "BN Release Status" 下拉框
2. 选择不同的状态（如 "Partial"）
3. 在 "Status Comment" 输入框中输入备注（如 "部分完成"）
4. 点击底部的 "Save All (Status, Comment & Remarks)" 按钮
5. **预期：**
   - ✅ 弹出提示：`Invoice and workpackage remarks updated successfully!`
   - ✅ 刷新页面后，状态和备注保持修改后的值
   - ✅ 返回列表页面，该发票的状态已更新

#### 5. 测试错误处理

##### a) 停止后端服务器
1. 停止后端服务器
2. 访问详情页面：http://localhost:3000/invoice/INV-2024-001
3. **预期：** 显示错误提示并提供返回列表的按钮

##### b) 访问不存在的发票
1. 重新启动后端
2. 访问：http://localhost:3000/invoice/INV-INVALID
3. **预期：** 显示404错误提示

---

## 数据流验证

### 1. 发票列表 → 后端数据库
```
前端 (http://localhost:3000/invoice)
  ↓ 调用
后端 API (GET http://localhost:8000/api/invoices)
  ↓ 查询
SQL Server 数据库 (Invoice 表)
  ↓ 返回
前端显示数据
```

### 2. 发票详情 → 后端数据库
```
前端 (http://localhost:3000/invoice/INV-2024-001)
  ↓ 调用
后端 API (GET http://localhost:8000/api/invoices/INV-2024-001)
  ↓ 查询
SQL Server 数据库 (Invoice + Workpackage 表)
  ↓ 返回（包含工作包列表）
前端显示详情和工作包
```

### 3. 更新工作包 → 后端数据库
```
前端 (点击 "Mark as Complete")
  ↓ 调用
后端 API (PUT http://localhost:8000/api/invoices/{id}/workpackages/{wpId})
  ↓ 更新
SQL Server 数据库 (Workpackage 表)
  ↓ 顺序校验 + 进度重算
后端返回更新结果
  ↓
前端刷新数据
```

---

## 浏览器开发者工具验证

### 1. Network 标签验证
打开浏览器开发者工具（F12）→ Network 标签

#### 发票列表页面
**预期请求：**
```
GET http://localhost:8000/api/invoices
Status: 200 OK
Response Type: application/json
```

**响应格式：**
```json
{
  "items": [
    {
      "id": "INV-2024-001",
      "customer_id": "byd_customer_001",
      "cm_id": "cm_viveka",
      "lcm_id": "lcm_jimmy",
      "region": "CCN1",
      "ile": "ILE-2024-001",
      "bn_release_status": "Pending",
      "status_comment": null,
      "progress": "Normal",
      "current_workpackage": "...",
      "created_time": "2024-01-15T10:00:00",
      "workpackages": [...]
    }
  ],
  "total": 2,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

#### 发票详情页面
**预期请求：**
```
GET http://localhost:8000/api/invoices/INV-2024-001
Status: 200 OK
```

#### 更新工作包
**预期请求：**
```
PUT http://localhost:8000/api/invoices/INV-2024-001/workpackages/{uuid}
Status: 200 OK
Request Payload:
{
  "actual_date": "2024-01-06",
  "remark": "测试备注"
}
```

### 2. Console 标签验证
**正常情况：** 无错误信息

**错误情况（后端未启动）：**
```
Failed to load invoices: Failed to fetch
API Request Failed [/api/invoices]: TypeError: Failed to fetch
```

---

## 常见问题排查

### 问题1：页面显示 "Failed to load invoices"
**原因：** 后端服务器未启动或无法访问
**解决：**
1. 确认后端服务器正在运行：http://localhost:8000
2. 访问 http://localhost:8000/docs 检查Swagger文档
3. 检查 `.env.local` 文件中的 `NEXT_PUBLIC_API_BASE_URL` 配置

### 问题2：CORS 错误
**错误信息：**
```
Access to fetch at 'http://localhost:8000/api/invoices' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解决：**
1. 确认后端 `backend/app/config.py` 中 `cors_origins` 包含 `http://localhost:3000`
2. 确认后端 `backend/app/main.py` 中 CORS 中间件已配置

### 问题3：工作包顺序校验失败（409错误）
**错误信息：** `必须按顺序完成工作包，当前应完成步骤 1`

**原因：** 这是正常的业务逻辑，必须按顺序完成工作包

**验证：**
1. 先完成第1个工作包
2. 然后才能完成第2个工作包

### 问题4：数据不刷新
**解决：**
1. 手动刷新页面（F5）
2. 或返回列表页面后重新进入详情页面

---

## 成功标准

### ✅ 任务22（发票列表）完成标准
- [ ] 页面从后端加载数据（不是Mock数据）
- [ ] 显示正确的发票列表
- [ ] 筛选功能正常工作
- [ ] 错误处理正确显示
- [ ] Network 标签显示对后端的API调用

### ✅ 任务23（发票详情）完成标准
- [ ] 页面从后端加载数据
- [ ] 显示正确的工作包列表
- [ ] "Mark as Complete" 功能正常（调用后端API）
- [ ] 顺序校验正确（跳步时按钮禁用或返回409错误）
- [ ] 更新工作包后，发票 `progress` 自动重算
- [ ] 修改实际日期后，数据保存到数据库
- [ ] 添加备注后，数据保存到数据库
- [ ] Network 标签显示PUT请求到后端API

---

## 下一步

完成测试后，可以继续实现：
- **任务24：** 工作包更新透传（已包含在任务23中）
- **任务25-28：** 其他页面的API透传
- **任务29：** 关闭Mock，全站使用真实API

---

## 技术栈

### 前端
- **框架：** Next.js 16.0.0 (App Router)
- **UI库：** Radix UI + Tailwind CSS
- **状态管理：** React Hooks (useState, useEffect)
- **HTTP客户端：** Fetch API

### 后端
- **框架：** FastAPI + SQLModel
- **数据库：** SQL Server Express
- **API风格：** RESTful

### 通信
- **协议：** HTTP/JSON
- **CORS：** 允许 http://localhost:3000
- **错误格式：** 统一 `{code, message, details}` 格式

---

## 联系与反馈

如有问题，请检查：
1. 后端Swagger文档：http://localhost:8000/docs
2. 后端健康检查：http://localhost:8000/healthz
3. 浏览器开发者工具的 Network 和 Console 标签

