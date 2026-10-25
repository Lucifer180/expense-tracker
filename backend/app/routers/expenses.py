from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Expense, User
from ..schemas import ExpenseCreate, ExpenseOut, ExpenseUpdate
from ..security import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


def get_owned_expense(expense_id: int, db: Session, user: User) -> Expense:
    expense = db.get(Expense, expense_id)
    if expense is None or expense.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.post("", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = Expense(**data.model_dump(), user_id=user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("", response_model=list[ExpenseOut])
def list_expenses(
    category: str | None = None,
    start: date | None = None,
    end: date | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stmt = select(Expense).where(Expense.user_id == user.id)
    if category:
        stmt = stmt.where(Expense.category == category)
    if start:
        stmt = stmt.where(Expense.spent_on >= start)
    if end:
        stmt = stmt.where(Expense.spent_on <= end)
    stmt = stmt.order_by(Expense.spent_on.desc(), Expense.id.desc()).limit(limit).offset(offset)
    return db.scalars(stmt).all()


@router.get("/{expense_id}", response_model=ExpenseOut)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return get_owned_expense(expense_id, db, user)


@router.patch("/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = get_owned_expense(expense_id, db, user)
    for field, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = get_owned_expense(expense_id, db, user)
    db.delete(expense)
    db.commit()
