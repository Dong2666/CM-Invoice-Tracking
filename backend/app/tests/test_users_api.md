# 用户 API 测试指南

## 前提条件
1. 确保后端服务正在运行：`uvicorn app.main:app --reload --port 8000`
2. 确保已初始化种子数据：`curl -X POST http://localhost:8000/db/init-seed`

## 任务13：用户 API 测试

### 说明
用户现在分为两个独立的表：
- **LCM** (Lead Customer Manager) - 区域负责人
- **CM** (Customer Manager) - 客户经理

提供了多种查询方式以适应不同的前端需求。

---

## 方式1：统一的用户端点（推荐）

### 1. 获取所有用户（GET /api/users）

不传参数，返回所有用户（LCM + CM）：

```powershell
curl http://localhost:8000/api/users
```

**预期返回：** 统一格式的用户列表
```json
[
  {
    "role": "lcm",
    "id": "lcm_jimmy",
    "nt_account": "NT\\jimmy",
    "name": "Jimmy",
    "region": "CCN1"
  },
  {
    "role": "cm",
    "id": "cm_viveka",
    "nt_account": "NT\\viveka",
    "name": "Viveka",
    "region": "CCN1"
  }
]
```

### 2. 按角色筛选（GET /api/users?role=lcm|cm）

只获取LCM：

```powershell
curl "http://localhost:8000/api/users?role=lcm"
```

只获取CM：

```powershell
curl "http://localhost:8000/api/users?role=cm"
```

**预期返回：** 对应角色的用户列表（原始数据结构）

### 3. 获取指定用户详情（GET /api/users/{id}?role=lcm|cm）

获取LCM详情：

```powershell
curl "http://localhost:8000/api/users/lcm_jimmy?role=lcm"
```

获取CM详情：

```powershell
curl "http://localhost:8000/api/users/cm_viveka?role=cm"
```

**预期返回：** 用户详情（统一格式）
```json
{
  "role": "lcm",
  "id": "lcm_jimmy",
  "nt_account": "NT\\jimmy",
  "name": "Jimmy",
  "region": "CCN1"
}
```

### 4. 测试不存在的用户

```powershell
curl "http://localhost:8000/api/users/invalid_id?role=lcm"
```

**预期返回：** 404状态码

---

## 方式2：分离的端点（更明确）

### 1. 获取所有LCM（GET /api/users/lcm）

```powershell
curl http://localhost:8000/api/users/lcm
```

**预期返回：** LCM列表
```json
[
  {
    "id": "lcm_jimmy",
    "nt_account": "NT\\jimmy",
    "name": "Jimmy",
    "region": "CCN1"
  }
]
```

### 2. 获取指定LCM详情（GET /api/users/lcm/{id}）

```powershell
curl http://localhost:8000/api/users/lcm/lcm_jimmy
```

**预期返回：** LCM详情

### 3. 获取所有CM（GET /api/users/cm）

```powershell
curl http://localhost:8000/api/users/cm
```

**预期返回：** CM列表
```json
[
  {
    "id": "cm_viveka",
    "nt_account": "NT\\viveka",
    "name": "Viveka",
    "region": "CCN1"
  }
]
```

### 4. 获取指定CM详情（GET /api/users/cm/{id}）

```powershell
curl http://localhost:8000/api/users/cm/cm_viveka
```

**预期返回：** CM详情

---

## API端点总览

| 方法 | 端点 | 描述 | 返回格式 |
|------|------|------|----------|
| GET | `/api/users` | 所有用户（LCM+CM） | 统一格式 |
| GET | `/api/users?role=lcm` | 所有LCM | 原始格式 |
| GET | `/api/users?role=cm` | 所有CM | 原始格式 |
| GET | `/api/users/{id}?role=lcm\|cm` | 指定用户详情 | 统一格式 |
| GET | `/api/users/lcm` | 所有LCM | 原始格式 |
| GET | `/api/users/lcm/{id}` | 指定LCM详情 | 原始格式 |
| GET | `/api/users/cm` | 所有CM | 原始格式 |
| GET | `/api/users/cm/{id}` | 指定CM详情 | 原始格式 |

---

## 数据结构说明

### 统一格式（用于合并视图）
```json
{
  "role": "lcm" | "cm",
  "id": "string",
  "nt_account": "string",
  "name": "string",
  "region": "CCN1" | "CCN2" | "CCN3" | "CCN4"
}
```

### 原始格式（LCM/CM）
```json
{
  "id": "string",
  "nt_account": "string",
  "name": "string",
  "region": "CCN1" | "CCN2" | "CCN3" | "CCN4"
}
```

---

## 完整测试流程

```powershell
# 1. 初始化种子数据
curl -X POST http://localhost:8000/db/init-seed

# 2. 获取所有用户（统一视图）
curl http://localhost:8000/api/users

# 3. 只获取LCM
curl "http://localhost:8000/api/users?role=lcm"

# 4. 只获取CM
curl "http://localhost:8000/api/users?role=cm"

# 5. 获取LCM详情（方式1）
curl "http://localhost:8000/api/users/lcm_jimmy?role=lcm"

# 6. 获取LCM详情（方式2）
curl http://localhost:8000/api/users/lcm/lcm_jimmy

# 7. 获取CM详情（方式1）
curl "http://localhost:8000/api/users/cm_viveka?role=cm"

# 8. 获取CM详情（方式2）
curl http://localhost:8000/api/users/cm/cm_viveka

# 9. 测试错误情况
curl "http://localhost:8000/api/users/invalid?role=lcm"
curl http://localhost:8000/api/users/cm/invalid
```

---

## Swagger UI 测试

访问 http://localhost:8000/docs 可以：
- ✅ 查看所有用户API文档
- ✅ 在线测试接口
- ✅ 查看请求/响应Schema
- ✅ 测试不同的role参数

---

## 前端使用建议

### 场景1：需要显示所有用户（不区分角色）
```javascript
// 使用统一端点
fetch('/api/users')
```

### 场景2：需要区分角色显示
```javascript
// 使用role参数
fetch('/api/users?role=lcm')  // 获取LCM
fetch('/api/users?role=cm')   // 获取CM
```

### 场景3：明确知道角色类型
```javascript
// 使用分离端点
fetch('/api/users/lcm')       // 获取所有LCM
fetch('/api/users/cm')        // 获取所有CM
```

### 场景4：获取用户详情
```javascript
// 如果知道角色，使用分离端点更高效
fetch(`/api/users/lcm/${id}`)
fetch(`/api/users/cm/${id}`)

// 或使用统一端点（需要传role参数）
fetch(`/api/users/${id}?role=${role}`)
```

---

## 错误响应

### 404 - 用户不存在
```json
{
  "detail": "角色为 lcm 的用户 invalid_id 不存在"
}
```

### 400 - 无效的role参数
```json
{
  "detail": "role 参数必须是 'lcm' 或 'cm'"
}
```

