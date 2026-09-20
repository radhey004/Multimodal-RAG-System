import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.services.database import (
    get_user_by_email,
    create_user
)

from app.utils.auth import (
    hash_password,
    verify_password,
    create_access_token
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(data: RegisterRequest):

    email = data.email.lower()

    existing_user = get_user_by_email(
        email
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    if len(data.password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters"
        )

    user_id = str(
        uuid.uuid4()
    )

    user = {
        "user_id": user_id,
        "name": data.name,
        "email": email,
        "password":
            hash_password(
                data.password
            ),
        "created_at":
            datetime.now(
                timezone.utc
            )
    }

    create_user(
        user
    )

    token = create_access_token(
        user_id
    )

    return {
        "message":
            "Registration successful",
        "token": token,
        "user": {
            "user_id":
                user_id,
            "name":
                data.name,
            "email":
                email
        }
    }


@router.post("/login")
def login(data: LoginRequest):

    email = data.email.lower()

    user = get_user_by_email(
        email
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(
        data.password,
        user["password"]
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(
        user["user_id"]
    )

    return {
        "message":
            "Login successful",
        "token":
            token,
        "user": {
            "user_id":
                user["user_id"],
            "name":
                user["name"],
            "email":
                user["email"]
        }
    }