erDiagram

    %% ========== 核心实体 ==========
    Invoice ||--o{ Workpackage : "contains (1..4)"
    Invoice {
        string id PK
        string region
        string ile FK
        string cm 
        string bn_release_status
        string status_comment
        string progress
        string current_workpackage    
        datetime created_time
    }

    Workpackage }o--|| WorkpackageTemplate : "template"
    Workpackage {
        uuid id PK
        string invoice_id FK
        int template_id FK
        date due_date
        date actual_date
        string status
        string remark
    }

    WorkpackageTemplate {
        int id PK
        string name
        int order
    }

    
 Customer ||--|| User : "assigned to (1..1)"
    Customer {
        string id PK
        string customer_name
        string remark
        string user_id FK
    }

    User {
        string id PK
        string nt_account
        string name
        string region
        string role
        string lcm
        string responsible_customer
    }
 %% ========== STI 实体：DueDateRule 及其子类 ==========
    DueDateRule {
        int id PK
        string customer_id FK
        int template_id FK
        string rule_type "fixed_day | nth_weekday | last_day_offset"
        int day_of_month "for fixed_day"
        int nth "for nth_weekday"
        int weekday "for nth_weekday"
        int offset "for last_day_offset"
        bool is_next_month
    }

    %% ========== 关系 ==========
    Customer ||--o{ DueDateRule : "has"
    DueDateRule ||--|| WorkpackageTemplate : "applies to"

    %% ========== 外键关系 ==========
    Invoice }o--|| Customer : "belongs to"


## 一、产品概述

**CM Invoice Tracking** 是一个企业内部的发票工作流管理和团队协作平台，旨在帮助企业内部员对汽车供应链企业（如 BYD、Tesla、BMW、Mercedes-Benz 等）实现发票处理的全过程跟踪、状态管理和团队协作。

---

## 二、目标用户

### 主要用户群体：

1. **Customer Manager (CM)** - 业务执行人员

1. 负责处理分配给他们的发票
2. 跟踪工作包完成进度
3. 更新发票状态和备注



2. **LCM (Lead Customer Manager)** - 管理层/主管

1. 监督团队的整体发票处理情况
2. 查看团队成员的工作进展
3. 进行数据分析和性能评估



---

## 三、核心功能模块

### 1. **Overview (仪表盘)**

#### My View - 个人工作视图

- **Abnormal Work List (异常工作列表)**

- 展示所有释放状态非 "All" 或进度为 "Abnormal" 的发票
- 显示字段：Invoice ID、Customer、Status、Current Workpackage、Remark、Progress、Due Date
- 支持点击 Invoice ID 跳转到发票详情



- **To Do List (日常待办)**

- 展示完成状态 "All"、且 due date 在未来 7 天内的发票
- 字段顺序一致，用于提醒近期需要关注的工作





#### Admin View - 团队管理视图

- **Team Invoice List (团队发票管理表)**

- 字段：Invoice ID、ILE、Region、LCM、CM、Status、Remark、Progress、Current Step
- 高级筛选条件：ILE、Region、LCM、CM、Status、Progress、Current Step
- 快捷筛选按钮：释放异常、进度异常
- 支持 Excel 导出功能
- 点击 Invoice ID 可跳转详情页





### 2. **Invoice Management (发票管理)**

#### 发票列表视图

- **字段显示**：

- Created Time、ID、Region、ILE、CM、BN Release Status、Remark、Progress、Next Workpackage、Next Step Date



- **状态指示系统**：

- BN Release Status：All（绿）、Partial（黄）、None（红）、Null（灰）
- Progress：Normal（正常）、Abnormal（异常）、Done（完成）



- **交互功能**：

- 多条件筛选（Date、ILE、CM、Status、Progress）
- 点击 Invoice ID 进入详情页
- New Invoice 按钮创建新发票
- Delete 按钮多选删除
- Excel 导出



#### 发票详情页

- **Header Information Card**：

- ID、Region、ILE、CM、BN Release Status（带状态灯）、Workflow Health、Created Time



- **Workpackage Management**

- 四个标准工作包：

1. Customer billing notification alignment
2. RB internal mapping
3. Billing data adjustment
4. Invoice issue & booking



- 每个工作包显示：名称、状态、Due Date、Actual Date、Remark、Action 按钮
- **关键业务逻辑**：

- 按顺序完成工作包（前一个完成才能处理下一个）
- progress自动计算：

- Done：所有工作包全部完成
- Normal：工作包尚未完成，下一个工作包Actual Date ，且Due Date >= 今天
- Abnormal：工作包尚未完成，下一个工作包Actual Date 为空且 Due Date <= 今天



