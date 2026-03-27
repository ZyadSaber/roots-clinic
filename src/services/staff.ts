"use server";

import { SPECIALTY_FIELD } from "@/constants/specilalty";
import isArrayHasData from "@/lib/isArrayHasData";
import { queryOne, queryMany, executeTransaction } from "@/lib/pg";
import {
  CreateUserPayload,
  User,
  StaffRole,
  UserPermissions,
  UpdateUserPayload,
} from "@/types/staff";
import { createClient } from "@supabase/supabase-js";
import { getLocale } from "next-intl/server";
import { MANAGEMENT_NAV_ITEMS } from "@/constants/navigation";
import { Module } from "@/types/navigation";

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getStaffById(id: string) {
  try {
    const locale = await getLocale();
    const specialtyField = SPECIALTY_FIELD[locale] ?? "english_name";
    const sql = `
      SELECT
        swe.id,
        swe.full_name,
        swe.username,
        swe.avatar_url,
        swe.role,
        swe.phone,
        swe.is_active,
        swe.permissions,
        swe.auth_id,
        swe.created_at,
        swe.updated_at,
        swe.email,
        au.last_sign_in_at,
        sp.${specialtyField} AS specialty,
        d.specialty_id,
        swe.permissions
      FROM staff_with_email swe
      LEFT JOIN auth.users  au ON au.id        = swe.id
      LEFT JOIN doctors     d  ON d.staff_id   = swe.id
      LEFT JOIN specialties sp ON sp.id        = d.specialty_id
      WHERE swe.id = $1 AND swe.is_active = TRUE
      LIMIT 1
    `;
    return await queryOne({ sql, params: [id] });
  } catch (error) {
    console.error("Error fetching staff by id:", error);
    return null;
  }
}

export async function getAllStaff(): Promise<User[]> {
  const locale = await getLocale();
  // ✅ Fix #3 — whitelist, not interpolation
  const specialtyField = SPECIALTY_FIELD[locale] ?? "english_name";

  try {
    // ✅ Fix #4 & #9 — includes last_sign_in_at and permissions
    const sql = `
      SELECT
        swe.*,
        au.last_sign_in_at,
        sp.${specialtyField} AS specialty,
        d.specialty_id
      FROM staff_with_email swe
      LEFT JOIN auth.users  au ON au.id        = swe.id
      LEFT JOIN doctors     d  ON d.staff_id   = swe.id
      LEFT JOIN specialties sp ON sp.id        = d.specialty_id
      ORDER BY swe.is_active DESC, swe.role DESC, swe.full_name ASC
    `;
    return await queryMany<User>({ sql });
  } catch (error) {
    console.error("Error fetching all staff:", error);
    // ✅ Fix #8 — re-throw so the caller (Redux thunk) can handle it properly
    throw error;
  }
}

export async function updateUserPermissions(
  staffId: string,
  permissions: UserPermissions,
): Promise<ActionResult<{ id: string }>> {
  try {
    // ✅ Fix #5 — use queryOne which returns the row directly, no .rows/.rowCount
    const updated = await queryOne<{ id: string }>({
      sql: `
        UPDATE staff
        SET permissions = $1::jsonb,
            updated_at  = NOW()
        WHERE id = $2
        RETURNING id, full_name, permissions
      `,
      params: [JSON.stringify(permissions), staffId],
    });

    if (!updated) {
      return { success: false, error: "User not found" };
    }

    return { success: true, data: updated };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Database error";
    return { success: false, error: msg };
  }
}
const ALL_MODULES = MANAGEMENT_NAV_ITEMS.map((item) => item.href as Module);

function buildPermissions(allowed: Module[]): UserPermissions {
  return Object.fromEntries(
    ALL_MODULES.map((m) => [m, allowed.includes(m)]),
  ) as UserPermissions;
}

