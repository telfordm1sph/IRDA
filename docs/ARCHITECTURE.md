# IRDA System — Architecture Documentation

**Version:** 1.0  
**Date:** April 21, 2026  
**Project:** Incident Report & Disciplinary Action (IRDA) System

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Database Architecture](#5-database-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [IR Workflow Engine](#9-ir-workflow-engine)
10. [External Integrations](#10-external-integrations)
11. [Key Constants & Enums](#11-key-constants--enums)
12. [Configuration & Environment](#12-configuration--environment)

---

## 1. System Overview

IRDA is an enterprise-grade **Incident Report and Disciplinary Action management system**. It digitizes and enforces a multi-role approval workflow for employee violations — from initial IR creation, through HR validation, supervisor assessment, department head approval, and DA issuance, to final employee acknowledgment.

**Core Capabilities:**
- Multi-role IR workflow (Supervisor → HR → Department Head → HR Manager → DA)
- Disciplinary Action (DA) generation and acknowledgment chain
- Letter of Explanation (LOE) submission and tracking
- Violation code master data management
- Dashboard analytics (trends, code distribution, DA type breakdown)
- HR admin personnel assignment
- System maintenance mode toggle
- SSO-based authentication via Authify

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Backend Framework | Laravel | 12.0 |
| PHP | PHP | 8.2+ |
| Frontend Framework | React | 18.2 |
| SPA Bridge | Inertia.js | 2.0 |
| Build Tool | Vite | 6.2 |
| CSS Framework | Tailwind CSS | 3.2 |
| UI Components | DaisyUI | 5.0 |
| UI Primitives | Radix UI | Latest |
| Component Library | Ant Design | 6.0 |
| State Management | Zustand | 5.0 |
| Form Management | React Hook Form | 7.7 |
| Charts | Chart.js | Latest |
| Notifications | Sonner | Latest |
| Date Utilities | date-fns | Latest |
| Icons | Lucide React + Ant Design Icons | Latest |
| Testing | Pest | 3.8 |
| Code Formatting | Laravel Pint | Latest |
| Database | MySQL | Latest |
| Session/Cache | File / Database | — |
| Queue | Database | — |

---

## 3. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          Browser                            │
│              React 18 + Inertia.js (SPA)                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / Inertia Protocol
┌────────────────────────▼────────────────────────────────────┐
│                    Laravel 12 (PHP 8.2)                     │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Middleware│  │Controllers │  │ Services │  │Repositories│ │
│  │ Auth     │  │ IrController│  │ IrRequest│  │ IrRequest │ │
│  │ Admin    │  │ Dashboard  │  │ HrisApi  │  │ IrMaint.  │ │
│  │ Inertia  │  │ IrMaint.  │  │ DataTable│  │ SysStatus │ │
│  └──────────┘  └────────────┘  └──────────┘  └──────────┘  │
└──────────┬───────────────────────────┬──────────────────────┘
           │                           │
┌──────────▼──────────┐   ┌────────────▼───────────────────────┐
│   Application DB     │   │         External Services          │
│   MySQL              │   │  ┌──────────────┐  ┌───────────┐  │
│   - ir_requests      │   │  │ Authify (SSO)│  │ HRIS API  │  │
│   - ir_approvals     │   │  │ Port 8001    │  │ Employee  │  │
│   - ir_da_requests   │   │  │ Sessions DB  │  │ Data API  │  │
│   - ir_list          │   │  └──────────────┘  └───────────┘  │
│   - ir_appeals       │   └────────────────────────────────────┘
│   - ir_reasons       │
│   - ir_code_no       │   ┌────────────────────────────────────┐
│   - ir_admins        │   │      Masterlist DB (Read-Only)     │
│   - system_status    │   │   employee_masterlist (HR data)    │
└─────────────────────┘   └────────────────────────────────────┘
```

### Request Lifecycle

1. Browser sends HTTP request (or Inertia XHR)
2. `AuthMiddleware` validates SSO token → session check
3. Route dispatches to Controller
4. Controller calls Service → Repository → Eloquent Model
5. Response returned as Inertia page (initial: full HTML, subsequent: JSON)
6. React renders the component with props

---

## 4. Directory Structure

```
IRDA/
├── app/
│   ├── Constants/
│   │   └── IrConstants.php          # All IR/DA status codes and labels
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── AuthenticationController.php     # SSO logout
│   │   │   ├── DashboardController.php          # Dashboard stats
│   │   │   ├── DemoController.php               # Dev/test page
│   │   │   ├── IrController.php                 # Main IR workflow
│   │   │   ├── IrMaintenanceController.php      # HR admin panel
│   │   │   └── General/
│   │   │       ├── AdminController.php          # System admin mgmt
│   │   │       └── ProfileController.php        # User profile
│   │   ├── Middleware/
│   │   │   ├── AuthMiddleware.php               # SSO token validation
│   │   │   ├── AdminMiddleware.php              # Admin role check
│   │   │   └── HandleInertiaRequests.php        # Inertia shared data
│   │   └── Requests/
│   │       ├── Auth/LoginRequest.php
│   │       └── ProfileUpdateRequest.php
│   ├── Models/
│   │   ├── User.php                  # Laravel default (minimal use)
│   │   ├── IrRequest.php             # Main IR submission
│   │   ├── IrDaRequest.php           # Disciplinary action record
│   │   ├── IrApproval.php            # Per-role approval tracking
│   │   ├── IrAppeal.php              # Employee appeal records
│   │   ├── IrAdmin.php               # HR personnel assignments
│   │   ├── IrCodeNo.php              # Violation code master
│   │   ├── IrList.php                # Violations per IR
│   │   ├── IrReason.php              # LOE reasons
│   │   └── SystemStatus.php          # Maintenance mode
│   ├── Repositories/
│   │   ├── IrRequestRepository.php   # IR CRUD + filtering
│   │   ├── IrMaintenanceRepository.php
│   │   └── SystemStatusRepository.php
│   ├── Services/
│   │   ├── IrRequestService.php      # IR list, detail, role resolution
│   │   ├── IrMaintenanceService.php  # Admin & code CRUD
│   │   ├── HrisApiService.php        # Employee data API client
│   │   ├── SystemStatusService.php   # Maintenance mode logic
│   │   └── DataTableService.php      # Server-side table logic
│   └── Providers/
│       └── AppServiceProvider.php
├── bootstrap/
│   ├── app.php                       # App config & middleware registration
│   └── providers.php
├── config/
│   ├── database.php                  # Multiple DB connection definitions
│   └── (standard Laravel configs)
├── database/
│   ├── migrations/                   # Schema version history
│   ├── factories/
│   └── seeders/
├── resources/
│   ├── js/
│   │   ├── app.jsx                   # Inertia/React entry point
│   │   ├── Components/               # Reusable UI components
│   │   ├── Pages/                    # Inertia page components
│   │   ├── Layouts/                  # App shell layouts
│   │   ├── stores/                   # Zustand state stores
│   │   └── utils/                    # Utility functions
│   └── css/
│       └── app.css                   # Tailwind entry
├── routes/
│   ├── web.php                       # Route group includes
│   ├── auth.php                      # Login/logout routes
│   ├── irda.php                      # All IR workflow routes
│   └── general.php                   # Dashboard & admin routes
├── storage/
├── tests/
├── public/
├── .env / .env.example
├── composer.json
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 5. Database Architecture

### 5.1 Database Connections

The application uses **three separate MySQL databases**:

| Connection | Purpose | Access |
|---|---|---|
| `mysql` | Application data (IRs, DAs, approvals) | Read/Write |
| `masterlist` | HR employee master list | Read-Only |
| `authify` | SSO sessions | Read-Only |

### 5.2 Application Database Tables

#### `ir_requests` — Main IR Form
| Column | Type | Description |
|---|---|---|
| hash | string | Public-facing unique identifier |
| ir_status | int | Workflow status (0–4) |
| requestor_emp_no | int | Who filed the IR |
| subject_emp_no | int | Employee being reported |
| quality_violation | int | 1=Admin, 2=Quality |
| incident_date | date | When incident occurred |
| incident_description | text | Narrative |
| da_sign_date | date | Date HR signed for DA |

#### `ir_approvals` — Per-Role Approval Tracking
| Column | Type | Description |
|---|---|---|
| ir_request_id | FK | Reference to ir_requests |
| role | enum | SV, HR, DH, OD, HR_MNGR, DM, DA |
| emp_no | int | Approver employee number |
| status | int | 0=Pending, 1=Approved, 2=Disapproved |
| remarks | text | Optional feedback |
| approved_at | timestamp | When action was taken |

#### `ir_da_requests` — Disciplinary Action Record
| Column | Type | Description |
|---|---|---|
| ir_request_id | FK | Reference to ir_requests |
| da_status | int | DA workflow status (0–5) |
| da_type | int | 1=Verbal Warning … 5=Dismissal |
| hr_manager_signed_at | timestamp | HR Manager signature timestamp |
| sv_acknowledged_at | timestamp | Supervisor acknowledgment |
| dm_acknowledged_at | timestamp | Division Manager acknowledgment |
| emp_acknowledged_at | timestamp | Employee acknowledgment |

#### `ir_list` — Violations Per IR
| Column | Type | Description |
|---|---|---|
| ir_request_id | FK | Reference to ir_requests |
| ir_code_no_id | FK | Violation code |
| da_type | int | Disposition type for this violation |
| offense_count | int | Offense count (1st, 2nd, etc.) |

#### `ir_code_no` — Violation Code Master
| Column | Type | Description |
|---|---|---|
| code | string | e.g., "A-01" |
| description | text | Human-readable violation name |
| is_active | bool | Soft toggle |

#### `ir_admins` — HR Personnel Assignments
| Column | Type | Description |
|---|---|---|
| emp_no | int | HR employee (unique) |
| role | enum | 'hr' or 'hr_mngr' |
| is_active | bool | Active flag |

#### `ir_appeals` — Employee Appeals
| Column | Type | Description |
|---|---|---|
| ir_request_id | FK | Reference to ir_requests |
| content | text | Appeal content |
| filed_at | timestamp | When appeal was submitted |

#### `ir_reasons` — LOE Reasons
| Column | Type | Description |
|---|---|---|
| ir_request_id | FK | Reference to ir_requests |
| reason | text | Employee's explanation |
| submitted_at | timestamp | Submission timestamp |

#### `system_status` — Maintenance Mode
| Column | Type | Description |
|---|---|---|
| status | string | 'maintenance' or 'online' |
| updated_at | timestamp | Last change |

### 5.3 Read-Only Databases

**Masterlist DB (`employee_masterlist` table)**
- EMPLOYID, EMPNAME, JOB_TITLE, DEPARTMENT, ACCSTATUS
- Used for employee lookups, supervisory hierarchy

**Authify DB (`authify_sessions` table)**
- token, emp_id, emp_name, emp_dept_id, emp_jobtitle_id
- emp_prodline_id, emp_position_id, emp_station_id, shift_type, team, generated_at
- Used by `AuthMiddleware` to validate SSO tokens

---

## 6. Backend Architecture

### 6.1 Layered Architecture

```
Controller → Service → Repository → Eloquent Model → Database
                ↕
           HrisApiService (External HTTP)
```

**Controllers** handle HTTP input/output and delegate all logic.  
**Services** contain business logic, orchestrate calls across repositories and APIs.  
**Repositories** encapsulate database queries (Eloquent).  
**Models** define relationships and casts.

### 6.2 Controllers

#### `IrController` — Core IR Workflow
The largest controller, managing the entire IR lifecycle:

| Method | Route | Description |
|---|---|---|
| `index()` | GET /ir | My IR list |
| `staff()` | GET /ir/staff | Supervisor's staff IRs |
| `adminList()` | GET /ir/admin | HR global IR list |
| `create()` | GET /ir/create | Create form page |
| `store()` | POST /ir/store | Save new IR |
| `show()` | GET /ir/{hash} | View IR detail |
| `showDa()` | GET /ir/{hash}/da | View DA detail |
| `edit()` | GET /ir/{hash}/edit | Edit draft IR |
| `resubmit()` | POST /ir/{hash}/resubmit | Resubmit edited IR |
| `validateIr()` | POST /ir/{hash}/validate | HR validates IR |
| `submitLoe()` | POST /ir/{hash}/loe | Submit letter of explanation |
| `supervisorAssess()` | POST /ir/{hash}/assess | Supervisor assessment |
| `deptHeadReview()` | POST /ir/{hash}/dept-review | DH approval |
| `hrRevalidate()` | POST /ir/{hash}/revalidate | HR re-validation |
| `issueDa()` | POST /ir/{hash}/issue-da | Issue DA |
| `hrManagerApprove()` | POST /ir/{hash}/da/hr-approve | HR Manager signs |
| `svAcknowledge()` | POST /ir/{hash}/da/sv-ack | Supervisor acks |
| `dmAcknowledge()` | POST /ir/{hash}/da/dm-ack | Div. Manager acks |
| `employeeAcknowledge()` | POST /ir/{hash}/da/acknowledge | Employee acks |
| `bulkAction()` | POST /ir/bulk-action | Batch operations |

#### `DashboardController` — Admin Analytics
- Computes IR status counts, monthly trends (12 months), top violation codes, DA type distribution, violation type split

#### `IrMaintenanceController` — HR Admin Panel
- CRUD for IR admin assignments (add/remove HR personnel, toggle active)
- CRUD for violation codes (add/update/toggle)

#### `AdminController` — System Admin Management
- List, add, remove, change role of system administrators

### 6.3 Services

#### `HrisApiService`
Central client for all HRIS API calls. Authenticates with `X-Internal-Key` header.

| Method | Purpose |
|---|---|
| `fetchEmployeeName(id)` | Get employee display name |
| `fetchWorkDetails(id)` | Full work info (dept, prodline, status) |
| `fetchApprovers(id)` | Supervisor hierarchy chain |
| `fetchOperationDirector()` | Get current OD |
| `fetchActiveEmployees(query, page, per_page)` | Paginated search |
| `fetchDirectReports(id)` | Supervisor's team list |
| `isValidWorkData(data)` | Validate completeness of work data |

#### `IrRequestService`
- Resolves current user's role in context of a specific IR
- Determines which actions are available to the current user
- Builds paginated IR lists with filters
- Maps DB rows to frontend-friendly shapes

#### `DataTableService`
- Handles server-side pagination, sorting, and filtering for admin DataTable components

### 6.4 Routes

Routes are split across four files, all under the `APP_NAME` URL prefix:

| File | Prefix | Guard | Purpose |
|---|---|---|---|
| `auth.php` | `/` | — | Login/logout/unauthorized |
| `general.php` | `/` | AuthMiddleware | Dashboard, profile, admin mgmt |
| `irda.php` | `/` | AuthMiddleware | Full IR workflow |
| `web.php` | — | — | Includes all above + 404 fallback |

Admin routes (add/remove system admin) additionally require `AdminMiddleware`.  
Maintenance routes require `AuthMiddleware` + `is_active` HR admin check inside controller.

---

## 7. Frontend Architecture

### 7.1 Inertia.js SPA Pattern

IRDA uses **Inertia.js** to bridge Laravel routing with React rendering:
- Server-side routing (no React Router)
- Initial page load = full HTML with embedded JSON props
- Subsequent navigations = JSON response, React re-renders the page component
- Shared data (auth user, flash messages) injected via `HandleInertiaRequests`

### 7.2 Page Components

All Inertia pages live in `resources/js/Pages/`:

| Page | Path | Audience |
|---|---|---|
| Login | `Authentication/Login.jsx` | All |
| Dashboard | `Dashboard.jsx` | Admin |
| My IRs | `IR/IndexIR.jsx` | Employee |
| Staff IRs | `IR/StaffIR.jsx` | Supervisor |
| Admin IRs | `IR/AdminIR.jsx` | HR Admin |
| Create IR | `IR/CreateIR.jsx` | Supervisor |
| Edit IR | `IR/EditIR.jsx` | Requestor |
| View IR | `IR/ShowIR.jsx` | All roles |
| View DA | `IR/ShowDA.jsx` | All roles |
| Admin Maintenance | `IR/Maintenance/AdminMaintenance.jsx` | HR Admin |
| Code Maintenance | `IR/Maintenance/CodeMaintenance.jsx` | HR Admin |
| Admin List | `Admin/Admin.jsx` | System Admin |
| Add Admin | `Admin/NewAdmin.jsx` | System Admin |
| Profile | `Profile/Profile.jsx` | All |

### 7.3 Reusable Components

Located in `resources/js/Components/`:

| Component | Purpose |
|---|---|
| `DataTable.jsx` | Server-paginated sortable/filterable table |
| `Modal.jsx` | Generic modal dialog wrapper |
| `Pagination.jsx` | Page navigation controls |
| `NavBar.jsx` | Top navigation bar |
| `TextInput.jsx` | Styled form input |
| `LoadingScreen.jsx` | Full-screen loading overlay |
| `sidebar/SideBar.jsx` | Left sidebar layout |
| `sidebar/Navigation.jsx` | Sidebar nav links |
| `ThemeContext.jsx` | Dark/light theme provider |
| `ui/*` | Radix UI + Tailwind primitives |

### 7.4 IR-Specific Sub-Components

Located in `resources/js/Pages/IR/components/`:

| Component | Purpose |
|---|---|
| `ApprovalSection.jsx` | Renders multi-role approval timeline |
| `EmployeeSection.jsx` | Employee info card (subject + requestor) |
| `IncidentDetailsSection.jsx` | Incident date, description display |
| `ViolationSection.jsx` | List of violations with DA types |
| `IrStatusBadge.jsx` | Colored status badge |
| `PrintableDA.jsx` | Printable DA document layout |
| `IrConstants.js` | Frontend mirror of backend constants |
| `IrShared.jsx` | Shared UI utilities across IR pages |

### 7.5 Custom Hooks

Located in `resources/js/Pages/IR/hooks/`:

| Hook | Purpose |
|---|---|
| `useIrFilters.js` | Filter state for My IR list |
| `useAdminFilters.js` | Filter state for Admin IR list |
| `useIrForm.js` | IR create/edit form state & submission |
| `useEmployee.js` | Employee search autocomplete & work details |
| `useCodeNumbers.js` | Fetch and cache violation code list |

### 7.6 State Management

- **Zustand** (`stores/createFilterStore.js`) — Per-table filter state (search, status filter, date range, pagination)
- **React Hook Form** — Form state for IR create/edit
- **Inertia shared data** — Auth user, flash messages (server-injected)
- **Local component state** — Modal open/close, loading flags

---

## 8. Authentication & Authorization

### 8.1 Authentication Flow (SSO via Authify)

```
1. User visits IRDA → AuthMiddleware checks session
2. No valid session → redirect to Authify (port 8001) with ?redirect=
3. Authify authenticates → redirect back to IRDA with ?key=TOKEN
4. AuthMiddleware validates TOKEN against authify_sessions DB
5. Session stored: emp_data (emp_id, emp_name, dept, role, etc.)
6. SSO cookie set (7-day expiry)
7. On logout → session cleared + redirect to Authify /logout
```

### 8.2 Session Data Structure

```php
session('emp_data') = [
    'token'           => string,
    'emp_id'          => int,
    'emp_name'        => string,
    'emp_firstname'   => string,
    'emp_dept_id'     => int,
    'emp_jobtitle_id' => int,
    'emp_prodline_id' => int,
    'emp_position_id' => int,
    'emp_station_id'  => int,
    'shift_type'      => string,
    'team'            => string,
]
```

### 8.3 Authorization Roles

| Role | Table | Assignment | Permissions |
|---|---|---|---|
| System Admin | `admins` | Manual DB entry | Access admin pages, manage admins |
| HR | `ir_admins` (role='hr') | Via Admin Maintenance | Validate IR, revalidate, issue DA |
| HR Manager | `ir_admins` (role='hr_mngr') | Via Admin Maintenance | Sign DA |
| Supervisor | HRIS (emp_approver hierarchy) | Automatic via HRIS | Assess IR, ack DA |
| Department Head | HRIS | Automatic via HRIS | Review IR |
| Division Manager | HRIS | Automatic via HRIS | Ack DA |
| Operations Director | HRIS | Automatic via HRIS | Optional IR approval |
| Employee | HRIS (anyone) | Automatic | Submit LOE, ack DA |

### 8.4 Middleware

**`AuthMiddleware`**
1. Checks for SSO cookie or session
2. Validates token against `authify_sessions`
3. If token invalid → clears session, redirects to Authify login
4. If system in maintenance mode → blocks all access (except logout)

**`AdminMiddleware`**
1. Checks `admins` table for current `emp_id`
2. 403 if not found

---

## 9. IR Workflow Engine

### 9.1 IR Status Flow

```
[IR_PENDING (0)]
      │
      │ HR validates
      ▼
[IR_VALIDATED (1)]
      │
      │ Employee submits LOE
      │ Supervisor assesses
      │ HR revalidates
      │ Department Head reviews
      ▼
[IR_APPROVED (2)] ──── HR issues DA ────► DA Workflow
      │
      │ (if invalid)
      ▼
[IR_INVALID (3)]

[IR_CANCELLED (4)]  ← can be set at any point by HR
```

### 9.2 DA Status Flow

```
[DA_CREATED (0)]
      │ HR Manager signs
      ▼
[DA_FOR_HR_MANAGER (1)]
      │ Supervisor acknowledges
      ▼
[DA_FOR_SUPERVISOR (2)]
      │ Division Manager acknowledges
      ▼
[DA_FOR_DEPT_MANAGER (3)]
      │ Employee can acknowledge
      ▼
[DA_FOR_ACKNOWLEDGEMENT (4)]
      │ Employee acknowledges
      ▼
[DA_ACKNOWLEDGED (5)]  ← COMPLETE
```

### 9.3 Display Status (Frontend)

The `resolveDisplayStatus()` helper in `IrConstants.php` maps the combination of IR status, approval records, DA status, and LOE submission to 14 human-readable frontend statuses:

- Pending, Disapproved, Letter of Explanation, Under Assessment, Under Review, Approved, Invalid, Cancelled
- DA: Created, For HR Manager, For Supervisor Ack, For Dept Manager Ack, For Employee Ack, Acknowledged

### 9.4 Role Resolution Logic

`IrRequestService::resolveCurrentUserRole()` determines the acting user's role in a specific IR context:
- Checks `ir_admins` table → HR or HR_MNGR
- Checks HRIS approver chain → SV, DH, DM
- Checks OD → OD role
- Falls back to employee (requestor/subject)

`resolveAvailableActions()` then returns the list of actions the resolved role can take at the current IR/DA state.

---

## 10. External Integrations

### 10.1 Authify SSO

| Item | Detail |
|---|---|
| Host | 127.0.0.1:8001 |
| Login Endpoint | GET /login?redirect={callback_url} |
| Logout Endpoint | GET /logout?token={token}&redirect={url} |
| Token Validation | Direct DB query on authify_sessions table |
| Session Lifetime | 720 minutes (configurable in .env) |

### 10.2 HRIS API

| Item | Detail |
|---|---|
| Authentication | `X-Internal-Key` header |
| Employee Name | GET /api/employees/{id} |
| Work Details | GET /api/employees/{id}/work |
| Approvers Chain | GET /api/employees/{id}/work (includes hierarchy) |
| OD Lookup | GET /api/employees/operation-director |
| Employee Search | GET /api/employees/active?q=base64(json) |
| Direct Reports | GET /api/employees/direct-reports/{id} |

---

## 11. Key Constants & Enums

Defined in `app/Constants/IrConstants.php` and mirrored in `resources/js/Pages/IR/components/IrConstants.js`.

### IR Status
| Constant | Value | Meaning |
|---|---|---|
| `IR_PENDING` | 0 | Just created |
| `IR_VALIDATED` | 1 | HR has actioned |
| `IR_APPROVED` | 2 | Approved, DA phase |
| `IR_INVALID` | 3 | Disposition invalid |
| `IR_CANCELLED` | 4 | Cancelled |

### Approval Status
| Constant | Value | Meaning |
|---|---|---|
| `APPROVAL_PENDING` | 0 | Awaiting action |
| `APPROVAL_APPROVED` | 1 | Approved/signed |
| `APPROVAL_DISAPPROVED` | 2 | Rejected |

### DA Types
| Value | Label |
|---|---|
| 1 | Verbal Warning |
| 2 | Written Warning |
| 3 | 3-Day Suspension |
| 4 | 7-Day Suspension |
| 5 | Dismissal |

### Violation Types
| Value | Label |
|---|---|
| 1 | Administrative |
| 2 | Quality |

### Approval Roles
`SV`, `HR`, `DH`, `OD`, `HR_MNGR`, `DM`, `DA`

---

## 12. Configuration & Environment

### `.env` Key Variables

```env
APP_NAME=irda                    # Used as URL prefix
APP_TIMEZONE=Asia/Manila

# Application DB
DB_CONNECTION=mysql
DB_HOST=...
DB_DATABASE=...

# HR Masterlist DB (read-only)
MDB_HOST=...
MDB_DATABASE=...

# Authify SSO DB (read-only)
ADB_HOST=...
ADB_DATABASE=...

# HRIS API
HRIS_API_URL=...
HRIS_INTERNAL_KEY=...

# Authify SSO
AUTHIFY_URL=http://127.0.0.1:8001
AUTHIFY_REDIRECT=...

SESSION_LIFETIME=720
QUEUE_CONNECTION=database
```

### Tailwind & Theming
- Dark mode via CSS class (`.dark`)
- Custom font: Poppins
- Custom animation: `fade` keyframes
- DaisyUI themes: `light` / `dark`
- Theme stored in `ThemeContext` (React context + localStorage)

---

*End of Architecture Documentation*
