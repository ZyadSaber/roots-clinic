# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev       # Start Next.js dev server (localhost:3000)
bun run build     # Build for production (standalone output)
bun start         # Run production server
```

ESLint is configured but has no dedicated script — run `npx eslint .` manually.

Docker runs on port 9090 with a multi-stage Bun → Node 24-alpine build.

## Architecture

**Roots Clinic** is a full-stack medical clinic management system (dental/healthcare) built with Next.js App Router.

### Core Stack
- **Framework**: Next.js 16 (App Router) + React 19, React Compiler enabled
- **Database**: PostgreSQL on Supabase, accessed directly via `pg` connection pool (`src/lib/pg.ts`)
- **Auth**: Supabase Auth — username-based login (looks up email from `staff_with_email` DB view, then signs in via Supabase)
- **State**: Redux Toolkit (auth, doctors, patients, appointments, staff, UI) + React Query (server data cache, 60s stale)
- **UI**: shadcn/ui + Radix UI + Tailwind CSS v4
- **i18n**: next-intl with `ar` (RTL) and `en` locales; all routes are under `src/app/[locale]/`

### Data Flow
```
User action (UI)
  → Redux dispatch (UI state)
  → React Query mutation
  → Next.js Server Action  ← session validated here (only security boundary)
  → lib/pg helper (queryOne / queryMany / execute / executeTransaction)
  → Supabase PostgreSQL
  → invalidateQueries → refetch → re-render
