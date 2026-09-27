import hashlib
import secrets
import smtplib
import uuid
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.config import settings
from app.services.database import (
    create_user,
    get_user_by_email,
    get_user_by_id,
    update_user,
)
from app.utils.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    valid_password,
    verify_password,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleRequest(BaseModel):
    id_token: str


class ForgotRequest(BaseModel):
    email: EmailStr


class ResetRequest(BaseModel):
    token: str
    password: str
    confirm_password: str


class ProfileRequest(BaseModel):
    full_name: str
    email: EmailStr
    current_password: str
    new_password: str | None = None


def password_error(password):
    if not valid_password(password):
        return (
            "Password must contain at least 8 characters, "
            "one letter and one number."
        )


def public_user(user):
    return {
        "user_id": user["user_id"],
        "name": user["name"],
        "email": user["email"]
    }


def send_reset_email(email, token):
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        raise RuntimeError("SMTP is not configured")

    link = f"{settings.PASSWORD_RESET_URL}?token={token}"

    msg = EmailMessage()
    msg["Subject"] = "Reset your Multimodal RAG password"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = email
    msg.set_content(
        f"Reset your password using this link:\n\n{link}\n\n"
        "This link expires in 30 minutes."
    )

    with smtplib.SMTP(
        settings.SMTP_HOST,
        settings.SMTP_PORT
    ) as smtp:
        smtp.starttls()
        smtp.login(
            settings.SMTP_USERNAME,
            settings.SMTP_PASSWORD
        )
        smtp.send_message(msg)


@router.post("/register")
def register(data: RegisterRequest):
    name = data.full_name.strip()
    email = data.email.lower()

    if len(name) < 2:
        raise HTTPException(400, "Enter your full name")

    if data.password != data.confirm_password:
        raise HTTPException(400, "Passwords do not match")

    if error := password_error(data.password):
        raise HTTPException(400, error)

    if get_user_by_email(email):
        raise HTTPException(400, "Email already registered")

    user = {
        "user_id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "password": hash_password(data.password),
        "password_history": [],
        "auth_provider": "password",
        "created_at": datetime.now(timezone.utc)
    }

    create_user(user)

    # Important: no token here.
    # Registration -> Login -> Dashboard.
    return {"message": "Registration successful. Please login."}


@router.post("/login")
def login(data: LoginRequest):
    user = get_user_by_email(data.email)

    if not user or not user.get("password"):
        raise HTTPException(401, "Invalid email or password")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")

    return {
        "message": "Login successful",
        "token": create_access_token(user["user_id"]),
        "user": public_user(user)
    }


@router.post("/google")
def google_login(data: GoogleRequest):
    try:
        import firebase_admin
        from firebase_admin import auth as firebase_auth
        from firebase_admin import credentials

        if not firebase_admin._apps:
            if not settings.FIREBASE_PROJECT_ID:
                raise RuntimeError("Firebase is not configured")

            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": settings.FIREBASE_PROJECT_ID,
                "client_email": settings.FIREBASE_CLIENT_EMAIL,
                "private_key": settings.FIREBASE_PRIVATE_KEY.replace("\\n", "\n"),
                "client_id": settings.FIREBASE_CLIENT_ID,
                "token_uri": settings.FIREBASE_TOKEN_URI,
        })
            firebase_admin.initialize_app(cred)

        decoded = firebase_auth.verify_id_token(data.id_token)

        email = decoded.get("email", "").lower()
        name = decoded.get("name") or email.split("@")[0]

        if not email:
            raise HTTPException(400, "Google account has no email")

        user = get_user_by_email(email)

        if not user:
            user = {
                "user_id": str(uuid.uuid4()),
                "name": name,
                "email": email,
                "password": None,
                "password_history": [],
                "auth_provider": "google",
                "created_at": datetime.now(timezone.utc)
            }
            create_user(user)
        else:
            update_user(user["user_id"], {
                "name": name,
                "auth_provider": "google"
            })

        return {
            "message": "Google login successful",
            "token": create_access_token(user["user_id"]),
            "user": public_user(user)
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            503,
            f"Google authentication is not configured correctly: {exc}"
        )


@router.post("/forgot-password")
def forgot_password(data: ForgotRequest):
    user = get_user_by_email(data.email)

    if user:
        token = secrets.token_urlsafe(48)

        update_user(user["user_id"], {
            "reset_token": hashlib.sha256(
                token.encode()
            ).hexdigest(),
            "reset_expires": datetime.now(timezone.utc)
            + timedelta(minutes=30)
        })

        try:
            send_reset_email(user["email"], token)
        except Exception:
            # Don't reveal whether the email exists.
            pass

    return {
        "message":
            "If the email exists, a password reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(data: ResetRequest):
    if data.password != data.confirm_password:
        raise HTTPException(400, "Passwords do not match")

    if error := password_error(data.password):
        raise HTTPException(400, error)

    token_hash = hashlib.sha256(
        data.token.encode()
    ).hexdigest()

    user = None

    # Reset tokens are hashed, so search by hash.
    for candidate in get_user_by_email("") or []:
        pass

    from app.services.database import users_collection

    user = users_collection.find_one({
        "reset_token": token_hash,
        "reset_expires": {"$gt": datetime.now(timezone.utc)}
    })

    if not user:
        raise HTTPException(
            400,
            "Invalid or expired reset link"
        )

    history = user.get("password_history", [])
    old_passwords = [user.get("password")] + history

    if any(
        old and verify_password(data.password, old)
        for old in old_passwords
    ):
        raise HTTPException(
            400,
            "New password cannot be one of your previous passwords"
        )

    update_user(user["user_id"], {
        "password": hash_password(data.password),
        "password_history": (
            [user.get("password")] + history
        )[:5],
        "reset_token": None,
        "reset_expires": None
    })

    return {"message": "Password reset successfully"}


@router.patch("/profile")
def update_profile(
    data: ProfileRequest,
    user_id: str = Depends(get_current_user)
):
    user = get_user_by_id(user_id)

    if not user:
        raise HTTPException(404, "User not found")

    if not user.get("password"):
        raise HTTPException(
            400,
            "Google accounts should use Forgot Password first "
            "to create a password."
        )

    if not verify_password(
        data.current_password,
        user["password"]
    ):
        raise HTTPException(
            401,
            "Current password is incorrect"
        )

    email = data.email.lower()

    if email != user["email"] and get_user_by_email(email):
        raise HTTPException(400, "Email already in use")

    changes = {
        "name": data.full_name.strip(),
        "email": email
    }

    if data.new_password:
        if error := password_error(data.new_password):
            raise HTTPException(400, error)

        if verify_password(
            data.new_password,
            user["password"]
        ):
            raise HTTPException(
                400,
                "New password cannot be the current password"
            )

        history = user.get("password_history", [])

        if any(
            verify_password(data.new_password, old)
            for old in history
        ):
            raise HTTPException(
                400,
                "New password cannot be a previous password"
            )

        changes["password_history"] = (
            [user["password"]] + history
        )[:5]
        changes["password"] = hash_password(
            data.new_password
        )

    update_user(user_id, changes)

    updated = get_user_by_id(user_id)

    return {
        "message": "Profile updated successfully",
        "user": public_user(updated),
        "token": create_access_token(user_id)
    }