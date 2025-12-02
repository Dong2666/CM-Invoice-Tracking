# 统一错误格式测试指南（任务21）

## 前提条件
确保后端服务正在运行：`uvicorn app.main:app --reload --port 8000`

---

## 任务21：统一错误格式与CORS

### 说明
所有API错误都返回统一格式：
```json
{
  "code": 404,
  "message": "错误描述",
  "details": null  // 可选，包含额外错误信息
}
```

---

## 测试统一错误格式

### 1. 404 错误（资源不存在）

#### 测试：获取不存在的发票

```powershell
curl -i "http://localhost:8000/api/invoices/INV-NOT-EXIST"
```

**预期响应：**
```
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "code": 404,
  "message": "发票 INV-NOT-EXIST 不存在",
  "details": null
}
```

#### 测试：获取不存在的客户

```powershell
curl -i "http://localhost:8000/api/customers/CUSTOMER-NOT-EXIST"
```

**预期响应：**
```json
{
  "code": 404,
  "message": "客户 CUSTOMER-NOT-EXIST 不存在",
  "details": null
}
```

#### 测试：获取不存在的用户

```powershell
curl -i "http://localhost:8000/api/users/lcm/USER-NOT-EXIST"
```

**预期响应：**
```json
{
  "code": 404,
  "message": "LCM USER-NOT-EXIST 不存在",
  "details": null
}
```

---

### 2. 409 错误（冲突）

#### 测试：工作包顺序校验失败

```powershell
# 前提：创建发票并获取第2个工作包的ID（第1个未完成）
# 参考 test_workpackages_api.md 创建发票

curl -i -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<uuid-2>" `
-H "Content-Type: application/json" `
-d '{"actual_date":"2024-01-10"}'
```

**预期响应：**
```
HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "code": 409,
  "message": "必须按顺序完成工作包，当前应完成步骤 1",
  "details": null
}
```

#### 测试：模板序号重复

```powershell
# 前提：已存在 sequence_order=1 的模板
curl -i -X POST "http://localhost:8000/api/templates" `
-H "Content-Type: application/json" `
-d '{
  "name": "重复序号测试",
  "sequence_order": 1,
  "status": true
}'
```

**预期响应：**
```json
{
  "code": 409,
  "message": "序号 1 已被模板使用",
  "details": null
}
```

---

### 3. 422 错误（请求参数验证失败）

#### 测试：缺少必填字段

```powershell
curl -i -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-TEST"
}'
```

**预期响应：**
```
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "code": 422,
  "message": "请求参数验证失败",
  "details": [
    {
      "type": "missing",
      "loc": ["body", "customer_id"],
      "msg": "Field required",
      "input": {...}
    },
    {
      "type": "missing",
      "loc": ["body", "cm_id"],
      "msg": "Field required",
      "input": {...}
    },
    ...
  ]
}
```

#### 测试：字段类型错误

```powershell
curl -i -X POST "http://localhost:8000/api/templates" `
-H "Content-Type: application/json" `
-d '{
  "name": "测试模板",
  "sequence_order": "not_a_number",
  "status": true
}'
```

**预期响应：**
```json
{
  "code": 422,
  "message": "请求参数验证失败",
  "details": [
    {
      "type": "int_parsing",
      "loc": ["body", "sequence_order"],
      "msg": "Input should be a valid integer",
      "input": "not_a_number"
    }
  ]
}
```

#### 测试：枚举值错误

```powershell
curl -i -X POST "http://localhost:8000/api/customers" `
-H "Content-Type: application/json" `
-d '{
  "id": "test_customer",
  "customer_name": "Test",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "INVALID_REGION"
}'
```

**预期响应：**
```json
{
  "code": 422,
  "message": "请求参数验证失败",
  "details": [
    {
      "type": "enum",
      "loc": ["body", "region"],
      "msg": "Input should be 'CCN1', 'CCN2', 'CCN3' or 'CCN4'",
      "input": "INVALID_REGION"
    }
  ]
}
```

#### 测试：日期格式错误

```powershell
curl -i -X PUT "http://localhost:8000/api/invoices/INV-TEST-001/workpackages/<uuid-1>" `
-H "Content-Type: application/json" `
-d '{"actual_date":"invalid-date"}'
```

