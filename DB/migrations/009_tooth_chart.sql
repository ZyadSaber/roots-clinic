-- Add tooth_chart JSONB column to visit_records
-- Stores FDI-keyed annotation map from the interactive dental chart

ALTER TABLE visit_records
  ADD COLUMN IF NOT EXISTS tooth_chart JSONB;
