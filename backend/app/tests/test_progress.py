"""测试 Progress 计算函数"""
import pytest
from datetime import date
from app.services.invoices import (
    calculate_progress,
    get_current_step,
    can_update_workpackage
)


class TestCalculateProgress:
    """测试进度计算"""
    
    def test_all_completed(self):
        """测试全部完成"""
        wps = [
            {"sequence_order": 1, "due_date": date(2025, 1, 10), "actual_date": date(2025, 1, 9), "name": "WP1"},
            {"sequence_order": 2, "due_date": date(2025, 1, 20), "actual_date": date(2025, 1, 18), "name": "WP2"},
            {"sequence_order": 3, "due_date": date(2025, 1, 30), "actual_date": date(2025, 1, 28), "name": "WP3"},
        ]
        status, current = calculate_progress(wps, today=date(2025, 2, 1))
        assert status == "Done"
        assert current is None
    
    def test_normal_not_overdue(self):
        """测试正常（未逾期）"""
        wps = [
            {"sequence_order": 1, "due_date": date(2025, 1, 10), "actual_date": date(2025, 1, 9), "name": "WP1"},
            {"sequence_order": 2, "due_date": date(2025, 1, 20), "actual_date": None, "name": "WP2"},
        ]
        status, current = calculate_progress(wps, today=date(2025, 1, 15))
        assert status == "Normal"
        assert current == "WP2"
    
    def test_normal_due_today(self):
        """测试今天到期（仍为Normal）"""
        wps = [
            {"sequence_order": 1, "due_date": date(2025, 1, 10), "actual_date": date(2025, 1, 9), "name": "WP1"},
            {"sequence_order": 2, "due_date": date(2025, 1, 20), "actual_date": None, "name": "WP2"},
        ]
        status, current = calculate_progress(wps, today=date(2025, 1, 20))
        assert status == "Normal"
        assert current == "WP2"
    
    def test_abnormal_overdue(self):
        """测试异常（已逾期）"""
        wps = [
            {"sequence_order": 1, "due_date": date(2025, 1, 10), "actual_date": date(2025, 1, 9), "name": "WP1"},
            {"sequence_order": 2, "due_date": date(2025, 1, 20), "actual_date": None, "name": "WP2"},
        ]
        status, current = calculate_progress(wps, today=date(2025, 1, 25))
        assert status == "Abnormal"
        assert current == "WP2"
    
    def test_first_workpackage_not_started(self):
        """测试第一个工作包未开始"""
        wps = [
            {"sequence_order": 1, "due_date": date(2025, 1, 10), "actual_date": None, "name": "WP1"},
            {"sequence_order": 2, "due_date": date(2025, 1, 20), "actual_date": None, "name": "WP2"},
        ]
        status, current = calculate_progress(wps, today=date(2025, 1, 5))
        assert status == "Normal"
        assert current == "WP1"
    
    def test_empty_workpackages(self):
        """测试空工作包列表"""
        status, current = calculate_progress([], today=date(2025, 1, 15))
        assert status == "Normal"
        assert current is None
    
    def test_no_due_date(self):
        """测试没有due_date的情况"""
        wps = [
            {"sequence_order": 1, "due_date": None, "actual_date": None, "name": "WP1"},
        ]
        status, current = calculate_progress(wps, today=date(2025, 1, 15))
        assert status == "Normal"
        assert current == "WP1"
    
    def test_unordered_workpackages(self):
        """测试乱序工作包列表"""
        wps = [
            {"sequence_order": 3, "due_date": date(2025, 1, 30), "actual_date": None, "name": "WP3"},
            {"sequence_order": 1, "due_date": date(2025, 1, 10), "actual_date": date(2025, 1, 9), "name": "WP1"},
            {"sequence_order": 2, "due_date": date(2025, 1, 20), "actual_date": None, "name": "WP2"},
        ]
        status, current = calculate_progress(wps, today=date(2025, 1, 15))
        assert status == "Normal"
        assert current == "WP2"


class TestGetCurrentStep:
    """测试获取当前步骤"""
    
    def test_first_step(self):
        """测试当前在第一步"""
        wps = [
            {"sequence_order": 1, "actual_date": None},
            {"sequence_order": 2, "actual_date": None},
        ]
        assert get_current_step(wps) == 1
    
    def test_middle_step(self):
        """测试当前在中间步骤"""
        wps = [
            {"sequence_order": 1, "actual_date": date(2025, 1, 9)},
            {"sequence_order": 2, "actual_date": None},
            {"sequence_order": 3, "actual_date": None},
        ]
        assert get_current_step(wps) == 2
    
    def test_all_completed_no_current(self):
        """测试全部完成返回None"""
        wps = [
            {"sequence_order": 1, "actual_date": date(2025, 1, 9)},
            {"sequence_order": 2, "actual_date": date(2025, 1, 19)},
        ]
        assert get_current_step(wps) is None
    
    def test_empty_list(self):
        """测试空列表"""
        assert get_current_step([]) is None


class TestCanUpdateWorkpackage:
    """测试工作包更新权限校验"""
    
    def test_can_update_current(self):
        """测试可以更新当前步骤"""
        wps = [
            {"sequence_order": 1, "actual_date": date(2025, 1, 9)},
            {"sequence_order": 2, "actual_date": None},
            {"sequence_order": 3, "actual_date": None},
        ]
        can, msg = can_update_workpackage(wps, 2)
        assert can is True
        assert msg == ""
    
    def test_cannot_skip_steps(self):
        """测试不能跳过步骤"""
        wps = [
            {"sequence_order": 1, "actual_date": date(2025, 1, 9)},
            {"sequence_order": 2, "actual_date": None},
            {"sequence_order": 3, "actual_date": None},
        ]
        can, msg = can_update_workpackage(wps, 3)
        assert can is False
        assert "步骤 2" in msg
    
    def test_cannot_update_previous(self):
        """测试不能更新之前的步骤"""
        wps = [
            {"sequence_order": 1, "actual_date": date(2025, 1, 9)},
            {"sequence_order": 2, "actual_date": None},
        ]
        can, msg = can_update_workpackage(wps, 1)
        assert can is False
        assert "步骤 2" in msg
    
    def test_cannot_update_all_completed(self):
        """测试全部完成后不能更新"""
        wps = [
            {"sequence_order": 1, "actual_date": date(2025, 1, 9)},
            {"sequence_order": 2, "actual_date": date(2025, 1, 19)},
        ]
        can, msg = can_update_workpackage(wps, 1)
        assert can is False
        assert "已完成" in msg









