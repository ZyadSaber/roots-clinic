"use server";

import { revalidatePath } from "next/cache";
import { queryMany, queryOne, execute, executeTransaction } from "@/lib/pg";
import {
  Appointment,
  AppointmentPayload,
  AppointmentStats,
} from "@/types/appointments";

export async function getAppointmentsStatsByDate(
  date: Date,
): Promise<AppointmentStats> {
  try {
    const sql = `
      SELECT
        (SELECT COUNT(*) FROM appointments  WHERE DATE(appointment_date) = $1  ) AS total,
  		  (SELECT COUNT(*) FROM appointments  WHERE status='completed' AND DATE(appointment_date) = $1) AS completed,
        (SELECT COUNT(*) FROM appointments  WHERE status='no_show' AND DATE(appointment_date) = $1) AS no_show,
        (SELECT COUNT(*) FROM appointments  WHERE status='cancelled' AND DATE(appointment_date) = $1) AS cancelled,
        (SELECT COUNT(*) FROM appointments  WHERE status='arrived' AND DATE(appointment_date) = $1) AS arrived,
        (SELECT COUNT(*) FROM appointments  WHERE status='in_chair' AND DATE(appointment_date) = $1) AS in_chair,
        (SELECT COUNT(*) FROM appointments  WHERE status='pending' AND DATE(appointment_date) = $1) AS pending,
        (SELECT COUNT(*) FROM appointments  WHERE status='confirmed' AND DATE(appointment_date) = $1) AS confirmed,
        (SELECT MIN(start_time) FROM doctor_schedules WHERE day_of_week = EXTRACT(DOW FROM $1::date)) AS start_time,
        (SELECT MAX(end_time) FROM doctor_schedules WHERE day_of_week = EXTRACT(DOW FROM $1::date)) AS end_time
    `;
    return await queryOne<AppointmentStats>({ sql, params: [date] });
  } catch (error) {
    console.error("Error fetching appointments stats:", error);
    throw error;
  }
}

export async function getAllAppointments(date: Date): Promise<Appointment[]> {
  try {
    const sql = `
      SELECT 
        a.id,
	      a.patient_id,
	      p.full_name AS patient_name,
	      p.patient_code,
	      a.doctor_id,
        s.full_name AS doctor_name,
	      a.appointment_date,
	      a.arrived_at,
	      a.completed_at,
	      a.duration_mins,
	      a.procedure_type,
	      a.status,
	      a.notes,
	      a.priority
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
	    JOIN doctors d on d.id = a.doctor_id
      JOIN staff s ON s.id = d.staff_id
      WHERE DATE(a.appointment_date) = $1
      ORDER BY a.appointment_date ASC
    `;
    return await queryMany<Appointment>({ sql, params: [date] });
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    throw error;
  }
}

export async function createAppointment(
  payload: AppointmentPayload,
): Promise<{ success: boolean; data?: Appointment; error?: string }> {
  const {
    patient_id,
    doctor_id,
    appointment_date,
    duration_mins,
    procedure_type,
    notes,
  } = payload;

  try {
    const result = await queryOne<Appointment>({
      sql: `
        INSERT INTO appointments (
          patient_id,
          doctor_id,
          appointment_date,
          duration_mins,
          procedure_type,
          status,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, 'pending', $6)
        RETURNING *
      `,
      params: [
        patient_id,
        doctor_id,
        appointment_date,
        duration_mins,
        procedure_type,
        notes || "",
      ],
    });

    if (result) {
      revalidatePath("/appointments");
      return { success: true, data: result };
    }
    return { success: false, error: "Failed to create appointment" };
  } catch (error) {
    console.error("Error creating appointment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

export async function getAppointmentsByDoctor(
  doctorId: string,
  date: Date,
): Promise<Appointment[]> {
  const sql = `
    SELECT
      a.id,
      a.patient_id,
      p.full_name AS patient_name,
      p.patient_code,
      a.doctor_id,
      s.full_name AS doctor_name,
      a.appointment_date,
      a.arrived_at,
      a.completed_at,
      a.duration_mins,
      a.procedure_type,
      a.status,
      a.notes,
      a.priority,
      EXISTS (
        SELECT 1 FROM radiology_requests rr
        WHERE rr.appointment_id = a.id AND rr.status = 'pending'
      ) AS awaiting_radiology
    FROM appointments a
    JOIN patients p ON p.id = a.patient_id
    JOIN doctors d ON d.id = a.doctor_id
    JOIN staff s ON s.id = d.staff_id
    WHERE a.doctor_id = $1 AND DATE(a.appointment_date) = $2
    ORDER BY a.appointment_date ASC
  `;
  return queryMany<Appointment>({ sql, params: [doctorId, date] });
}

export async function getDoctorAppointmentStats(
  doctorId: string,
  date: Date,
): Promise<{ confirmed: number; arrived: number; in_chair: number; completed: number; total: number }> {
  return queryOne({
    sql: `
      SELECT
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'arrived')   AS arrived,
        COUNT(*) FILTER (WHERE status = 'in_chair')  AS in_chair,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) AS total
      FROM appointments
      WHERE doctor_id = $1 AND DATE(appointment_date) = $2
    `,
    params: [doctorId, date],
  });
}

export async function startVisit(
  appointmentId: string,
  patientId: string,
  doctorId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await executeTransaction(async (client) => {
      await client.query(
        `UPDATE appointments SET
           status     = 'in_chair'::appointment_status,
           updated_at = NOW()
         WHERE id = $1`,
        [appointmentId],
      );
      await client.query(
        `INSERT INTO visit_records (appointment_id, patient_id, doctor_id)
         VALUES ($1, $2, $3)`,
        [appointmentId, patientId, doctorId],
      );
    });
    revalidatePath("/appointments");
    return { success: true };
  } catch (error) {
    console.error("Error starting visit:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await execute({
      sql: `
        UPDATE appointments SET
          status       = $1::appointment_status,
          arrived_at   = CASE WHEN $1::appointment_status = 'arrived'   THEN COALESCE(arrived_at,   NOW()) ELSE arrived_at   END,
          completed_at = CASE WHEN $1::appointment_status = 'completed' THEN COALESCE(completed_at, NOW()) ELSE completed_at END,
          updated_at   = NOW()
        WHERE id = $2
      `,
      params: [status, id],
    });

    if (result && (result.rowCount ?? 0) > 0) {
      revalidatePath("/appointments");
      return { success: true };
    }
    return { success: false, error: "Appointment not found" };
  } catch (error) {
    console.error("Error updating appointment status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}
