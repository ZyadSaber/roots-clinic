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
}

export interface AppointmentPayload {
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  duration: string;
  type: string;
  notes?: string;
}

export interface AppointmentFilters {
  search: string;
  status: AppointmentStatus | "All";
  doctor_id: string | "All";
  date: string | null;
}
