import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";

/**
 * In-memory Postgres (PGlite) with just enough of Supabase to run our migrations:
 * the `anon`/`authenticated`/`service_role` roles with Supabase's default grants, an
 * `auth` schema (`auth.users`, `auth.uid()`) and a `storage` schema (`buckets`, `objects`).
 *
 * Proves SQL and RLS only. It is not Supabase: no PostgREST, no Storage API, no JWTs.
 */

const MIGRATIONS_DIR = path.resolve(__dirname, "../../supabase/migrations");

const SUPABASE_STUBS = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb default '{}'
);
-- Supabase reads the JWT; tests set the caller with as() instead.
create function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

create schema storage;
create table storage.buckets (id text primary key, name text not null, public boolean default false);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets,
  name text,
  owner uuid
);
alter table storage.objects enable row level security;

-- Supabase's default privileges: table access is granted to the API roles, and RLS
-- decides which rows they see. Without these, tests would fail on "permission denied"
-- instead of exercising the policies.
grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`;

export type Role = "anon" | "authenticated";

export interface TestDb {
  db: PGlite;
  /** Act as a Supabase API role. `userId` becomes `auth.uid()`. Resets any earlier role. */
  as(role: Role, userId?: string): Promise<void>;
  /** Back to the superuser (bypasses RLS), for setup and assertions on raw state. */
  asSuperuser(): Promise<void>;
  /** Run one migration file again, by its numeric prefix (e.g. "008"). */
  applyMigration(prefix: string): Promise<void>;
}

/** Migration files in order. `upTo` is an inclusive numeric prefix, e.g. "007". */
export function migrationFiles(upTo?: string): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .filter((f) => !upTo || f.slice(0, upTo.length) <= upTo);
}

function readMigration(file: string): string {
  return readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
}

export async function createTestDb(opts: { upTo?: string } = {}): Promise<TestDb> {
  const db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  for (const file of migrationFiles(opts.upTo)) {
    try {
      await db.exec(readMigration(file));
    } catch (e) {
      throw new Error(`${file}: ${(e as Error).message}`);
    }
  }

  const asSuperuser = async () => {
    await db.exec(`reset role`);
    await db.query(`select set_config('test.uid', '', false)`);
  };

  return {
    db,
    asSuperuser,
    async as(role, userId) {
      await asSuperuser();
      await db.query(`select set_config('test.uid', $1, false)`, [userId ?? ""]);
      // Role names are a closed union, never user input.
      await db.exec(`set role ${role === "anon" ? "anon" : "authenticated"}`);
    },
    async applyMigration(prefix) {
      const file = migrationFiles().find((f) => f.startsWith(prefix));
      if (!file) throw new Error(`no migration ${prefix}`);
      await asSuperuser();
      await db.exec(readMigration(file));
    },
  };
}
