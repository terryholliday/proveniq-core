"""Authentication helpers for PROVENIQ Core backend."""

from typing import Optional

from fastapi import HTTPException, Request, status
from firebase_admin import auth
from pydantic import BaseModel


class AuthenticatedUser(BaseModel):
    uid: str
    email: Optional[str] = None


async def get_current_user(request: Request) -> AuthenticatedUser:
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = auth_header.split(" ", 1)[1]
    try:
        decoded = auth.verify_id_token(token)
        return AuthenticatedUser(uid=decoded["uid"], email=decoded.get("email"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
