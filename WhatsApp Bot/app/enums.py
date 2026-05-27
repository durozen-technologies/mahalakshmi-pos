from enum import Enum


class BaseUnit(str, Enum):
    KG = "KG"
    UNIT = "UNIT"


class BillStatus(str, Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAID = "PAID"


class UnitType(str, Enum):
    WEIGHT = "WEIGHT"
    COUNT = "COUNT"


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SHOP_ACCOUNT = "SHOP_ACCOUNT"
