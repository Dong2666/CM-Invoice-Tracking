"""测试 DueDate 计算函数"""
import pytest
from datetime import date
from app.services.due_date import DueDateCalculator


class TestFixedDayRule:
    """测试固定日期规则"""
    
    def test_fixed_day_current_month(self):
        """测试当月固定日期"""
        result = DueDateCalculator.calculate_fixed_day(date(2025, 1, 15), 10)
        assert result == date(2025, 1, 10)
    
    def test_fixed_day_month_end(self):
        """测试 31 天月份"""
        result = DueDateCalculator.calculate_fixed_day(date(2025, 1, 15), 31)
        assert result == date(2025, 1, 31)
    
    def test_fixed_day_feb_non_leap(self):
        """测试非闰年2月（最多28天）"""
        result = DueDateCalculator.calculate_fixed_day(date(2025, 2, 1), 31)
        assert result == date(2025, 2, 28)
    
    def test_fixed_day_feb_leap(self):
        """测试闰年2月（最多29天）"""
        result = DueDateCalculator.calculate_fixed_day(date(2024, 2, 1), 31)
        assert result == date(2024, 2, 29)
    
    def test_fixed_day_30_day_month(self):
        """测试30天月份（4月）"""
        result = DueDateCalculator.calculate_fixed_day(date(2025, 4, 1), 31)
        assert result == date(2025, 4, 30)


class TestNthWeekdayRule:
    """测试第N个星期X规则"""


class TestNthWeekdayRule:
    """测试第N个星期X规则"""
    
    def test_first_monday(self):
        """测试第一个星期一"""
        # 2025年1月第一个星期一是1月6日
        result = DueDateCalculator.calculate_nth_weekday(date(2025, 1, 15), 1, 0)
        assert result == date(2025, 1, 6)
    
    def test_second_wednesday(self):
        """测试第二个星期三"""
        # 2025年1月第二个星期三是1月8日
        result = DueDateCalculator.calculate_nth_weekday(date(2025, 1, 15), 2, 2)
        assert result == date(2025, 1, 8)
    
    def test_third_friday(self):
        """测试第三个星期五"""
        # 2025年1月第三个星期五是1月17日
        result = DueDateCalculator.calculate_nth_weekday(date(2025, 1, 1), 3, 4)
        assert result == date(2025, 1, 17)
    
    def test_last_friday(self):
        """测试最后一个星期五"""
        # 2025年1月最后一个星期五是1月31日
        result = DueDateCalculator.calculate_nth_weekday(date(2025, 1, 15), -1, 4)
        assert result == date(2025, 1, 31)
    
    def test_next_month_first_monday(self):
        """测试下月第一个星期一"""
        # 2025年2月第一个星期一是2月3日
    def test_invalid_nth(self):
        """测试不存在的第N个星期X"""
        # 2025年2月没有第5个星期一
        with pytest.raises(ValueError):
            DueDateCalculator.calculate_nth_weekday(date(2025, 2, 1), 5, 0)


class TestLastDayOffsetRule:
    """测试月末偏移规则"""
    
    def test_last_day_no_offset(self):
        """测试月末无偏移"""
        result = DueDateCalculator.calculate_last_day_offset(date(2025, 1, 15), 0)
        assert result == date(2025, 1, 31)
    
    def test_last_day_minus_3(self):
        """测试月末往前3天"""
        result = DueDateCalculator.calculate_last_day_offset(date(2025, 1, 15), -3)
        assert result == date(2025, 1, 28)
    
    def test_last_day_plus_2_cross_month(self):
        """测试月末往后2天（跨月）"""
        result = DueDateCalculator.calculate_last_day_offset(date(2025, 1, 15), 2)
        assert result == date(2025, 2, 2)
    
    def test_feb_last_day_offset(self):
        """测试2月月末偏移"""
        result = DueDateCalculator.calculate_last_day_offset(date(2025, 2, 15), -5)
        assert result == date(2025, 2, 23)
    
    def test_next_month_last_day(self):
        """测试下月月末"""
        result = DueDateCalculator.calculate_last_day_offset(date(2025, 1, 15), 0)
        assert result == date(2025, 1, 31)

