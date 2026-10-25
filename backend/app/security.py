from datetime import datetime, timedelta, timezone

import jwt
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def hash_password(password:str)->str:
    return password_hash.hash(password)

def verify_password(password:str,hashed:str)->bool:
    return password_hash.verify(password,hashed)

def create_access_token(user_id:int)->str:
    expire = datetime.now(timezone.utc) + timedelta(minutes = settings.access_token_expire_minutes)
    payload = {"sub":str(user_id),"exp":expire}
    return jwt.encode(payload,settings.secret_key, algorithm = settings.algorithm)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credential_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        user_id = int(payload["sub"])

    except (InvalidTokenError, KeyError, ValueError):
        raise credential_error

    user = db.get(User, user_id)

    if user is None:
        raise credential_error

    return user
