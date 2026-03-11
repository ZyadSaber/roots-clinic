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
  insurance_provider: string;
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

export interface VitalRecord {
  id: string;
  blood_pressure: string | null;
  heart_rate: number | null;
  temperature: number | null;
  weight: number | null;
  notes: string | null;
  recorded_at: string;
}

export interface VisitRecord {
  id: string;
  appointment_id: string;
  diagnosis: string | null;
  procedure_type?: string | null;
  procedure_done: string | null;
  procedure_notes: string | null;
  prescription: string | null;
  follow_up_date: string | null;
  doctor_name: string;
  doctor_specialty_en: string;
  doctor_specialty_ar: string;
  created_at: string;
  assets?: RadiologyAsset[];
}

export interface RadiologyAsset {
  id: string;
  image_type: "panoramic" | "bitewing" | "periapical" | string;
  image_url: string;
  notes: string | null;
  taken_at: string;
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
  vitals: VitalRecord[];
  visits: VisitRecord[];
  invoices: InvoiceRecord[];
}

export interface PatientStats {
  total: number;
  newThisMonth: number;
  critical: number;
  insured: number;
}
