import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..emailer import send_password_reset_email
from ..models import PasswordResetToken, User
from ..schemas import (
    ForgotPasswordRequest, MessageOut, ResetPasswordRequest, Token, UserCreate, UserOut,
)
from ..security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(email=email, hashed_password=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == form.username.lower()))
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


GENERIC_FORGOT_MSG = "If an account exists for that email, a reset link has been sent."


@router.post("/forgot-password", response_model=MessageOut)
def forgot_password(
    data: ForgotPasswordRequest,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    # Same response whether or not the email exists, so this can't be used to discover accounts.
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user is None:
        return MessageOut(message=GENERIC_FORGOT_MSG)

    now = datetime.now(timezone.utc)
    # Only the newest link should work: expire any older unused ones.
    db.execute(
        update(PasswordResetToken)
        .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
        .values(used_at=now)
    )

    raw_token = secrets.token_urlsafe(32)
    db.add(PasswordResetToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=now + timedelta(minutes=settings.reset_token_expire_minutes),
    ))
    db.commit()

    link = f"{settings.frontend_url.rstrip('/')}/reset-password?token={raw_token}"
    # Send after the response so the request is fast and timing doesn't reveal if the email exists.
    background.add_task(send_password_reset_email, user.email, link)
    return MessageOut(message=GENERIC_FORGOT_MSG)


@router.post("/reset-password", response_model=MessageOut)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    record = db.scalar(select(PasswordResetToken).where(PasswordResetToken.token_hash == hash_token(data.token)))
    now = datetime.now(timezone.utc)
    expires_at = record.expires_at if record else None
    if expires_at is not None and expires_at.tzinfo is None:  # some DB drivers drop the timezone
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if record is None or record.used_at is not None or expires_at < now:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user = db.get(User, record.user_id)
    if user is None:
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    user.hashed_password = hash_password(data.new_password)
    record.used_at = now
    db.commit()
    return MessageOut(message="Password updated. You can now log in.")
