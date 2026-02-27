"use server";

import { queryMany, queryOne, execute } from "@/lib/pg";
import { Specialty } from "@/types/database";
import { revalidatePath } from "next/cache";

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getSpecialties(): Promise<Specialty[]> {
  const sql = `
    SELECT id, arabic_name, english_name
    FROM specialties
    ORDER BY english_name ASC
  `;
  return (await queryMany({ sql })) as Specialty[];
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createSpecialty(
  english_name: string,
  arabic_name: string,
): Promise<{ success: boolean; specialty?: Specialty; error?: string }> {
  try {
    const trimmedEn = english_name.trim();
    const trimmedAr = arabic_name.trim();

    if (!trimmedEn || !trimmedAr) {
      return { success: false, error: "Both names are required." };
    }

    const sql = `
      INSERT INTO specialties (arabic_name, english_name)
      VALUES ($1, $2)
      RETURNING id, arabic_name, english_name
    `;
    const row = await queryOne({ sql, params: [trimmedAr, trimmedEn] });
    revalidatePath("/[locale]/doctors", "page");
    return { success: true, specialty: row as Specialty };
  } catch (err: unknown) {
    console.error("createSpecialty error:", err);
    return { success: false, error: (err as Error).message };
  }
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateSpecialty(
  id: string,
  english_name: string,
  arabic_name: string,
): Promise<{ success: boolean; specialty?: Specialty; error?: string }> {
  try {
    const trimmedEn = english_name.trim();
    const trimmedAr = arabic_name.trim();

    if (!trimmedEn || !trimmedAr) {
      return { success: false, error: "Both names are required." };
    }

    const sql = `
      UPDATE specialties
      SET arabic_name = $1, english_name = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, arabic_name, english_name
    `;
    const row = await queryOne({ sql, params: [trimmedAr, trimmedEn, id] });
    if (!row) return { success: false, error: "Specialty not found." };
    revalidatePath("/[locale]/doctors", "page");
    return { success: true, specialty: row as Specialty };
  } catch (err: unknown) {
    console.error("updateSpecialty error:", err);
    return { success: false, error: (err as Error).message };
  }
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteSpecialty(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const sql = `DELETE FROM specialties WHERE id = $1`;
    await execute({ sql, params: [id] });
    revalidatePath("/[locale]/doctors", "page");
    return { success: true };
  } catch (err: unknown) {
    console.error("deleteSpecialty error:", err);
    return { success: false, error: (err as Error).message };
  }
}