export async function getDefaultPermissions(
  role: StaffRole,
): Promise<UserPermissions> {
  switch (role) {
    case "admin":
      return buildPermissions(ALL_MODULES); // full access

    case "doctor":
      return buildPermissions([
        "dashboard",
        "appointments",
        "patients",
        "radiology",
        "records",
      ]);

    case "receptionist":
      return buildPermissions(["dashboard", "appointments", "patients"]);

    case "finance":
      return buildPermissions(["dashboard", "finance"]);

    default:
      return buildPermissions([]); // deny all — admin assigns manually
  }
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<ActionResult<{ staffId: string }>> {
  const { email, password, username, full_name, role, phone, specialty_id } =
    payload;

  // ✅ Fix #7 — basic guard before touching auth or DB
  if (!email || !password || !username || !full_name || !role) {
    console.error("createUser error: Missing required fields");
    return { success: false, error: "Missing required fields" };
  }
  if (role === "doctor" && !specialty_id) {
    console.error("createUser error: Specialty required for doctor accounts");
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: {
        specialty_id: "Specialty is required for doctor accounts",
      },
    };
  }

  // ✅ Fix #1 & #2 — getAdminClient is async, must await it
  const supabaseAdmin = await getAdminClient();

  const existing = await queryMany<{ id: string }>({
    sql: `SELECT id FROM staff WHERE username = $1 LIMIT 1`,
    params: [username],
  });
  if (isArrayHasData(existing)) {
    console.error(`createUser error: Username "${username}" is already taken`);
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: { username: `Username "${username}" is already taken` },
    };
  }

  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    const msg = authError?.message ?? "Failed to create auth user";
    console.error("createUser error (Auth):", msg);
    if (msg.toLowerCase().includes("already registered")) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: { email: "A user with this email already exists" },
      };
    }
    return { success: false, error: msg };
  }

  const authId = authData.user.id;

  try {
    const permissions = await getDefaultPermissions(role);
    await executeTransaction(async (client) => {
      await client.query(
        `INSERT INTO staff (auth_id, username, full_name, role, phone, is_active, permissions)
         VALUES ($1, $2, $3, $4, $5, TRUE, $6)`,
        [authId, username, full_name, role, phone || "", permissions],
      );

      if (role === "doctor") {
        await client.query(
          `INSERT INTO doctors (staff_id, specialty_id)
           VALUES ($1, $2)`,
          [authId, specialty_id],
        );
      }
    });
  } catch (dbError) {
    await supabaseAdmin.auth.admin.deleteUser(authId);
    const msg = dbError instanceof Error ? dbError.message : "Database error";
    console.error("createUser error (DB):", msg, dbError);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: { username: `Username "${username}" is already taken` },
      };
    }
    return { success: false, error: `Failed to create staff record: ${msg}` };
  }

  return { success: true, data: { staffId: authId } };
}

export async function deleteUser(staffId: string): Promise<ActionResult> {
  if (!staffId) {
    return { success: false, error: "Staff ID is required" };
  }

  const supabaseAdmin = await getAdminClient();

  const staffMember = await queryOne<{
    auth_id: string;
    is_active: boolean;
    last_sign_in_at: string | null;
  }>({
    sql: `
      SELECT auth_id, is_active, last_sign_in_at
      FROM staff_with_email
      WHERE id = $1
      LIMIT 1
    `,
    params: [staffId],
  });

  if (!staffMember) {
    return { success: false, error: "Staff member not found" };
  }

  if (!staffMember.is_active) {
    return { success: false, error: "Staff member is already deactivated" };
  }

  if (staffMember.last_sign_in_at === null && !!staffMember.auth_id) {
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      staffMember.auth_id,
    );

    const deleted = await queryOne<{ id: string }>({
      sql: `
        DELETE FROM staff
        WHERE id = $1
      `,
      params: [staffId],
    });

    if (authError || !deleted) {
      console.error("deleteUser error (Auth hard delete):", authError?.message);
      return {
        success: false,
        error: `Failed to delete user: ${authError?.message}`,
      };
    }

    return { success: true };
  } else {
    const updated = await queryOne<{ id: string }>({
      sql: `
        UPDATE staff
        SET is_active  = FALSE,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      params: [staffId],
    });

    if (!updated) {
      return { success: false, error: "Failed to deactivate staff member" };
    }

    return { success: true };
  }
}

export async function resetUserPassword(
  staffId: string,
  newPassword: string,
): Promise<ActionResult> {
  // 1. Basic guards
  if (!staffId) {
    return { success: false, error: "Staff ID is required" };
  }
  if (!newPassword || newPassword.length < 8) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: { newPassword: "Password must be at least 8 characters" },
    };
  }
  if (newPassword.length > 72) {
    return {
      success: false,
      error: "Validation failed",
      fieldErrors: { newPassword: "Password must be under 72 characters" },
    };
  }

  const supabaseAdmin = await getAdminClient();

  // 2. Fetch the auth_id for this staff member
  const staffMember = await queryOne<{ auth_id: string }>({
    sql: `SELECT auth_id FROM staff WHERE id = $1 AND is_active = TRUE LIMIT 1`,
    params: [staffId],
  });

  if (!staffMember) {
    return { success: false, error: "Staff member not found or deactivated" };
  }

  // 3. Update password via Admin API — no email/old password needed
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    staffMember.auth_id,
    { password: newPassword },
  );

  if (authError) {
    console.error("resetUserPassword error:", authError.message);
    return {
      success: false,
      error: `Failed to reset password: ${authError.message}`,
    };
  }

  const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(
    staffMember.auth_id,
    "global",
  );

  if (signOutError) {
    console.warn(
      "resetUserPassword: sessions not fully invalidated:",
      signOutError.message,
    );
  }

  return { success: true };
}

export async function updateUser(
  payload: UpdateUserPayload,
): Promise<ActionResult> {
  const { id, username, full_name, role, phone, avatar_url } = payload;

  try {
    const updated = await queryOne<{ id: string }>({
      sql: `
        UPDATE staff
        SET username   = $2,
            full_name  = $3,
            role       = $4,
            phone      = $5,
            avatar_url = $6,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      params: [
        id,
        username || "",
        full_name || "",
        role || "",
        phone || "",
        avatar_url || null,
      ],
    });

    if (!updated) {
      return { success: false, error: "Staff member not found" };
    }
  } catch (dbError) {
    const msg = dbError instanceof Error ? dbError.message : "Database error";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: { username: `Username "${username}" is already taken` },
      };
    }
    return { success: false, error: `Failed to update staff: ${msg}` };
  }

  return { success: true };
}

