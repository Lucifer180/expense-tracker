import app.routers.ai as ai_router
from app.grok import ParsedExpense


def test_parse_expense(client, user):
    r = client.post("/ai/parse-expense", json={"text": "spent 450 on swiggy"}, headers=user.headers)
    assert r.status_code == 200
    assert r.json()["category"] == "Food"
    # parsing only suggests; it must never save anything
    assert client.get("/expenses", headers=user.headers).json() == []


def test_parse_without_amount_is_422(client, user, monkeypatch):
    monkeypatch.setattr(
        ai_router,
        "parse_expense",
        lambda text: ParsedExpense(amount=None, category="Groceries", description="Groceries", spent_on="2026-10-10"),
    )
    r = client.post("/ai/parse-expense", json={"text": "bought groceries"}, headers=user.headers)
    assert r.status_code == 422


def test_insights_empty_month_skips_llm(client, user, fake_llm):
    r = client.get("/ai/insights?month=2020-01", headers=user.headers)
    assert r.status_code == 404
    assert fake_llm == []


def test_insights(client, user):
    client.post("/expenses", json={"amount": 100, "category": "Food", "spent_on": "2025-05-05"}, headers=user.headers)
    r = client.get("/ai/insights?month=2025-05", headers=user.headers)
    assert r.status_code == 200
    assert r.json()["stats"]["total_spent"] == 100
    assert "summary" in r.json()["insights"]
