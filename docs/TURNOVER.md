# IRDA System — Turnover Documentation

**Version:** 1.0  
**Date:** April 21, 2026  
**Project:** Incident Report & Disciplinary Action (IRDA) System  
**Prepared by:** telfordm1sph

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [Current System State](#2-current-system-state)
3. [Environment Setup](#3-environment-setup)
4. [Running the Application](#4-running-the-application)
5. [User Roles & Access](#5-user-roles--access)
6. [IR Workflow Reference](#6-ir-workflow-reference)
7. [Admin Operations](#7-admin-operations)
8. [Known Issues & In-Progress Work](#8-known-issues--in-progress-work)
9. [Files Most Likely to Need Changes](#9-files-most-likely-to-need-changes)
10. [Dependencies & Services Required](#10-dependencies--services-required)
11. [Codebase Orientation](#11-codebase-orientation)
12. [Gotchas & Non-Obvious Behaviors](#12-gotchas--non-obvious-behaviors)

---

## 1. Project Summary

**IRDA** is an internal web application that manages the end-to-end lifecycle of employee **Incident Reports (IR)** and **Disciplinary Actions (DA)**. It replaces a manual/paper-based process with a structured multi-role digital workflow.

**Who uses it:**
- **Supervisors** — File IRs for their direct reports
- **HR Personnel** — Validate, revalidate, and issue DAs
- **Department Heads** — Review and approve IR dispositions
- **HR Managers** — Sign DA documents
- **Division Managers** — Acknowledge DAs
- **Employees** — Submit Letters of Explanation, acknowledge DAs
- **System Admins** — Manage system admin accounts

**Tech:** Laravel 12 + React 18 + Inertia.js, deployed with Vite for frontend assets. Authentication is handled by a separate **Authify** SSO service.

---

## 2. Current System State

As of April 21, 2026, the system is **actively in development**. The following are the current modified (uncommitted or recently committed) files:

| File | Status | Description |
|---|---|---|
| `app/Constants/IrConstants.php` | Modified | Status constants & display logic |
| `app/Http/Controllers/DashboardController.php` | Modified | Dashboard stats computation |
| `resources/js/Pages/Dashboard.jsx` | Modified | Admin dashboard charts/UI |
| `resources/js/Pages/IR/ShowIR.jsx` | Modified | IR detail view (largest component) |

**Recent Commits (most recent first):**
| Hash | Message |
|---|---|
| db747ec | fix the admin table filtering and creation of admin maintenance code number and admin list |
| 17f06ce | refactor irda action available |
| 28c4524 | Refactor and Action btn on show |
| c52bb06 | Table filtering |
| a3043c0 | Refactor codes |

Active branch: `main`

---

## 3. Environment Setup

### Prerequisites

| Tool | Version |
|---|---|
| PHP | 8.2+ |
| Composer | Latest |
| Node.js | 18+ (LTS) |
| npm | Latest |
| MySQL | 5.7+ or 8.0 |

### Step-by-Step Setup

**1. Clone the repository**
```bash
git clone <repo-url> IRDA
cd IRDA
```

**2. Install PHP dependencies**
```bash
composer install
```

**3. Install Node dependencies**
```bash
npm install
```

**4. Copy and configure environment**
```bash
cp .env.example .env
php artisan key:generate
```

**5. Configure `.env`**

Fill in all required values:

```env
APP_NAME=irda
APP_URL=http://localhost:8000
APP_TIMEZONE=Asia/Manila

# Application database
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=irda_db
DB_USERNAME=root
DB_PASSWORD=

# HR Masterlist DB (read-only)
MDB_HOST=
MDB_PORT=3306
MDB_DATABASE=
MDB_USERNAME=
MDB_PASSWORD=

# Authify SSO DB (read-only — same server as Authify)
ADB_HOST=
ADB_PORT=3306
ADB_DATABASE=
ADB_USERNAME=
ADB_PASSWORD=

# HRIS API
HRIS_API_URL=http://...
HRIS_INTERNAL_KEY=

# Authify SSO service
AUTHIFY_URL=http://127.0.0.1:8001
AUTHIFY_REDIRECT=http://localhost:8000/irda
```

**6. Run migrations**
```bash
php artisan migrate
```

> Note: Most IR tables (`ir_requests`, `ir_approvals`, `ir_da_requests`, etc.) are **not managed by migrations** in this app — they were inherited from a legacy schema. Only `users`, `cache`, `jobs`, `system_status`, and `ir_admins` are created via migrations.

**7. Build frontend assets**

For development (with hot reload):
```bash
npm run dev
```

For production:
```bash
npm run build
```

**8. Start the server**
```bash
php artisan serve
```

App is accessible at: `http://localhost:8000/{APP_NAME}` (e.g., `http://localhost:8000/irda`)

---

## 4. Running the Application

### Development

Run both in separate terminals:

```bash
# Terminal 1 — Laravel backend
php artisan serve

# Terminal 2 — Vite frontend (hot reload)
npm run dev
```

### Production Build

```bash
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Serve via Nginx/Apache pointing to `/public`.

### Queue Worker (if needed)

The app uses database-backed queues. Start a worker if jobs are queued:

```bash
php artisan queue:work
```

---

## 5. User Roles & Access

### Role Summary

| Role | How Assigned | What They Can Do |
|---|---|---|
| **System Admin** | Via `admins` table (AdminController) | Manage system admin accounts |
| **HR** | Via `ir_admins` table (role='hr') | Validate IR, issue DA, manage codes |
| **HR Manager** | Via `ir_admins` table (role='hr_mngr') | Sign DA documents |
| **Supervisor (SV)** | Automatically via HRIS approver chain | Create IR, assess, ack DA |
| **Department Head (DH)** | Automatically via HRIS | Review IR disposition |
| **Division Manager (DM)** | Automatically via HRIS | Acknowledge DA |
| **Operations Director (OD)** | Automatically via HRIS | Optional approval step |
| **Employee** | Any authenticated user | Submit LOE, acknowledge DA |

### Adding an HR Admin (HR or HR Manager)

1. Log in as System Admin
2. Go to **Admin** → **HR Maintenance** → **Admin Management**
3. Search for the employee by name or ID
4. Assign role: `hr` or `hr_mngr`
5. Save

This inserts a record into `ir_admins`.

### Adding a System Admin

1. Log in as an existing System Admin
2. Go to **Admin** → **Admin List** → **Add Admin**
3. Search and select the employee
4. They will appear in the admin list and have access to admin routes

---

## 6. IR Workflow Reference

### Full Lifecycle

```
STEP 1: Supervisor creates IR
  → IR status: IR_PENDING (0)

STEP 2: HR validates IR
  → HR approval record created (APPROVAL_APPROVED or APPROVAL_DISAPPROVED)
  → If disapproved: IR stays pending, can be edited and resubmitted
  → If approved: IR status → IR_VALIDATED (1)

STEP 3: Employee submits Letter of Explanation (LOE)
  → ir_reasons record created

STEP 4: Supervisor assesses
  → SV approval record created
  → Can approve or disapprove

STEP 5: HR revalidates
  → HR sets da_sign_date on ir_requests
  → Prepares for DH review

STEP 6: Department Head reviews
  → DH approval record created
  → If approved: IR status → IR_APPROVED (2)
  → If disapproved: IR status → IR_INVALID (3)

STEP 7: HR issues DA
  → ir_da_requests record created
  → DA status: DA_CREATED (0)

STEP 8: HR Manager signs DA
  → DA status: DA_FOR_HR_MANAGER (1)

STEP 9: Supervisor acknowledges
  → DA status: DA_FOR_SUPERVISOR (2)

STEP 10: Division Manager acknowledges
  → DA status: DA_FOR_DEPT_MANAGER (3)

STEP 11: Employee acknowledges
  → DA status: DA_ACKNOWLEDGED (5) — COMPLETE
```

### Key Business Rules

- An IR can only be edited when it is in `IR_PENDING` and has been disapproved by HR
- The LOE step is required before supervisor assessment
- DA can only be issued if IR is `IR_APPROVED`
- The DA acknowledgment chain is sequential: HR Manager → Supervisor → Division Manager → Employee
- Violation codes must be active (`is_active = true`) to appear in the IR creation form
- Each IR can have multiple violations (stored in `ir_list`), each with its own DA type

---

## 7. Admin Operations

### Violation Code Management

Go to **Admin → Code Maintenance**:
- **Add Code** — Add a new violation code (e.g., "A-01 — Tardiness")
- **Edit Code** — Update description
- **Toggle Active/Inactive** — Inactive codes will not appear in IR creation

### System Maintenance Mode

- Toggle via `SystemStatusService` (no UI exposed as of April 2026 — check if UI was added)
- When `system_status.status = 'maintenance'`, all authenticated routes redirect to a maintenance page
- Only logout is allowed during maintenance

### Database Backups

Recommended to back up the application DB (`ir_requests`, `ir_approvals`, `ir_da_requests`, `ir_list`, `ir_appeals`, `ir_reasons`, `ir_code_no`, `ir_admins`) regularly. The masterlist and authify DBs are managed by other systems.

---

## 8. Known Issues & In-Progress Work

Based on recent commits and modified files:

### Active Development Areas

1. **Dashboard (`DashboardController.php` + `Dashboard.jsx`)**
   - Stats and chart computation recently modified
   - Charts cover: IR status breakdown, monthly trends, top violations, DA types, violation types

2. **IR Detail View (`ShowIR.jsx`)**
   - Most recently active file (57KB, largest component)
   - Action buttons and approval workflow UI recently refactored
   - Watch for state management complexity — multiple conditional renders based on role + IR status

3. **IrConstants (`IrConstants.php`)**
   - `resolveDisplayStatus()` logic recently updated
   - Maps complex status combinations to display labels
   - Frontend mirror (`IrConstants.js`) must stay in sync when PHP side changes

4. **Admin Table Filtering (commit db747ec)**
   - Admin maintenance table filtering was recently fixed
   - Code number creation and admin list creation also addressed

### Areas to Be Careful With

- `ShowIR.jsx` and `ShowDA.jsx` are very large (57KB and 36KB respectively). Changes need careful review of all conditional rendering paths.
- Role resolution (`resolveCurrentUserRole()` in `IrRequestService`) is complex — test with multiple role accounts when changing.
- The `resolveDisplayStatus()` in `IrConstants.php` is the source of truth for all status badges. Logic bugs here affect the entire UI.
- IR tables not managed by migration — schema changes must be applied manually to the DB.

---

## 9. Files Most Likely to Need Changes

### High-Frequency Change Files

| File | Why |
|---|---|
| `app/Constants/IrConstants.php` | Any new status, role, or display label |
| `resources/js/Pages/IR/ShowIR.jsx` | IR detail view UI and actions |
| `resources/js/Pages/IR/ShowDA.jsx` | DA view UI and acknowledgment |
| `app/Http/Controllers/IrController.php` | New workflow actions |
| `app/Services/IrRequestService.php` | Role resolution, action availability |
| `resources/js/Pages/IR/components/IrConstants.js` | Must mirror PHP constants |

### Configuration Files

| File | Why |
|---|---|
| `.env` | All environment-specific settings |
| `routes/irda.php` | New IR routes |
| `routes/general.php` | New admin/dashboard routes |
| `app/Http/Middleware/AuthMiddleware.php` | SSO flow changes |

### Database

| Operation | How |
|---|---|
| New application table | Create migration: `php artisan make:migration` |
| Change IR workflow tables | Manual SQL — no migration for these |
| Add violation code | Via Code Maintenance UI or direct DB insert |

---

## 10. Dependencies & Services Required

The IRDA app **cannot function** without these external services running:

### Required Services

| Service | Purpose | Default |
|---|---|---|
| **Authify SSO** | Authentication & session tokens | http://127.0.0.1:8001 |
| **HRIS API** | Employee data, approver hierarchy | Configured in .env |
| **MySQL (App DB)** | IR/DA data storage | Configured in .env |
| **MySQL (Masterlist DB)** | Employee master records | Configured in .env (MDB_*) |
| **MySQL (Authify DB)** | SSO session validation | Configured in .env (ADB_*) |

### Degraded Behavior Without Services

| Service Down | Impact |
|---|---|
| Authify SSO | Nobody can log in; existing sessions expire |
| HRIS API | Cannot create IR (no employee search), cannot resolve roles |
| Masterlist DB | Employee name lookups fail |
| App DB | Application completely non-functional |
| Authify DB | Token validation fails → nobody can log in |

---

## 11. Codebase Orientation

### Where to Find Things

**"Where is the login logic?"**
→ `app/Http/Middleware/AuthMiddleware.php` (token validation)
→ `routes/auth.php` (routes)
→ `resources/js/Pages/Authentication/Login.jsx` (page)

**"Where is the IR creation form?"**
→ `resources/js/Pages/IR/CreateIR.jsx` (UI)
→ `resources/js/Pages/IR/hooks/useIrForm.js` (form logic)
→ `app/Http/Controllers/IrController.php` → `store()` (backend)

**"Where is the approval logic?"**
→ `app/Services/IrRequestService.php` → `resolveAvailableActions()`
→ `app/Http/Controllers/IrController.php` (individual action methods)
→ `resources/js/Pages/IR/ShowIR.jsx` (UI action buttons)

**"Where are the status codes defined?"**
→ `app/Constants/IrConstants.php` (PHP — authoritative)
→ `resources/js/Pages/IR/components/IrConstants.js` (JS mirror)

**"Where is the employee data coming from?"**
→ `app/Services/HrisApiService.php` (API client)
→ `resources/js/Pages/IR/hooks/useEmployee.js` (frontend search)

**"Where are the sidebar/nav links defined?"**
→ `resources/js/Components/sidebar/Navigation.jsx`

**"Where is DB configuration?"**
→ `config/database.php` (connection definitions)
→ `.env` (credentials)

**"Where do I add a new admin route?"**
→ `routes/general.php` (inside AdminMiddleware group)

**"Where do I add a new IR workflow action?"**
→ `routes/irda.php` (new route)
→ `app/Http/Controllers/IrController.php` (new method)
→ `app/Services/IrRequestService.php` (update `resolveAvailableActions()`)
→ `resources/js/Pages/IR/ShowIR.jsx` (add action button)

---

## 12. Gotchas & Non-Obvious Behaviors

### 1. URL Prefix from APP_NAME
All routes are prefixed with `APP_NAME` from `.env`. If `APP_NAME=irda`, the dashboard is at `/irda`, not `/`. Changing `APP_NAME` breaks all existing bookmarks.

### 2. IR Tables Not in Migrations
The core tables (`ir_requests`, `ir_approvals`, `ir_da_requests`, etc.) were inherited from a legacy system and **are not managed by Laravel migrations**. Schema changes must be done manually. The only tables in migrations are: `users`, `cache`, `jobs`, `system_status`, `ir_admins`.

### 3. IrConstants.php Has a JS Mirror
`app/Constants/IrConstants.php` has a manual JavaScript mirror at `resources/js/Pages/IR/components/IrConstants.js`. **If you change status codes or labels in PHP, you must also update the JS file.** There is no automated sync.

### 4. Frontend Status Resolution is Complex
`IrConstants::resolveDisplayStatus()` takes IR status, all approval records, LOE state, and DA state to produce a single display label. The 14 possible display states are not 1-to-1 with `ir_status`. When adding workflow steps, this function must be updated carefully.

### 5. Role Resolution Happens at Runtime
There is no persistent "role" column for supervisors, DH, DM, or OD in the application DB. Their roles are resolved dynamically each time by calling the HRIS API and checking the approver hierarchy. If the HRIS API is down, role resolution fails silently or errors.

### 6. Employee Hash vs ID
IRs are publicly identified by a `hash` field (not the auto-increment `id`) in URLs. This is intentional to avoid enumeration. Always use `hash` in routes and URLs — never the raw `id`.

### 7. Authify Token Expires
The SSO cookie has a 7-day lifetime, but the session lifetime in `.env` is 720 minutes (12 hours). Users may see their session expire mid-work. The `AuthMiddleware` handles this by redirecting to Authify login.

### 8. Dark/Light Theme
Theme is stored in browser `localStorage` and a React context (`ThemeContext`). The Tailwind `dark` class is toggled on the `<html>` element. If DaisyUI theme breaks, check `ThemeContext.jsx` and `tailwind.config.js`.

### 9. Maintenance Mode Blocks Everyone
When `system_status.status = 'maintenance'`, `AuthMiddleware` blocks **all** requests (including admin routes). Only the logout route is allowed. To restore access, update the DB directly: `UPDATE system_status SET status = 'online'`.

### 10. No Email/Notification System
As of April 2026, there are **no email notifications** or push notifications in the system. Users must manually check their IRs. Mail is configured to `log` driver in development.

### 11. ShowIR.jsx is Very Large
`ShowIR.jsx` is ~57KB. It renders different UI based on 7+ role conditions and multiple status states. Before modifying it, read the entire component top to bottom to understand all the conditional branches. Prefer extracting logic into sub-components or hooks rather than adding more inline logic.

---

*End of Turnover Documentation*
