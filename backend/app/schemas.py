from datetime import datetime, date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, ConfigDict

Category = Literal[
    "Food", "Groceries", "Transport", "Shopping", "Bills", "Rent",
    "Entertainment", "Health", "Education", "Travel", "Other",
]


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    new_password: str = Field(min_length=8, max_length=128)


class MessageOut(BaseModel):
    message: str


# ---------- Expenses ----------
class ExpenseCreate(BaseModel):
    amount: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    category: Category
    description: str = Field(default="", max_length=255)
    spent_on: date = Field(default_factory=date.today)


class ExpenseUpdate(BaseModel):
    amount: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    category: Category | None = None
    description: str | None = Field(default=None, max_length=255)
    spent_on: date | None = None


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    amount: float
    category: str
    description: str
    spent_on: date


# ---------- Budgets ----------
class BudgetSet(BaseModel):
    monthly_limit: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class BudgetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    category: str
    monthly_limit: float
