export interface Specialty {
  id: string;
  arabic_name: string;
  english_name: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DoctorRecord {
  id: string;
  name: string;
  image: string | null;
  specialty_en: string | null;
  specialty_ar: string | null;
  fee: string | number;
  exp: number;
  rating: string | number;
  reviews: number;
  status: string;
}

export interface DoctorScheduleRecord {
  id: string;
  doctor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface UpsertDoctorData {
  id?: string;
  name: string;
  specialty_id?: string;
  fee: number;
  exp: number;
  status: string;
  image?: string;
  schedule?: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }[];
}
