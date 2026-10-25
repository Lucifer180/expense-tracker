"""Shared fixtures. Runs against the database in DATABASE_URL (Postgres in CI).
The LLM is replaced with a fake so tests are free, fast and deterministic."""
import json
import os
import uuid
from types import SimpleNamespace

os.environ.setdefault("SECRET_KEY", "test-secret-key-for-ci-only-0123456789")
os.environ.setdefault("XAI_API_KEY", "test-key")
os.environ.setdefault("SMTP_HOST", "")

import pytest
from fastapi.testclient import TestClient

import app.grok as grok
import app.routers.auth as auth_router
from app.main import app

PARSED = {"amount": 450, "category": "Food", "description": "Swiggy dinner", "spent_on": "2026-10-24"}
INSIGHTS = {"summary": "ok", "overspent": [], "went_well": [], "suggestions": []}


@pytest.fixture(autouse=True)
def fake_llm(monkeypatch):
    calls = []

    def create(**kw):
        calls.append(kw)
        system = kw["messages"][0]["content"]
        out = PARSED if "extract one expense" in system else INSIGHTS
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=json.dumps(out)))])

    monkeypatch.setattr(grok.client.chat.completions, "create", create)
    return calls


@pytest.fixture
def sent_emails(monkeypatch):
    sent = []
    monkeypatch.setattr(auth_router, "send_password_reset_email", lambda to, link: sent.append((to, link)))
    return sent


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def make_user(client):
    def _make(password="password123"):
        email = f"user-{uuid.uuid4().hex[:10]}@test.com"
        assert client.post("/auth/signup", json={"email": email, "password": password}).status_code == 201
        token = client.post("/auth/login", data={"username": email, "password": password}).json()["access_token"]
        return SimpleNamespace(email=email, password=password, headers={"Authorization": f"Bearer {token}"})

    return _make


@pytest.fixture
def user(make_user):
    return make_user()
