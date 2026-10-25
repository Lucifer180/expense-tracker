"""Fill an account with realistic demo expenses and budgets.

Usage (from backend\\, with the venv active):
    python seed_demo.py you@example.com            # add demo data (creates the account if missing)
    python seed_demo.py you@example.com --clear    # wipe that account's expenses/budgets first

If the account doesn't exist yet you'll be asked for a password (it isn't stored in this file).
"""
import argparse
import getpass
import random
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import delete, select

from app.database import Base, SessionLocal, engine
from app.models import Budget, Expense, User
from app.security import hash_password

BUDGETS = {
    "Food": 7000, "Groceries": 6000, "Transport": 4000, "Shopping": 4000,
    "Entertainment": 2000, "Bills": 3500, "Health": 1500,
}

# (category, descriptions, (min, max) amount, typical times per month)
PATTERNS = [
    ("Food", ["Swiggy dinner", "Zomato lunch", "Cafe with friends", "Chai and snacks", "Office canteen",
              "Biryani order", "Dominos pizza", "Team lunch", "Starbucks coffee"], (120, 1000), 12),
    ("Groceries", ["BigBasket order", "Blinkit groceries", "Zepto essentials", "DMart run", "Vegetables and fruits"], (250, 1800), 5),
    ("Transport", ["Uber to office", "Rapido ride", "Ola auto", "Metro card recharge", "Petrol"], (60, 600), 9),
    ("Shopping", ["Amazon order", "Myntra sale", "Flipkart gadgets", "Decathlon", "Books"], (400, 3200), 3),
    ("Entertainment", ["Movie tickets", "Netflix", "Spotify", "BookMyShow event", "Gaming"], (149, 1200), 3),
    ("Health", ["Pharmacy", "Gym supplements", "Doctor consultation"], (150, 1200), 1),
    ("Education", ["Udemy course", "Coursera subscription", "Tech book"], (399, 2500), 1),
]
FIXED = [  # same day every month
    (1, "Rent", "House rent", 15000),
    (5, "Bills", "Electricity bill", None),
    (7, "Bills", "Mobile recharge", 299),
    (10, "Bills", "Broadband", 799),
]


def month_starts(today: date, months: int) -> list[date]:
    out, d = [], today.replace(day=1)
    for _ in range(months):
        out.append(d)
        d = (d - timedelta(days=1)).replace(day=1)
    return list(reversed(out))


def generate(user_id: int, today: date, months: int, rng: random.Random) -> list[Expense]:
    rows = []
    for i, start in enumerate(month_starts(today, months)):
        nxt = (start + timedelta(days=32)).replace(day=1)
        last = min(today, nxt - timedelta(days=1))
        days = (last - start).days + 1
        # older months a little cheaper, the latest a little more indulgent: gives the insights something to say
        mood = 0.85 + 0.12 * i

        for day, cat, desc, amt in FIXED:
            if day <= days:
                amount = amt if amt else rng.randint(900, 1900)
                rows.append(Expense(user_id=user_id, category=cat, description=desc,
                                    amount=Decimal(amount), spent_on=start + timedelta(days=day - 1)))

        for cat, descs, (lo, hi), per_month in PATTERNS:
            count = max(0, round(per_month * days / 30 * rng.uniform(0.7, 1.2) * (mood if cat in ("Food", "Shopping") else 1)))
            for _ in range(count):
                rows.append(Expense(
                    user_id=user_id, category=cat, description=rng.choice(descs),
                    amount=Decimal(round(rng.uniform(lo, hi) / 10) * 10),
                    spent_on=start + timedelta(days=rng.randrange(days)),
                ))
    return rows


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("email")
    p.add_argument("--months", type=int, default=3)
    p.add_argument("--clear", action="store_true", help="delete this account's existing expenses and budgets first")
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()

    Base.metadata.create_all(bind=engine)
    email = args.email.strip().lower()
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            pw = getpass.getpass(f"No account for {email}. Choose a password to create it: ")
            if len(pw) < 8:
                raise SystemExit("Password must be at least 8 characters.")
            user = User(email=email, hashed_password=hash_password(pw))
            db.add(user)
            db.flush()
            print(f"Created account {email}")

        if args.clear:
            db.execute(delete(Expense).where(Expense.user_id == user.id))
            db.execute(delete(Budget).where(Budget.user_id == user.id))

        existing = {b.category: b for b in db.scalars(select(Budget).where(Budget.user_id == user.id))}
        for cat, limit in BUDGETS.items():
            if cat in existing:
                existing[cat].monthly_limit = Decimal(limit)
            else:
                db.add(Budget(user_id=user.id, category=cat, monthly_limit=Decimal(limit)))

        rows = generate(user.id, date.today(), args.months, random.Random(args.seed))
        db.add_all(rows)
        db.commit()

        total = sum(r.amount for r in rows)
        print(f"Added {len(rows)} expenses (₹{total:,.0f}) over {args.months} months and {len(BUDGETS)} budgets for {email}.")


if __name__ == "__main__":
    main()
