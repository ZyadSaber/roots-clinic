// lib/db.js
import { Pool, PoolClient } from "pg";

interface QueryParams {
  sql: string;
  params?: (string | number | boolean | Date | null)[];
}
const globalForPg = global as unknown as { pgPool: Pool };

export const pool =
  globalForPg.pgPool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // required for Supabase
    connectionTimeoutMillis: 10000, // 10 seconds timeout
  });

if (process.env.NODE_ENV !== "production") globalForPg.pgPool = pool;

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
    return result;
  } finally {
    client.release();
  }
}

export async function executeTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error; // re-throw so the server action catch handles it
  } finally {
    client.release();
  }
}
