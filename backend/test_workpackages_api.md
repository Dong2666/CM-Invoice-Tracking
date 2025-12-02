# 工作包更新 API 测试指南（任务17）

## 前提条件
1. 确保后端服务正在运行：`uvicorn app.main:app --reload --port 8000`
2. 确保已初始化种子数据：`curl -X POST http://localhost:8000/db/init-seed`
3. 确保已创建发票（参考 `test_invoices_api.md`）

---

## 任务17：工作包更新（顺序校验 + Mark as Complete）

### 说明
- 只能更新 `actual_date` 和 `remark` 字段
- **必须按顺序完成**：只能更新当前最前面未完成的工作包
- 设置 `actual_date` 后，自动将 `is_completed` 设置为 `true`
- 更新后自动重新计算发票的 `progress` 和 `current_workpackage`

---

## 准备测试数据

### 1. 配置客户规则

```powershell
curl -X PUT "http://localhost:8000/api/customers/byd_customer_001/rules" `
-H "Content-Type: application/json" `
-d '[
  {"template_id":1,"rule_type":"fixed_day","day_of_month":5},
  {"template_id":2,"rule_type":"nth_weekday","nth":2,"weekday":1},
  {"template_id":3,"rule_type":"last_day_offset","offset":-3},
  {"template_id":4,"rule_type":"fixed_day","day_of_month":15,"is_next_month":true}
]'
```

### 2. 创建发票

```powershell
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-TEST-001",
  "customer_id": "byd_customer_001",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "CCN1",
  "ile": "ILE-TEST-001",
  "bn_release_status": "Pending",
  "created_time": "2024-01-15T10:00:00"
}'
```

### 3. 获取工作包ID

```powershell
curl "http://localhost:8000/api/invoices/INV-TEST-001"
```

**从响应中找到4个工作包的UUID：**
```json
{
  "workpackages": [
    {"id": "uuid-1", "template_id": 1, ...},
    {"id": "uuid-2", "template_id": 2, ...},
    {"id": "uuid-3", "template_id": 3, ...},
    {"id": "uuid-4", "template_id": 4, ...}
  ]
}
```

**记录这些UUID用于后续测试。**

---

## 测试场景

### 场景1：尝试跳步更新（应返回409错误）

**说明：** 尝试更新第2个工作包（template_id=2），但第1个还未完成。

```powershell
# 替换 <uuid-2> 为实际的工作包ID
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<uuid-2>" `
-H "Content-Type: application/json" `
-d '{
  "actual_date": "2024-01-10",
  "remark": "尝试跳步"
}'
```

**预期返回：** 409 Conflict
```json
{
  "code": 409,
  "message": "必须按顺序完成工作包，当前应完成步骤 1",
  "details": null
}
```

---

### 场景2：正确按顺序完成第1步

```powershell
# 替换 <uuid-1> 为实际的工作包ID（template_id=1）
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<uuid-1>" `
-H "Content-Type: application/json" `
-d '{
  "actual_date": "2024-01-06",
  "remark": "第一步已完成"
}'
```

**预期返回：** 200 OK
```json
{
  "id": "uuid-1",
  "invoice_id": "INV-TEST-001",
  "template_id": 1,
  "due_date": "2024-01-05",
  "actual_date": "2024-01-06",
  "is_completed": true,
  "remark": "第一步已完成"
}
```

**验证：**
```powershell
curl "http://localhost:8000/api/invoices/INV-TEST-001"
```

**检查：**
- ✅ 第1个工作包的 `is_completed` 应为 `true`
- ✅ 发票的 `current_workpackage` 应更新为第2步的名称
- ✅ 发票的 `progress` 应为 `"Abnormal"`（因为 actual_date 晚于 due_date）

---

### 场景3：完成第2步

```powershell
# 现在可以更新第2个工作包了
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<uuid-2>" `
-H "Content-Type: application/json" `
-d '{
  "actual_date": "2024-01-08",
  "remark": "第二步已完成"
}'
```

**预期返回：** 200 OK

**验证：**
```powershell
curl "http://localhost:8000/api/invoices/INV-TEST-001"
```

**检查：**
- ✅ 第2个工作包的 `is_completed` 应为 `true`
- ✅ 发票的 `current_workpackage` 应更新为第3步的名称
- ✅ 发票的 `progress` 应为 `"Abnormal"`（第1步已经逾期）

---

### 场景4：只更新 remark（不设置 actual_date）

```powershell
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<uuid-3>" `
-H "Content-Type: application/json" `
-d '{
  "remark": "添加备注但不完成"
}'
```

**预期返回：** 200 OK

**验证：**
```powershell
curl "http://localhost:8000/api/invoices/INV-TEST-001"
```

