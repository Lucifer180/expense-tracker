import logging
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from openai import APIError
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy.orm import Session

from ..database import get_db
from ..grok import ParsedExpense, SpendingInsights, generate_insights, parse_expense
from ..insights import build_month_stats
from ..models import User
from ..security import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger("uvicorn.error")


class ParseRequest(BaseModel):
    text: str = Field(min_length=2, max_length=300)


class InsightsResponse(BaseModel):
    stats: dict
    insights: SpendingInsights


@router.post("/parse-expense", response_model=ParsedExpense)
def parse(req: ParseRequest, user: User = Depends(get_current_user)):
    try:
        parsed = parse_expense(req.text)
    except APIError:
        logger.exception("LLM API call failed")
        raise HTTPException(status_code=502, detail="AI service is unavailable, try again")
    except ValidationError:
        logger.exception("LLM returned invalid JSON")
        raise HTTPException(status_code=502, detail="AI returned an unexpected response")

    if parsed.amount is None or parsed.amount <= 0:
        raise HTTPException(status_code=422, detail="Couldn't find an amount. Try e.g. 'spent 450 on dinner'")

    parsed.amount = round(parsed.amount, 2)
    return parsed


@router.get("/insights", response_model=InsightsResponse)
def insights(
    month: str | None = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="YYYY-MM, defaults to this month"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if month:
        year, mon = map(int, month.split("-"))
    else:
        today = date.today()
        year, mon = today.year, today.month

    stats = build_month_stats(db, user.id, year, mon)
    if stats["total_spent"] == 0:
        raise HTTPException(status_code=404, detail="No expenses recorded for this month yet")

    try:
        result = generate_insights(stats)
    except APIError:
        logger.exception("LLM API call failed")
        raise HTTPException(status_code=502, detail="AI service is unavailable, try again")
    except ValidationError:
        logger.exception("LLM returned invalid JSON")
        raise HTTPException(status_code=502, detail="AI returned an unexpected response")

    return {"stats": stats, "insights": result}


@router.get("/stats")
def stats_only(
    month: str | None = Query(None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Same numbers as /insights but without the AI call. Free and instant, used by the dashboard charts."""
    if month:
        year, mon = map(int, month.split("-"))
    else:
        today = date.today()
        year, mon = today.year, today.month
    return build_month_stats(db, user.id, year, mon)