```

- **Server actions are the only auth gate** — every action touching sensitive data must validate the session
- `executeTransaction` passes a single `PoolClient`; never call `execute()` inside a transaction block
- Two-layer rollback: if DB insert fails after `auth.users` creation, call `supabaseAdmin.auth.admin.deleteUser(authId)` to prevent orphaned auth records
- `clinic_id` is always passed as a query parameter (hardcoded UUID now) so multi-tenant pivot is a config change, not a rewrite

### Auth & Permissions
- `StoreInitializer` hydrates Redux in two stages: fast (from Supabase `user_metadata`) then authoritative (overwritten from `staff` table)
- JWT expiry: 8 hours, session managed via `onAuthStateChange`
- `AuthUser` carries `permissions: UserPermissions | null` from the `staff.permissions` JSONB column

| Role | Accessible modules |
|------|-------------------|
| `admin` | All 9 modules |
| `doctor` | Appointments, Records, Radiology |
| `receptionist` | Appointments, Patients |
| `finance` | Finance, Inventory |

### Middleware (`src/proxy.ts`)
Handles Supabase session persistence (SSR), i18n locale routing, and redirect logic (unauthenticated → login, authenticated on login → /welcome).

### Key Directories
| Path | Purpose |
|------|---------|
| `src/app/[locale]/` | Page routes (appointments, dashboard, doctors, finance, inventory, patients, radiology, records, users) |
| `src/app/[locale]/appointments/[id]/` | Doctor-specific appointments page (doctor_id as `id`) |
| `src/services/` | All server actions (data operations per domain) |
| `src/services/visits.ts` | `getVisitByAppointmentId`, `getRadiologyByVisitId`, `updateVisitRecord` |
| `src/store/slices/` | Redux slices: auth, doctors, patient, appointment, staff, uiShared |
| `src/components/` | UI components organized by domain + `shared/` + `ui/` (shadcn base) |
| `src/components/appointments/AppointmentTabs.tsx` | Reusable list + calendar tabs (shared by admin and doctor pages) |
| `src/components/appointments/StartVisitDialog.tsx` | Confirmation dialog; atomically sets `in_chair` + creates `visit_records` row |
| `src/components/appointments/VisitInProgressModal.tsx` | Locked session modal: clinical EHR form + radiology viewer; cannot be dismissed |
| `src/lib/` | Standalone helpers (`pg.ts`, `timeSlots.ts`, `localize.ts`, etc.) |
| `src/lib/supabase/` | Supabase client (server + browser variants) |
| `src/types/` | TypeScript types per domain |
| `src/validation/` | Zod schemas — one file per domain (patients, appointments, staff, doctors, specialties) |
| `DB/` | Full PostgreSQL schema (`roots_clinic_schema_final.sql`) |

### Database Patterns
- Soft delete: patients with related records set `is_active = FALSE` rather than hard-deleted
- Transactional operations for multi-step mutations — use `executeTransaction`
- Views: `patients_full`, `staff_with_email`, `monthly_revenue`, `low_stock_items`
- Key enums: `staff_role`, `appointment_status`, `invoice_status`, `payment_status`, `stock_status`, `doctor_status`
- `patient_code` auto-generated via PostgreSQL sequence (`PAT-0001` format); `invoice_number` = `INV-YYYY-XXXX`; `payment_ref` = `PAY-YYYY-XXXX`

## Clinic Workflow (6 phases)

Understanding these phases is essential for building any new feature correctly.

### Phase 1 — Auth
Staff log in with username → Supabase Auth → Redux hydrated → role-gated module access.

### Phase 2 — Reception
- **Patient entry**: new patients registered in `/patients` (writes to `patients` table), existing patients searched by name or `PAT-XXXX` code
- **Appointment booking**: doctor + date/time + procedure type + priority (`normal`/`urgent`) + notes → `appointments` table with status `pending`
- Booking can be triggered from the patients page via Redux `bookingPatient` state (no URL params)
- **Day-of flow**: `pending → confirmed → arrived` (receptionist records `arrived_at`)

### Phase 3 — Clinical
`arrived → in_chair → completed`
- **Start Visit**: doctor clicks "Start Visit" on an `arrived` appointment → `StartVisitDialog` confirms → atomic transaction sets status to `in_chair` and inserts a `visit_records` row
- `in_chair` auto-opens `VisitInProgressModal` (locked — cannot be dismissed without action)
  - Modal persists across page refresh: if any appointment is still `in_chair` on mount, modal re-opens automatically
  - Two-column layout: **Clinical Notes** (diagnosis, procedure done, procedure notes, prescription, follow-up date) | **Radiology** (images polled every 15 s)
  - Actions: **Send for Radiology** (dismisses modal temporarily, stores appointment ID in `localStorage`) | **End Visit & Save** (saves EHR fields + marks `completed`)
- Radiology sub-flow: upload X-ray → `radiology_assets` (types: panoramic / bitewing / periapical), linked to `visit_id`; images appear live in modal
- `completed_at` recorded when doctor ends visit

### Phase 4 — EHR / Records
`visit_records` row created when visit starts (`in_chair`), linked to `appointment_id`, `patient_id`, `doctor_id`. Fields filled during the visit: diagnosis, procedure_done, procedure_notes, prescription, follow_up_date. Saved incrementally via **Save Notes** or all-at-once on **End Visit**.

Parallel: supplies used → `inventory_movements` (negative qty) → `inventory_items.current_stock` updated → triggers `low_stock` / `critical` / `out_of_stock` status if at or below `reorder_level`.

### Phase 5 — Billing
`visit_record` → invoice (`invoices` + `invoice_items`) → optional insurance claim (`insurance_claims`, statuses: pending / submitted / approved / partial / rejected) → payment recorded (`payments`). Invoice `outstanding` is a computed column (`total − amount_paid`).

Invoice status machine: `draft → pending → partial → paid` / `overdue` / `cancelled`

### Phase 6 — Ops Dashboards
- `/dashboard` — today's appointments by status, revenue KPIs (`monthly_revenue` view), patient volume, low-stock alerts (`low_stock_items` view). Built last — aggregates all modules.
- `/finance` — revenue vs. expenses (Recharts), outstanding/overdue invoices, insurance claim summary. Billing lives as a tab here (no separate `/billing` route).
- `/inventory` — stock levels, movement history, reorder alerts.

### Appointment status machine
```
pending → confirmed → arrived → in_chair → completed
               └──► cancelled
any status ──► no_show
```

## Module Build Order (Remaining)
```
radiology (upload UI) → records (EHR detail/history view) → inventory → finance (+ billing tab) → dashboard
```

## Doctor Appointments Flow (Implemented)
`/appointments/[doctorId]` is the doctor-facing view:
- Lists confirmed / arrived / in_chair / completed appointments for that doctor on the selected date
- Stat cards: confirmed, arrived, in_chair, completed
- `StartVisitDialog` on `arrived` rows → atomic `in_chair` + `visit_records` creation
- `VisitInProgressModal` auto-opens for any `in_chair` appointment; locked until End Visit or Send for Radiology
- `pendingRadiology` set persisted in `localStorage` to track patients sent for imaging
- `AppointmentTabs` (list only, `showCalendar=false`) reused from admin page
