# CampusFix - AI-Powered Campus Complaint Management System

CampusFix is a university maintenance and student complaint management system designed to streamline issue reporting, triage, and resolution across campus facilities, hostels, departments, and labs.

Built with React, Vite, Tailwind CSS, Lucide Icons, and Recharts, it features smart AI classification and routing, automated department assignment, status timeline tracking, and an integrated Campus AI Assistant.

---

## 🚀 Key Features

- **Modern SaaS University Dashboard**: Clean, responsive, and accessible interface built with deep navy brand colors and light grey surfaces.
- **Role-Based Authentication**: Support for Student and Admin portals with JWT token persistence and 1-click Demo mode.
- **Smart AI Complaint Triage**:
  - Automatically analyzes complaint title and description (`POST /ai/analyze`).
  - Suggests category, priority level, and target department.
  - Summarizes the issue and allows student confirmation prior to submission.
- **Real-Time Complaints Queue**:
  - Filter by Status (Pending, In Progress, Resolved, Rejected).
  - Filter by Priority (Urgent, High, Medium, Low) and Category.
  - Fast search across ticket ID, title, and room/location.
- **Detailed Ticket View**:
  - Live status history timeline with completion milestones.
  - Assigned department and technician contact details.
  - Official technician resolution notes.
- **Campus AI Assistant**:
  - Real-time interactive AI chatbot powered by backend endpoint `POST /ai/chat`.
  - Suggested FAQs for quick inquiries regarding maintenance protocols, emergency contacts, and turnaround times.
- **Modular Admin Isolation**:
  - Admin dashboard pages are placed in `src/pages/admin/` to allow parallel development without impacting the student module.

---

## 🛠️ Technology Stack

- **Frontend Library**: React 18
- **Build Tool**: Vite 6
- **Routing**: React Router 6
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **HTTP Client**: Axios

---

## 📂 Project Structure

```text
CAMPUS FIX FRONTEND DEVELOPER/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .env
├── README.md
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── services/
    │   └── api.js                   # Centralized API logic & endpoints contract
    ├── context/
    │   └── AuthContext.jsx          # User authentication and session management
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx           # Top navigation with role badge & user menu
    │   │   ├── Sidebar.jsx          # SaaS sidebar with campus emergency desk
    │   │   └── StudentLayout.jsx    # Responsive layout wrapper
    │   ├── ui/
    │   │   ├── StatusBadge.jsx      # Color-coded status badges
    │   │   ├── PriorityBadge.jsx    # Priority indicators
    │   │   ├── StatCard.jsx         # Metric summary cards
    │   │   ├── LoadingSpinner.jsx   # Consistent loading indicators
    │   │   ├── SkeletonLoader.jsx   # Skeleton shimmer states
    │   │   ├── EmptyState.jsx       # Zero-data placeholders
    │   │   └── AlertBanner.jsx      # Error, warning, and info banners
    │   └── auth/
    │       └── ProtectedRoute.jsx   # Route access guard
    └── pages/
        ├── auth/
        │   └── LoginPage.jsx        # Authentication & Registration
        ├── student/
        │   ├── DashboardPage.jsx    # Student dashboard with live metrics & chart
        │   ├── SubmitComplaintPage.jsx # Complaint submission with AI analysis
        │   ├── MyComplaintsPage.jsx # Ticket list with search and filters
        │   ├── ComplaintDetailsPage.jsx # Detailed ticket view with status history
        │   └── AIAssistantPage.jsx  # Interactive Campus AI Chatbot
        └── admin/
            └── AdminDashboard.jsx   # Isolated admin module
```

---

## 📡 API Contract & Endpoints

Base URL: `http://localhost:8000/api` (Configurable via `VITE_API_BASE_URL`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register new student or admin account |
| `POST` | `/login` | Authenticate user & retrieve JWT token |
| `POST` | `/ai/analyze` | AI analysis to classify category, priority & department |
| `POST` | `/complaints` | Submit a new campus complaint |
| `GET` | `/complaints` | Fetch list of complaints |
| `GET` | `/complaints/{id}` | Retrieve single complaint with resolution notes & history |
| `POST` | `/ai/chat` | Send prompt to Campus AI Assistant |

---

## ⚙️ Installation & Running the App

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` (already created by default):
```bash
cp .env.example .env
```
Ensure `VITE_API_BASE_URL` points to your active backend (default: `http://localhost:8000/api`).

### 4. Start Development Server
```bash
npm run dev
```
The frontend will start on `http://localhost:5173`.

### 5. Build for Production
```bash
npm run build
```
The optimized production bundle will be generated in `dist/`.

---

## 🔑 Demo Access
On the login page, you can either:
1. Enter your registered credentials, or
2. Click **"Demo Student"** or **"Demo Admin"** for 1-click test access without needing backend authentication seeded.

