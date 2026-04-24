"use server";

import { queryOne, queryMany } from "@/lib/pg";

export interface DashboardStats {
  total_appointments: number;
  pending: number;
  confirmed: number;
  arrived: number;
  in_chair: number;
  completed: number;
  cancelled: number;
  no_show: number;
  total_visits: number;
  pending_radiology: number;
}

export interface DashboardAppointment {
  id: string;
  patient_name: string;
  patient_code: string;
  doctor_name: string;
  appointment_date: string;
  procedure_type: string | null;
  status: string;
  priority: "normal" | "urgent";
  duration_mins: number;
}

export interface PendingRadiologyItem {
  id: string;
  patient_name: string;
  patient_code: string;
  procedure_type: string | null;
  doctor_name: string | null;
  requested_at: string;
}

export async function getDashboardStats(date: Date): Promise<DashboardStats> {
  const d = date.toISOString().slice(0, 10);
  const row = await queryOne<DashboardStats>({
    sql: `
      SELECT
        (SELECT COUNT(*) FROM appointments WHERE DATE(appointment_date) = $1)::int              AS total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status='pending'   AND DATE(appointment_date) = $1)::int AS pending,
        (SELECT COUNT(*) FROM appointments WHERE status='confirmed' AND DATE(appointment_date) = $1)::int AS confirmed,
        (SELECT COUNT(*) FROM appointments WHERE status='arrived'   AND DATE(appointment_date) = $1)::int AS arrived,
        (SELECT COUNT(*) FROM appointments WHERE status='in_chair'  AND DATE(appointment_date) = $1)::int AS in_chair,
        (SELECT COUNT(*) FROM appointments WHERE status='completed' AND DATE(appointment_date) = $1)::int AS completed,
        (SELECT COUNT(*) FROM appointments WHERE status='cancelled' AND DATE(appointment_date) = $1)::int AS cancelled,
        (SELECT COUNT(*) FROM appointments WHERE status='no_show'   AND DATE(appointment_date) = $1)::int AS no_show,
        (SELECT COUNT(*) FROM visit_records WHERE DATE(created_at) = $1)::int                  AS total_visits,
        (SELECT COUNT(*) FROM radiology_requests WHERE status = 'pending')::int                AS pending_radiology
    `,
    params: [d],
  });
  return (
    row ?? {
      total_appointments: 0,
      pending: 0,
      confirmed: 0,
      arrived: 0,
      in_chair: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
      total_visits: 0,
      pending_radiology: 0,
    }
  );
}

export async function getDashboardAppointments(
  date: Date,
): Promise<DashboardAppointment[]> {
  const d = date.toISOString().slice(0, 10);
  return queryMany<DashboardAppointment>({
    sql: `
      SELECT
        a.id,
        p.full_name          AS patient_name,
        p.patient_code,
        s.full_name          AS doctor_name,
        a.appointment_date,
        a.procedure_type,
        a.status,
        a.priority,
        a.duration_mins
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN doctors  d ON d.id = a.doctor_id
      JOIN staff    s ON s.id = d.staff_id
      WHERE DATE(a.appointment_date) = $1
        AND a.status NOT IN ('cancelled', 'no_show')
      ORDER BY a.appointment_date ASC
      LIMIT 8
    `,
    params: [d],
  });
}

export async function getPendingRadiologyQueue(): Promise<
  PendingRadiologyItem[]
> {
  return queryMany<PendingRadiologyItem>({
    sql: `
      SELECT
        rr.id,
        p.full_name        AS patient_name,
        p.patient_code,
        a.procedure_type,
        s.full_name        AS doctor_name,
        rr.requested_at
      FROM radiology_requests rr
      JOIN appointments a  ON a.id  = rr.appointment_id
      JOIN patients     p  ON p.id  = rr.patient_id
      LEFT JOIN doctors  d  ON d.id  = a.doctor_id
      LEFT JOIN staff    s  ON s.id  = d.staff_id
      WHERE rr.status = 'pending'
      ORDER BY rr.requested_at ASC
      LIMIT 5
    `,
    params: [],
  });
}
