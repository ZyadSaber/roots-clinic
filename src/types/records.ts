export interface VisitRecordRow {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  doctor_id: string;
  doctor_name: string;
  specialty_en: string;
  specialty_ar: string;
  diagnosis: string | null;
  procedure_type: string | null;
  procedure_done: string | null;
  procedure_notes: string | null;
  prescription: string | null;
  follow_up_date: string | null;
  created_at: string;
  radiology_count: number;
}

export interface VisitRecordStats {
  total: number;
  with_follow_up: number;
  with_prescription: number;
  with_radiology: number;
}
