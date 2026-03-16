"use server";

import { queryOne, queryMany, execute } from "@/lib/pg";
import { User, UserPermissions } from "@/types/staff";

export async function getStaffById(id: string) {
  try {
    const sql = `
            SELECT 
                full_name,
                username,
                avatar_url,
                role,
                email
            FROM staff_with_email
            WHERE id = $1 AND is_active = TRUE
            LIMIT 1
        `;
    return await queryOne({ sql, params: [id] });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return null;
  }
}

export async function getAllStaff(): Promise<User[]> {
  try {
    const sql = `
          SELECT swe.*, sp.english_name AS english_specialty, sp.arabic_name AS arabic_specialty
          FROM staff_with_email swe
          LEFT JOIN doctors d ON d.staff_id = swe.id
          LEFT JOIN specialties sp ON sp.id = d.specialty_id
        `;
    return await queryMany({ sql });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
}

export async function updateUserPermissions(
  staffId: string,
  permissions: UserPermissions,
) {
  const result = await execute({
    sql: `
      UPDATE staff
      SET permissions = $1::jsonb,
          updated_at  = NOW()
      WHERE id = $2
      RETURNING id, full_name, permissions`,
    params: [JSON.stringify(permissions), staffId],
  });

  if (result.rowCount === 0) {
    return { success: false, error: "User not found" };
  }

  return { success: true, data: result.rows[0] };
}
