"use server";

import { queryOne } from "@/lib/pg";
import { createClient } from "@/lib/supabase/server";

// Server Action
export async function loginWithUsername(username: string, password: string) {
  // 1. Find email from username
  const staff = await queryOne({
    sql: "SELECT email FROM staff_with_email  WHERE username = $1",
    params: [username],
  });

  if (!staff) throw new Error("Username not found");

  const supabase = await createClient();

  // 2. Sign in with Supabase using the email
  const { data, error } = await supabase.auth.signInWithPassword({
    email: staff?.email || "",
    password,
  });

  return { data, error };
}
