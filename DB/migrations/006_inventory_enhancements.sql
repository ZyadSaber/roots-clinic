-- ── Inventory Enhancements ────────────────────────────────────────────────
-- 1. expiry_date on inventory_items (UI was already showing it)
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 2. Link movements to patient visits and invoices
ALTER TABLE inventory_movements
  ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS visit_id   UUID REFERENCES visit_records(id) ON DELETE SET NULL;

-- 3. Purchase order status enum
DO $$ BEGIN
  CREATE TYPE purchase_status AS ENUM ('draft', 'ordered', 'received', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Sequence for purchase order numbers (PO-YYYY-0001)
CREATE SEQUENCE IF NOT EXISTS purchase_invoice_seq START 1;

-- 5. Purchase invoices table (clinic buying from suppliers)
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_number VARCHAR(30) UNIQUE,
  supplier        VARCHAR(100) NOT NULL,
  total           DECIMAL(10,2) NOT NULL DEFAULT 0,
  status          purchase_status DEFAULT 'draft',
  ordered_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  received_at     DATE,
  notes           TEXT,
  created_by      UUID REFERENCES staff(id),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Auto-generate purchase_number on insert
CREATE OR REPLACE FUNCTION set_purchase_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.purchase_number IS NULL THEN
    NEW.purchase_number := 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                           LPAD(NEXTVAL('purchase_invoice_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purchase_number ON purchase_invoices;
CREATE TRIGGER trg_purchase_number
  BEFORE INSERT ON purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION set_purchase_number();

-- 6. Line items for purchase invoices
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_id     UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name   VARCHAR(150) NOT NULL,
  quantity    INT NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  total       DECIMAL(10,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- 7. KPI view for inventory stat cards
CREATE OR REPLACE VIEW inventory_kpis AS
SELECT
  COUNT(*)::INT                                                  AS total_items,
  COUNT(*) FILTER (WHERE status = 'low_stock')::INT             AS low_stock_count,
  COUNT(*) FILTER (WHERE status = 'critical')::INT              AS critical_count,
  COUNT(*) FILTER (WHERE status = 'out_of_stock')::INT          AS out_of_stock_count,
  COALESCE(SUM(current_stock * unit_price), 0)::NUMERIC(14,2)  AS total_value
FROM inventory_items;

-- 8. Trigger: auto-update stock_status when current_stock changes
CREATE OR REPLACE FUNCTION update_stock_status() RETURNS TRIGGER AS $$
BEGIN
  NEW.status :=
    CASE
      WHEN NEW.current_stock <= 0                              THEN 'out_of_stock'::stock_status
      WHEN NEW.reorder_level > 0 AND NEW.current_stock <= NEW.reorder_level / 2 THEN 'critical'::stock_status
      WHEN NEW.current_stock <= NEW.reorder_level              THEN 'low_stock'::stock_status
      ELSE 'in_stock'::stock_status
    END;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_status ON inventory_items;
CREATE TRIGGER trg_stock_status
  BEFORE UPDATE OF current_stock ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_stock_status();
