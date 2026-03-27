import { Module } from "./navigation";

export type StaffRole = "admin" | "doctor" | "receptionist" | "finance";

export type UserPermissions = Record<Module, boolean>;

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: StaffRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  last_sign_in_at: string;

  permissions: UserPermissions;

  // from auth.users via staff_with_email view
  email: string;

  // from doctors → specialties join (null for non-doctors)
  specialty: string;
  specialty_id: string | null;
  auth_id: string;
}

export interface UserPayload {
  username: string;
  full_name: string;
  role: StaffRole;
  phone?: string;
  avatar_url?: string;
  specialty_id?: string;
}

// for the create/invite form (admin creates a new staff member)
export interface CreateUserPayload extends UserPayload {
  email: string; // goes to Supabase Auth
  password: string; // goes to Supabase Auth
}

// for the edit form (updating staff row only, email is immutable)
export interface UpdateUserPayload extends Partial<UserPayload> {
  id: string;
}
