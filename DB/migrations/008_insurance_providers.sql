-- ── Insurance Providers ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS insurance_providers (
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

-- Link existing claims to the new provider table (nullable, old rows stay valid)
ALTER TABLE insurance_claims
  ADD COLUMN IF NOT EXISTS insurance_provider_id UUID
    REFERENCES insurance_providers(id) ON DELETE SET NULL;
