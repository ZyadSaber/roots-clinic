export type DoctorStatus =
  | "available"
  | "in_session"
  | "on_break"
  | "away"
  | "off_duty";

// Lightweight version — used in dropdowns, appointment booking, command center
export interface DoctorSummary {
  en: string;
  ar: string;
  id: string; // doctors.id (not staff.id)
  staff_id: string;
  name: string; // from staff table
  consultation_fee: number;
  status: DoctorStatus;
  rating: number;
  avatar_url?: string;
  review_count: number;
  years_experience: number;
}

export interface DoctorState {
  // The lightweight list used across modules (booking form, command center)
  availableDoctors: DoctorSummary[];

  // Directory page filters
  filters: {
    status: DoctorStatus | "all";
    specialtyId: string | null;
    searchQuery: string;
  };

  // Which doctor is selected in the directory
  selectedDoctorId: string | null;

  // Async state
  loading: boolean;
  error: string | null;
}
