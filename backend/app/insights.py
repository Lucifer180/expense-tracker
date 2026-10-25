import calendar
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Budget, Expense


def month_range(year: int, month: int) -> tuple[date, date]:
    """First day of the month, and first day of the next month (exclusive)."""
    start = date(year, month, 1)
    end = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    return start, end


def totals_by_category(db: Session, user_id: int, start: date, end: date) -> dict[str, float]:
    rows = db.execute(
        select(Expense.category, func.sum(Expense.amount))
        .where(Expense.user_id == user_id, Expense.spent_on >= start, Expense.spent_on < end)
        .group_by(Expense.category)
    ).all()
    return {category: float(total) for category, total in rows}


def pct(part: float, whole: float) -> int | None:
    return round(part / whole * 100) if whole else None


def build_month_stats(db: Session, user_id: int, year: int, month: int) -> dict:
    start, end = month_range(year, month)
    prev_start, _ = month_range(year - 1, 12) if month == 1 else month_range(year, month - 1)

    current = totals_by_category(db, user_id, start, end)
    previous = totals_by_category(db, user_id, prev_start, start)
    budgets = {
        b.category: float(b.monthly_limit)
        for b in db.scalars(select(Budget).where(Budget.user_id == user_id))
    }

    today = date.today()
    days_in_month = calendar.monthrange(year, month)[1]
    is_current = (today.year, today.month) == (year, month)
    days_elapsed = today.day if is_current else days_in_month
    pace = days_in_month / days_elapsed  # 1.0 for finished months

    categories = []
    for cat in sorted(set(current) | set(budgets), key=lambda c: -current.get(c, 0)):
        spent = round(current.get(cat, 0.0), 2)
        budget = budgets.get(cat)
        prev = round(previous.get(cat, 0.0), 2)
        projected = round(spent * pace, 2)
        categories.append({
            "category": cat,
            "spent": spent,
            "budget": budget,
            "budget_used_pct": pct(spent, budget) if budget else None,
            "projected_month_end": projected if is_current else None,
            "projected_budget_pct": pct(projected, budget) if (budget and is_current) else None,
            "previous_month": prev,
            "change_vs_previous_pct": pct(spent - prev, prev) if prev else None,
        })

    top = db.scalars(
        select(Expense)
        .where(Expense.user_id == user_id, Expense.spent_on >= start, Expense.spent_on < end)
        .order_by(Expense.amount.desc())
        .limit(5)
    ).all()

    total = round(sum(current.values()), 2)
    prev_total = round(sum(previous.values()), 2)
    return {
        "month": f"{year}-{month:02d}",
        "is_current_month": is_current,
        "days_elapsed": days_elapsed,
        "days_in_month": days_in_month,
        "total_spent": total,
        "total_budget": round(sum(budgets.values()), 2) or None,
        "previous_month_total": prev_total,
        "change_vs_previous_pct": pct(total - prev_total, prev_total) if prev_total else None,
        "categories": categories,
        "top_expenses": [
            {"description": e.description, "category": e.category,
             "amount": float(e.amount), "spent_on": e.spent_on.isoformat()}
            for e in top
        ],
    }
