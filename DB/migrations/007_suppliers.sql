-- ── Suppliers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name               VARCHAR(150) NOT NULL,
  phone              VARCHAR(30),
  responsible_person VARCHAR(100),
  initial_balance    DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes              TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

-- Link purchase_invoices to suppliers (nullable to keep existing rows valid)
ALTER TABLE purchase_invoices
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
