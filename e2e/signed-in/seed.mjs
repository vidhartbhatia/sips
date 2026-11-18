// Seeds the LOCAL Supabase stack for the signed-in e2e flow. Refuses to run against anything
// but a local URL, so it can never touch production.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url)) {
  throw new Error(`seed: refusing non-local Supabase URL ${url}`);
}
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
const email = process.env.ALLOWED_EMAILS;

// Start every run from no reviews, so "a draft is invisible" is a real check.
const none = "00000000-0000-0000-0000-000000000000";
for (const [table, step] of [
  ["reviews", (q) => q.update({ cover_photo_id: null }).neq("id", none)],
  ["photos", (q) => q.delete().neq("id", none)],
  ["items", (q) => q.delete().neq("id", none)],
  ["reviews", (q) => q.delete().neq("id", none)],
  ["cafes", (q) => q.update({ overall_rating: null, cover_photo_url: null }).neq("id", none)],
  // Cafes the new-cafe test adds (through the fake place search, and by name only).
  ["cafes", (q) => q.delete().in("slug", ["e2e-place-cafe", "e2e-manual-cafe"])],
]) {
  const { error } = await step(admin.from(table));
  if (error) throw error;
}

const { data: list } = await admin.auth.admin.listUsers();
let user = list.users.find((u) => u.email === email);
if (!user) {
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  user = data.user;
}
const { error: roleError } = await admin
  .from("profiles")
  .update({ role: "admin", display_name: "E2E" })
  .eq("id", user.id);
if (roleError) throw roleError;

const { error: cafeError } = await admin.from("cafes").upsert(
  {
    name: "E2E Test Cafe",
    slug: "e2e-test-cafe",
    neighborhood: "Capitol Hill",
    address: "1 Test St, Seattle, WA",
    lat: 47.6145,
    lng: -122.3205,
    status: "published",
  },
  { onConflict: "slug" }
);
if (cafeError) throw cafeError;
console.log("seeded user and cafe");
