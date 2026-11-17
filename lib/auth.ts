import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user, or null if not logged in.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if an email is in the allowlist.
 */
export function isAllowedEmail(email: string): boolean {
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}

/**
 * Sign out the current user and redirect to login.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * Require an authenticated, authorized user. Throws if not.
 */
export async function requireAuth() {
  const user = await getUser();
  if (!user?.email) throw new Error("Not authenticated");
  if (!isAllowedEmail(user.email)) throw new Error("Not authorized");
  return user;
}
