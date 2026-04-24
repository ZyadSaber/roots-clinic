import { z } from "zod";

export const createInvoiceSchema = z.object({
  patient_id: z.string().min(1, "Please select a patient"),
  visit_id: z.string().uuid().optional().or(z.literal("")),
  due_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
});
export type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>;

export const addInvoiceItemSchema = z.object({
  service_name: z.string().min(1, "Service name is required").max(150),
  doctor_id: z.string().optional().or(z.literal("")),
  quantity: z.number().int().min(1, "Minimum 1").max(999),
  unit_price: z.number().min(0.01, "Price must be greater than 0"),
  discount_pct: z.number().min(0).max(100).optional(),
});
export type AddInvoiceItemValues = z.infer<typeof addInvoiceItemSchema>;

export const recordPaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  method: z.enum(["cash", "card", "insurance", "bank_transfer"]),
  transaction_ref: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});
export type RecordPaymentValues = z.infer<typeof recordPaymentSchema>;

export const createExpenseSchema = z.object({
  title: z.string().min(2, "Title is required").max(150),
  description: z.string().max(1000).optional().or(z.literal("")),
  category: z.enum(["fixed", "inventory", "personnel", "service", "utility", "other"]),
  department: z.string().max(50).optional().or(z.literal("")),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  status: z.enum(["paid", "pending", "overdue"]).optional(),
  expense_date: z.string().min(1, "Date is required"),
});
export type CreateExpenseValues = z.infer<typeof createExpenseSchema>;

export const createInsuranceClaimSchema = z.object({
  provider: z.string().min(1, "Provider is required").max(100),
  policy_number: z.string().max(100).optional().or(z.literal("")),
  claimed_amount: z.number().min(0.01, "Amount must be greater than 0"),
  notes: z.string().max(500).optional().or(z.literal("")),
});
export type CreateInsuranceClaimValues = z.infer<typeof createInsuranceClaimSchema>;
