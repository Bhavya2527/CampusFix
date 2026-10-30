# CampusFix Backend – AI-Powered Campus Complaint Management System

CampusFix is an intelligent campus complaint and grievance resolution platform. It provides a secure, role-based backend for logging, triaging, assigning, and resolving campus infrastructure and facility issues.

---

## 1. Technology Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.10+)
- **Database**: [SQLite](https://www.sqlite.org/) (Local file storage, zero cloud database)
- **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/)
- **Data Validation & Schemas**: [Pydantic v2](https://docs.pydantic.dev/)
- **Password Hashing**: `bcrypt` / secure PBKDF2 standard
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC)
- **Local AI Interface**: [Ollama](http://localhost:11434) integration ready (zero cloud AI APIs)
- **CORS**: Configured for local Vite frontend (`http://localhost:5173`)

---

## 2. Directory Structure

```
backend/
├── main.py               # FastAPI application setup, CORS, lifespan, router mounting
├── database.py           # SQLite connection, engine, and session dependency (get_db)
├── models.py             # SQLAlchemy models (User, Complaint, StatusHistory, Department)
├── schemas.py            # Pydantic schemas for requests, responses, and validation
├── auth.py               # Password hashing, JWT token handling, RBAC dependencies
├── requirements.txt      # Dependency specification
├── .env                  # Local environment configuration
├── .env.example          # Environment template
├── README.md             # Backend architecture and setup documentation
├── routes/
│   ├── users.py          # /api/register, /api/login, /api/me, /api/users
│   ├── complaints.py     # /api/complaints, /api/complaints/{id}, /status, /assign
│   ├── analytics.py      # /api/analytics (live SQLite statistics)
│   ├── departments.py    # /api/departments
│   └── ai.py             # /api/ai/analyze, /api/ai/chat
└── ai/
    └── __init__.py       # Member 3 AI interface & local heuristic/Ollama fallback
```

---

## 3. Demo Accounts (Seeded Automatically)

Upon startup, the database automatically seeds three demo accounts:

| Role | Name | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Campus Administrator | `admin@campusfix.edu` | `admin123` | Full access: assign departments, assign staff, update status, view all complaints & analytics |
| **Staff** | Hostel Maintenance Officer | `staff@campusfix.edu` | `staff123` | Update complaint status, view campus complaints, add resolution notes |
| **Student** | Alex Johnson | `student@campusfix.edu` | `student123` | Submit complaints, view only own complaints, check status history |

---

## 4. Quick Start & Execution

### Prerequisites
- Python 3.10 or higher
- Pip

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Start the Backend Server
```bash
python main.py
```
*Or using uvicorn directly:*
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Interactive API Documentation
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 5. API Endpoints Reference

All endpoints are mounted under the base path: `/api`

### 🔑 Authentication & Users
- `POST /api/register` – Register a new user (`student`, `staff`, or `admin`)
- `POST /api/login` – Authenticate with email and password, returns JWT Bearer token
- `GET /api/me` – Retrieve profile of current logged-in user
- `GET /api/users?role=staff` – List staff or users (Admin/Staff only)

### 📋 Complaints Workflow
- `POST /api/complaints` – Submit a new complaint (Student/User)
  - Auto-generates unique ID (e.g. `CMP-20261030-A8B2`)
  - Initial status: `Pending`
  - Creates initial audit entry in `StatusHistory`
- `GET /api/complaints` – List complaints:
  - Students see **only** their own complaints.
  - Admin/Staff see **all** complaints with query filters (`status`, `category`, `department`, `priority`, `search`).
- `GET /api/complaints/{id}` – View single complaint by integer ID or `complaint_id` string:
  - Students are prevented from accessing other students' complaints (`403 Forbidden`).
  - Returns linked student, assignee, and complete `status_history`.
- `PATCH /api/complaints/{id}/status` – Update complaint status (`Pending`, `In Progress`, `Resolved`, `Rejected`):
  - Accessible by **Admin** or **Staff** only.
  - Automatically adds an entry in `StatusHistory` with timestamp and notes.
- `PATCH /api/complaints/{id}/assign` – Assign complaint to a department and/or staff member:
  - Accessible by **Admin** only.

### 🏢 Departments
- `GET /api/departments` – Retrieve all campus departments (e.g., Hostel, Electrical, IT, Plumbing).
- `POST /api/departments` – Add a new campus department (Admin only).

### 📊 Real-time Analytics
- `GET /api/analytics` – Returns actual database-driven metrics:
  - `total_complaints`
  - `pending_complaints`
  - `in_progress_complaints`
  - `resolved_complaints`
  - `complaints_by_category`
  - `complaints_by_department`
  - `complaints_by_location`

### 🤖 AI Service (Member 3 Integration)
- `POST /api/ai/analyze` – Classifies complaint text, detects category, priority, and suggested department.
- `POST /api/ai/chat` – Interactive chatbot assistant for student grievance guidance.

> **Member 3 Note**: The AI service interface is located in `backend/ai/__init__.py`. It is pre-configured to query local Ollama (`http://localhost:11434`) when active, and provides a built-in deterministic heuristic fallback so the entire system operates immediately without cloud API dependencies.

---

## 6. Complaint Lifecycle & RBAC Rules

1. **Submission**: A student submits a complaint with title, description, category, and location.
2. **Identification**: The backend validates fields, assigns a unique tracking ID (`CMP-YYYYMMDD-XXXX`), and stores it with status `Pending`.
3. **Assignment**: An administrator reviews the complaint and assigns it to a relevant department and staff officer via `/api/complaints/{id}/assign`.
4. **Resolution**: The assigned staff updates the status to `In Progress` and subsequently `Resolved` via `/api/complaints/{id}/status`.
5. **Auditing**: Every status change is captured in the `status_history` table with timestamps, previous status, new status, and action notes.
6. **Privacy**: Students cannot view or modify complaints filed by other students.
