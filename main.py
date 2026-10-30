import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from database import engine, Base, SessionLocal
import models
from auth import hash_password
from routes import users, complaints, analytics, departments, ai

# Ensure database tables exist
Base.metadata.create_all(bind=engine)


def seed_initial_data():
    """Populate database with default demo accounts, departments, and seed complaints if not already present."""
    db = SessionLocal()
    try:
        # 1. Seed Demo Users
        demo_users = [
            {
                "name": "Campus Administrator",
                "email": "admin@campusfix.edu",
                "password": "admin123",
                "role": "admin"
            },
            {
                "name": "Hostel Maintenance Officer",
                "email": "staff@campusfix.edu",
                "password": "staff123",
                "role": "staff"
            },
            {
                "name": "Alex Johnson (Student)",
                "email": "student@campusfix.edu",
                "password": "student123",
                "role": "student"
            }
        ]

        created_users = {}
        for u in demo_users:
            existing = db.query(models.User).filter(models.User.email == u["email"]).first()
            if not existing:
                new_user = models.User(
                    name=u["name"],
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"]
                )
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                created_users[u["email"]] = new_user
            else:
                created_users[u["email"]] = existing

        # 2. Seed Default Departments
        default_depts = [
            "Hostel & Housing",
            "Electrical & Power",
            "Plumbing & Sanitation",
            "IT & Network Infrastructure",
            "Academic & Classroom Facilities",
            "Security & Campus Safety",
            "Cafeteria & Mess"
        ]
        for dept_name in default_depts:
            dept_exists = db.query(models.Department).filter(
                models.Department.department_name == dept_name
            ).first()
            if not dept_exists:
                db.add(models.Department(department_name=dept_name))
        db.commit()

        # 3. Seed Sample Complaints if database has none
        complaint_count = db.query(models.Complaint).count()
        if complaint_count == 0:
            student = created_users.get("student@campusfix.edu")
            staff = created_users.get("staff@campusfix.edu")

            if student:
                # Sample 1: Pending
                c1 = models.Complaint(
                    complaint_id="CMP-20261030-INIT01",
                    title="Water tap leaking continuously in Hostel B, 2nd Floor",
                    description="The main washbasin tap on the 2nd floor of Hostel B is continuously dripping, leading to water accumulation and slippery floors.",
                    location="Hostel B, 2nd Floor Bathroom",
                    category="Plumbing",
                    priority="High",
                    department="Plumbing & Sanitation",
                    status="Pending",
                    student_id=student.id
                )
                db.add(c1)
                db.flush()
                db.add(models.StatusHistory(
                    complaint_id=c1.id,
                    old_status=None,
                    new_status="Pending",
                    note="Complaint logged by Alex Johnson via Student Portal."
                ))

                # Sample 2: In Progress
                c2 = models.Complaint(
                    complaint_id="CMP-20261030-INIT02",
                    title="Wi-Fi access point offline in Library Reading Room 3",
                    description="Wi-Fi signal drops frequently in Reading Room 3 on the 3rd floor. Students are unable to access research portals.",
                    location="Central Library, Room 302",
                    category="IT & Network",
                    priority="Medium",
                    department="IT & Network Infrastructure",
                    status="In Progress",
                    student_id=student.id,
                    assigned_to=staff.id if staff else None
                )
                db.add(c2)
                db.flush()
                db.add(models.StatusHistory(
                    complaint_id=c2.id,
                    old_status=None,
                    new_status="Pending",
                    note="Complaint submitted."
                ))
                db.add(models.StatusHistory(
                    complaint_id=c2.id,
                    old_status="Pending",
                    new_status="In Progress",
                    note="Assigned to IT Network team. Replacement router deployed."
                ))

                # Sample 3: Resolved
                c3 = models.Complaint(
                    complaint_id="CMP-20261030-INIT03",
                    title="Ceiling fan sparking in Classroom 104",
                    description="The second ceiling fan near the blackboard is making a buzzing sound and emitted minor sparks when turned on.",
                    location="Academic Block A, Room 104",
                    category="Electrical",
                    priority="Urgent",
                    department="Electrical & Power",
                    status="Resolved",
                    student_id=student.id,
                    assigned_to=staff.id if staff else None
                )
                db.add(c3)
                db.flush()
                db.add(models.StatusHistory(
                    complaint_id=c3.id,
                    old_status=None,
                    new_status="Pending",
                    note="Initial report."
                ))
                db.add(models.StatusHistory(
                    complaint_id=c3.id,
                    old_status="Pending",
                    new_status="In Progress",
                    note="Electrical team dispatched for emergency inspection."
                ))
                db.add(models.StatusHistory(
                    complaint_id=c3.id,
                    old_status="In Progress",
                    new_status="Resolved",
                    note="Defective regulator and capacitor replaced. Tested safe."
                ))

                db.commit()

    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Seed initial demo data
    seed_initial_data()
    yield
    # Shutdown logic if any


app = FastAPI(
    title="CampusFix Backend API",
    description=(
        "AI-Powered Campus Complaint Management System Backend.\n\n"
        "### Demo Accounts for Testing:\n"
        "- **Admin**: `admin@campusfix.edu` / `admin123`\n"
        "- **Staff**: `staff@campusfix.edu` / `staff123`\n"
        "- **Student**: `student@campusfix.edu` / `student123`\n"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration for local Vite frontend (port 5173 / localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base API Router with prefix /api
api_router = APIRouter(prefix="/api")

# Register routes under /api
api_router.include_router(users.router)
api_router.include_router(complaints.router)
api_router.include_router(analytics.router)
api_router.include_router(departments.router)
api_router.include_router(ai.router)

# Mount API router
app.include_router(api_router)


@app.get("/", tags=["Health Check"])
def root():
    return {
        "status": "online",
        "service": "CampusFix Backend API",
        "documentation": "/docs",
        "api_base": "/api"
    }


@app.get("/api/health", tags=["Health Check"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected (SQLite)",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
