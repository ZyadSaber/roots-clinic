# Roots Clinic — Application Workflow Map

## Overview

The clinic workflow runs through **6 sequential phases**. Every patient visit starts at Auth and exits through the Ops dashboards. The phases are: Auth → Reception → Clinical → EHR/Records → Billing → Ops.

---

## Phase 1 — Auth

**Entry point for all staff.**

- Staff log in with a `username` credential via Supabase Auth
- JWT is issued (8-hour expiry), session managed via `onAuthStateChange` in `StoreInitializer`
- `StoreInitializer` hydrates Redux in two stages:
  1. Fast: from Supabase `user_metadata`
  2. Authoritative: overwritten with data from the `staff` table
- Role is resolved from the `staff` table → gates module access via the `permissions` JSONB column

| Role | Accessible modules |
|---|---|
| `admin` | All 9 modules |
| `doctor` | Appointments, Records, Radiology |
| `receptionist` | Appointments, Patients |
| `finance` | Finance, Inventory |

---

## Phase 2 — Reception

**Managed by receptionist (or admin).**

### 2a. Patient entry — two paths

```
New patient                    Existing patient
    │                               │
Register in /patients          Search by name / PAT-code
PAT-XXXX auto-generated             │
    └──────────────┬───────────────┘
                   ▼
           Select patient record
```

- New patient registration writes to `patients` table
- `patient_code` is generated via a PostgreSQL sequence (`PAT-0001` format)
- Patient alerts (`patient_alerts`) are visible immediately on selection

### 2b. Appointment booking

- Receptionist opens the booking form (can be triggered from the patients page via Redux `bookingPatient` state — no URL params)
- Selects: doctor, date/time, procedure type, priority (`normal` / `urgent`), notes
- Appointment written to `appointments` table with status `pending`
- Available doctors are pulled from Redux `availableDoctors` (loaded once, reused cross-module)

### 2c. Day-of flow

```
pending → confirmed → arrived → [clinical phase]
```

- `arrived` = patient physically in waiting room; `arrived_at` timestamp recorded
- Receptionist view shows the live waiting room list, filterable by status

---

## Phase 3 — Clinical

**Managed by doctor (or receptionist on behalf).**

```
arrived
   │
   ▼
in_chair  ←── receptionist calls patient in
   │
   ├── (optional) Radiology sub-flow
   │       Upload X-ray image → radiology_assets
   │       Link to visit_id
   │
   ▼
completed  ←── doctor marks done; completed_at recorded
```

- `in_chair` status signals doctor is actively with patient — prevents double-booking and enables waiting time vs. treatment time metrics
- Doctor works in the appointments detail view (doctor-facing view, planned future page)
- Radiology assets are uploaded to storage, URL stored in `radiology_assets` with `image_type` (panoramic / bitewing / periapical)

---

## Phase 4 — EHR / Records

**Written by doctor on appointment completion.**

A `visit_record` row is created and linked to:
- `appointment_id` → the completed appointment
- `patient_id` → the patient
- `doctor_id` → the treating doctor

### Fields captured

| Field | Description |
|---|---|
| `diagnosis` | Clinical diagnosis text |
| `procedure_done` | Procedure name/code |
| `procedure_notes` | Detailed clinical notes (supports voice-to-text via Groq Whisper → Gemini) |
| `prescription` | Medication and dosage |
| `follow_up_date` | Next appointment suggestion |

### Inventory deduction (parallel)

- Supplies used in the procedure are logged in `inventory_movements` (negative quantity = usage)
- `inventory_items.current_stock` is updated
- If stock drops to or below `reorder_level`, item status updates to `low_stock` / `critical` / `out_of_stock`

---

## Phase 5 — Billing

**Managed by finance staff.**

```
visit_record exists
       │
       ▼
Create invoice (invoices table)
  - invoice_number: INV-YYYY-XXXX
  - subtotal, discount, tax, total
  - outstanding = total − amount_paid (computed column)
       │
       ├── Add line items (invoice_items)
       │     per service / procedure / doctor
       │
       ├── (optional) Insurance claim (insurance_claims)
       │     Submit → track status: pending / submitted / approved / partial / rejected
       │
       ▼
Record payment (payments table)
  - payment_ref: PAY-YYYY-XXXX
  - method: cash / card / insurance / bank_transfer
  - Updates invoice.amount_paid → recomputes outstanding
  - Invoice status: draft → pending → partial → paid / overdue
```

---

## Phase 6 — Ops Outputs

**All modules feed three dashboard endpoints.**

### Command Center (`/dashboard`)
- Today's appointments count by status
- Revenue KPIs (uses `monthly_revenue` view)
- Patient volume trends
- Low stock alerts (uses `low_stock_items` view)
- Built last — aggregates all other modules

### Finance Dashboard (`/finance`)
- Revenue vs. expenses over time (Recharts)
- Breakdown by `expense_category`
- Outstanding invoices, overdue tracking
- Insurance claim status summary
- Billing lives as a tab inside this route (no separate `/billing` route)

### Inventory (`/inventory`)
- Stock levels per item and category
- `low_stock_items` view surfaces critical items
- Movement history (purchases, usage, returns, adjustments)
- Reorder alerts

---

## Data Flow (Technical)

```
User action (UI)
       │
       ▼
Redux dispatch (UI state update)
       │
       ▼
React Query mutation
       │
       ▼
Next.js Server Action  ←── auth check (session validated here — only security boundary)
       │
       ▼
lib/pg helper (queryOne / queryMany / execute / executeTransaction)
       │
       ▼
Supabase PostgreSQL
       │
       ▼
invalidateQueries → React Query refetch → components re-render
```

### Key patterns

- **Server actions are the security gate** — every action touching sensitive data validates the session first
- **`executeTransaction`** — passes a single `PoolClient` to ensure all queries in a transaction share one connection. `execute()` must never be called inside a transaction block
- **Two-layer rollback** — if DB insert fails after `auth.users` creation, call `supabaseAdmin.auth.admin.deleteUser(authId)` to prevent orphaned auth records
- **Polling** — `refetchInterval` used as a practical real-time substitute for WebSockets
- **`clinic_id`** — always passed as a query parameter (even if hardcoded to one UUID now) so the SaaS multi-tenant pivot is a config change, not a rewrite

---

## Status State Machine

```
Appointment statuses:

pending ──► confirmed ──► arrived ──► in_chair ──► completed
                │                                      
                └──► cancelled                         
                
Any status ──► no_show
```

```
Invoice statuses:

draft ──► pending ──► partial ──► paid
                  └──► overdue
                  └──► cancelled
```

---

## Module Build Order (Remaining)

```
records (EHR detail view)
    │
    ▼
radiology
    │
    ▼
inventory
    │
    ▼
finance (+ billing as tab)
    │
    ▼
dashboard (last — aggregates everything)
```
