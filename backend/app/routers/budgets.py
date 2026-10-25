from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Budget, User
from ..schemas import BudgetOut, BudgetSet, Category
from ..security import get_current_user

router = APIRouter(prefix="/budgets", tags=["budgets"])


def find_budget(db: Session, user_id: int, category: str) -> Budget | None:
    return db.scalar(select(Budget).where(Budget.user_id == user_id, Budget.category == category))


@router.get("", response_model=list[BudgetOut])
def list_budgets(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(Budget).where(Budget.user_id == user.id).order_by(Budget.category)).all()


@router.put("/{category}", response_model=BudgetOut)
def set_budget(
    category: Category,
    data: BudgetSet,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = find_budget(db, user.id, category)
    if budget is None:
        budget = Budget(user_id=user.id, category=category, monthly_limit=data.monthly_limit)
        db.add(budget)
    else:
        budget.monthly_limit = data.monthly_limit
    db.commit()
    db.refresh(budget)
    return budget


@router.delete("/{category}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    category: Category,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    budget = find_budget(db, user.id, category)
    if budget is None:
        raise HTTPException(status_code=404, detail="No budget set for this category")
    db.delete(budget)
    db.commit()
