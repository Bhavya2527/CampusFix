from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field


# ----------------------------------------------------
# User Schemas
# ----------------------------------------------------
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="John Doe")
    email: EmailStr = Field(..., example="student@campusfix.edu")
    password: str = Field(..., min_length=6, max_length=128, example="student123")
    role: Optional[str] = Field(default="student", example="student")  # 'student', 'admin', 'staff'


class UserLogin(BaseModel):
    email: EmailStr = Field(..., example="student@campusfix.edu")
    password: str = Field(..., example="student123")


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ----------------------------------------------------
# Status History Schemas
# ----------------------------------------------------
class StatusHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    old_status: Optional[str] = None
    new_status: str
    note: Optional[str] = None
    changed_at: datetime

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Complaint Schemas
# ----------------------------------------------------
class ComplaintCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200, example="Water leakage in Hostel B 2nd floor bathroom")
    description: str = Field(..., min_length=10, example="Tap is continuously leaking causing floor waterlogging.")
    location: str = Field(..., min_length=2, max_length=150, example="Hostel B, 2nd Floor")
    category: str = Field(..., min_length=2, max_length=100, example="Plumbing")
    priority: Optional[str] = Field(default="Medium", example="Medium")  # Low, Medium, High, Urgent
    department: Optional[str] = Field(default=None, example="Plumbing & Sanitation")


class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., example="In Progress")  # Pending, In Progress, Resolved, Rejected
    note: Optional[str] = Field(default=None, example="Technician dispatched to the location.")


class ComplaintAssignUpdate(BaseModel):
    department: Optional[str] = Field(default=None, example="Hostel & Housing")
    assigned_to: Optional[int] = Field(default=None, example=2)  # Staff user ID
    note: Optional[str] = Field(default=None, example="Assigned to hostel maintenance team")


class ComplaintResponse(BaseModel):
    id: int
    complaint_id: str
    title: str
    description: str
    location: str
    category: str
    priority: str
    department: Optional[str] = None
    status: str
    student_id: int
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    student: Optional[UserResponse] = None
    assignee: Optional[UserResponse] = None
    status_history: Optional[List[StatusHistoryResponse]] = []

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Department Schemas
# ----------------------------------------------------
class DepartmentCreate(BaseModel):
    department_name: str = Field(..., min_length=2, max_length=100, example="Electrical & Power")


class DepartmentResponse(BaseModel):
    id: int
    department_name: str

    class Config:
        from_attributes = True


# ----------------------------------------------------
# Analytics Schemas
# ----------------------------------------------------
class AnalyticsResponse(BaseModel):
    total_complaints: int
    pending_complaints: int
    in_progress_complaints: int
    resolved_complaints: int
    complaints_by_category: Dict[str, int]
    complaints_by_department: Dict[str, int]
    complaints_by_location: Dict[str, int]


# ----------------------------------------------------
# AI Service Schemas (Consistent interface for Member 3)
# ----------------------------------------------------
class AIAnalyzeRequest(BaseModel):
    text: Optional[str] = Field(default=None, example="Water pipe burst in Hostel C corridor")
    title: Optional[str] = Field(default=None, example="Water pipe burst")
    description: Optional[str] = Field(default=None, example="There is a major pipe burst in Hostel C corridor causing flooding.")
    location: Optional[str] = Field(default=None, example="Hostel C, Corridor 1")


class AIAnalyzeResponse(BaseModel):
    category: str
    priority: str
    suggested_department: str
    summary: str
    key_issues: List[str]
    confidence_score: float = 0.95


class AIChatRequest(BaseModel):
    message: str = Field(..., example="How do I track my hostel complaint status?")
    conversation_history: Optional[List[Dict[str, str]]] = Field(default=[], example=[])
    context: Optional[Dict[str, Any]] = Field(default=None)


class AIChatResponse(BaseModel):
    reply: str
    suggested_actions: Optional[List[str]] = []
    intent: Optional[str] = None
