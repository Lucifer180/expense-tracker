from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # registers the models so their tables get created
from .config import settings
from .database import Base, engine
from .routers import ai, auth, budgets, expenses

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

# CORS matches on origin (scheme + host) only, so strip any path from FRONTEND_URL
# (e.g. https://user.github.io/expense-tracker -> https://user.github.io).
def _origin(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


# Lets the deployed frontend and the local React dev server call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list({_origin(settings.frontend_url), "http://localhost:5173", "http://127.0.0.1:5173"}),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(expenses.router)
app.include_router(budgets.router)
app.include_router(ai.router)


@app.get("/health")
def health():
    return {"status": "ok"}
