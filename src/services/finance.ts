"use server";

import { queryOne, queryMany, execute, executeTransaction } from "@/lib/pg";
import { revalidatePath } from "next/cache";
import type {
  FinanceKPIs,
  FinancePeriodStats,
  Invoice,
  InvoiceDetail,
  InvoiceItem,
  InvoiceFilters,
  Payment,
  InsuranceClaim,
  InsuranceClaimDetail,
  InsuranceClaimFilters,
  InsuranceClaimStatus,
  Expense,
  ExpenseFilters,
  CreateInvoicePayload,
  AddInvoiceItemPayload,
  RecordPaymentPayload,
  CreateExpensePayload,
  CreateInsuranceClaimPayload,
  InvoiceStatus,
  TodayPayment,
} from "@/types/finance";

// ── KPIs ───────────────────────────────────────────────────────────────────

const EMPTY_KPIS: FinanceKPIs = {
  monthly_revenue: 0,
  prev_month_revenue: 0,
  monthly_expenses: 0,
  prev_month_expenses: 0,
  total_outstanding: 0,
  outstanding_invoice_count: 0,
  today_income: 0,
  today_expenses: 0
};

// Always current calendar month vs previous month — used by the top 4 cards
export async function getFinanceStats(): Promise<FinanceKPIs> {
  try {
    const row = await queryOne<FinanceKPIs>({ sql: "SELECT * FROM finance_kpis" });
    return row
  } catch (err) {
    console.error("getFinanceStats — finance_kpis view may not exist yet:", err);
    return EMPTY_KPIS;
  }
}

// Selected date range stats — used by the bottom 4 cards
export async function getFinancePeriodStats(
  dateFrom: string,
  dateTo: string,
): Promise<FinancePeriodStats> {
  const EMPTY: FinancePeriodStats = { period_revenue: 0, period_expenses: 0, period_outstanding: 0, period_outstanding_count: 0 };
  try {
    const row = await queryOne<FinancePeriodStats>({
      sql: `
        SELECT
          COALESCE(
            (SELECT SUM(amount) FROM payments
             WHERE status = 'completed' AND paid_at::DATE BETWEEN $1::DATE AND $2::DATE),
            0
          )::NUMERIC(12,2) AS period_revenue,

          COALESCE(
            (SELECT SUM(amount) FROM expenses
             WHERE status = 'paid' AND expense_date BETWEEN $1::DATE AND $2::DATE),
            0
          )::NUMERIC(12,2) AS period_expenses,

          COALESCE(
            (SELECT SUM(outstanding) FROM invoices
             WHERE created_at::DATE BETWEEN $1::DATE AND $2::DATE
               AND status IN ('pending', 'overdue', 'partial')),
            0
          )::NUMERIC(12,2) AS period_outstanding,

          (SELECT COUNT(*) FROM invoices
           WHERE created_at::DATE BETWEEN $1::DATE AND $2::DATE
             AND status IN ('pending', 'overdue', 'partial'))::INT AS period_outstanding_count
      `,
      params: [dateFrom, dateTo],
    });
    if (!row) return EMPTY;
    return {
      period_revenue: Number(row.period_revenue),
      period_expenses: Number(row.period_expenses),
      period_outstanding: Number(row.period_outstanding),
      period_outstanding_count: Number(row.period_outstanding_count),
    };
  } catch (err) {
    console.error("getFinancePeriodStats error:", err);
    return EMPTY;
  }
}

// ── Invoices ───────────────────────────────────────────────────────────────

export async function getInvoices(
  filters: InvoiceFilters = {},
): Promise<Invoice[]> {
  const { status, search, dateFrom, dateTo } = filters;

  const statusParam = !status || status === "all" ? null : status;
  const searchParam = search?.trim() || null;
  const dateFromParam = dateFrom || null;
  const dateToParam = dateTo || null;

  const where = `
    WHERE ($1::invoice_status IS NULL OR i.status = $1::invoice_status)
      AND ($2::TEXT IS NULL OR p.full_name ILIKE '%' || $2 || '%'
                            OR i.invoice_number ILIKE '%' || $2 || '%')
      AND ($3::DATE IS NULL OR i.created_at::DATE >= $3::DATE)
      AND ($4::DATE IS NULL OR i.created_at::DATE <= $4::DATE)
  `;

  return queryMany<Invoice>({
    sql: `
      SELECT
        i.id, i.invoice_number, i.patient_id,
        p.full_name AS patient_name, p.patient_code,
        i.visit_id, i.doctor_id, i.subtotal, i.discount, i.tax, i.total,
        i.amount_paid, i.outstanding, i.status, i.due_date,
        i.notes, i.created_at, i.updated_at
      FROM invoices i
      JOIN patients p ON p.id = i.patient_id
      ${where}
      ORDER BY i.created_at DESC
    `,
    params: [statusParam, searchParam, dateFromParam, dateToParam],
  });
}

