# CampusFix – Admin Dashboard & Operations Analytics

Professional administrative and facility operations module for the **CampusFix** university incident management platform.

Built with **React**, **Tailwind CSS**, **React Router**, **Recharts**, and **Lucide React**.

---

## 1. Module Overview & Architecture

This module provides university facility managers, estates officers, and central operations authorities with real-time command of student maintenance reports, department dispatching, resolution workflows, and deduplication intelligence.

```
frontend/src/
├── components/
│   └── admin/
│       ├── AdminSidebar.jsx       # Deep navy responsive navigation sidebar & API health indicator
│       ├── StatsCard.jsx          # KPI metric cards with trends, accent bars & variants
│       ├── ComplaintTable.jsx     # High-density university operations table with inline actions
│       ├── StatusBadge.jsx        # Standardized Status, Priority & Department badges
│       ├── AnalyticsCharts.jsx    # Recharts: Category Bar, Status Donut, Dept Stack, Location
│       └── index.js               # Barrel export for admin components
└── pages/
    └── admin/
        ├── AdminDashboard.jsx     # Executive overview, KPI cards, recent incidents & triage
        ├── ComplaintManagement.jsx# Faceted search, multi-filter registry, CSV export
        ├── ComplaintDetails.jsx   # In-depth dossier, status transitions, resolution notes & audit log
        ├── Analytics.jsx          # Empirical charts, resolution rate metrics & category matrix
        ├── DepartmentManagement.jsx# Division workload cards, unassigned triage & dispatch
        ├── DuplicateDetection.jsx # Text & location similarity detection (Levenshtein + Jaccard)
        ├── AdminRoutes.jsx        # Modular plug-and-play router for easy App.jsx integration
        ├── adminApi.js            # Live API client (http://localhost:8000/api) with resilient fallback
        ├── duplicateHelper.js     # Text tokenization, location proximity & duplicate scoring
        └── index.js               # Barrel export for admin pages
```

---

## 2. Integration into `App.jsx`

To integrate this module without modifying any student portal routes or overwriting configuration, add the modular `AdminRoutes` or individual route imports to your existing `App.jsx`:

### Option A: Clean Modular Route (Recommended)

```jsx
import { AdminRoutes } from './pages/admin/AdminRoutes';

function App() {
  return (
    <Routes>
      {/* Existing Student Portal Routes (untouched) */}
      <Route path="/" element={<StudentHome />} />
      <Route path="/submit" element={<SubmitComplaint />} />
      <Route path="/my-complaints" element={<StudentComplaints />} />

      {/* Admin Module Subtree */}
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  );
}
```

### Option B: Direct Route Definitions

```jsx
import {
  AdminDashboard,
  ComplaintManagement,
  ComplaintDetails,
  Analytics,
  DepartmentManagement,
  DuplicateDetection
} from './pages/admin';

// Inside your <Routes>:
<Route path="/admin" element={<AdminDashboard />} />
<Route path="/admin/complaints" element={<ComplaintManagement />} />
<Route path="/admin/complaints/:id" element={<ComplaintDetails />} />
<Route path="/admin/departments" element={<DepartmentManagement />} />
<Route path="/admin/duplicates" element={<DuplicateDetection />} />
<Route path="/admin/analytics" element={<Analytics />} />
```

---

## 3. Backend API Integration

