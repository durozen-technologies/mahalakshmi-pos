from enum import Enum


class UserRole(str, Enum):
    ADMIN = "admin"
    SHOP_ACCOUNT = "shop_account"


class UnitType(str, Enum):
    WEIGHT = "weight"
    COUNT = "count"


class BaseUnit(str, Enum):
    KG = "kg"
    UNIT = "unit"
