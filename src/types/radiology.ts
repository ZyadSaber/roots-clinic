export type RadiologyImageType = "panoramic" | "bitewing" | "periapical";

export type RadiologyRequestStatus = "pending" | "completed";

export interface RadiologyAsset {
  id: string;
  image_type: RadiologyImageType | string;
  image_url: string;
  notes: string | null;
  taken_at: string;
}

export interface RadiologyRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  visit_id: string | null;
  uploaded_by_name: string | null;
  image_type: RadiologyImageType | string;
  image_url: string;
  notes: string | null;
  taken_at: string;
}

export interface RadiologyRequest {
  id: string;
  appointment_id: string;
  visit_id: string | null;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  doctor_name: string | null;
  procedure_type: string | null;
  appointment_date: string;
  status: RadiologyRequestStatus;
  requested_at: string;
  completed_at: string | null;
}

export interface RadiologyStats {
  total: number;
  panoramic: number;
  bitewing: number;
  periapical: number;
}