**检查：**
- ✅ 第3个工作包的 `remark` 已更新
- ✅ 第3个工作包的 `is_completed` 仍为 `false`
- ✅ 第3个工作包的 `actual_date` 仍为 `null`
- ✅ 发票的 `current_workpackage` 仍为第3步

---

### 场景5：完成第3步后再完成第4步

```powershell
# 完成第3步
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<uuid-3>" `
-H "Content-Type: application/json" `
-d '{
  "actual_date": "2024-01-29"
}'

# 完成第4步
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<uuid-4>" `
-H "Content-Type: application/json" `
-d '{
  "actual_date": "2024-02-14"
}'
```

**验证：**
```powershell
curl "http://localhost:8000/api/invoices/INV-TEST-001"
```

**检查：**
- ✅ 所有工作包的 `is_completed` 应为 `true`
- ✅ 发票的 `progress` 应为 `"Done"`
- ✅ 发票的 `current_workpackage` 应为最后一步的名称

---

### 场景6：测试错误情况

#### 6.1 发票不存在

```powershell
curl -X PUT "http://localhost:8000/api/invoices/INV-INVALID/workpackages/<uuid-1>" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-06"}'
```

**预期：** 404 Not Found
```json
{
  "code": 404,
  "message": "发票 INV-INVALID 不存在",
  "details": null
}
```

#### 6.2 工作包ID格式错误

```powershell
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/invalid-uuid" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-06"}'
```

**预期：** 404 Not Found
```json
{
  "code": 404,
  "message": "工作包ID格式错误: invalid-uuid",
  "details": null
}
```

#### 6.3 工作包不存在

```powershell
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/12345678-1234-1234-1234-123456789012" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-06"}'
```

**预期：** 404 Not Found

#### 6.4 工作包不属于该发票

```powershell
# 创建第二个发票
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-TEST-002",
  "customer_id": "byd_customer_001",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "CCN2",
  "ile": "ILE-TEST-002",
  "bn_release_status": "Pending",
  "created_time": "2024-01-20T10:00:00"
}'

# 获取INV-TEST-002的工作包ID
curl "http://localhost:8000/api/invoices/INV-TEST-002"

# 尝试用INV-TEST-001的ID去更新INV-TEST-002的工作包
curl -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<INV-TEST-002的工作包UUID>" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-06"}'
```

**预期：** 404 Not Found
```json
{
  "code": 404,
  "message": "工作包 <uuid> 不属于发票 INV-TEST-001",
  "details": null
}
```

---

## Progress 计算验证

### 测试不同的完成时间对 Progress 的影响

#### 1. Normal（正常）

**条件：** 所有工作包都在 `due_date` 之前或当天完成

```powershell
# 创建新发票
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-NORMAL",
  "customer_id": "byd_customer_001",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "CCN1",
  "ile": "ILE-NORMAL",
  "bn_release_status": "Pending",
  "created_time": "2024-01-15T10:00:00"
}'

# 获取工作包ID
curl "http://localhost:8000/api/invoices/INV-NORMAL"

# 按顺序完成，所有actual_date都不晚于due_date
# 假设 due_dates 为: 2024-01-05, 2024-01-08, 2024-01-28, 2024-02-15
curl -X PUT "http://localhost:8000/api/invoices/INV-NORMAL/workpackages/<uuid-1>" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-05"}'

curl -X PUT "http://localhost:8000/api/invoices/INV-NORMAL/workpackages/<uuid-2>" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-08"}'

curl -X PUT "http://localhost:8000/api/invoices/INV-NORMAL/workpackages/<uuid-3>" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-28"}'

curl -X PUT "http://localhost:8000/api/invoices/INV-NORMAL/workpackages/<uuid-4>" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-02-15"}'

# 验证
curl "http://localhost:8000/api/invoices/INV-NORMAL"
```

**检查：** `progress` 应为 `"Done"`

#### 2. Abnormal（异常）

**条件：** 至少有一个工作包逾期完成（actual_date > due_date）

```powershell
# 上面场景1中，第1步 actual_date=2024-01-06 > due_date=2024-01-05
# 验证发票 INV-TEST-001
curl "http://localhost:8000/api/invoices/INV-TEST-001"
```

**检查：** `progress` 应为 `"Abnormal"`

---

## 完整测试流程

