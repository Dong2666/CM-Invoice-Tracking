# 发票 API 测试指南

## 前提条件
1. 确保后端服务正在运行：`uvicorn app.main:app --reload --port 8000`
2. 确保已初始化种子数据：`curl -X POST http://localhost:8000/db/init-seed`
3. 确保客户已配置规则：参考 `test_customers_api.md` 中的规则配置

---

## 任务14：发票创建（自动生成工作包）

### 说明
- 创建发票时，系统会自动根据客户的规则（DueDateRule）和模板生成工作包
- 每个工作包的 `due_date` 根据规则类型计算
- 自动计算发票的 `progress` 和 `current_workpackage`

### 1. 为客户配置规则（前置步骤）

首先确保客户已经配置了规则：

```powershell
# 获取客户ID（从种子数据）
curl http://localhost:8000/api/customers

# 为客户配置规则（4个模板）
curl -X PUT "http://localhost:8000/api/customers/byd_customer_001/rules" `
-H "Content-Type: application/json" `
-d '[
  {
    "template_id": 1,
    "rule_type": "fixed_day",
    "day_of_month": 5,
    "is_next_month": false
  },
  {
    "template_id": 2,
    "rule_type": "nth_weekday",
    "nth": 2,
    "weekday": 1,
    "is_next_month": false
  },
  {
    "template_id": 3,
    "rule_type": "last_day_offset",
    "offset": -3,
    "is_next_month": false
  },
  {
    "template_id": 4,
    "rule_type": "fixed_day",
    "day_of_month": 15,
    "is_next_month": true
  }
]'
```

### 2. 创建发票（POST /api/invoices）

```powershell
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
  "status_comment": null,
  "created_time": "2024-01-15T10:00:00"
}'
```

**预期返回：**
```json
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
  "current_workpackage": "Customer billing notification",
  "created_time": "2024-01-15T10:00:00",
  "workpackages": [
    {
      "id": "uuid-1",
      "invoice_id": "INV-2024-001",
      "template_id": 1,
      "due_date": "2024-01-05",
      "actual_date": null,
      "is_completed": false,
      "remark": null
    },
    {
      "id": "uuid-2",
      "invoice_id": "INV-2024-001",
      "template_id": 2,
      "due_date": "2024-01-08",
      "actual_date": null,
      "is_completed": false,
      "remark": null
    },
    {
      "id": "uuid-3",
      "invoice_id": "INV-2024-001",
      "template_id": 3,
      "due_date": "2024-01-28",
      "actual_date": null,
      "is_completed": false,
      "remark": null
    },
    {
      "id": "uuid-4",
      "invoice_id": "INV-2024-001",
      "template_id": 4,
      "due_date": "2024-02-15",
      "actual_date": null,
      "is_completed": false,
      "remark": null
    }
  ]
}
```

### 3. 验证工作包数量和due_date

```powershell
# 应该有4个工作包（对应4个模板）
# due_date应该根据规则正确计算
```

### 4. 创建第二个发票（用于列表测试）

