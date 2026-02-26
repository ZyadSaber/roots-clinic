"use server";

import { queryMany } from "@/lib/pg";
import { Specialty } from "@/types/database";

export async function getSpecialties(): Promise<Specialty[]> {
  const sql = `
    SELECT id, arabic_name, english_name 
    FROM specialties 
    ORDER BY english_name ASC
  `;
  return (await queryMany({ sql })) as Specialty[];
}