**预期响应：**
```json
{
  "code": 422,
  "message": "请求参数验证失败",
  "details": [
    {
      "type": "date_parsing",
      "loc": ["body", "actual_date"],
      "msg": "Input should be a valid date",
      "input": "invalid-date"
    }
  ]
}
```

---

### 4. 400 错误（业务逻辑错误）

#### 测试：外键约束（客户不存在）

```powershell
curl -i -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-BAD-FK",
  "customer_id": "INVALID_CUSTOMER",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "CCN1",
  "ile": "ILE-TEST",
  "bn_release_status": "Pending",
  "created_time": "2024-01-15T10:00:00"
}'
```

**预期响应：**
```json
{
  "code": 400,
  "message": "外键约束错误或数据库错误信息",
  "details": null
}
```

#### 测试：主键冲突（重复ID）

```powershell
# 前提：INV-TEST-001已存在
curl -i -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{
  "id": "INV-TEST-001",
  "customer_id": "byd_customer_001",
  "cm_id": "cm_viveka",
  "lcm_id": "lcm_jimmy",
  "region": "CCN1",
  "ile": "ILE-TEST",
  "bn_release_status": "Pending",
  "created_time": "2024-01-15T10:00:00"
}'
```

**预期响应：**
```json
{
  "code": 400,
  "message": "主键冲突或唯一约束错误信息",
  "details": null
}
```

---

### 5. 500 错误（服务器内部错误）

**说明：** 正常情况下不应出现500错误，但如果出现，也会返回统一格式。

在 DEBUG 模式下（`.env` 中设置 `LOG_LEVEL=DEBUG`）：
```json
{
  "code": 500,
  "message": "服务器内部错误",
  "details": "具体的异常信息"
}
```

在生产模式下（`LOG_LEVEL=INFO`）：
```json
{
  "code": 500,
  "message": "服务器内部错误",
  "details": null
}
```

---

## 测试CORS配置

### 说明
后端已配置允许 `http://localhost:3000` 跨域访问。

### 1. 测试预检请求（OPTIONS）

```powershell
curl -i -X OPTIONS "http://localhost:8000/api/invoices" `
-H "Origin: http://localhost:3000" `
-H "Access-Control-Request-Method: POST" `
-H "Access-Control-Request-Headers: Content-Type"
```

**预期响应头包含：**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Credentials: true
```

### 2. 测试实际请求（GET）

```powershell
curl -i "http://localhost:8000/api/invoices" `
-H "Origin: http://localhost:3000"
```

**预期响应头包含：**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

### 3. 在浏览器中测试

打开浏览器开发者工具（F12），在 Console 中运行：

```javascript
// 测试GET请求
fetch('http://localhost:8000/api/invoices', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
  .then(response => response.json())
  .then(data => console.log('成功:', data))
  .catch(error => console.error('错误:', error));

// 测试POST请求
fetch('http://localhost:8000/api/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    id: 'INV-CORS-TEST',
    customer_id: 'byd_customer_001',
    cm_id: 'cm_viveka',
    lcm_id: 'lcm_jimmy',
    region: 'CCN1',
    ile: 'ILE-CORS',
    bn_release_status: 'Pending',
    created_time: '2024-01-15T10:00:00'
  })
})
  .then(response => response.json())
  .then(data => console.log('成功:', data))
  .catch(error => console.error('错误:', error));
```

**预期：** 
- ✅ 请求成功，没有CORS错误
- ✅ Console 显示返回的数据

### 4. 测试不允许的Origin

```powershell
curl -i "http://localhost:8000/api/invoices" `
-H "Origin: http://localhost:4000"
```

**预期：** 
- ✅ 响应头中**不包含** `Access-Control-Allow-Origin`
- ✅ 浏览器会阻止访问（如果在浏览器中测试）

---

## 完整测试流程

