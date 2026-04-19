"use server";

import { queryOne, queryMany, execute } from "@/lib/pg";
import { VisitRecord, RadiologyAsset } from "@/types/patients";

export async function getVisitByAppointmentId(
  appointmentId: string,
): Promise<VisitRecord | null> {
  return queryOne<VisitRecord>({
    sql: `
      SELECT
        vr.id,
        vr.appointment_id,
        vr.patient_id,
        vr.doctor_id,
        vr.diagnosis,
        vr.procedure_done,
        vr.procedure_notes,
        vr.prescription,
        vr.follow_up_date,
        vr.created_at,
        s.full_name       AS doctor_name,
        sp.english_name   AS doctor_specialty_en,
        sp.arabic_name    AS doctor_specialty_ar,
        a.procedure_type
      FROM visit_records vr
      JOIN doctors       d  ON vr.doctor_id     = d.id
      JOIN staff         s  ON d.staff_id        = s.id
      LEFT JOIN specialties sp ON d.specialty_id = sp.id
      LEFT JOIN appointments a ON vr.appointment_id = a.id
      WHERE vr.appointment_id = $1
    `,
    params: [appointmentId],
  });
}

export async function getRadiologyByVisitId(
  visitId: string,
): Promise<RadiologyAsset[]> {
  return queryMany<RadiologyAsset>({
    sql: `
      SELECT id, image_type, image_url, notes, taken_at
      FROM radiology_assets
      WHERE visit_id = $1
      ORDER BY taken_at ASC
    `,
    params: [visitId],
  });
}

export interface VisitUpdatePayload {
  diagnosis?: string;
  procedure_done?: string;
  procedure_notes?: string;
  prescription?: string;
  follow_up_date?: string | null;
}

export async function updateVisitRecord(
  visitId: string,
  data: VisitUpdatePayload,
): Promise<{ success: boolean; error?: string }> {
  try {
    await execute({
      sql: `
        UPDATE visit_records SET
          diagnosis       = COALESCE($1, diagnosis),
          procedure_done  = COALESCE($2, procedure_done),
          procedure_notes = COALESCE($3, procedure_notes),
          prescription    = COALESCE($4, prescription),
          follow_up_date  = $5
        WHERE id = $6
      `,
      params: [
        data.diagnosis ?? null,
        data.procedure_done ?? null,
        data.procedure_notes ?? null,
        data.prescription ?? null,
        data.follow_up_date ?? null,
        visitId,
      ],
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating visit record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database error",
    };
  }
}
