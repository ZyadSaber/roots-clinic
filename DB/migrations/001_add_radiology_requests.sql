-- Migration: Add radiology_requests table
-- Run once against your Supabase/PostgreSQL database

BEGIN;

CREATE TYPE radiology_request_status AS ENUM ('pending', 'completed');

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

COMMIT;
