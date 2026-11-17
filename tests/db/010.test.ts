import { describe, expect, it } from "vitest";
import { createTestDb } from "./harness";

const WRITE_PRIVILEGES = ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"];

describe("010_listed_cafes_read_only", () => {
  it("anon and authenticated can only select from listed_cafes", async () => {
    const { db } = await createTestDb();
    for (const role of ["anon", "authenticated"]) {
      const select = await db.query<{ ok: boolean }>(
        `select has_table_privilege($1, 'public.listed_cafes', 'SELECT') as ok`,
        [role],
      );
      expect(select.rows[0].ok, `${role} SELECT`).toBe(true);
      for (const privilege of WRITE_PRIVILEGES) {
        const res = await db.query<{ ok: boolean }>(
          `select has_table_privilege($1, 'public.listed_cafes', $2) as ok`,
          [role, privilege],
        );
        expect(res.rows[0].ok, `${role} ${privilege}`).toBe(false);
      }
    }
  });

  it("re-applying 010 is a no-op", async () => {
    const t = await createTestDb();
    await t.applyMigration("010");
    const res = await t.db.query<{ ok: boolean }>(
      `select has_table_privilege('anon', 'public.listed_cafes', 'INSERT') as ok`,
    );
    expect(res.rows[0].ok).toBe(false);
  });
});
