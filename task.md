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
检查我的er图是否有问题