- Mark as Complete 按钮自动设置当天为实际完成日期（用户可编辑）




- **Status Comment Section**

- 当 BN Release Status 为 Partial 或 None 时显示
- 用户可添加问题说明和状态备注



- **Save & Cancel Buttons**

- 蓝色 Save 按钮保存所有更改
- 白色 Cancel 按钮取消操作




### 3. **Customer Management (客户管理)**

#### 客户列表视图

- **字段**：ID、ILE Customer、Remark、Region、LCM、CM
- **交互**：

- 点击 ID 进入详情
- New Customer 创建新客户
- Delete 按钮多选删除
- Excel 导出




#### 客户详情页

- **基本信息**：ID、ILE Customer、Region、LCM、CM、多个 Remark 字段
- **Due Date Generation Rules (时间规则配置)**

- 为每个工作包配置 Due Date
- 支持同月和次月配置
- 规则自动应用于新建发票




#### 客户创建页

- 与详情页布局一致
- ID 自动分配（只读）
- 支持多个 Remark 记录
- 配置工作包时间规则


### 4. **User Management (用户管理)**

#### 用户列表视图

- **字段**：Name、Dept、Role、LCM、Responsible ILE Customer、NT
- **筛选**：Dept、LCM 筛选，Name 搜索
- **交互**：

- 点击 Name 进入用户详情
- New User 创建用户
- Delete 多选删除





#### 用户详情页

- 可编辑基本字段
- Save & Cancel 按钮


---

## 四、关键特性

### 1. **智能工作流管理**

- 强制按顺序完成工作包
- 自动计算状态（绿黄红）基于完成日期
- 实时进度健康状态评估


### 2. **灵活的状态系统**

- **BN Release Status**：All / Partial / None / Null - 发票释放状态
- **Progress**：Normal / Abnormal / Done - 进度健康度
- 三种状态使用彩色圆点直观表示


### 3. **时间规则引擎**

- 每个客户可配置独立的工作包 Due Date 规则
- 支持当月和下月日期配置
- 新建发票自动应用时间规则


### 4. **多层次数据管理**

- 客户级别：管理时间规则和工作流配置
- 发票级别：跟踪各工作包的具体进度和状态
- 团队级别：LCM 可见团队成员的所有发票


### 5. **高效的协作与追踪**

- Remark 字段记录异常说明
- Status Comment 记录问题和原因
- 完整的审计追踪


### 6. **数据导出与分析**

- Excel 导出发票和客户列表
- 支持条件筛选后导出


### 7. **交互流程示例**

#### 发票完成流程

1. CM 在 Dashboard 看到异常工作列表
2. 点击 Invoice ID 进入详情页
3. 查看工作包的 Due Date 和当前状态
4. 对第一个工作包点击 "Mark as Complete"
5. 系统自动设置 Actual Date 为当天（可编辑）
6. 第二个工作包自动变为可完成状态
7. 填写 Remark 后点击 Save
8. Dashboard 实时更新显示进度


#### 客户配置流程

1. LCM/Admin 进入 Customer 页面
2. 点击 New Customer
3. 填写 ILE Customer、Region、LCM、CM
4. 配置 4 个工作包的 Due Date 规则（相对当月日期）
5. 保存后，新建 Invoice 时自动应用这些规则

#### Invoice 对象

```typescript
{
  id: string;                  // "INV-2025-10-001"
  region: string;              // "CCN1|CCN2|CCN3|CCN4"
  ile: string;                 // 车厂名称
  cm: string;                  // 负责 CM
  bnReleaseStatus: "All" | "Partial" | "None" | "Null";
  statusComment: string;       // 状态说明
  workflowHealth: "Normal" | "Abnormal" | "Done";
  createdTime: string;         // "YYYY-MM"
  workpackages: Workpackage[];
}

Workpackage {
  name: string;
  dueDate: string;             // "YYYY-MM-DD"
  actualDate: string | null;
  status: "red" | "yellow" | "green";  // 自动计算
  remark: string;
}
```

#### Customer 对象

```typescript
{
  id: string;
  ileCustomer: string;
  remark: string;
  region: string;
  lcm: string;
  cm: string;
  dueDateRules: DueDateRule[];
}

DueDateRule {
  workpackageName: string;
  daysFromMonthStart: number;
  isNextMonth: boolean;
}
```

#### User 对象

```typescript
{
  id: string;
  name: string;
  dept: "CCN1" | "CCN2" | "CCN3" | "CCN4";
  role: "CM" | "LCM";
  lcm: string;
  impactIleCustomer: string;
  nt: string;
}
```