import json
import logging
from datetime import date
from typing import TypeVar, get_args

from openai import BadRequestError, OpenAI
from pydantic import BaseModel

from .config import settings
from .schemas import Category

logger = logging.getLogger("uvicorn.error")
client = OpenAI(api_key=settings.xai_api_key, base_url=settings.llm_base_url, timeout=30)

CATEGORIES = ", ".join(get_args(Category))
T = TypeVar("T", bound=BaseModel)


def structured_completion(system: str, user: str, model_cls: type[T], name: str) -> T:
    """Ask the LLM for JSON matching `model_cls`.
    Uses strict JSON-schema mode; if the model doesn't support it (some Groq models don't),
    falls back to plain JSON mode with the schema in the prompt. Pydantic validates either way."""
    messages = [{"role": "system", "content": system}, {"role": "user", "content": user}]
    schema = model_cls.model_json_schema()
    try:
        response = client.chat.completions.create(
            model=settings.grok_model,
            messages=messages,
            response_format={"type": "json_schema", "json_schema": {"name": name, "schema": schema}},
        )
    except BadRequestError as e:
        logger.warning("json_schema mode rejected (%s); retrying with json_object mode", e)
        messages[0]["content"] = (
            system + "\n\nRespond ONLY with a JSON object matching this JSON schema:\n" + json.dumps(schema)
        )
        response = client.chat.completions.create(
            model=settings.grok_model,
            messages=messages,
            response_format={"type": "json_object"},
        )
    return model_cls.model_validate_json(response.choices[0].message.content)


# ---------- Parse one expense from text ----------
class ParsedExpense(BaseModel):
    amount: float | None
    category: Category
    description: str
    spent_on: date


SYSTEM_PROMPT = """You extract one expense from a short message written by a user in India.
Today is {today} ({weekday}).

Rules:
- amount: the number spent, in INR. If no amount is mentioned, use null. Never guess an amount.
- category: exactly one of: {categories}. Use "Other" if nothing fits.
- description: a short clean label of 2-6 words, e.g. "Swiggy dinner".
- spent_on: ISO date YYYY-MM-DD. Resolve words like "yesterday" or "last Friday" relative to today. If no date is mentioned, use today.
"""


def parse_expense(text: str) -> ParsedExpense:
    today = date.today()
    system = SYSTEM_PROMPT.format(today=today.isoformat(), weekday=today.strftime("%A"), categories=CATEGORIES)
    return structured_completion(system, text, ParsedExpense, "parsed_expense")


# ---------- Monthly spending insights ----------
class CategoryNote(BaseModel):
    category: str
    note: str


class SpendingInsights(BaseModel):
    summary: str
    overspent: list[CategoryNote]
    went_well: list[CategoryNote]
    suggestions: list[str]


INSIGHTS_PROMPT = """You are an honest, friendly personal finance coach for a user in India.
Amounts are in INR; write them like ₹4,500.

You receive one month of the user's spending as JSON. Every number is already calculated.
Use the numbers exactly as given. Never do your own arithmetic and never invent figures.

Write:
- summary: 2-3 sentences on the month: total spent, the biggest categories, and how it compares to last month.
- overspent: categories where budget_used_pct > 100, or (if the month is in progress) projected_budget_pct > 100,
  or that rose sharply vs last month. One specific sentence each, with the numbers.
- went_well: categories under budget or noticeably lower than last month. One sentence each.
- suggestions: at most 3 concrete, realistic actions tied to this user's actual expenses
  (mention specific top_expenses where useful). No generic advice like "track your spending".

If is_current_month is true, the month is still in progress: talk about pace and projections, not final results.
Be direct but kind. Empty lists are fine if nothing applies.
"""


def generate_insights(stats: dict) -> SpendingInsights:
    return structured_completion(INSIGHTS_PROMPT, json.dumps(stats), SpendingInsights, "spending_insights")
