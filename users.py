from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_staff_or_admin
)

router = APIRouter(tags=["Authentication & Users"])


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    """Register a new user (student, staff, or admin).
    Ensures unique email and securely hashes password before saving.
    """
    normalized_email = user_in.email.lower().strip()
    existing_user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Validate role
    role = (user_in.role or "student").lower().strip()
    if role not in ["student", "admin", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'student', 'staff', or 'admin'."
        )

    hashed_pw = hash_password(user_in.password)

    new_user = models.User(
        name=user_in.name.strip(),
        email=normalized_email,
        hashed_password=hashed_pw,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=schemas.TokenResponse)
def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning a JWT bearer token."""
    normalized_email = login_data.email.lower().strip()
    user = db.query(models.User).filter(models.User.email == normalized_email).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT access token with user claims (sub must be string)
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "name": user.name
    }
    access_token = create_access_token(data=token_payload)

    return schemas.TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=schemas.UserResponse.from_orm(user) if hasattr(schemas.UserResponse, "from_orm") else schemas.UserResponse.model_validate(user)
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    """Fetch the currently authenticated user's profile details."""
    return current_user


@router.get("/users", response_model=List[schemas.UserResponse])
def list_users(
    role: Optional[str] = Query(None, description="Filter users by role: student, staff, admin"),
    current_user: models.User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """List system users (restricted to staff and admin). Useful for assignment workflows."""
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role.lower().strip())
    return query.order_by(models.User.name.asc()).all()
