"""初始化种子数据"""
from sqlmodel import SQLModel, Session, select
from app.db import engine
from app.models import WorkpackageTemplate


def init_templates(session: Session):
    """初始化工作包模板"""
    templates_data = [
        {"name": "1. Customer billing notification", "sequence_order": 1, "status": True},
        {"name": "2. RB internal mapping", "sequence_order": 2, "status": True},
        {"name": "3. Billing data adjustment", "sequence_order": 3, "status": True},
        {"name": "4. Invoice issue & booking", "sequence_order": 4, "status": True},
    ]
    
    for data in templates_data:
        # 检查是否已存在
        existing = session.exec(
            select(WorkpackageTemplate).where(WorkpackageTemplate.sequence_order == data["sequence_order"])
        ).first()
        
        if not existing:
            template = WorkpackageTemplate(**data)
            session.add(template)
            print(f"✅ 创建模板: {data['name']}")
        else:
            print(f"⏭️  模板已存在: {existing.name}")
    
    session.commit()



def init_db():
    """执行所有初始化"""
    print("\n" + "="*50)
    print("开始初始化种子数据...")
    print("="*50 + "\n")

    print("🧱 创建或更新数据库表结构...")
    SQLModel.metadata.create_all(bind=engine)
    
    with Session(engine) as session:
        print("📋 初始化工作包模板...")
        init_templates(session)

    
    print("\n" + "="*50)
    print("✅ 种子数据初始化完成！")
    print("="*50 + "\n")


if __name__ == "__main__":
    init_db()






