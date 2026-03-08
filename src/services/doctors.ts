"use server";

import { queryMany, execute } from "@/lib/pg";
import { DoctorScheduleRecord, UpsertDoctorData } from "@/types/database";
import { DoctorSummary, DoctorFormData } from "@/types/doctors";
import { revalidatePath } from "next/cache";

export async function createDoctor(data: DoctorFormData) {
  console.log(data);
  return {
    success: false,
    error: "Creating a doctor requires staff registration first.",
  };
}

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

    const dayNameMap: Record<string, number> = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    if (data.schedule && data.schedule.length > 0) {
      for (const slot of data.schedule) {
        const dayIndex = dayNameMap[slot.day];
        if (dayIndex !== undefined) {
          await execute({
            sql: `INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_active) VALUES ($1, $2, $3, $4, $5)`,
            params: [
              data.id,
              dayIndex,
              slot.startTime,
              slot.endTime,
              slot.active,
            ],
          });
        }
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

// export async function saveDoctor(data: UpsertDoctorData) {
//   if (data.id) {
//     // Update existing doctor
//     const sql = `
//       UPDATE doctors
//       SET
//         consultation_fee = $1,
//         years_experience = $2,
//         status = $3,
//         updated_at = NOW()
//       WHERE id = $4
//     `;
//     await execute({
//       sql,
//       params: [data.fee, data.exp, data.status, data.id],
//     });
//   }

//   revalidatePath("/[locale]/doctors", "page");
//   return { success: true };
// }
