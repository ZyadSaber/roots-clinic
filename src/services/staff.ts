"use server";

import { queryOne } from "@/lib/pg";

export async function getStaffByEmail(email: string) {
  try {
    const sql = `
            SELECT 
                s.id,
                s.full_name,
                s.username,
                s.avatar_url,
                s.role
            FROM staff s
            WHERE s.email = $1 AND s.is_active = TRUE
            LIMIT 1
        `;
    return await queryOne({ sql, params: [email] });
  } catch (error) {
    console.error("Error fetching staff:", error);
    return null;
  }
}
