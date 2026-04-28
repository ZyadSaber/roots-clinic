export type InvoiceStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'insurance' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type InsuranceClaimStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'partial';
export type ExpenseCategory = 'fixed' | 'inventory' | 'personnel' | 'service' | 'utility' | 'other';
export type ExpenseStatus = 'paid' | 'pending' | 'overdue';

export interface FinanceKPIs {
  monthly_revenue: number;
  prev_month_revenue: number;
  monthly_expenses: number;
  prev_month_expenses: number;
  total_outstanding: number;
  outstanding_invoice_count: number;
  today_expenses: number;
  today_income: number
}

export interface Invoice {
  id: string;
  invoice_number: string;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  visit_id: string | null;
  doctor_id: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  outstanding: number;
  status: InvoiceStatus;
  due_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RadiologyPricing {
  image_type: string;
  price: number;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  doctor_id: string | null;
  doctor_name: string | null;
  service_name: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  total: number;
  created_at: string;
}

export interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  payments: Payment[];
  insurance_claims: InsuranceClaim[];
}

export interface Payment {
  id: string;
  payment_ref: string;
  invoice_id: string;
  patient_id: string;
  received_by: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_ref: string | null;
  notes: string | null;
  paid_at: string;
  created_at: string;
}

export interface InsuranceClaim {
  id: string;
  invoice_id: string;
  patient_id: string;
  provider: string;
  policy_number: string | null;
  claimed_amount: number;
  approved_amount: number;
  status: InsuranceClaimStatus;
  submitted_at: string | null;
  resolved_at: string | null;
  notes: string | null;
  document_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  title: string;
  description: string | null;
  category: ExpenseCategory;
  department: string | null;
  amount: number;
  status: ExpenseStatus;
  added_by: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ExpenseFilters {
  status?: ExpenseStatus | 'all';
  category?: ExpenseCategory | 'all';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface InsuranceClaimFilters {
  status?: InsuranceClaimStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateInvoicePayload {
  patient_id: string;
  visit_id?: string;
  due_date?: string;
  notes?: string;
  discount?: number;
  tax?: number;
  created_by?: string;
}

export interface AddInvoiceItemPayload {
  invoice_id: string;
  doctor_id?: string;
  service_name: string;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
}

export interface RecordPaymentPayload {
  invoice_id: string;
  patient_id: string;
  amount: number;
  method: PaymentMethod;
  transaction_ref?: string;
  notes?: string;
  received_by?: string;
}

export interface CreateExpensePayload {
  title: string;
  description?: string;
  category: ExpenseCategory;
  department?: string;
  amount: number;
  status?: ExpenseStatus;
  expense_date: string;
  added_by?: string;
}

export interface FinancePeriodStats {
  period_revenue: number;
  period_expenses: number;
  period_outstanding: number;
  period_outstanding_count: number;
}

export interface CreateInsuranceClaimPayload {
  invoice_id: string;
  patient_id: string;
  provider: string;
  policy_number?: string;
  claimed_amount: number;
  notes?: string;
}

export interface InsuranceClaimDetail extends InsuranceClaim {
  patient_name: string;
  patient_code: string;
  invoice_number: string;
}

export interface TodayPayment {
  id: string;
  payment_ref: string;
  patient_name: string;
  patient_code: string;
  invoice_number: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
}
