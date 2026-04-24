-- Finance sequences and triggers for auto-numbering
-- Run in Supabase SQL editor before deploying the finance module

-- ── Invoice number: INV-YYYY-0001 ──────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                          LPAD(NEXTVAL('invoice_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoice_number ON invoices;
CREATE TRIGGER trg_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();

-- ── Payment ref: PAY-YYYY-0001 ─────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS payment_ref_seq START 1;

CREATE OR REPLACE FUNCTION generate_payment_ref()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.payment_ref IS NULL THEN
    NEW.payment_ref := 'PAY-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
                       LPAD(NEXTVAL('payment_ref_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_ref ON payments;
CREATE TRIGGER trg_payment_ref
  BEFORE INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION generate_payment_ref();

-- ── Finance KPIs view ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW finance_kpis AS
SELECT
  COALESCE(
    (SELECT SUM(amount) FROM payments
     WHERE status = 'completed'
       AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW())),
    0
  )::NUMERIC(12,2) AS monthly_revenue,

  COALESCE(
    (SELECT SUM(amount) FROM payments
     WHERE status = 'completed'
       AND DATE_TRUNC('month', paid_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')),
    0
  )::NUMERIC(12,2) AS prev_month_revenue,

  COALESCE(
    (SELECT SUM(amount) FROM expenses
     WHERE status = 'paid'
       AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)),
    0
  )::NUMERIC(12,2) AS monthly_expenses,

  COALESCE(
    (SELECT SUM(amount) FROM expenses
     WHERE status = 'paid'
       AND DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')),
    0
  )::NUMERIC(12,2) AS prev_month_expenses,

  COALESCE(
    (SELECT SUM(outstanding) FROM invoices WHERE status IN ('pending', 'overdue')),
    0
  )::NUMERIC(12,2) AS total_outstanding,

  (SELECT COUNT(*) FROM invoices WHERE status IN ('pending', 'overdue'))::INT AS outstanding_invoice_count;

-- ── updated_at triggers ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invoices_updated ON invoices;
CREATE TRIGGER trg_invoices_updated
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_expenses_updated ON expenses;
CREATE TRIGGER trg_expenses_updated
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_insurance_claims_updated ON insurance_claims;
CREATE TRIGGER trg_insurance_claims_updated
  BEFORE UPDATE ON insurance_claims
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Verify: SELECT * FROM finance_kpis;