```powershell
# 1. 测试404错误
curl -i "http://localhost:8000/api/invoices/INV-NOT-EXIST"

# 2. 测试422错误（缺少字段）
curl -i -X POST "http://localhost:8000/api/invoices" `
-H "Content-Type: application/json" `
-d '{"id":"test"}'

# 3. 测试422错误（类型错误）
curl -i -X POST "http://localhost:8000/api/templates" `
-H "Content-Type: application/json" `
-d '{"name":"test","sequence_order":"abc","status":true}'

# 4. 测试409错误（顺序校验）
# 参考 test_workpackages_api.md 创建发票和工作包
# 然后尝试跳步更新

# 5. 测试CORS预检
curl -i -X OPTIONS "http://localhost:8000/api/invoices" `
-H "Origin: http://localhost:3000" `
-H "Access-Control-Request-Method: POST"

# 6. 测试CORS实际请求
curl -i "http://localhost:8000/api/invoices" `
-H "Origin: http://localhost:3000"
```

---

## 错误响应格式总结

### 统一格式
所有错误都遵循以下格式：
```json
{
  "code": 404,         // HTTP状态码
  "message": "string", // 错误描述（人类可读）
  "details": null      // 可选，包含额外信息（如验证错误详情）
}
```

### 常见错误码

| 状态码 | 场景 | details内容 |
|--------|------|-------------|
| 400 | 业务逻辑错误 | `null` |
| 404 | 资源不存在 | `null` |
| 409 | 冲突（如顺序错误、唯一约束） | `null` |
| 422 | 请求参数验证失败 | Pydantic验证错误列表 |
| 500 | 服务器内部错误 | DEBUG模式下包含异常信息 |

---

## CORS配置总结

### 允许的源
- `http://localhost:3000` （前端开发服务器）

### 允许的方法
- `DELETE`, `GET`, `HEAD`, `OPTIONS`, `PATCH`, `POST`, `PUT`

### 允许的头
- `*` （所有头）

### 凭证
- `allow_credentials: true` （允许发送Cookie）

---

## Swagger UI 测试

访问 http://localhost:8000/docs 可以：
- ✅ 测试各种错误场景
- ✅ 查看统一错误响应格式
- ✅ 验证参数验证规则

---

## 注意事项

1. **错误消息：** 应清晰描述问题，帮助开发者快速定位
2. **details字段：** 
   - 422错误时包含Pydantic验证错误详情
   - 其他错误通常为 `null`
   - DEBUG模式下500错误会暴露异常信息（生产环境应避免）
3. **CORS配置：** 
   - 只允许 `http://localhost:3000`
   - 生产环境需要修改为实际的前端域名
   - 可在 `.env` 中通过 `CORS_ORIGINS` 配置（逗号分隔多个域名）

---

## 配置文件

### `.env` 示例

```env
# 数据库配置
SQLSERVER_DSN=mssql+pyodbc://localhost/CM_Invoice_Tracking?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes&Trusted_Connection=yes

# CORS配置（逗号分隔多个域名）
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# 日志级别（DEBUG 或 INFO）
LOG_LEVEL=INFO
```

### 多个允许的源

如果需要允许多个前端域名：

```env
CORS_ORIGINS=http://localhost:3000,https://example.com,https://app.example.com
```

后端会自动分割并允许所有这些源跨域访问。

---

## 前端使用示例

### Axios 配置

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // 允许发送Cookie
  headers: {
    'Content-Type': 'application/json'
  }
});

// 统一错误处理
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // 后端返回的错误（统一格式）
      const { code, message, details } = error.response.data;
      console.error(`错误 ${code}: ${message}`, details);
      
      // 根据错误码进行不同处理
      switch (code) {
        case 404:
          // 资源不存在
          break;
        case 409:
          // 冲突（如顺序错误）
          alert(message);
          break;
        case 422:
          // 参数验证失败
          console.error('验证错误:', details);
          break;
        default:
          alert('请求失败，请稍后重试');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Fetch 配置

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(`http://localhost:8000${url}`, {
      ...options,
      credentials: 'include', // 允许发送Cookie
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // 统一错误格式
      const { code, message, details } = data;
      throw new Error(message);
    }
    
    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

// 使用示例
try {
  const invoices = await apiRequest('/api/invoices');
  console.log(invoices);
} catch (error) {
  alert(error.message);
}
```

---

## 测试检查清单

- [ ] 404错误返回统一格式
- [ ] 409错误返回统一格式
- [ ] 422错误返回统一格式（含details）
- [ ] 400错误返回统一格式
- [ ] 所有错误都包含 `code` 和 `message` 字段
- [ ] CORS预检请求成功
- [ ] 浏览器可以成功调用API（无CORS错误）
- [ ] 不允许的Origin被正确拒绝
- [ ] Swagger UI显示正常

---

完成所有测试后，确认：
✅ 所有错误都遵循统一格式
✅ 前端可以正常跨域访问API
✅ 错误消息清晰明确
✅ CORS配置符合要求









