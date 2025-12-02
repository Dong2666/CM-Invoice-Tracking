"""到期日期计算服务"""
from datetime import date, timedelta
from calendar import monthrange


class DueDateCalculator:
    """到期日期计算器"""
    
    @staticmethod
    def calculate_fixed_day(
        base_date: date,
        day_of_month: int,
    ) -> date:
        """
        固定日期规则：每月固定某一天

        Args:
            base_date: 基准日期（通常是发票创建日期）
            day_of_month: 月份中的第几天 (1-31)

        Returns:
            计算后的到期日期
        """
        year = base_date.year
        month = base_date.month
        
        # 获取目标月份的天数
        _, last_day = monthrange(year, month)
        
        # 如果指定的日期超过该月最大天数，使用该月最后一天
        actual_day = min(day_of_month, last_day)
        
        return date(year, month, actual_day)
    
    @staticmethod
    def calculate_nth_weekday(
        base_date: date,
        nth: int,
        weekday: int,
    ) -> date:
        """
        第N个星期X规则：每月第N个星期X

        Args:
            base_date: 基准日期（通常是发票创建日期）
            nth: 第几个 (1=第一个, 2=第二个, ..., -1=最后一个)
            weekday: 星期几 (0=周一, 1=周二, ..., 6=周日)

        Returns:
            计算后的到期日期
        """
        year = base_date.year
        month = base_date.month
        
        # 找到该月第一天
        first_day = date(year, month, 1)
        
        # 如果是"最后一个"
        if nth == -1:
            # 从该月最后一天往回找
            _, last_day_num = monthrange(year, month)
            last_day = date(year, month, last_day_num)
            
            # 往回找到目标星期几
            days_back = (last_day.weekday() - weekday) % 7
            return last_day - timedelta(days=days_back)
        
        # 找到该月第一个目标星期几
        days_ahead = (weekday - first_day.weekday()) % 7
        first_occurrence = first_day + timedelta(days=days_ahead)
        
        # 加上 (nth-1) 周
        result = first_occurrence + timedelta(weeks=(nth - 1))
        
        # 验证结果仍在目标月份内
        if result.month != month or result.year != year:
            raise ValueError(f"第{nth}个星期{weekday}不存在于{year}年{month}月")
        
        return result
    
    @staticmethod
    def calculate_last_day_offset(
        base_date: date,
        offset: int,
    ) -> date:
        """
        月末偏移规则：从月末往前/后偏移N天

        Args:
            base_date: 基准日期（通常是发票创建日期）
            offset: 偏移天数（负数表示往前，正数表示往后）

        Returns:
            计算后的到期日期
        """
        year = base_date.year
        month = base_date.month
        
        # 获取该月最后一天
        _, last_day_num = monthrange(year, month)
        last_day = date(year, month, last_day_num)
        
        # 应用偏移
        result = last_day + timedelta(days=offset)
        
        return result

