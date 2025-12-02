# 模板 API 测试指南

## 前提条件
确保后端服务正在运行：
```bash
uvicorn app.main:app --reload --port 8000
```

## 1. 列表查询（GET /api/templates）

```powershell
curl http://localhost:8000/api/templates
```

**预期返回：** 按sequence_order排序的模板列表（如果已经运行了种子数据初始化）

## 2. 创建模板（POST /api/templates）

```powershell
# 创建模板5
curl -X POST http://localhost:8000/api/templates -H "Content-Type: application/json" -d '{\"name\": \"Test Template\", \"sequence_order\": 5, \"status\": true}'
```

**预期返回：** 201状态码和创建的模板数据

## 3. 测试唯一性约束（应该失败）

```powershell
# 尝试创建重复的sequence_order
curl -X POST http://localhost:8000/api/templates -H "Content-Type: application/json" -d '{\"name\": \"Duplicate\", \"sequence_order\": 1, \"status\": true}'
```

**预期返回：** 409状态码，错误信息"顺序号 1 已被使用"

## 4. 查询单个模板（GET /api/templates/{id}）

```powershell
# 查询ID为1的模板
curl http://localhost:8000/api/templates/1
```

**预期返回：** 模板详情

## 5. 更新模板（PUT /api/templates/{id}）

```powershell
# 更新模板名称
curl -X PUT http://localhost:8000/api/templates/5 -H "Content-Type: application/json" -d '{\"name\": \"Updated Template Name\"}'
```

**预期返回：** 更新后的模板数据

## 6. 测试更新顺序约束

```powershell
# 尝试将模板5的顺序改为1（已被占用）
curl -X PUT http://localhost:8000/api/templates/5 -H "Content-Type: application/json" -d '{\"sequence_order\": 1}'
```

**预期返回：** 409状态码，错误信息"顺序号 1 已被其他模板使用"

## 7. 删除模板（DELETE /api/templates/{id}）

```powershell
curl -X DELETE http://localhost:8000/api/templates/5
```

**预期返回：** 204状态码，无内容

## 8. 验证删除

```powershell
# 尝试查询已删除的模板
curl http://localhost:8000/api/templates/5
```

**预期返回：** 404状态码，错误信息"模板不存在"

## Swagger UI 测试
访问 http://localhost:8000/docs 可以直接在浏览器中测试所有API