```powershell
# 1. 初始化
curl -X POST http://localhost:8000/db/init-seed

# 2. 配置规则
curl -X PUT "http://localhost:8000/api/customers/byd_customer_001/rules" `
-H "Content-Type: application/json" `
-d '[{"template_id":1,"rule_type":"fixed_day","day_of_month":5},{"template_id":2,"rule_type":"nth_weekday","nth":2,"weekday":1},{"template_id":3,"rule_type":"last_day_offset","offset":-3},{"template_id":4,"rule_type":"fixed_day","day_of_month":15,"is_next_month":true}]'

# 3. 创建发票
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{"id":"INV-SEQ-TEST","customer_id":"byd_customer_001","cm_id":"cm_viveka","lcm_id":"lcm_jimmy","region":"CCN1","ile":"ILE-SEQ","bn_release_status":"Pending","created_time":"2024-01-15T10:00:00"}'

# 4. 获取工作包ID
curl "http://localhost:8000/api/invoices/INV-SEQ-TEST"

# 记下4个工作包的UUID（按sequence_order排序）
# wp1_id = <第1个工作包的UUID>
# wp2_id = <第2个工作包的UUID>
# wp3_id = <第3个工作包的UUID>
# wp4_id = <第4个工作包的UUID>

# 5. 测试：尝试跳步（应失败）
curl -X PUT "http://localhost:8000/api/invoices/INV-SEQ-TEST/workpackages/$wp2_id" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-10"}'
# 预期：409错误

# 6. 正确完成第1步
curl -X PUT "http://localhost:8000/api/invoices/INV-SEQ-TEST/workpackages/$wp1_id" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-06","remark":"完成第1步"}'
# 预期：200成功

# 7. 验证第1步完成后的状态
curl "http://localhost:8000/api/invoices/INV-SEQ-TEST"
# 检查：current_workpackage 应为第2步

# 8. 完成第2步
curl -X PUT "http://localhost:8000/api/invoices/INV-SEQ-TEST/workpackages/$wp2_id" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-08","remark":"完成第2步"}'

# 9. 完成第3步
curl -X PUT "http://localhost:8000/api/invoices/INV-SEQ-TEST/workpackages/$wp3_id" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-29","remark":"完成第3步"}'

# 10. 完成第4步
curl -X PUT "http://localhost:8000/api/invoices/INV-SEQ-TEST/workpackages/$wp4_id" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-02-14","remark":"完成第4步"}'

# 11. 最终验证
curl "http://localhost:8000/api/invoices/INV-SEQ-TEST"
# 检查：progress 应为 "Done" 或 "Abnormal"
```

---

## API端点

| 方法 | 端点 | 描述 | 状态码 |
|------|------|------|--------|
| PUT | `/api/invoices/{id}/workpackages/{wpId}` | 更新工作包 | 200/404/409 |

---

## 请求体

```json
{
  "actual_date": "2024-01-06",  // 可选，设置后自动标记为完成
  "remark": "string"             // 可选，备注信息
}
```

---

## 响应格式

### 成功（200）

```json
{
  "id": "uuid",
  "invoice_id": "string",
  "template_id": 1,
  "due_date": "2024-01-05",
  "actual_date": "2024-01-06",
  "is_completed": true,
  "remark": "string"
}
```

### 顺序错误（409）

```json
{
  "code": 409,
  "message": "必须按顺序完成工作包，当前应完成步骤 1",
  "details": null
}
```

### 资源不存在（404）

```json
{
  "code": 404,
  "message": "发票 INV-INVALID 不存在",
  "details": null
}
```

---

## 业务规则

### 1. 顺序约束
- ✅ 只能更新当前最前面未完成的工作包
- ✅ 尝试跳步返回 409 错误
- ✅ 错误消息明确指出当前应完成的步骤

### 2. 自动标记完成
- ✅ 设置 `actual_date` 后，`is_completed` 自动设为 `true`
- ✅ 只更新 `remark` 不会标记为完成

### 3. 进度重算
- ✅ 更新后自动重新计算发票的 `progress`
- ✅ 更新后自动更新发票的 `current_workpackage`

### 4. Progress 状态
- **Normal:** 所有已完成的工作包都不逾期
- **Abnormal:** 至少有一个工作包逾期（actual_date > due_date）
- **Done:** 所有工作包都已完成

---

## Swagger UI 测试

访问 http://localhost:8000/docs 可以：
- ✅ 查看工作包更新API文档
- ✅ 在线测试更新操作
- ✅ 查看请求/响应Schema
- ✅ 测试顺序校验

---

## 注意事项

1. **UUID 格式：** 工作包ID必须是有效的UUID格式
2. **顺序校验：** 严格按照 `sequence_order` 顺序完成
3. **进度自动更新：** 每次更新工作包都会触发发票进度重算
4. **只读字段：** 不能直接修改 `is_completed`、`due_date`、`template_id` 等字段
5. **日期格式：** 使用 ISO 8601 格式（`YYYY-MM-DD`）

---

## 错误码总结

| 状态码 | 场景 | 处理方式 |
|--------|------|----------|
| 200 | 更新成功 | 返回更新后的工作包 |
| 404 | 发票/工作包不存在 | 返回错误信息 |
| 409 | 顺序校验失败 | 返回当前应完成的步骤 |
| 422 | 请求参数验证失败 | 返回验证错误详情 |









