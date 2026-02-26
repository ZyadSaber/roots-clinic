"use server";

import { queryOne } from "@/lib/pg";

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
