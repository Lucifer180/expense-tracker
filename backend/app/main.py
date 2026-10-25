from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # registers the models so their tables get created
from .config import settings
from .database import Base, engine
from .routers import ai, auth, budgets, expenses

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Expense Tracker API")

# Lets the React dev server (a different port = a different origin) call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=list({settings.frontend_url.rstrip("/"), "http://localhost:5173", "http://127.0.0.1:5173"}),
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