The API client is located in [adminApi.js](file:///c:/Users/user/OneDrive/Campus%20Fix%20Admin%20Dashboard/frontend/src/pages/admin/adminApi.js) and is configured to communicate with:

**Base URL**: `http://localhost:8000/api`

### Configured Endpoints:

| Method | Endpoint | Description | Payload / Response |
| :--- | :--- | :--- | :--- |
| `GET` | `/complaints` | Fetch all complaints | Array of complaint objects |
| `GET` | `/complaints/{id}` | Fetch individual complaint dossier | Single complaint object |
| `GET` | `/analytics` | Fetch operations analytics | Totals, category breakdown, status breakdown, location counts |
| `GET` | `/departments` | Fetch university departments | Array of department records, heads & capacities |
| `PATCH` | `/complaints/{id}/status` | Update complaint status | `{ "status": "In Progress" \| "Resolved", "resolutionNotes": "..." }` |
| `PATCH` | `/complaints/{id}/assign` | Assign department division | `{ "department": "Plumbing & Water Works" }` |

> [!NOTE]
> **Resilient Offline Fallback**: If the backend server at `http://localhost:8000/api` is still booting up or unreachable during frontend testing, `adminApi.js` seamlessly serves initial seeded university data and persists interactive updates in local cache. Once the backend is online, live requests are dispatched automatically.

---

## 4. Key Functional Modules

### 4.1 Admin Dashboard (`AdminDashboard.jsx`)
- **KPI Stats Cards**: Total Complaints, Pending Triage, In Progress, Resolved.
- **Priority Distribution Widget**: Live visual progress bars for Urgent, High, Medium, and Low incidents.
- **Live Pipeline Chart**: Compact Recharts status donut.
- **Recent Complaints Registry**: Quick inspection of latest campus complaints with inline status actions.
- **Duplicate Alert Banner**: Proactively warns admins if open complaints share text or locations.

### 4.2 Complaint Management (`ComplaintManagement.jsx`)
- **Full Data Table**: ID, Student (Name + ID + Avatar), Title, Category, Location, Priority, Assigned Department, Status, Date.
- **Multi-Facet Filters**:
  - Live search across ID, Title, Student name, Description, Location.
  - Category dropdown.
  - Priority dropdown.
  - Status quick pills + dropdown.
  - Department filter (including "Unassigned Only").
- **CSV Export**: Instant download of filtered incident table with university formatting.
- **Deep-linking**: Filter states synchronize seamlessly with browser URL query parameters (`?status=Pending&priority=Urgent`).

### 4.3 Complaint Details & Status Workflow (`ComplaintDetails.jsx`)
- **Inspection Dossier**: Full incident report with location tags, submission timestamps, and student profile.
- **Status Transition Workflow**:
  - `Pending` $\to$ `In Progress` $\to$ `Resolved`.
  - Resolution & Maintenance notes field with technical audit logging.
  - Dispatches `PATCH /complaints/{id}/status` to the backend.
- **Department Dispatch**:
  - Assign to any active department division.
  - Dispatches `PATCH /complaints/{id}/assign` to the backend.
- **Audit Timeline**: Chronological log of state transitions with author and timestamps.
- **Duplicate Warning**: In-page similarity warning banner linking directly to matching complaints.

### 4.4 Department Operations (`DepartmentManagement.jsx`)
- **Department Division Cards**: Workload, contact info, head of department, active tickets, resolution velocity.
- **Unassigned Incident Triage**: Dedicated quick-access queue for unassigned student reports.
- **Interactive Assignment**: Reassign tickets directly from the department registry.

### 4.5 Recharts Analytics (`Analytics.jsx` & `AnalyticsCharts.jsx`)
- **Category-Wise Bar Chart**: Visualizes complaint density across infrastructure types.
- **Complaint Status Pie Chart**: Donut chart with live percentage breakdown and center counter.
- **Department-Wise Stacked Bar Chart**: Workload breakdown (Pending, In Progress, Resolved) per department.
- **Location Hotspot Chart**: Identifies campus zones with the highest incident frequencies.
- **Category Performance Matrix**: Tabular breakdown of SLA metrics, volume, and resolution rates.

### 4.6 Duplicate Detection Engine (`DuplicateDetection.jsx` & `duplicateHelper.js`)
- **Text & Location Similarity**:
  - Tokenization, stop-word elimination, Jaccard token overlap.
  - Normalized Levenshtein distance on incident titles.
  - Location token matching (e.g. `Hostel Block B, Floor 3` vs `Hostel Block B, 3rd Floor`).
- **Safety Policy**: Strictly complies with the rule: **Do not automatically delete or merge complaints**.
- **Side-by-Side Comparison**: Highlights shared keywords, confidence score, and allows marking as reviewed.

---

## 5. Design Specifications

- **Color Palette**:
  - Background & Shell: Deep Navy Blue (`#020617`, `#0f172a`, `#1e293b`).
  - Surfaces: Slate-50, crisp white cards (`bg-white border border-slate-200`).
  - Accents: University Blue (`#2563eb`), Amber (`#f59e0b`), Emerald (`#10b981`), Rose (`#f43f5e`).
- **Typography**: Clean tabular fonts, monospaced ID tags (`#CMP-2026-1041`), clear visual hierarchy.
- **Responsiveness**: Persistent desktop sidebar, collapsible mobile navigation drawer, and horizontal-scroll data tables.
