// types/patients.ts

export interface PatientSummary {
  // Identity
  patient_id: string;
  patient_code: string;
  full_name: string;
  gender: "male" | "female" | "";
  dob: string;
  age: number;

  // Contact
  phone: string;
  email: string;
  address: string;

  // Emergency
  emergency_contact_name: string;
  emergency_contact_phone: string;

  // Insurance
  insurance_company_id?: string;
  insurance_company_name?: string;
  insurance_number: string;

  // Meta
  notes: string;
  is_active: boolean;
  created_at: string;

  // Last visit
  last_visit: string | null;
  last_diagnosis: string | null;

  // Financial
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  invoice_count: number;

  // Appointments
  total_appointments: number;

  // Alerts
  alert_count: number;
  has_critical_alert: boolean;
}

export interface MedicalAlert {
  id: string;
  alert_type: "allergy" | "condition" | "medication";
  description: string;
  severity: "low" | "medium" | "high";
  created_at: string;
}

export type { RadiologyAsset } from "@/types/radiology";
import type { RadiologyAsset } from "@/types/radiology";

export interface VisitRecord {
  id: string;
  appointment_id: string;
  diagnosis: string | null;
  procedure_type?: string | null;
  procedure_done: string | null;
  procedure_notes: string | null;
  prescription: string | null;
  follow_up_date: string | null;
  tooth_chart?: import("./dentalChart").AnnotationMap | null;
  doctor_name: string;
  doctor_specialty: string;
  created_at: string;
  assets: RadiologyAsset[];
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  total: number;
  amount_paid: number;
  outstanding: number;
  status: string;
  created_at: string;
}

export interface PatientDetails {
  alerts: MedicalAlert[];
  visits: VisitRecord[];
  invoices: InvoiceRecord[];
}

export interface PatientStats {
  total: number;
  newThisMonth: number;
  critical: number;
  insured: number;
}
