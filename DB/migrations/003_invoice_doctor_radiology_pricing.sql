-- Migration 003 — Invoice doctor tracking + radiology pricing
-- Run in Supabase SQL editor after 002_finance_sequences.sql

-- ── 1. Add doctor_id to invoices ───────────────────────────────────────────
-- Tracks which doctor the appointment was with at the invoice level,
-- separate from invoice_items.doctor_id which tracks per-line-item attribution.
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id);

-- ── 2. Radiology pricing reference table ───────────────────────────────────
-- Maps each image type to a clinic-wide price per scan.
-- Finance admin sets these prices; the auto-invoice uses them at completion time.
CREATE TABLE IF NOT EXISTS radiology_pricing (
  image_type  VARCHAR(50)    PRIMARY KEY,   -- matches radiology_assets.image_type
  price       DECIMAL(10,2)  NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP      DEFAULT NOW()
);

-- Seed the three image types the clinic uses (prices start at 0 — admin sets real values)
INSERT INTO radiology_pricing (image_type, price) VALUES
  ('panoramic',  0),
  ('bitewing',   0),
  ('periapical', 0)
ON CONFLICT (image_type) DO NOTHING;

-- Auto-update updated_at on price changes
CREATE OR REPLACE FUNCTION set_radiology_pricing_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_radiology_pricing_updated ON radiology_pricing;
CREATE TRIGGER trg_radiology_pricing_updated
  BEFORE UPDATE ON radiology_pricing
  FOR EACH ROW EXECUTE FUNCTION set_radiology_pricing_updated_at();

-- ── Verify ─────────────────────────────────────────────────────────────────
-- SELECT * FROM radiology_pricing;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'doctor_id';
