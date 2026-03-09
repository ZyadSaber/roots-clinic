"use server";

import isArrayHasData from "@/lib/isArrayHasData";
import { queryMany, executeTransaction } from "@/lib/pg";
import { DoctorScheduleRecord } from "@/types/database";
import { DoctorSummary, DoctorFormData } from "@/types/doctors";
import { revalidatePath } from "next/cache";

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

    WHERE doctor_id = $1 AND is_active = TRUE
    ORDER BY day_of_week ASC
  `;
  return (await queryMany({
    sql,
    params: [doctorId],
  })) as DoctorScheduleRecord[];
}

export async function createDoctor(data: DoctorFormData) {
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

  let staffId: string | null = null;
  let doctorId: string;

  try {
    const { doctor_id } = await executeTransaction(async (client) => {
      const staffResult = await client.query(
        `
                INSERT INTO staff (username, full_name, role, phone, avatar_url, is_active)
                VALUES ($1, $2, 'doctor', $3, $4, TRUE)
                RETURNING id
              `,
        [username, name, phone || "", avatar_url || ""],
      );
      staffId = staffResult.rows[0].id;

      const doctorResult = await client.query(
        `
                INSERT INTO doctors (staff_id, specialty_id, consultation_fee, years_experience, status)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
              `,
        [staffId, specialty_id, consultation_fee, years_experience, status],
      );
      doctorId = doctorResult.rows[0].id;

      if (isArrayHasData(schedule)) {
        const values: (string | number | boolean)[] = [];
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

        console.log(schedule, placeholders, values);

        await client.query(
          `INSERT INTO doctor_schedules
          (doctor_id, day_of_week, start_time, end_time, is_active)
          VALUES ${placeholders.join(", ")}`,
          values,
        );
      }

      return { doctor_id: doctorId };
    });

    revalidatePath("/[locale]/doctors", "page");
    revalidatePath("/[locale]/patients", "page");
    return { success: true, doctor_id };
  } catch (error) {
    console.error("[addDoctor] failed:", error);
    return { success: false, error: "Failed to add doctor." };
  }
}

export async function updateDoctor(data: DoctorFormData) {
  const {
    name,
    specialty_id,
    status,
    avatar_url,
    years_experience,
    phone,
    consultation_fee,
    schedule,
    id: doctorId,
    staff_id: staffId,
  } = data;

  const username = name
    .toLowerCase()
    .replace(/^dr\.\s*/, "dr.")
    .split(" ")
    .slice(0, 2)
    .join(".");

  if (doctorId && staffId) {
    try {
      await executeTransaction(async (client) => {
        // 1. Update staff
        await client.query(
          `
          UPDATE staff 
          SET full_name = $1, username = $2, phone = $3, avatar_url = $4, updated_at = NOW()
          WHERE id = $5
        `,
          [name, username, phone || "", avatar_url || "", staffId],
        );

        // 2. Update doctors
        await client.query(
          `
          UPDATE doctors
          SET specialty_id = $1, consultation_fee = $2, years_experience = $3, status = $4, updated_at = NOW()
          WHERE id = $5
        `,
          [specialty_id, consultation_fee, years_experience, status, doctorId],
        );

        // 3. Replace schedule
        if (isArrayHasData(schedule)) {
          await client.query(
            `DELETE FROM doctor_schedules WHERE doctor_id = $1`,
            [doctorId],
          );

          const values: (string | number | boolean)[] = [];
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
      });

      revalidatePath("/[locale]/doctors", "page");
      return { success: true };
    } catch (error) {
      console.error("[updateDoctor] failed:", error);
      return { success: false, error: "Failed to update doctor." };
    }
  }

  return { success: false, error: "Missing doctor ID or staff ID." };
}

export async function deleteDoctor(doctorId: string) {
  try {
    await executeTransaction(async (client) => {
      // 1. Get staffId from doctors table
      const result = await client.query<{ staff_id: string }>(
        `SELECT staff_id FROM doctors WHERE id = $1`,
        [doctorId],
      );

      if (!result.rows[0]) {
        throw new Error(`Doctor with id ${doctorId} not found`);
      }

      const staffId = result.rows[0].staff_id;

      // 2. Delete doctor first (doctor_schedules cascades automatically)
      await client.query(`DELETE FROM doctors WHERE id = $1`, [doctorId]);

      // 3. Delete staff
      await client.query(`DELETE FROM staff WHERE id = $1`, [staffId]);
    });

    revalidatePath("/[locale]/doctors", "page");
    return { success: true };
  } catch (error) {
    console.error("[deleteDoctor] failed:", error);
    return { success: false, error: "Failed to delete doctor." };
  }
}
