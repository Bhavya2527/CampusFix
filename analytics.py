from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
import models
import schemas

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=schemas.AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)):
    """Compute and return live database statistics:
    - Total complaints
    - Pending complaints
    - In-progress complaints
    - Resolved complaints
    - Complaints grouped by category
    - Complaints grouped by department
    - Complaints grouped by location
    """
    # Total count
    total_complaints = db.query(func.count(models.Complaint.id)).scalar() or 0

    # Count by status
    pending_complaints = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status.ilike("Pending")
    ).scalar() or 0

    in_progress_complaints = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status.ilike("In Progress")
    ).scalar() or 0

    resolved_complaints = db.query(func.count(models.Complaint.id)).filter(
        models.Complaint.status.ilike("Resolved")
    ).scalar() or 0

    # Group by category
    category_rows = db.query(
        models.Complaint.category,
        func.count(models.Complaint.id)
    ).group_by(models.Complaint.category).all()
    complaints_by_category = {cat or "Uncategorized": count for cat, count in category_rows}

    # Group by department
    department_rows = db.query(
        models.Complaint.department,
        func.count(models.Complaint.id)
    ).group_by(models.Complaint.department).all()
    complaints_by_department = {dept or "Unassigned": count for dept, count in department_rows}

    # Group by location
    location_rows = db.query(
        models.Complaint.location,
        func.count(models.Complaint.id)
    ).group_by(models.Complaint.location).all()
    complaints_by_location = {loc or "Unknown": count for loc, count in location_rows}

    return schemas.AnalyticsResponse(
        total_complaints=total_complaints,
        pending_complaints=pending_complaints,
        in_progress_complaints=in_progress_complaints,
        resolved_complaints=resolved_complaints,
        complaints_by_category=complaints_by_category,
        complaints_by_department=complaints_by_department,
        complaints_by_location=complaints_by_location
    )
