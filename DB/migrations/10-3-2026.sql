-- ================================
-- patients_full view
-- ================================

CREATE OR REPLACE VIEW patients_full AS
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

  -- Last visit
  MAX(a.appointment_date) AS last_visit,

  -- Last diagnosis
  (
    SELECT vr.diagnosis
    FROM visit_records vr
    JOIN appointments ap ON vr.appointment_id = ap.id
    WHERE ap.patient_id = p.id
    ORDER BY vr.created_at DESC
    LIMIT 1
  ) AS last_diagnosis,

  -- Financial
  COALESCE(SUM(i.total), 0)       AS total_billed,
  COALESCE(SUM(i.amount_paid), 0) AS total_paid,
  COALESCE(SUM(i.outstanding), 0) AS total_outstanding,
  COUNT(DISTINCT i.id)            AS invoice_count,

  -- Alerts
  COUNT(DISTINCT pa.id)          AS alert_count,
  BOOL_OR(pa.severity = 'high')  AS has_critical_alert,

  -- Appointments
  COUNT(DISTINCT a.id)           AS total_appointments

FROM patients p
LEFT JOIN appointments a    ON p.id = a.patient_id AND a.status = 'completed'
LEFT JOIN invoices i        ON p.id = i.patient_id
LEFT JOIN patient_alerts pa ON p.id = pa.patient_id
GROUP BY p.id;

-- ================================
-- remove the auth_id column from staff table
-- ================================

-- Drop the old FK-based primary key constraint
ALTER TABLE staff 
  ALTER COLUMN id SET DEFAULT uuid_generate_v4(),
  ALTER COLUMN id DROP DEFAULT; -- first remove to re-add properly

-- Actually the clean way:
ALTER TABLE staff
  ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Add optional auth_id column
ALTER TABLE staff
  ADD COLUMN auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update the view to use auth_id for email lookup
DROP VIEW staff_with_email;
CREATE VIEW staff_with_email AS
SELECT
  s.id,
  s.auth_id,
  s.username,
  s.full_name,
  s.role,
  s.phone,
  s.avatar_url,
  s.is_active,
  s.created_at,
  s.updated_at,
  u.email
FROM staff s
LEFT JOIN auth.users u ON s.auth_id = u.id; -- LEFT JOIN since auth_id is optional