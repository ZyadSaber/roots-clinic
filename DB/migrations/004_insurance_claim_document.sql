-- Add document attachment support to insurance_claims
ALTER TABLE insurance_claims
  ADD COLUMN IF NOT EXISTS document_url TEXT;
