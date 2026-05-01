-- ============================================================
-- ROOTS CLINIC — COMPLETE DATABASE SCHEMA
-- Full consolidated schema including all migrations
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE staff_role AS ENUM (
  'admin',
  'doctor',
  'receptionist',
  'finance'
);

CREATE TYPE appointment_status AS ENUM (
  'pending',
  'confirmed',
  'arrived',
  'in_chair',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'pending',
  'partial',
  'paid',
  'overdue',
  'cancelled'
);

CREATE TYPE payment_method AS ENUM (
  'cash',
  'card',
  'insurance',
  'bank_transfer'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

CREATE TYPE stock_status AS ENUM (
  'in_stock',
  'low_stock',
  'critical',
  'out_of_stock'
);

CREATE TYPE expense_category AS ENUM (
  'fixed',
  'inventory',
  'personnel',
  'service',
  'utility',
  'other'
);

CREATE TYPE expense_status AS ENUM (
  'paid',
  'pending',
  'overdue'
);

CREATE TYPE radiology_request_status AS ENUM (
  'pending',
  'completed'
);

CREATE TYPE insurance_claim_status AS ENUM (
  'pending',
  'submitted',
  'approved',
  'rejected',
  'partial'
);

CREATE TYPE doctor_status AS ENUM (
  'available',
  'in_session',
  'on_break',
  'away',
  'off_duty'
);

CREATE TYPE purchase_status AS ENUM (
  'draft',
  'ordered',
  'received',
  'cancelled'
);

-- ============================================================
-- SEQUENCES
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq   START 1;
CREATE SEQUENCE IF NOT EXISTS payment_ref_seq      START 1;
CREATE SEQUENCE IF NOT EXISTS purchase_invoice_seq START 1;

-- ============================================================
-- 1. SPECIALTIES
-- ============================================================

CREATE TABLE specialties (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  arabic_name   VARCHAR(100) NOT NULL,
  english_name  VARCHAR(100) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 2. STAFF
-- Linked to Supabase auth.users via auth_id (optional FK).
-- id is its own UUID — not derived from auth.users.
-- permissions: JSONB column storing per-module access flags.
-- ============================================================

CREATE TABLE staff (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id     UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  username    VARCHAR(50) UNIQUE NOT NULL,
  full_name   VARCHAR(100) NOT NULL,
  role        staff_role NOT NULL DEFAULT 'receptionist',
  phone       VARCHAR(20),
  avatar_url  TEXT,
  permissions JSONB,          -- { "appointments": true, "finance": false, ... }
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 3. DOCTORS
-- Extends staff for doctor-specific fields.
-- ============================================================

CREATE TABLE doctors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id          UUID REFERENCES staff(id) ON DELETE CASCADE,
  specialty_id      UUID REFERENCES specialties(id),
  consultation_fee  DECIMAL(10,2) NOT NULL DEFAULT 0,
  years_experience  INT DEFAULT 0,
  rating            DECIMAL(3,2) DEFAULT 0,
  review_count      INT DEFAULT 0,
  status            doctor_status DEFAULT 'available',
  bio               TEXT,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. DOCTOR SCHEDULES
-- ============================================================

CREATE TABLE doctor_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id   UUID REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 5. PATIENTS
-- ============================================================

CREATE TABLE patients (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_code            VARCHAR(20) UNIQUE,          -- PAT-0001 (sequence-generated)
  full_name               VARCHAR(100) NOT NULL,
  phone                   VARCHAR(20) NOT NULL,
  email                   VARCHAR(100),
  dob                     DATE,
  gender                  VARCHAR(10),
  address                 TEXT,
  emergency_contact_name  VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  insurance_provider      VARCHAR(100),
  insurance_number        VARCHAR(100),
  notes                   TEXT,
  is_active               BOOLEAN DEFAULT TRUE,        -- soft delete
  created_at              TIMESTAMP DEFAULT NOW(),
  updated_at              TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 6. PATIENT MEDICAL ALERTS
-- ============================================================

CREATE TABLE patient_alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  alert_type  VARCHAR(50) NOT NULL,      -- allergy | condition | medication
  description VARCHAR(200) NOT NULL,
  severity    VARCHAR(20) DEFAULT 'medium', -- low | medium | high
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 7. PATIENT VITALS
-- ============================================================

CREATE TABLE patient_vitals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id     UUID REFERENCES patients(id) ON DELETE CASCADE,
  recorded_by    UUID REFERENCES staff(id),
  blood_pressure VARCHAR(20),           -- e.g. 120/80
  heart_rate     INT,
  temperature    DECIMAL(4,1),
  weight         DECIMAL(5,2),
  notes          TEXT,
  recorded_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 8. APPOINTMENTS
-- Status machine: pending → confirmed → arrived → in_chair → completed
--                 any → cancelled | no_show
-- ============================================================

CREATE TABLE appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id       UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id        UUID REFERENCES doctors(id),
  booked_by        UUID REFERENCES staff(id),
  appointment_date TIMESTAMP NOT NULL,
  duration_mins    INT DEFAULT 30,
  procedure_type   VARCHAR(100),
  status           appointment_status DEFAULT 'pending',
  priority         VARCHAR(20) DEFAULT 'normal',       -- normal | urgent
  notes            TEXT,
  arrived_at       TIMESTAMP,
  completed_at     TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 9. VISIT RECORDS (EHR)
-- Row created atomically when appointment moves to in_chair.
-- ============================================================

CREATE TABLE visit_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id),
  doctor_id       UUID REFERENCES doctors(id),
  diagnosis       TEXT,
  procedure_done  VARCHAR(200),
  procedure_notes TEXT,
  prescription    TEXT,
  follow_up_date  DATE,
  tooth_chart     JSONB,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 10. RADIOLOGY ASSETS
-- X-ray images linked to a visit.
-- ============================================================

CREATE TABLE radiology_assets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  visit_id    UUID REFERENCES visit_records(id),
  uploaded_by UUID REFERENCES staff(id),
  image_type  VARCHAR(50),              -- panoramic | bitewing | periapical
  image_url   TEXT NOT NULL,
  notes       TEXT,
  taken_at    TIMESTAMP DEFAULT NOW(),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 11. RADIOLOGY REQUESTS
-- Doctor sends patient for imaging; polled every 15 s in UI.
-- ============================================================

CREATE TABLE radiology_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  visit_id       UUID REFERENCES visit_records(id) ON DELETE SET NULL,
  patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  requested_by   UUID REFERENCES doctors(id),
  status         radiology_request_status NOT NULL DEFAULT 'pending',
  requested_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMP,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_radiology_requests_appointment ON radiology_requests(appointment_id);
CREATE INDEX idx_radiology_requests_status      ON radiology_requests(status);
CREATE INDEX idx_radiology_requests_patient     ON radiology_requests(patient_id);

-- ============================================================
-- 12. RADIOLOGY PRICING
-- Clinic-wide price per image type; used for auto-invoicing.
-- ============================================================

CREATE TABLE radiology_pricing (
  image_type  VARCHAR(50) PRIMARY KEY,  -- matches radiology_assets.image_type
  price       DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP DEFAULT NOW()
);

INSERT INTO radiology_pricing (image_type, price) VALUES
  ('panoramic',  0),
  ('bitewing',   0),
  ('periapical', 0)
ON CONFLICT (image_type) DO NOTHING;

-- ============================================================
-- 13. INVENTORY ITEMS
-- ============================================================

CREATE TABLE inventory_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  sku           VARCHAR(50) UNIQUE NOT NULL,
  category      VARCHAR(50),            -- anesthesia | restorative | radiology | general
  description   TEXT,
  unit          VARCHAR(20),            -- box | tube | unit | pack
  current_stock INT NOT NULL DEFAULT 0,
  reorder_level INT NOT NULL DEFAULT 0,
  unit_price    DECIMAL(10,2) DEFAULT 0,
  supplier      VARCHAR(100),
  expiry_date   DATE,
  status        stock_status DEFAULT 'in_stock',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 14. INVENTORY MOVEMENTS
-- positive qty = stock in, negative = stock out
-- ============================================================

CREATE TABLE inventory_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  moved_by      UUID REFERENCES staff(id),
  invoice_id    UUID REFERENCES invoices(id) ON DELETE SET NULL,    -- billing link
  visit_id      UUID REFERENCES visit_records(id) ON DELETE SET NULL, -- usage link
  movement_type VARCHAR(20) NOT NULL,   -- purchase | usage | adjustment | return
  quantity      INT NOT NULL,
  notes         TEXT,
  moved_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 15. SUPPLIERS
-- ============================================================

CREATE TABLE suppliers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               VARCHAR(150) NOT NULL,
  phone              VARCHAR(30),
  responsible_person VARCHAR(100),
  initial_balance    DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes              TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 16. PURCHASE INVOICES (clinic buying from suppliers)
-- ============================================================

CREATE TABLE purchase_invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_number VARCHAR(30) UNIQUE,              -- PO-YYYY-0001
  supplier_id     UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier        VARCHAR(100) NOT NULL,           -- denormalised name snapshot
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  status          purchase_status DEFAULT 'draft',
  ordered_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  received_at     DATE,
  notes           TEXT,
  created_by      UUID REFERENCES staff(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchase_invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name   VARCHAR(150) NOT NULL,
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total       DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 17. INVOICES (clinic billing patients)
-- ============================================================

CREATE TABLE invoices (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(30) UNIQUE,               -- INV-YYYY-0001
  patient_id     UUID REFERENCES patients(id),
  visit_id       UUID REFERENCES visit_records(id),
  doctor_id      UUID REFERENCES doctors(id),
  created_by     UUID REFERENCES staff(id),
  subtotal       DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount       DECIMAL(10,2) DEFAULT 0,
  tax            DECIMAL(10,2) DEFAULT 0,
  total          DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid    DECIMAL(10,2) DEFAULT 0,
  outstanding    DECIMAL(10,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  status         invoice_status DEFAULT 'draft',
  due_date       DATE,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 18. INVOICE LINE ITEMS
-- ============================================================

CREATE TABLE invoice_items (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id   UUID REFERENCES invoices(id) ON DELETE CASCADE,
  doctor_id    UUID REFERENCES doctors(id),
  service_name VARCHAR(150) NOT NULL,
  quantity     INT DEFAULT 1,
  unit_price   DECIMAL(10,2) NOT NULL,
  discount_pct DECIMAL(5,2) DEFAULT 0,
  total        DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 19. PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_ref     VARCHAR(30) UNIQUE,              -- PAY-YYYY-0001
  invoice_id      UUID REFERENCES invoices(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id),
  received_by     UUID REFERENCES staff(id),
  amount          DECIMAL(10,2) NOT NULL,
  method          payment_method NOT NULL,
  status          payment_status DEFAULT 'completed',
  transaction_ref VARCHAR(100),                    -- card / bank reference
  notes           TEXT,
  paid_at         TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 20. INSURANCE PROVIDERS
-- ============================================================

CREATE TABLE insurance_providers (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                   VARCHAR(150) NOT NULL,
  phone                  VARCHAR(30),
  hotline                VARCHAR(30),
  date_from              DATE,
  date_to                DATE,
  representative_person  VARCHAR(100),
  notes                  TEXT,
  insurance_instructions TEXT,
  created_at             TIMESTAMP DEFAULT NOW(),
  updated_at             TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 21. INSURANCE CLAIMS
-- ============================================================

CREATE TABLE insurance_claims (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id           UUID REFERENCES invoices(id),
  patient_id           UUID REFERENCES patients(id),
  insurance_provider_id UUID REFERENCES insurance_providers(id) ON DELETE SET NULL,
  provider             VARCHAR(100) NOT NULL,       -- denormalised name snapshot
  policy_number        VARCHAR(100),
  claimed_amount       DECIMAL(10,2) NOT NULL,
  approved_amount      DECIMAL(10,2) DEFAULT 0,
  status               insurance_claim_status DEFAULT 'pending',
  document_url         TEXT,
  submitted_at         TIMESTAMP,
  resolved_at          TIMESTAMP,
  notes                TEXT,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 22. EXPENSES
-- ============================================================

CREATE TABLE expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  category     expense_category NOT NULL,
  department   VARCHAR(50),              -- admin | radiology | general care | etc.
  amount       DECIMAL(10,2) NOT NULL,
  status       expense_status DEFAULT 'pending',
  added_by     UUID REFERENCES staff(id),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-generate invoice_number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                          LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- Auto-generate payment_ref
CREATE OR REPLACE FUNCTION generate_payment_ref()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.payment_ref IS NULL THEN
    NEW.payment_ref := 'PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                       LPAD(NEXTVAL('payment_ref_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_ref
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION generate_payment_ref();

-- Auto-generate purchase_number
CREATE OR REPLACE FUNCTION set_purchase_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.purchase_number IS NULL THEN
    NEW.purchase_number := 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                           LPAD(NEXTVAL('purchase_invoice_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_purchase_number
  BEFORE INSERT ON purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION set_purchase_number();

-- Generic updated_at setter
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expenses_updated
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_insurance_claims_updated
  BEFORE UPDATE ON insurance_claims
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_radiology_pricing_updated
  BEFORE UPDATE ON radiology_pricing
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-update stock_status when current_stock changes
CREATE OR REPLACE FUNCTION update_stock_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.status :=
    CASE
      WHEN NEW.current_stock <= 0 THEN 'out_of_stock'::stock_status
      WHEN NEW.reorder_level > 0 AND NEW.current_stock <= NEW.reorder_level / 2 THEN 'critical'::stock_status
      WHEN NEW.current_stock <= NEW.reorder_level THEN 'low_stock'::stock_status
      ELSE 'in_stock'::stock_status
    END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_stock_status
  BEFORE UPDATE OF current_stock ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_status();

-- ============================================================
-- VIEWS
-- ============================================================

-- Staff with email (pulled from auth.users)
CREATE VIEW staff_with_email AS
SELECT
  s.id,
  s.auth_id,
  s.username,
  s.full_name,
  s.role,
  s.phone,
  s.avatar_url,
  s.permissions,
  s.is_active,
  s.created_at,
  s.updated_at,
  u.email
FROM staff s
LEFT JOIN auth.users u ON s.auth_id = u.id;

-- Today's appointments with doctor + specialty details
CREATE VIEW todays_appointments AS
SELECT
  a.id,
  a.appointment_date,
  a.duration_mins,
  a.procedure_type,
  a.status,
  a.priority,
  a.arrived_at,
  p.id             AS patient_id,
  p.full_name      AS patient_name,
  p.phone          AS patient_phone,
  s.full_name      AS doctor_name,
  sp.arabic_name   AS specialty_arabic,
  sp.english_name  AS specialty_english,
  d.id             AS doctor_id
FROM appointments a
JOIN patients    p  ON a.patient_id  = p.id
JOIN doctors     d  ON a.doctor_id   = d.id
JOIN staff       s  ON d.staff_id    = s.id
LEFT JOIN specialties sp ON d.specialty_id = sp.id
WHERE a.appointment_date::date = CURRENT_DATE
ORDER BY a.appointment_date ASC;

-- Full patient profile with computed financials, alerts, and visit history
CREATE VIEW patients_full AS
SELECT
  p.id AS patient_id,
  p.patient_code,
  p.full_name,
  p.phone,
  p.email,
  p.dob,
  DATE_PART('year', AGE(p.dob))::INT AS age,
  p.gender,
  p.address,
  p.emergency_contact_name,
  p.emergency_contact_phone,
  p.insurance_provider,
  p.insurance_number,
  p.notes,
  p.is_active,
  p.created_at,
  MAX(a.appointment_date)          AS last_visit,
  (
    SELECT vr.diagnosis
    FROM visit_records vr
    JOIN appointments ap ON vr.appointment_id = ap.id
    WHERE ap.patient_id = p.id
    ORDER BY vr.created_at DESC
    LIMIT 1
  )                                AS last_diagnosis,
  COALESCE(SUM(i.total),       0)  AS total_billed,
  COALESCE(SUM(i.amount_paid), 0)  AS total_paid,
  COALESCE(SUM(i.outstanding), 0)  AS total_outstanding,
  COUNT(DISTINCT i.id)             AS invoice_count,
  COUNT(DISTINCT pa.id)            AS alert_count,
  BOOL_OR(pa.severity = 'high')    AS has_critical_alert,
  COUNT(DISTINCT a.id)             AS total_appointments
FROM patients p
LEFT JOIN appointments  a  ON p.id = a.patient_id AND a.status = 'completed'
LEFT JOIN invoices       i  ON p.id = i.patient_id
LEFT JOIN patient_alerts pa ON p.id = pa.patient_id
GROUP BY p.id;

-- Monthly revenue summary
CREATE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', paid_at) AS month,
  SUM(amount)                  AS total_revenue,
  COUNT(*)                     AS total_payments,
  AVG(amount)                  AS avg_payment
FROM payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY month DESC;

-- Patient financial summary
CREATE VIEW patient_financial_summary AS
SELECT
  p.id           AS patient_id,
  p.full_name,
  p.patient_code,
  COALESCE(SUM(i.total),       0) AS total_billed,
  COALESCE(SUM(i.amount_paid), 0) AS total_paid,
  COALESCE(SUM(i.outstanding), 0) AS total_outstanding,
  COUNT(i.id)                     AS invoice_count
FROM patients p
LEFT JOIN invoices i ON p.id = i.patient_id
GROUP BY p.id, p.full_name, p.patient_code;

-- Low stock items requiring reorder
CREATE VIEW low_stock_items AS
SELECT
  id, name, sku, category,
  current_stock, reorder_level,
  unit, supplier, status
FROM inventory_items
WHERE current_stock <= reorder_level
ORDER BY current_stock ASC;

-- Inventory KPI stat cards
CREATE VIEW inventory_kpis AS
SELECT
  COUNT(*)::INT                                                AS total_items,
  COUNT(*) FILTER (WHERE status = 'low_stock')::INT           AS low_stock_count,
  COUNT(*) FILTER (WHERE status = 'critical')::INT            AS critical_count,
  COUNT(*) FILTER (WHERE status = 'out_of_stock')::INT        AS out_of_stock_count,
  COALESCE(SUM(current_stock * unit_price), 0)::NUMERIC(14,2) AS total_value
FROM inventory_items;

-- Finance KPI stat cards
CREATE VIEW finance_kpis AS
SELECT
  COALESCE((
    SELECT SUM(amount) FROM payments
    WHERE status = 'completed'
      AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW())
  ), 0)::NUMERIC(12,2) AS monthly_revenue,

  COALESCE((
    SELECT SUM(amount) FROM payments
    WHERE status = 'completed'
      AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
  ), 0)::NUMERIC(12,2) AS prev_month_revenue,

  COALESCE((
    SELECT SUM(amount) FROM expenses
    WHERE status = 'paid'
      AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)
  ), 0)::NUMERIC(12,2) AS monthly_expenses,

  COALESCE((
    SELECT SUM(amount) FROM expenses
    WHERE status = 'paid'
      AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
  ), 0)::NUMERIC(12,2) AS prev_month_expenses,

  COALESCE((
    SELECT SUM(outstanding) FROM invoices WHERE status IN ('pending', 'overdue')
  ), 0)::NUMERIC(12,2) AS total_outstanding,

  (SELECT COUNT(*) FROM invoices WHERE status IN ('pending', 'overdue'))::INT AS outstanding_invoice_count,

  COALESCE((
    SELECT SUM(amount) FROM payments
    WHERE status = 'completed' AND paid_at::DATE = CURRENT_DATE
  ), 0)::NUMERIC(12,2) AS today_income,

  COALESCE((
    SELECT SUM(amount) FROM expenses WHERE expense_date = CURRENT_DATE
  ), 0)::NUMERIC(12,2) AS today_expenses;
