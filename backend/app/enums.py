"""枚举类型定义"""
from enum import Enum


class RegionEnum(str, Enum):
    """区域枚举"""
    CCN1 = "CCN1"
    CCN2 = "CCN2"
    CCN3 = "CCN3"
    CCN4 = "CCN4"


class RuleTypeEnum(str, Enum):
    """到期日期规则类型"""
    FIXED_DAY = "fixed_day"
    NTH_WEEKDAY = "nth_weekday"
    LAST_DAY_OFFSET = "last_day_offset"


class UserRoleEnum(str, Enum):
    """用户角色"""
    CM = "cm"
    LCM = "lcm"


class ScnEnum(str, Enum):
    """SCN 枚举"""
    SCN1 = "SCN1"
    SCN2 = "SCN2"


