# 客户与规则 API 测试指南

## 前提条件
1. 确保后端服务正在运行：`uvicorn app.main:app --reload --port 8000`
2. 确保已初始化种子数据：`curl -X POST http://localhost:8000/db/init-seed`

## 任务11：客户 API 测试

### 1. 列表查询（GET /api/customers）

```powershell
curl http://localhost:8000/api/customers
```

**预期返回：** 客户列表（包含种子数据中的 BYD）

### 2. 查询单个客户（GET /api/customers/{id}）

```powershell
curl http://localhost:8000/api/customers/customer_byd
```

**预期返回：** 客户详情

### 3. 创建客户（POST /api/customers）

```powershell
curl -X POST http://localhost:8000/api/customers -H "Content-Type: application/json" -d '{\"id\": \"customer_tesla\", \"customer_name\": \"Tesla\", \"remark\": \"特斯拉汽车\", \"cm_id\": \"cm_viveka\", \"lcm_id\": \"lcm_jimmy\"}'
```

**预期返回：** 201状态码和创建的客户数据

### 4. 测试ID唯一性（应该失败）

```powershell
curl -X POST http://localhost:8000/api/customers -H "Content-Type: application/json" -d '{\"id\": \"customer_byd\", \"customer_name\": \"Duplicate\", \"cm_id\": \"cm_viveka\", \"lcm_id\": \"lcm_jimmy\"}'
```

**预期返回：** 409状态码，错误信息"客户ID customer_byd 已存在"

### 5. 更新客户（PUT /api/customers/{id}）

```powershell
curl -X PUT http://localhost:8000/api/customers/customer_tesla -H "Content-Type: application/json" -d '{\"customer_name\": \"Tesla Motors\", \"remark\": \"特斯拉汽车 - 新能源\"}'
```

**预期返回：** 更新后的客户数据

### 6. 删除客户（DELETE /api/customers/{id}）

```powershell
curl -X DELETE http://localhost:8000/api/customers/customer_tesla
```

**预期返回：** 204状态码，无内容

### 7. 验证删除

```powershell
curl http://localhost:8000/api/customers/customer_tesla
```

**预期返回：** 404状态码

## 任务12：客户规则 API 测试

### 1. 查询客户规则（GET /api/customers/{id}/rules）

```powershell
# 查询BYD的规则（初始应该为空）
curl http://localhost:8000/api/customers/customer_byd/rules
```

**预期返回：** 空数组 `[]`

### 2. 设置客户规则（PUT /api/customers/{id}/rules）

为 customer_byd 设置4个工作包的规则：

```powershell
curl -X PUT http://localhost:8000/api/customers/customer_byd/rules -H "Content-Type: application/json" -d '[
  {
    \"template_id\": 1,
    \"rule_type\": \"fixed_day\",
    \"day_of_month\": 8,
    \"is_next_month\": false
  },
  {
    \"template_id\": 2,
    \"rule_type\": \"fixed_day\",
    \"day_of_month\": 18,
    \"is_next_month\": false
  },
  {
    \"template_id\": 3,
    \"rule_type\": \"last_day_offset\",
    \"offset\": -2,
    \"is_next_month\": false
  },
  {
    \"template_id\": 4,
    \"rule_type\": \"nth_weekday\",
    \"nth\": 1,
    \"weekday\": 0,
    \"is_next_month\": true
  }
]'
```

**预期返回：** 创建的4条规则

**规则说明：**
- 规则1：每月8号
- 规则2：每月18号
- 规则3：月末往前2天
- 规则4：下月第一个星期一

### 3. 再次查询规则（验证保存成功）

```powershell
curl http://localhost:8000/api/customers/customer_byd/rules
```

**预期返回：** 4条规则数据

### 4. 更新规则（幂等操作）

修改规则1，只保留2条规则：

```powershell
curl -X PUT http://localhost:8000/api/customers/customer_byd/rules -H "Content-Type: application/json" -d '[
  {
    \"template_id\": 1,
    \"rule_type\": \"fixed_day\",
    \"day_of_month\": 10,
    \"is_next_month\": false
  },
  {
    \"template_id\": 2,
    \"rule_type\": \"fixed_day\",
    \"day_of_month\": 20,
    \"is_next_month\": false
  }
]'
```

**预期返回：** 只有2条规则（旧规则被删除，新规则被创建）

### 5. 验证幂等性

再次查询应该只有2条规则：

```powershell
curl http://localhost:8000/api/customers/customer_byd/rules
```

**预期返回：** 2条规则

### 6. 测试规则模板唯一性

尝试为同一个模板创建多条规则（应该在数据库层面失败）：

```powershell
curl -X PUT http://localhost:8000/api/customers/customer_byd/rules -H "Content-Type: application/json" -d '[
  {
    \"template_id\": 1,
    \"rule_type\": \"fixed_day\",
    \"day_of_month\": 10,
    \"is_next_month\": false
  },
  {
    \"template_id\": 1,
    \"rule_type\": \"fixed_day\",
    \"day_of_month\": 20,
    \"is_next_month\": false
  }
]'
```

**预期返回：** 400状态码（违反唯一约束）

### 7. 测试不存在的客户

```powershell
curl http://localhost:8000/api/customers/invalid_id/rules
```

**预期返回：** 404状态码

## Swagger UI 测试

访问 http://localhost:8000/docs 可以直接在浏览器中测试所有API，查看请求/响应Schema。

## 规则类型说明

### fixed_day（固定日期）
- `day_of_month`: 1-31
- `is_next_month`: true/false

### nth_weekday（第N个星期X）
- `nth`: 1（第一个）、2（第二个）、3、4、-1（最后一个）
- `weekday`: 0（周一）到 6（周日）
- `is_next_month`: true/false

### last_day_offset（月末偏移）
- `offset`: 负数往前，正数往后（天数）
- `is_next_month`: true/false

## 完整测试流程

```powershell
# 1. 初始化种子数据
curl -X POST http://localhost:8000/db/init-seed

# 2. 查看所有客户
curl http://localhost:8000/api/customers

# 3. 为BYD设置规则
curl -X PUT http://localhost:8000/api/customers/customer_byd/rules -H "Content-Type: application/json" -d '[{\"template_id\": 1, \"rule_type\": \"fixed_day\", \"day_of_month\": 8, \"is_next_month\": false},{\"template_id\": 2, \"rule_type\": \"fixed_day\", \"day_of_month\": 18, \"is_next_month\": false},{\"template_id\": 3, \"rule_type\": \"fixed_day\", \"day_of_month\": 28, \"is_next_month\": false},{\"template_id\": 4, \"rule_type\": \"nth_weekday\", \"nth\": 1, \"weekday\": 0, \"is_next_month\": true}]'

# 4. 验证规则
curl http://localhost:8000/api/customers/customer_byd/rules

# 5. 创建新客户
curl -X POST http://localhost:8000/api/customers -H "Content-Type: application/json" -d '{\"id\": \"customer_bmw\", \"customer_name\": \"BMW\", \"cm_id\": \"cm_viveka\", \"lcm_id\": \"lcm_jimmy\"}'

# 6. 为新客户设置规则
curl -X PUT http://localhost:8000/api/customers/customer_bmw/rules -H "Content-Type: application/json" -d '[{\"template_id\": 1, \"rule_type\": \"last_day_offset\", \"offset\": -5, \"is_next_month\": false}]'
```