```powershell
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

---

## 任务15：发票列表（分页+筛选）

### 1. 获取所有发票（GET /api/invoices）

```powershell
curl "http://localhost:8000/api/invoices"
```

**预期返回：**
```json
{
  "items": [
    { /* 发票对象 */ },
    { /* 发票对象 */ }
  ],
  "total": 2,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

### 2. 分页测试

```powershell
# 每页1条
curl "http://localhost:8000/api/invoices?page=1&size=1"

# 第2页
curl "http://localhost:8000/api/invoices?page=2&size=1"
```

### 3. 按创建时间筛选

```powershell
# 2024年1月创建的发票
curl "http://localhost:8000/api/invoices?created_from=2024-01&created_to=2024-01"

# 2024年1月到2月的发票
curl "http://localhost:8000/api/invoices?created_from=2024-01&created_to=2024-02"
```

### 4. 按ILE筛选

```powershell
curl "http://localhost:8000/api/invoices?ile=ILE-2024-001"
```

### 5. 按CM筛选

```powershell
curl "http://localhost:8000/api/invoices?cm=cm_viveka"
```

### 6. 按BN Release Status筛选

```powershell
# 只显示Pending状态
curl "http://localhost:8000/api/invoices?status=Pending"

# 只显示Released状态
curl "http://localhost:8000/api/invoices?status=Released"
```

### 7. 按Progress筛选

```powershell
# 只显示Normal进度
curl "http://localhost:8000/api/invoices?progress=Normal"

# 只显示Abnormal进度
curl "http://localhost:8000/api/invoices?progress=Abnormal"

# 只显示Done
curl "http://localhost:8000/api/invoices?progress=Done"
```

### 8. 组合筛选

```powershell
# 2024年1月，CM为viveka，状态为Pending
curl "http://localhost:8000/api/invoices?created_from=2024-01&created_to=2024-01&cm=cm_viveka&status=Pending"
```

---

## 任务16：发票详情与更新

### 1. 获取发票详情（GET /api/invoices/{id}）

```powershell
curl "http://localhost:8000/api/invoices/INV-2024-001"
```

**预期返回：** 完整的发票信息，包含所有工作包

### 2. 更新发票（PUT /api/invoices/{id}）

#### 更新 bn_release_status

```powershell
curl -X PUT "http://localhost:8000/api/invoices/INV-2024-001" `
-H "Content-Type: application/json" `
-d '{
  "bn_release_status": "Released"
}'
```

#### 更新 status_comment

```powershell
curl -X PUT "http://localhost:8000/api/invoices/INV-2024-001" `
-H "Content-Type: application/json" `
-d '{
  "status_comment": "已审核通过"
}'
```

#### 同时更新多个字段

```powershell
curl -X PUT "http://localhost:8000/api/invoices/INV-2024-001" `
-H "Content-Type: application/json" `
-d '{
  "bn_release_status": "Completed",
  "status_comment": "发票处理完成"
}'
```

### 3. 验证更新结果

```powershell
curl "http://localhost:8000/api/invoices/INV-2024-001"
```

**预期：** 返回的数据应包含更新后的字段值

---

## 删除发票（额外功能）

### 删除发票及其工作包

```powershell
curl -X DELETE "http://localhost:8000/api/invoices/INV-2024-002"
```

**预期：** 204状态码（无内容）

### 验证删除

```powershell
# 应该返回404
curl "http://localhost:8000/api/invoices/INV-2024-002"
```

---

## 错误场景测试

### 1. 创建重复ID的发票

```powershell
# 第二次创建相同ID
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
```

**预期：** 400错误（主键冲突）

### 2. 创建发票时引用不存在的客户

```powershell
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-2024-999",
  "customer_id": "invalid_customer",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "CCN1",
  "ile": "ILE-2024-999",
  "bn_release_status": "Pending",
  "created_time": "2024-01-15T10:00:00"
}'
```

**预期：** 400错误（外键约束）

### 3. 更新不存在的发票

```powershell
curl -X PUT "http://localhost:8000/api/invoices/INV-INVALID" `
-H "Content-Type: application/json" `
-d '{
  "bn_release_status": "Released"
}'
```

**预期：** 404错误

### 4. 获取不存在的发票

```powershell
curl "http://localhost:8000/api/invoices/INV-INVALID"
```

**预期：** 404错误

---

## 完整测试流程

```powershell
# 1. 初始化数据
curl -X POST http://localhost:8000/db/init-seed

# 2. 配置客户规则
curl -X PUT "http://localhost:8000/api/customers/byd_customer_001/rules" `
-H "Content-Type: application/json" `
-d '[{"template_id":1,"rule_type":"fixed_day","day_of_month":5},{"template_id":2,"rule_type":"nth_weekday","nth":2,"weekday":1},{"template_id":3,"rule_type":"last_day_offset","offset":-3},{"template_id":4,"rule_type":"fixed_day","day_of_month":15,"is_next_month":true}]'

# 3. 创建发票1
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{"id":"INV-2024-001","customer_id":"byd_customer_001","cm_id":"cm_viveka","lcm_id":"lcm_jimmy","region":"CCN1","ile":"ILE-2024-001","bn_release_status":"Pending","created_time":"2024-01-15T10:00:00"}'

# 4. 创建发票2
curl -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{"id":"INV-2024-002","customer_id":"byd_customer_001","cm_id":"cm_viveka","lcm_id":"lcm_jimmy","region":"CCN2","ile":"ILE-2024-002","bn_release_status":"Released","status_comment":"测试发票","created_time":"2024-02-10T14:30:00"}'

# 5. 获取发票详情
curl "http://localhost:8000/api/invoices/INV-2024-001"

# 6. 更新发票
curl -X PUT "http://localhost:8000/api/invoices/INV-2024-001" `
-H "Content-Type: application/json" `
-d '{"bn_release_status":"Released","status_comment":"已审核通过"}'

# 7. 验证更新
curl "http://localhost:8000/api/invoices/INV-2024-001"

# 8. 列表查询（所有）
curl "http://localhost:8000/api/invoices"

# 9. 列表查询（筛选）
curl "http://localhost:8000/api/invoices?status=Released"

# 10. 分页查询
curl "http://localhost:8000/api/invoices?page=1&size=1"
```

---

## API端点总览

| 方法 | 端点 | 描述 | 状态码 |
|------|------|------|--------|
| POST | `/api/invoices` | 创建发票（自动生成工作包） | 201 |
| GET | `/api/invoices` | 获取发票列表（分页+筛选） | 200 |
| GET | `/api/invoices/{id}` | 获取发票详情 | 200/404 |
| PUT | `/api/invoices/{id}` | 更新发票 | 200/404 |
| DELETE | `/api/invoices/{id}` | 删除发票 | 204/404 |

---

## 筛选参数说明

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `page` | int | 页码（从1开始） | `page=1` |
| `size` | int | 每页数量（1-100） | `size=20` |
| `created_from` | string | 创建时间起（YYYY-MM） | `created_from=2024-01` |
| `created_to` | string | 创建时间止（YYYY-MM） | `created_to=2024-12` |
| `ile` | string | ILE筛选 | `ile=ILE-2024-001` |
| `cm` | string | CM ID筛选 | `cm=cm_viveka` |
| `status` | string | BN Release Status | `status=Pending` |
| `progress` | string | Progress状态 | `progress=Normal` |
| `current_step` | int | 当前步骤（1-4） | `current_step=2` |

---

## 数据结构说明

### InvoiceCreate（创建请求）
```json
{
  "id": "string",
  "customer_id": "string",
  "cm_id": "string",
  "lcm_id": "string",
  "region": "string",
  "ile": "string",
  "bn_release_status": "string",
  "status_comment": "string | null",
  "created_time": "datetime"
}
```

### InvoiceRead（响应）
```json
{
  "id": "string",
  "customer_id": "string",
  "cm_id": "string",
  "lcm_id": "string",
  "region": "string",
  "ile": "string",
  "bn_release_status": "string",
  "status_comment": "string | null",
  "progress": "Normal | Abnormal | Done",
  "current_workpackage": "string | null",
  "created_time": "datetime",
  "workpackages": [
    {
      "id": "uuid",
      "invoice_id": "string",
      "template_id": "int",
      "due_date": "date | null",
      "actual_date": "date | null",
      "is_completed": "boolean",
      "remark": "string | null"
    }
  ]
}
```

### InvoiceUpdate（更新请求）
```json
{
  "customer_id": "string | null",
  "cm_id": "string | null",
  "lcm_id": "string | null",
  "region": "string | null",
  "ile": "string | null",
  "bn_release_status": "string | null",
  "status_comment": "string | null",
  "progress": "string | null",
  "current_workpackage": "string | null"
}
```

---

## Swagger UI 测试

访问 http://localhost:8000/docs 可以：
- ✅ 查看所有发票API文档
- ✅ 在线测试创建、查询、更新、删除
- ✅ 查看请求/响应Schema
- ✅ 测试各种筛选参数

---

## 业务逻辑验证

### 1. 工作包自动生成
- ✅ 创建发票时自动生成4个工作包（对应4个模板）
- ✅ 每个工作包的 `due_date` 根据客户规则计算
- ✅ 如果客户没有配置规则，`due_date` 为 `null`

### 2. Progress 计算
- **Normal：** 所有工作包都在 `due_date` 之前或当天完成
- **Abnormal：** 至少有一个工作包逾期（超过 `due_date` 未完成）
- **Done：** 所有工作包都已完成

### 3. Current Workpackage
- 显示当前应完成的工作包名称（按 `sequence_order`）
- 如果所有工作包都已完成，显示最后一个工作包

---

## 注意事项

1. **创建时间格式：** 使用ISO 8601格式（`YYYY-MM-DDTHH:MM:SS`）
2. **时区：** 后端未处理时区，建议统一使用UTC
3. **外键约束：** 创建发票时必须确保 `customer_id`、`cm_id`、`lcm_id` 存在
4. **规则配置：** 客户必须先配置规则，否则工作包的 `due_date` 为 `null`
5. **级联删除：** 删除发票时会自动删除关联的工作包

---

## 性能优化建议

对于生产环境：
1. 为 `Invoice.created_time` 添加索引（筛选优化）
2. 为 `Invoice.cm_id` 和 `Invoice.customer_id` 添加索引（外键优化）
3. 考虑使用 `joinedload` 预加载工作包（减少N+1查询）
4. 对分页查询添加缓存（如Redis）









