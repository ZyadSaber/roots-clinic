export type AppointmentStats = Record<AppointmentStatus | "total", number> & {
  start_time: string;
  end_time: string;
};

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "in_chair"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_code: string;
  doctor_id: string;
  doctor_name: string;
  appointment_date: string;
  arrived_at: string;
  completed_at: string;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  procedure_type: string;
  priority: "normal" | "urgent";
  duration_mins: string;
  awaiting_radiology: boolean;
}

export interface AppointmentPayload {
  patient_id: string;
  doctor_id: string;
  appointment_date: string; // full ISO datetime e.g. "2025-01-15T09:30:00"
  duration_mins: number;
  procedure_type: string;
  notes?: string;
}

export type { RadiologyRequestStatus, RadiologyRequest } from "@/types/radiology";

export interface AppointmentFilters {
  search: string;
  status: AppointmentStatus | "All";
  doctor_id: string | "All";
  date: string | null;
}
