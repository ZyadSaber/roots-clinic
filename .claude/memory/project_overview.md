---
name: roots-clinic project overview
description: What roots-clinic is, its tech stack, module structure, and DB/data access patterns
type: project
---

# Roots Clinic — Dental/Medical Clinic Management System

A full-stack clinic management web app built with **Next.js 16 App Router** (React 19). It manages patients, appointments, doctors, staff, finance, radiology, inventory, and records.

## Tech Stack
- **Framework:** Next.js 16 App Router, React 19, TypeScript
- **Database:** PostgreSQL via Supabase (accessed with raw `pg` Pool — NOT via Supabase client for most queries)
- **Auth:** Supabase Auth (`@supabase/ssr`)
- **State:** Redux Toolkit (slices for auth, appointments, doctors, patients, staff, uiShared)
- **Server state / fetching:** TanStack React Query v5
- **i18n:** `next-intl` — locale prefix routing (`/[locale]/...`), supports at least EN/AR
- **UI:** shadcn/ui components (in `src/components/ui/`), Tailwind CSS v4, Lucide icons, Framer Motion
- **Validation:** Zod schemas (in `src/validation/`)
- **Export:** jsPDF + jspdf-autotable for PDF, custom CSV for Excel

## Database Access Pattern
- Raw SQL via `pg` Pool in `src/lib/pg.ts`
- Helpers: `queryOne`, `queryMany`, `execute`, `executeTransaction`
- All DB calls are Next.js **Server Actions** (`"use server"` files in `src/services/`)
- Services: `appointments.ts`, `doctors.ts`, `patients.ts`, `staff.ts`, `specialties.ts`, `login.ts`

## App Routes (all under `/[locale]/`)
- `/dashboard` — overview
- `/patients` — patient list + details modal + medical history
- `/appointments` — appointment scheduling and calendar
- `/radiology` — radiology images
- `/doctors` — doctor management
- `/inventory` — inventory
- `/finance` — finance
- `/records` — records
- `/users` — staff/user management with role-based permissions
- `/welcome` — login/welcome screen

## Key Patterns
- **`useVisibility` hook** — simple open/close boolean state for dialogs
- **`useFormManager` hook** — generic form state with optional Zod validation, `handleToggle(name)` returns a value setter (used for Select components)
- **`SelectField` component** — extended Select with `showSearch` prop for searchable dropdowns
- **Server Actions** are called directly from React Query `queryFn` / `mutationFn`
- **`StoreInitializer`** — hydrates Redux store from server-fetched data
- Redux selectors in `src/store/selectors/`

## Appointment Module Detail
- `AppointmentDialog` — dialog to create a new appointment (patient select + doctor + type + time slot + duration + notes)
- `StatusUpdateDialog` — updates appointment status (pending → confirmed → arrived → in_chair → completed / cancelled / no_show)
- `AppointmentsPage` — main page with stats cards, list tab, and calendar (daily doctor-column grid) tab
- Appointment statuses: `pending | confirmed | arrived | in_chair | completed | cancelled | no_show`
- Calendar view: CSS grid with time rows (ROW_HEIGHT=64px) and doctor columns; appointments positioned absolutely by time

**Why:** Built to replace paper-based or scattered clinic workflows with a unified digital system.
**How to apply:** When editing appointment features, check both `AppointmentDialog.tsx` and `src/app/[locale]/appointments/page.tsx`, and the server actions in `src/services/appointments.ts`.
