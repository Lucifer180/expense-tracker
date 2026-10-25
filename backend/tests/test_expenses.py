def add(client, headers, **overrides):
    body = {"amount": 450, "category": "Food", "description": "Swiggy dinner", "spent_on": "2026-10-10", **overrides}
    r = client.post("/expenses", json=body, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def test_create_and_list(client, user):
    e = add(client, user.headers)
    assert e["amount"] == 450
    listed = client.get("/expenses", headers=user.headers).json()
    assert [x["id"] for x in listed] == [e["id"]]


def test_patch_updates_only_given_fields(client, user):
    e = add(client, user.headers)
    r = client.patch(f"/expenses/{e['id']}", json={"amount": 500}, headers=user.headers)
    assert r.status_code == 200
    assert r.json()["amount"] == 500
    assert r.json()["description"] == "Swiggy dinner"


def test_delete(client, user):
    e = add(client, user.headers)
    assert client.delete(f"/expenses/{e['id']}", headers=user.headers).status_code == 204
    assert client.get(f"/expenses/{e['id']}", headers=user.headers).status_code == 404


def test_invalid_category_rejected(client, user):
    r = client.post("/expenses", json={"amount": 10, "category": "Snacks"}, headers=user.headers)
    assert r.status_code == 422


def test_users_cannot_see_each_others_expenses(client, make_user):
    alice, bob = make_user(), make_user()
    e = add(client, alice.headers)
    assert client.get(f"/expenses/{e['id']}", headers=bob.headers).status_code == 404
    assert client.delete(f"/expenses/{e['id']}", headers=bob.headers).status_code == 404
    assert client.get("/expenses", headers=bob.headers).json() == []


def test_filters(client, user):
    add(client, user.headers, category="Food", spent_on="2026-10-01")
    add(client, user.headers, category="Transport", spent_on="2026-10-15")
    assert len(client.get("/expenses?category=Food", headers=user.headers).json()) == 1
    assert len(client.get("/expenses?start=2026-10-10", headers=user.headers).json()) == 1


def test_budgets_upsert_and_delete(client, user):
    assert client.put("/budgets/Food", json={"monthly_limit": 4000}, headers=user.headers).status_code == 200
    assert client.put("/budgets/Food", json={"monthly_limit": 5000}, headers=user.headers).status_code == 200
    assert client.get("/budgets", headers=user.headers).json() == [{"category": "Food", "monthly_limit": 5000}]
    assert client.delete("/budgets/Food", headers=user.headers).status_code == 204
    assert client.delete("/budgets/Food", headers=user.headers).status_code == 404


def test_month_stats(client, user):
    client.put("/budgets/Shopping", json={"monthly_limit": 3000}, headers=user.headers)
    add(client, user.headers, amount=3600, category="Shopping", spent_on="2025-03-05")
    add(client, user.headers, amount=1000, category="Shopping", spent_on="2025-02-05")
    s = client.get("/ai/stats?month=2025-03", headers=user.headers).json()
    assert s["total_spent"] == 3600
    shop = next(c for c in s["categories"] if c["category"] == "Shopping")
    assert shop["budget_used_pct"] == 120
    assert shop["change_vs_previous_pct"] == 260
    assert s["is_current_month"] is False
