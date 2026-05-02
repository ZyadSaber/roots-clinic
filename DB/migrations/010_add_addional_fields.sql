ALTER TABLE patients
DROP insurance_provider
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS insurance_provider_id UUID REFERENCES insurance_providers (id) ON DELETE SET NULL;