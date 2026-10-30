"""
CampusFix Backend Test Suite
----------------------------
Verifies all required endpoints, RBAC permissions, status transitions,
status history recording, analytics aggregation, and AI endpoint contracts.
"""

import sys
import os

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from main import app, seed_initial_data


def run_tests():
    print("=" * 60)
    print("RUNNING CAMPUSFIX BACKEND VERIFICATION TESTS")
    print("=" * 60)

    # Ensure database is seeded with demo accounts & departments
    seed_initial_data()

    with TestClient(app) as client:
        # 1. Health & Root Endpoints
        print("\n[1] Testing Health & Root Endpoints...")
        res = client.get("/")
        assert res.status_code == 200, f"Root failed: {res.text}"
        print("  [OK] GET / -> 200 OK")

        res = client.get("/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        assert res.json()["status"] == "healthy"
        print("  [OK] GET /api/health -> 200 OK")

        # 2. Departments
        print("\n[2] Testing Departments Endpoint...")
        res = client.get("/api/departments")
        assert res.status_code == 200, f"Departments failed: {res.text}"
        depts = res.json()
        assert len(depts) >= 7, f"Expected at least 7 departments, got {len(depts)}"
        dept_names = [d["department_name"] for d in depts]
        print(f"  [OK] GET /api/departments -> 200 OK (Found {len(depts)} departments: {dept_names[:3]}...)")

        # 3. Authentication & Demo Accounts
        print("\n[3] Testing Authentication & Demo Accounts...")
        # Admin login
        res_admin = client.post("/api/login", json={"email": "admin@campusfix.edu", "password": "admin123"})
        assert res_admin.status_code == 200, f"Admin login failed: {res_admin.text}"
        admin_token = res_admin.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        print("  [OK] POST /api/login (Admin) -> 200 OK (Token received)")

        # Staff login
        res_staff = client.post("/api/login", json={"email": "staff@campusfix.edu", "password": "staff123"})
        assert res_staff.status_code == 200, f"Staff login failed: {res_staff.text}"
        staff_token = res_staff.json()["access_token"]
        staff_headers = {"Authorization": f"Bearer {staff_token}"}
        staff_id = res_staff.json()["user"]["id"]
        print("  [OK] POST /api/login (Staff) -> 200 OK (Token received)")

        # Student login
        res_student = client.post("/api/login", json={"email": "student@campusfix.edu", "password": "student123"})
        assert res_student.status_code == 200, f"Student login failed: {res_student.text}"
        student_token = res_student.json()["access_token"]
        student_headers = {"Authorization": f"Bearer {student_token}"}
        student_id = res_student.json()["user"]["id"]
        print("  [OK] POST /api/login (Student) -> 200 OK (Token received)")

        # Test /api/me
        res_me = client.get("/api/me", headers=student_headers)
        assert res_me.status_code == 200 and res_me.json()["role"] == "student"
        print("  [OK] GET /api/me -> 200 OK (Role verified: student)")

        # 4. User Registration
        print("\n[4] Testing User Registration...")
        import random
        rand_email = f"student_{random.randint(1000, 9999)}@campusfix.edu"
        res_reg = client.post("/api/register", json={
            "name": "Sarah Connor",
            "email": rand_email,
            "password": "Password@123",
            "role": "student"
        })
        assert res_reg.status_code == 201, f"Registration failed: {res_reg.text}"
        new_student = res_reg.json()
        assert new_student["email"] == rand_email
        assert "hashed_password" not in new_student
        print(f"  [OK] POST /api/register -> 201 Created (Created student: {rand_email})")

        # Login with newly registered student
        res_new_login = client.post("/api/login", json={"email": rand_email, "password": "Password@123"})
        assert res_new_login.status_code == 200
        new_student_token = res_new_login.json()["access_token"]
        new_student_headers = {"Authorization": f"Bearer {new_student_token}"}

        # 5. Complaint Submission
        print("\n[5] Testing Complaint Submission (Student)...")
        complaint_payload = {
            "title": "Air Conditioner not cooling in Seminar Hall B",
            "description": "The split AC in Seminar Hall B is running but blowing ambient room temperature air. Hall is overheating.",
            "location": "Seminar Block, Hall B",
            "category": "Electrical",
            "priority": "High",
            "department": "Electrical & Power"
        }
        res_c = client.post("/api/complaints", json=complaint_payload, headers=new_student_headers)
        assert res_c.status_code == 201, f"Complaint creation failed: {res_c.text}"
        complaint = res_c.json()
        complaint_id = complaint["complaint_id"]
        comp_pk = complaint["id"]
        assert complaint["status"] == "Pending"
        assert complaint_id.startswith("CMP-")
        print(f"  [OK] POST /api/complaints -> 201 Created (Unique ID: {complaint_id}, Status: Pending)")

        # 6. Complaint Scoping & RBAC Verification
        print("\n[6] Testing Role-Based Scoping & Privacy Protection...")
        # Student 2 lists complaints -> should only see their 1 complaint
        res_s2_list = client.get("/api/complaints", headers=new_student_headers)
        assert res_s2_list.status_code == 200
        s2_complaints = res_s2_list.json()
        assert len(s2_complaints) == 1
        assert s2_complaints[0]["id"] == comp_pk
        print("  [OK] GET /api/complaints (Student) -> Sees ONLY their own complaints")

        # Default student (student@campusfix.edu) tries to access Student 2's complaint -> MUST BE 403 Forbidden
        res_forbidden = client.get(f"/api/complaints/{comp_pk}", headers=student_headers)
        assert res_forbidden.status_code == 403, f"Expected 403 Forbidden, got {res_forbidden.status_code}"
        print("  [OK] GET /api/complaints/{id} -> 403 Forbidden (Blocked student from viewing another student's complaint)")

        # Student tries to update status -> MUST BE 403 Forbidden
        res_status_forbidden = client.patch(
            f"/api/complaints/{comp_pk}/status",
            json={"status": "Resolved", "note": "Attempted bypass"},
            headers=new_student_headers
        )
        assert res_status_forbidden.status_code == 403, f"Expected 403 Forbidden for student status update, got {res_status_forbidden.status_code}"
        print("  [OK] PATCH /api/complaints/{id}/status -> 403 Forbidden (Blocked student from updating complaint status)")

        # 7. Admin Assignment
        print("\n[7] Testing Admin Department & Staff Assignment...")
        res_assign = client.patch(
            f"/api/complaints/{comp_pk}/assign",
            json={
                "department": "Electrical & Power",
                "assigned_to": staff_id,
                "note": "Assigned to head electrician for immediate coil checking"
            },
            headers=admin_headers
        )
        assert res_assign.status_code == 200, f"Assignment failed: {res_assign.text}"
        assigned_data = res_assign.json()
        assert assigned_data["assigned_to"] == staff_id
        assert assigned_data["department"] == "Electrical & Power"
        print(f"  [OK] PATCH /api/complaints/{id}/assign -> 200 OK (Assigned to staff ID {staff_id})")

        # 8. Staff Status Update & Status History Tracking
        print("\n[8] Testing Status Transitions & Audit History...")
        # Transition to In Progress
        res_in_prog = client.patch(
            f"/api/complaints/{comp_pk}/status",
            json={"status": "In Progress", "note": "Technician arrived with refrigerant gas kit."},
            headers=staff_headers
        )
        assert res_in_prog.status_code == 200
        assert res_in_prog.json()["status"] == "In Progress"
        print("  [OK] PATCH /api/complaints/{id}/status -> 200 OK (Updated status to 'In Progress')")

        # Transition to Resolved
        res_resolved = client.patch(
            f"/api/complaints/{comp_pk}/status",
            json={"status": "Resolved", "note": "Replaced gas valve and refilled refrigerant. Temperature back to 22C."},
            headers=staff_headers
        )
        assert res_resolved.status_code == 200
        assert res_resolved.json()["status"] == "Resolved"
        print("  [OK] PATCH /api/complaints/{id}/status -> 200 OK (Updated status to 'Resolved')")

        # Verify Status History is complete
        res_detail = client.get(f"/api/complaints/{comp_pk}", headers=admin_headers)
        assert res_detail.status_code == 200
        detail = res_detail.json()
        history = detail.get("status_history", [])
        assert len(history) >= 3, f"Expected at least 3 history entries, found {len(history)}"
        print(f"  [OK] Audit History Verified: {len(history)} status changes logged in database.")

        # 9. Real-time Database Analytics
        print("\n[9] Testing Analytics Endpoint...")
        res_analytics = client.get("/api/analytics")
        assert res_analytics.status_code == 200, f"Analytics failed: {res_analytics.text}"
        stats = res_analytics.json()
        print("  [OK] GET /api/analytics -> 200 OK")
        print(f"    - Total Complaints: {stats['total_complaints']}")
        print(f"    - Pending: {stats['pending_complaints']}")
        print(f"    - In Progress: {stats['in_progress_complaints']}")
        print(f"    - Resolved: {stats['resolved_complaints']}")
        print(f"    - Categories: {stats['complaints_by_category']}")
        print(f"    - Departments: {stats['complaints_by_department']}")
        print(f"    - Locations: {stats['complaints_by_location']}")

        assert stats["total_complaints"] >= 4
        assert stats["resolved_complaints"] >= 2

        # 10. AI Service Endpoints (Member 3 Interface)
        print("\n[10] Testing AI Service Endpoints...")
        # Analyze
        res_ai_analyze = client.post("/api/ai/analyze", json={
            "title": "Severe water leakage in Hostel C ground floor bathroom",
            "description": "Main pipeline has ruptured, water is flooding into the corridor.",
            "location": "Hostel C, Ground Floor"
        })
        assert res_ai_analyze.status_code == 200, f"AI analyze failed: {res_ai_analyze.text}"
        ai_data = res_ai_analyze.json()
        print("  [OK] POST /api/ai/analyze -> 200 OK")
        print(f"    - Detected Category: {ai_data['category']}")
        print(f"    - Detected Priority: {ai_data['priority']}")
        print(f"    - Suggested Department: {ai_data['suggested_department']}")
        assert ai_data["category"] == "Plumbing"
        assert ai_data["priority"] in ["High", "Urgent"]

        # Chat
        res_ai_chat = client.post("/api/ai/chat", json={
            "message": "How do I check the status of my complaint?"
        })
        assert res_ai_chat.status_code == 200, f"AI chat failed: {res_ai_chat.text}"
        chat_data = res_ai_chat.json()
        print("  [OK] POST /api/ai/chat -> 200 OK")
        print(f"    - Assistant Reply: {chat_data['reply'][:65]}...")
        assert "reply" in chat_data and len(chat_data["reply"]) > 10

        print("\n" + "=" * 60)
        print("ALL TESTS PASSED SUCCESSFULLY! BACKEND IS 100% OPERATIONAL.")
        print("=" * 60)


if __name__ == "__main__":
    run_tests()