export async function getInvoiceDetail(
  invoiceId: string,
): Promise<InvoiceDetail | null> {
  const [invoice, items, payments, claims] = await Promise.all([
    queryOne<Invoice>({
      sql: `
        SELECT
          i.id, i.invoice_number, i.patient_id,
          p.full_name AS patient_name, p.patient_code,
          i.visit_id, i.doctor_id, i.subtotal, i.discount, i.tax, i.total,
          i.amount_paid, i.outstanding, i.status, i.due_date,
          i.notes, i.created_at, i.updated_at
        FROM invoices i
        JOIN patients p ON p.id = i.patient_id
        WHERE i.id = $1
      `,
      params: [invoiceId],
    }),
    queryMany<InvoiceItem>({
      sql: `
        SELECT
          ii.id, ii.invoice_id, ii.doctor_id,
          s.full_name AS doctor_name,
          ii.service_name, ii.quantity, ii.unit_price,
          ii.discount_pct, ii.total, ii.created_at
        FROM invoice_items ii
        LEFT JOIN doctors d ON d.id = ii.doctor_id
        LEFT JOIN staff s ON s.id = d.staff_id
        WHERE ii.invoice_id = $1
        ORDER BY ii.created_at ASC
      `,
      params: [invoiceId],
    }),
    queryMany<Payment>({
      sql: `
        SELECT * FROM payments
        WHERE invoice_id = $1
        ORDER BY paid_at DESC
      `,
      params: [invoiceId],
    }),
    queryMany<InsuranceClaim>({
      sql: `
        SELECT * FROM insurance_claims
        WHERE invoice_id = $1
        ORDER BY created_at DESC
      `,
      params: [invoiceId],
    }),
  ]);

  if (!invoice) return null;
  return { ...invoice, items, payments, insurance_claims: claims };
}

