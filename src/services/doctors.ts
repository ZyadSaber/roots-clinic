"use server";

import isArrayHasData from "@/lib/isArrayHasData";
import { queryMany, execute, pool } from "@/lib/pg";
import { DoctorScheduleRecord, UpsertDoctorData } from "@/types/database";
import { DoctorSummary, DoctorFormData } from "@/types/doctors";
import { revalidatePath } from "next/cache";

export async function updateDoctor(
  data: DoctorFormData & { id?: string; staff_id?: string },
) {
  try {
    if (!data.id || !data.staff_id) {
      return { success: false, error: "Missing doctor ID or staff ID" };
    }

    // 1. Update staff
    await execute({
      sql: `UPDATE staff SET full_name = $1, phone = $2, avatar_url = $3, updated_at = NOW() WHERE id = $4`,
      params: [
        data.name,
        data.phone || null,
        data.avatar_url || null,
        data.staff_id,
      ],
    });

    // 2. Update doctors
    await execute({
      sql: `UPDATE doctors SET specialty_id = $1, consultation_fee = $2, years_experience = $3, status = $4, updated_at = NOW() WHERE id = $5`,
      params: [
        data.specialty_id || null,
        data.consultation_fee,
        data.years_experience,
        data.status,
        data.id,
      ],
    });

    // 3. Update schedules
    await execute({
      sql: `DELETE FROM doctor_schedules WHERE doctor_id = $1`,
      params: [data.id],
    });

    if (data.schedule && data.schedule.length > 0) {
      for (const slot of data.schedule) {
        await execute({
          sql: `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_active) VALUES ($1, $2, $3, $4, $5)`,
          params: [
            data.id,
            slot.day_of_week,
            slot.start_time,
            slot.end_time,
            slot.is_active,
          ],
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating doctor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function fetchAvailableDoctors(): Promise<DoctorSummary[]> {
  const sql = `
    SELECT 
      d.id,
      d.staff_id,
      d.bio,
      s.phone,
      s.full_name as name,
      s.avatar_url,
      sp.english_name as en,
      sp.arabic_name as ar,
      d.consultation_fee,
      d.years_experience,
      d.rating,
      d.review_count,
      d.status,
      d.specialty_id
    FROM doctors d
    JOIN staff s ON d.staff_id = s.id
    LEFT JOIN specialties sp ON d.specialty_id = sp.id
    WHERE s.is_active = TRUE
    ORDER BY s.full_name ASC
  `;
  return (await queryMany({ sql })) as DoctorSummary[];
}

export async function getDoctorSchedule(
  doctorId: string,
): Promise<DoctorScheduleRecord[]> {
  const sql = `
    SELECT 
      id, 
      doctor_id,
      day_of_week,
      start_time, 
      end_time,
      is_active
    FROM doctor_schedules

    WHERE doctor_id = $1
    ORDER BY day_of_week ASC
  `;
  return (await queryMany({
    sql,
    params: [doctorId],
  })) as DoctorScheduleRecord[];
}

export async function createDoctor(data: DoctorFormData) {
  const client = await pool.connect();
  let doctorId: string | null = null;

  const {
    name,
    specialty_id,
    status,
    avatar_url,
    years_experience,
    phone,
    consultation_fee,
    schedule,
  } = data;

  const username = name
    .toLowerCase()
    .replace(/^dr\.\s*/, "dr.")
    .split(" ")
    .slice(0, 2)
    .join(".");

  try {
    await client.query("BEGIN");

    const sql = `
        INSERT INTO doctors
        (name, specialty_id, avatar_url, years_experience, phone, consultation_fee, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;

    const doctorResult = await execute({
      sql,
      params: [
        username,
        specialty_id,
        avatar_url || "",
        years_experience,
        phone || "",
        consultation_fee,
        status,
      ],
    });

    doctorId = doctorResult.rows[0].id;

    if (isArrayHasData(schedule)) {
      // Build a multi-row insert instead of looping queries
      const values: unknown[] = [];
      const placeholders = schedule.map((slot, i) => {
        const base = i * 5;
        values.push(
          doctorId,
          slot.day_of_week,
          slot.start_time,
          slot.end_time,
          slot.is_active,
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      });

      await client.query(
        `INSERT INTO doctor_schedules
          (doctor_id, day_of_week, start_time, end_time, is_active)
          VALUES ${placeholders.join(", ")}`,
        values,
      );
    }

    await client.query("COMMIT");
    return { success: true, doctorId };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("[addDoctor] failed:", error);
    return { success: false, error: "Failed to add doctor." };
  } finally {
    client.release();
  }
  // Update existing doctor
  // const sql = `
  //     UPDATE doctors
  //     SET
  //       consultation_fee = $1,
  //       years_experience = $2,
  //       status = $3,
  //       updated_at = NOW()
  //     WHERE id = $4
  //   `;
  // await execute({
  //   sql,
  //   params: [],
  // });

  // revalidatePath("/[locale]/doctors", "page");
  // return { success: true };
}
