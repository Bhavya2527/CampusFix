from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
import models
import schemas
from auth import require_admin, get_current_user

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=List[schemas.DepartmentResponse])
def get_all_departments(db: Session = Depends(get_db)):
    """Retrieve all available campus departments for complaint assignment and categorization."""
    departments = db.query(models.Department).order_by(models.Department.department_name.asc()).all()
    return departments


@router.post("", response_model=schemas.DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: schemas.DepartmentCreate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to register a new campus department."""
    name = dept_in.department_name.strip()
    existing = db.query(models.Department).filter(
        models.Department.department_name.ilike(name)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Department '{name}' already exists."
        )

    dept = models.Department(department_name=name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept
