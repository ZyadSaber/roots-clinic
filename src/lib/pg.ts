// lib/db.js
import { Pool } from "pg";

interface QueryParams {
  sql: string;
  params?: (string | number | boolean | Date | null)[];
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});

export async function query({ sql, params }: QueryParams) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// lib/db.js — extended version
export async function queryOne({ sql, params }: QueryParams) {
  const rows = await query({ sql, params });
  return rows[0] || null;
}

export async function queryMany({ sql, params }: QueryParams) {
  try {
    return await query({ sql, params });
  } catch (err) {
    console.error("queryMany error:", err);
    return [];
  }
}

export async function execute({ sql, params }: QueryParams) {
  // for INSERT, UPDATE, DELETE
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rowCount;
  } finally {
    client.release();
  }
}
