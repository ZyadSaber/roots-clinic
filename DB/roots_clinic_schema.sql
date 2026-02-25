-- ================================
-- ROOTS CLINIC — DATABASE SCHEMA
-- ================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- ENUMS
-- ================================

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

-- ================================
-- 1. STAFF TABLE
-- (linked to Supabase auth.users)
-- ================================

CREATE TABLE staff (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      VARCHAR(50) UNIQUE NOT NULL,        -- e.g. z.saber
  full_name     VARCHAR(100) NOT NULL,
  role          staff_role NOT NULL DEFAULT 'receptionist',
  specialty     VARCHAR(100),                        -- for doctors only
  phone         VARCHAR(20),
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE VIEW staff_with_email AS
SELECT 
  s.id,
  s.username,
  s.full_name,
  s.role,
  s.specialty,
  s.phone,
  s.avatar_url,
  s.is_active,
  s.created_at,
  s.updated_at,
  u.email                    -- pulled from auth.users
FROM staff s
JOIN auth.users u ON s.id = u.id;

-- ================================
-- 2. DOCTORS TABLE
-- (extends staff for doctor-specific data)
-- ================================

CREATE TABLE doctors (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id          UUID REFERENCES staff(id) ON DELETE CASCADE,
  specialty         VARCHAR(100) NOT NULL,
  consultation_fee  DECIMAL(10,2) NOT NULL DEFAULT 0,
  years_experience  INT DEFAULT 0,
  rating            DECIMAL(3,2) DEFAULT 0,          -- e.g. 4.8
  review_count      INT DEFAULT 0,
  status            doctor_status DEFAULT 'available',
  bio               TEXT,
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 3. DOCTOR SCHEDULES TABLE
-- ================================

CREATE TABLE doctor_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id   UUID REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 4. PATIENTS TABLE
-- ================================

CREATE TABLE patients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_code    VARCHAR(20) UNIQUE,               -- e.g. PAT-0001
  full_name       VARCHAR(100) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  email           VARCHAR(100),
  dob             DATE,
  gender          VARCHAR(10),
  address         TEXT,
  emergency_contact_name  VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  insurance_provider      VARCHAR(100),
  insurance_number        VARCHAR(100),
  notes           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 5. PATIENT MEDICAL ALERTS
-- ================================

CREATE TABLE patient_alerts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  alert_type  VARCHAR(50) NOT NULL,                 -- allergy, condition, medication
  description VARCHAR(200) NOT NULL,
  severity    VARCHAR(20) DEFAULT 'medium',         -- low, medium, high
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 6. PATIENT VITALS
-- ================================

CREATE TABLE patient_vitals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  recorded_by     UUID REFERENCES staff(id),
  blood_pressure  VARCHAR(20),                      -- e.g. 120/80
  heart_rate      INT,
  temperature     DECIMAL(4,1),
  weight          DECIMAL(5,2),
  notes           TEXT,
  recorded_at     TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 7. APPOINTMENTS TABLE
-- ================================

CREATE TABLE appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id       UUID REFERENCES doctors(id),
  booked_by       UUID REFERENCES staff(id),
  appointment_date TIMESTAMP NOT NULL,
  duration_mins   INT DEFAULT 30,
  procedure_type  VARCHAR(100),
  status          appointment_status DEFAULT 'pending',
  priority        VARCHAR(20) DEFAULT 'normal',     -- normal, urgent
  notes           TEXT,
  arrived_at      TIMESTAMP,
  completed_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 8. VISIT RECORDS (EHR)
-- ================================

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
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 9. RADIOLOGY / IMAGES
-- ================================

CREATE TABLE radiology_assets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID REFERENCES patients(id) ON DELETE CASCADE,
  visit_id    UUID REFERENCES visit_records(id),
  uploaded_by UUID REFERENCES staff(id),
  image_type  VARCHAR(50),                          -- panoramic, bitewing, periapical
  image_url   TEXT NOT NULL,
  notes       TEXT,
  taken_at    TIMESTAMP DEFAULT NOW(),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 10. INVENTORY ITEMS
-- ================================

CREATE TABLE inventory_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  sku             VARCHAR(50) UNIQUE NOT NULL,
  category        VARCHAR(50),                      -- anesthesia, restorative, radiology, general
  description     TEXT,
  unit            VARCHAR(20),                      -- box, tube, unit, pack
  current_stock   INT NOT NULL DEFAULT 0,
  reorder_level   INT NOT NULL DEFAULT 0,
  unit_price      DECIMAL(10,2) DEFAULT 0,
  supplier        VARCHAR(100),
  status          stock_status DEFAULT 'in_stock',
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 11. INVENTORY MOVEMENTS
-- ================================

CREATE TABLE inventory_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  moved_by      UUID REFERENCES staff(id),
  movement_type VARCHAR(20) NOT NULL,               -- purchase, usage, adjustment, return
  quantity      INT NOT NULL,                       -- positive = in, negative = out
  notes         TEXT,
  moved_at      TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 12. INVOICES
-- ================================

CREATE TABLE invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number  VARCHAR(30) UNIQUE,               -- e.g. INV-2024-0001
  patient_id      UUID REFERENCES patients(id),
  visit_id        UUID REFERENCES visit_records(id),
  created_by      UUID REFERENCES staff(id),
  subtotal        DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount        DECIMAL(10,2) DEFAULT 0,
  tax             DECIMAL(10,2) DEFAULT 0,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid     DECIMAL(10,2) DEFAULT 0,
  outstanding     DECIMAL(10,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  status          invoice_status DEFAULT 'draft',
  due_date        DATE,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 13. INVOICE LINE ITEMS
-- ================================

CREATE TABLE invoice_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID REFERENCES invoices(id) ON DELETE CASCADE,
  doctor_id     UUID REFERENCES doctors(id),
  service_name  VARCHAR(150) NOT NULL,
  quantity      INT DEFAULT 1,
  unit_price    DECIMAL(10,2) NOT NULL,
  discount_pct  DECIMAL(5,2) DEFAULT 0,
  total         DECIMAL(10,2) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 14. PAYMENTS
-- ================================

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_ref     VARCHAR(30) UNIQUE,               -- e.g. PAY-2024-0001
  invoice_id      UUID REFERENCES invoices(id) ON DELETE CASCADE,
  patient_id      UUID REFERENCES patients(id),
  received_by     UUID REFERENCES staff(id),
  amount          DECIMAL(10,2) NOT NULL,
  method          payment_method NOT NULL,
  status          payment_status DEFAULT 'completed',
  transaction_ref VARCHAR(100),                     -- card/bank ref number
  notes           TEXT,
  paid_at         TIMESTAMP DEFAULT NOW(),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 15. INSURANCE CLAIMS
-- ================================

CREATE TABLE insurance_claims (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id      UUID REFERENCES invoices(id),
  patient_id      UUID REFERENCES patients(id),
  provider        VARCHAR(100) NOT NULL,
  policy_number   VARCHAR(100),
  claimed_amount  DECIMAL(10,2) NOT NULL,
  approved_amount DECIMAL(10,2) DEFAULT 0,
  status          insurance_claim_status DEFAULT 'pending',
  submitted_at    TIMESTAMP,
  resolved_at     TIMESTAMP,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ================================
-- 16. EXPENSES
-- ================================

CREATE TABLE expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(150) NOT NULL,
  description   TEXT,
  category      expense_category NOT NULL,
  department    VARCHAR(50),                        -- admin, radiology, general care, etc.
  amount        DECIMAL(10,2) NOT NULL,
  status        expense_status DEFAULT 'pending',
  added_by      UUID REFERENCES staff(id),
  expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ================================
-- USEFUL VIEWS
-- ================================

-- Today's appointments with full details
CREATE VIEW todays_appointments AS
SELECT
  a.id,
  a.appointment_date,
  a.duration_mins,
  a.procedure_type,
  a.status,
  a.priority,
  a.arrived_at,
  p.id AS patient_id,
  p.full_name AS patient_name,
  p.phone AS patient_phone,
  s.full_name AS doctor_name,
  d.specialty,
  d.id AS doctor_id
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN doctors d ON a.doctor_id = d.id
JOIN staff s ON d.staff_id = s.id
WHERE a.appointment_date::date = CURRENT_DATE
ORDER BY a.appointment_date ASC;

-- Monthly revenue summary
CREATE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', paid_at) AS month,
  SUM(amount) AS total_revenue,
  COUNT(*) AS total_payments,
  AVG(amount) AS avg_payment
FROM payments
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY month DESC;

-- Low stock items
CREATE VIEW low_stock_items AS
SELECT
  id,
  name,
  sku,
  category,
  current_stock,
  reorder_level,
  unit,
  supplier,
  status
FROM inventory_items
WHERE current_stock <= reorder_level
ORDER BY current_stock ASC;

-- Patient financial summary
CREATE VIEW patient_financial_summary AS
SELECT
  p.id AS patient_id,
  p.full_name,
  p.patient_code,
  COALESCE(SUM(i.total), 0) AS total_billed,
  COALESCE(SUM(i.amount_paid), 0) AS total_paid,
  COALESCE(SUM(i.outstanding), 0) AS total_outstanding,
  COUNT(i.id) AS invoice_count
FROM patients p
LEFT JOIN invoices i ON p.id = i.patient_id
GROUP BY p.id, p.full_name, p.patient_code;
