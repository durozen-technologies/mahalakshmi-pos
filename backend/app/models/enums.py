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


class ItemAssumptionStatus(str, Enum):
    NOT_APPLICABLE = "not_applicable"
    NOT_SET = "not_set"
    INCOMPLETE = "incomplete"
    CONFIGURED = "configured"


class BillStatus(str, Enum):
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"


class InventoryMovementType(str, Enum):
    ADD = "add"
    USE = "use"