export async function createInvoice(
  payload: CreateInvoicePayload,
): Promise<{ success: boolean; invoiceId?: string; error?: string }> {
  try {
    const row = await queryOne<{ id: string }>({
      sql: `
        INSERT INTO invoices
          (patient_id, visit_id, subtotal, discount, tax, total, status, due_date, notes, created_by)
        VALUES ($1, $2, 0, $3, $4, 0, 'draft', $5, $6, $7)
        RETURNING id
      `,
      params: [
        payload.patient_id,
        payload.visit_id || null,
        payload.discount ?? 0,
        payload.tax ?? 0,
        payload.due_date || null,
        payload.notes || null,
        payload.created_by || null,
      ],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true, invoiceId: row?.id };
  } catch (err) {
    console.error("createInvoice:", err);
    return { success: false, error: "Failed to create invoice." };
  }
}

export async function addInvoiceItem(
  item: AddInvoiceItemPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    const discountPct = item.discount_pct ?? 0;
    const itemTotal = parseFloat(
      (item.quantity * item.unit_price * (1 - discountPct / 100)).toFixed(2),
    );

    await executeTransaction(async (client) => {
      await client.query(
        `INSERT INTO invoice_items
           (invoice_id, doctor_id, service_name, quantity, unit_price, discount_pct, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          item.invoice_id,
          item.doctor_id || null,
          item.service_name,
          item.quantity,
          item.unit_price,
          discountPct,
          itemTotal,
        ],
      );

      await client.query(
        `UPDATE invoices
         SET
           subtotal   = (SELECT COALESCE(SUM(total), 0) FROM invoice_items WHERE invoice_id = $1),
           total      = (SELECT COALESCE(SUM(total), 0) FROM invoice_items WHERE invoice_id = $1) + tax - discount,
           updated_at = NOW()
         WHERE id = $1`,
        [item.invoice_id],
      );
    });

    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("addInvoiceItem:", err);
    return { success: false, error: "Failed to add invoice item." };
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `UPDATE invoices SET status = $1::invoice_status, updated_at = NOW() WHERE id = $2`,
      params: [status, invoiceId],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("updateInvoiceStatus:", err);
    return { success: false, error: "Failed to update invoice status." };
  }
}

// ── Payments ───────────────────────────────────────────────────────────────

export async function recordPayment(
  payload: RecordPaymentPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await executeTransaction(async (client) => {
      await client.query(
        `INSERT INTO payments
           (invoice_id, patient_id, amount, method, transaction_ref, notes, received_by, status)
         VALUES ($1, $2, $3, $4::payment_method, $5, $6, $7, 'completed')`,
        [
          payload.invoice_id,
          payload.patient_id,
          payload.amount,
          payload.method,
          payload.transaction_ref || null,
          payload.notes || null,
          payload.received_by || null,
        ],
      );

      await client.query(
        `UPDATE invoices
         SET
           amount_paid = (
             SELECT COALESCE(SUM(amount), 0)
             FROM payments
             WHERE invoice_id = $1 AND status = 'completed'
           ),
           status = CASE
             WHEN (
               SELECT COALESCE(SUM(amount), 0)
               FROM payments
               WHERE invoice_id = $1 AND status = 'completed'
             ) >= total THEN 'paid'::invoice_status
             WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'overdue'::invoice_status
             ELSE 'pending'::invoice_status
           END,
           updated_at = NOW()
         WHERE id = $1`,
        [payload.invoice_id],
      );
    });

    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("recordPayment:", err);
    return { success: false, error: "Failed to record payment." };
  }
}

// ── Expenses ───────────────────────────────────────────────────────────────

export async function getExpenses(
  filters: ExpenseFilters = {},
): Promise<{ data: Expense[]; total: number }> {
  const {
    status,
    category,
    dateFrom,
    dateTo,
    page = 1,
    pageSize = 10,
  } = filters;

  const statusParam = !status || status === "all" ? null : status;
  const categoryParam = !category || category === "all" ? null : category;
  const dateFromParam = dateFrom || null;
  const dateToParam = dateTo || null;
  const offset = (page - 1) * pageSize;

  const where = `
    WHERE ($1::expense_status IS NULL OR status = $1::expense_status)
      AND ($2::expense_category IS NULL OR category = $2::expense_category)
      AND ($3::DATE IS NULL OR expense_date >= $3::DATE)
      AND ($4::DATE IS NULL OR expense_date <= $4::DATE)
  `;

  const baseParams = [statusParam, categoryParam, dateFromParam, dateToParam];

  const [data, countRow] = await Promise.all([
    queryMany<Expense>({
      sql: `SELECT * FROM expenses ${where} ORDER BY expense_date DESC LIMIT $5 OFFSET $6`,
      params: [...baseParams, pageSize, offset],
    }),
    queryOne<{ count: number }>({
      sql: `SELECT COUNT(*)::INT AS count FROM expenses ${where}`,
      params: baseParams,
    }),
  ]);

  return { data, total: countRow?.count ?? 0 };
}

export async function createExpense(
  payload: CreateExpensePayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `
        INSERT INTO expenses (title, description, category, department, amount, status, expense_date, added_by)
        VALUES ($1, $2, $3::expense_category, $4, $5, $6::expense_status, $7, $8)
      `,
      params: [
        payload.title,
        payload.description || null,
        payload.category,
        payload.department || null,
        payload.amount,
        payload.status ?? "pending",
        payload.expense_date,
        payload.added_by || null,
      ],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("createExpense:", err);
    return { success: false, error: "Failed to create expense." };
  }
}

export async function updateExpense(
  expenseId: string,
  payload: Partial<CreateExpensePayload>,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `
        UPDATE expenses
        SET
          title        = COALESCE($1, title),
          description  = $2,
          category     = COALESCE($3::expense_category, category),
          department   = $4,
          amount       = COALESCE($5, amount),
          status       = COALESCE($6::expense_status, status),
          expense_date = COALESCE($7, expense_date),
          updated_at   = NOW()
        WHERE id = $8
      `,
      params: [
        payload.title ?? null,
        payload.description ?? null,
        payload.category ?? null,
        payload.department ?? null,
        payload.amount ?? null,
        payload.status ?? null,
        payload.expense_date ?? null,
        expenseId,
      ],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("updateExpense:", err);
    return { success: false, error: "Failed to update expense." };
  }
}

export async function deleteExpense(
  expenseId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({ sql: `DELETE FROM expenses WHERE id = $1`, params: [expenseId] });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("deleteExpense:", err);
    return { success: false, error: "Failed to delete expense." };
  }
}

export async function createInsuranceClaim(
  payload: CreateInsuranceClaimPayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `
        INSERT INTO insurance_claims
          (invoice_id, patient_id, provider, policy_number, claimed_amount, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      params: [
        payload.invoice_id,
        payload.patient_id,
        payload.provider,
        payload.policy_number || null,
        payload.claimed_amount,
        payload.notes || null,
      ],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("createInsuranceClaim:", err);
    return { success: false, error: "Failed to create insurance claim." };
  }
}

export async function updateInsuranceClaim(
  claimId: string,
  status: InsuranceClaimStatus,
  approvedAmount?: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `
        UPDATE insurance_claims
        SET
          status          = $1::insurance_claim_status,
          approved_amount = COALESCE($2, approved_amount),
          resolved_at     = CASE WHEN $1 IN ('approved', 'rejected', 'partial') THEN NOW() ELSE resolved_at END,
          submitted_at    = CASE WHEN $1 = 'submitted' THEN NOW() ELSE submitted_at END,
          updated_at      = NOW()
        WHERE id = $3
      `,
      params: [status, approvedAmount ?? null, claimId],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("updateInsuranceClaim:", err);
    return { success: false, error: "Failed to update insurance claim." };
  }
}

export async function saveInsuranceClaimDocument(
  claimId: string,
  documentUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `UPDATE insurance_claims SET document_url = $1, updated_at = NOW() WHERE id = $2`,
      params: [documentUrl, claimId],
    });
    revalidatePath("/[locale]/finance", "page");
    return { success: true };
  } catch (err) {
    console.error("saveInsuranceClaimDocument:", err);
    return { success: false, error: "Failed to save document." };
  }
}

