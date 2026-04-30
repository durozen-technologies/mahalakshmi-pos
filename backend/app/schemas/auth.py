from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.models import UserRole
from app.schemas.common import ORMModel


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_password_match(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class UserSession(ORMModel):
    id: int
    username: str
    role: UserRole
    is_active: bool
    created_at: datetime
    shop_id: int | None = None
    shop_name: str | None = None
    requires_price_setup: bool = False
    next_screen: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSession


class TokenPayload(BaseModel):
    sub: str
