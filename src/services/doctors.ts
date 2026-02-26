"use server";

import { queryMany, execute } from "@/lib/pg";
import {
  DoctorRecord,
  DoctorScheduleRecord,
  UpsertDoctorData,
} from "@/types/database";
import { revalidatePath } from "next/cache";

export async function getDoctors(): Promise<DoctorRecord[]> {
  const sql = `
    SELECT 
      d.id,
      s.full_name as name,
      s.avatar_url as image,
      sp.english_name as specialty_en,
      sp.arabic_name as specialty_ar,
      d.consultation_fee as fee,
      d.years_experience as exp,
      d.rating,
      d.review_count as reviews,
      d.status
    FROM doctors d
    JOIN staff s ON d.staff_id = s.id
    LEFT JOIN specialties sp ON d.specialty_id = sp.id
    WHERE s.is_active = TRUE
    ORDER BY s.full_name ASC
  `;
  return (await queryMany({ sql })) as DoctorRecord[];
}

export async function getDoctorSchedule(
  doctorId: string,
): Promise<DoctorScheduleRecord[]> {
  const sql = `
    SELECT id, doctor_id, day_of_week, start_time, end_time, is_active
    FROM doctor_schedules
    WHERE doctor_id = $1
    ORDER BY day_of_week ASC
  `;
  return (await queryMany({
    sql,
    params: [doctorId],
  })) as DoctorScheduleRecord[];
}

export async function saveDoctor(data: UpsertDoctorData) {
  if (data.id) {
    // Update existing doctor
    const sql = `
      UPDATE doctors 
      SET 
        consultation_fee = $1,
        years_experience = $2,
        status = $3,
        updated_at = NOW()
      WHERE id = $4
    `;
    await execute({
      sql,
      params: [data.fee, data.exp, data.status, data.id],
    });
  }

  revalidatePath("/[locale]/doctors", "page");
  return { success: true };
}