// ── Radiology Pricing ──────────────────────────────────────────────────────

export async function getRadiologyPricing(): Promise<import("@/types/finance").RadiologyPricing[]> {
  return queryMany<import("@/types/finance").RadiologyPricing>({
    sql: `SELECT image_type, price, updated_at FROM radiology_pricing ORDER BY image_type`,
  });
}

export async function updateRadiologyPrice(
  imageType: string,
  price: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `
        INSERT INTO radiology_pricing (image_type, price)
        VALUES ($1, $2)
        ON CONFLICT (image_type) DO UPDATE SET price = EXCLUDED.price
      `,
      params: [imageType, price],
    });
    return { success: true };
  } catch (err) {
    console.error("updateRadiologyPrice:", err);
    return { success: false, error: "Failed to update radiology price." };
  }
}

// ── Today Bench ────────────────────────────────────────────────────────────

export async function getTodayPaymentsDetail(): Promise<TodayPayment[]> {
  try {
    return await queryMany<TodayPayment>({
      sql: `
        SELECT
          pay.id, pay.payment_ref, pay.amount, pay.method, pay.paid_at,
          p.full_name AS patient_name, p.patient_code,
          i.invoice_number
        FROM payments pay
        JOIN invoices i ON i.id = pay.invoice_id
        JOIN patients p ON p.id = i.patient_id
        WHERE pay.status = 'completed' AND pay.paid_at::DATE = CURRENT_DATE
        ORDER BY pay.paid_at DESC
      `,
    });
  } catch (err) {
    console.error("getTodayPaymentsDetail:", err);
    return [];
  }
}

export async function getTodayExpensesDetail(): Promise<Expense[]> {
  try {
    return await queryMany<Expense>({
      sql: `SELECT * FROM expenses WHERE expense_date = CURRENT_DATE ORDER BY created_at DESC`,
    });
  } catch (err) {
    console.error("getTodayExpensesDetail:", err);
    return [];
  }
}

export async function getInsuranceClaimsWithDetails(
  filters: InsuranceClaimFilters = {},
): Promise<InsuranceClaimDetail[]> {
  const { status, dateFrom, dateTo } = filters;

  const statusParam = !status || status === "all" ? null : status;
  const dateFromParam = dateFrom || null;
  const dateToParam = dateTo || null;

  const where = `
    WHERE ($1::insurance_claim_status IS NULL OR ic.status = $1::insurance_claim_status)
      AND ($2::DATE IS NULL OR ic.created_at::DATE >= $2::DATE)
      AND ($3::DATE IS NULL OR ic.created_at::DATE <= $3::DATE)
  `;

  return queryMany<InsuranceClaimDetail>({
    sql: `
      SELECT
        ic.*,
        p.full_name AS patient_name, p.patient_code,
        i.invoice_number
      FROM insurance_claims ic
      JOIN patients p ON p.id = ic.patient_id
      JOIN invoices i ON i.id = ic.invoice_id
      ${where}
      ORDER BY ic.created_at DESC
    `,
    params: [statusParam, dateFromParam, dateToParam],
  });
}
