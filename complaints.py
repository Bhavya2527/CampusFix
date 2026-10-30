import uuid
import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload

from database import get_db
import models
import schemas
from auth import (
    get_current_user,
    require_admin,
    require_staff_or_admin
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])


def generate_complaint_id() -> str:
    """Generate a readable, unique complaint identifier, e.g. CMP-20261030-A8B2."""
    now_str = datetime.datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:6].upper()
    return f"CMP-{now_str}-{unique_suffix}"


@router.post("", response_model=schemas.ComplaintResponse, status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint_in: schemas.ComplaintCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Student submits a new complaint.
    - Validates request payload.
    - Generates unique complaint ID.
    - Sets initial status to 'Pending'.
    - Stores initial status history record.
    """
    comp_id = generate_complaint_id()

    # Priority default fallback
    priority = (complaint_in.priority or "Medium").capitalize()
    if priority not in ["Low", "Medium", "High", "Urgent"]:
        priority = "Medium"

    new_complaint = models.Complaint(
        complaint_id=comp_id,
        title=complaint_in.title.strip(),
        description=complaint_in.description.strip(),
        location=complaint_in.location.strip(),
        category=complaint_in.category.strip(),
        priority=priority,
        department=complaint_in.department.strip() if complaint_in.department else None,
        status="Pending",
        student_id=current_user.id
    )
    db.add(new_complaint)
    db.flush()  # Populate new_complaint.id

    # Create initial status history entry
    initial_history = models.StatusHistory(
        complaint_id=new_complaint.id,
        old_status=None,
        new_status="Pending",
        note="Complaint submitted by student."
    )
    db.add(initial_history)
    db.commit()
    db.refresh(new_complaint)
    return new_complaint


@router.get("", response_model=List[schemas.ComplaintResponse])
def get_complaints(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status: Pending, In Progress, Resolved, Rejected"),
    category: Optional[str] = Query(None, description="Filter by category"),
    department: Optional[str] = Query(None, description="Filter by department"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    search: Optional[str] = Query(None, description="Search term for title, description, location or complaint_id"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve complaints with role-based scoping:
    - Students see ONLY their own submitted complaints.
    - Admins and Staff see campus-wide complaints with optional filters.
    """
    query = db.query(models.Complaint).options(
        joinedload(models.Complaint.student),
        joinedload(models.Complaint.assignee),
        joinedload(models.Complaint.status_history)
    )

    # Scoping by role
    if current_user.role == "student":
        query = query.filter(models.Complaint.student_id == current_user.id)
    elif current_user.role == "staff":
        # Staff can see all, or filtered to their department/assignments if specified
        pass

    # Optional query filters
    if status_filter:
        query = query.filter(models.Complaint.status.ilike(status_filter.strip()))
    if category:
        query = query.filter(models.Complaint.category.ilike(f"%{category.strip()}%"))
    if department:
        query = query.filter(models.Complaint.department.ilike(f"%{department.strip()}%"))
    if priority:
        query = query.filter(models.Complaint.priority.ilike(priority.strip()))
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (models.Complaint.title.ilike(search_pattern)) |
            (models.Complaint.description.ilike(search_pattern)) |
            (models.Complaint.location.ilike(search_pattern)) |
            (models.Complaint.complaint_id.ilike(search_pattern))
        )

    return query.order_by(models.Complaint.created_at.desc()).all()


@router.get("/{id}", response_model=schemas.ComplaintResponse)
def get_complaint_detail(
    id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve full details of a complaint by integer ID or unique complaint_id string.
    Enforces authorization: students can only access their own complaints.
    """
    query = db.query(models.Complaint).options(
        joinedload(models.Complaint.student),
        joinedload(models.Complaint.assignee),
        joinedload(models.Complaint.status_history)
    )

    if id.isdigit():
        complaint = query.filter(models.Complaint.id == int(id)).first()
    else:
        complaint = query.filter(models.Complaint.complaint_id == id.strip()).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{id}' not found."
        )

    # Role-based restriction: students cannot view complaints filed by others
    if current_user.role == "student" and complaint.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this complaint."
        )

    return complaint


@router.patch("/{id}/status", response_model=schemas.ComplaintResponse)
def update_complaint_status(
    id: str,
    status_update: schemas.ComplaintStatusUpdate,
    current_user: models.User = Depends(require_staff_or_admin),
    db: Session = Depends(get_db)
):
    """Admin or authorized staff updates complaint status.
    Records transition in status history. Students are prevented from modifying.
    """
    if id.isdigit():
        complaint = db.query(models.Complaint).filter(models.Complaint.id == int(id)).first()
    else:
        complaint = db.query(models.Complaint).filter(models.Complaint.complaint_id == id.strip()).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{id}' not found."
        )

    valid_statuses = ["Pending", "In Progress", "Resolved", "Rejected"]
    matched_status = next((s for s in valid_statuses if s.lower() == status_update.status.strip().lower()), None)
    if not matched_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{status_update.status}'. Valid choices are: {', '.join(valid_statuses)}."
        )

    old_status = complaint.status
    complaint.status = matched_status
    complaint.updated_at = datetime.datetime.utcnow()

    # Record status history audit log
    history_entry = models.StatusHistory(
        complaint_id=complaint.id,
        old_status=old_status,
        new_status=matched_status,
        note=status_update.note or f"Status changed from {old_status} to {matched_status} by {current_user.name} ({current_user.role})"
    )
    db.add(history_entry)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.patch("/{id}/assign", response_model=schemas.ComplaintResponse)
def assign_complaint(
    id: str,
    assign_update: schemas.ComplaintAssignUpdate,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to assign department and/or specific staff member to a complaint."""
    if id.isdigit():
        complaint = db.query(models.Complaint).filter(models.Complaint.id == int(id)).first()
    else:
        complaint = db.query(models.Complaint).filter(models.Complaint.complaint_id == id.strip()).first()

    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{id}' not found."
        )

    notes = []
    if assign_update.department:
        complaint.department = assign_update.department.strip()
        notes.append(f"Department assigned: {complaint.department}")

    if assign_update.assigned_to is not None:
        staff_user = db.query(models.User).filter(
            models.User.id == assign_update.assigned_to,
            models.User.role.in_(["staff", "admin"])
        ).first()
        if not staff_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Staff member with ID {assign_update.assigned_to} not found or not staff/admin."
            )
        complaint.assigned_to = staff_user.id
        notes.append(f"Assigned to {staff_user.name} ({staff_user.email})")

    complaint.updated_at = datetime.datetime.utcnow()

    # Log in status history if changes occurred
    note_msg = "; ".join(notes)
    if assign_update.note:
        note_msg = f"{note_msg}. Note: {assign_update.note}" if note_msg else assign_update.note

    if note_msg:
        history_entry = models.StatusHistory(
            complaint_id=complaint.id,
            old_status=complaint.status,
            new_status=complaint.status,
            note=note_msg
        )
        db.add(history_entry)

    db.commit()
    db.refresh(complaint)
    return complaint
