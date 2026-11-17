import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./harness";

/**
 * Public listing (spec: only cafes with at least one published review are listed).
 * `public.listed_cafes` is the relation lib/supabase/queries.ts reads for every public
 * cafe list and the cafe page.
 */
const ADMIN = "00000000-0000-0000-0000-00000000000a";

async function seed(t: TestDb) {
  await t.asSuperuser();
  await t.db.exec(`
    insert into auth.users (id) values ('${ADMIN}');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
    insert into public.cafes (id, name, slug, address, lat, lng, neighborhood, status) values
      ('10000000-0000-0000-0000-000000000001', 'Reviewed', 'reviewed', '', 47.6, -122.3, 'Ballard', 'published'),
      ('10000000-0000-0000-0000-000000000002', 'Draft only', 'draft-only', '', 47.6, -122.3, 'Ballard', 'published'),
      ('10000000-0000-0000-0000-000000000003', 'No reviews', 'no-reviews', '', 47.6, -122.3, 'Ballard', 'published'),
      ('10000000-0000-0000-0000-000000000004', 'Hidden cafe', 'hidden', '', 47.6, -122.3, 'Ballard', 'draft');
    insert into public.reviews (cafe_id, author_id, date_visited, overall_rating, status) values
      ('10000000-0000-0000-0000-000000000001', '${ADMIN}', '2026-11-01', 4, 'published'),
      ('10000000-0000-0000-0000-000000000001', '${ADMIN}', '2026-11-02', null, 'draft'),
      ('10000000-0000-0000-0000-000000000002', '${ADMIN}', '2026-11-01', null, 'draft'),
      ('10000000-0000-0000-0000-000000000004', '${ADMIN}', '2026-11-01', 5, 'published');
  `);
}

const slugs = async (t: TestDb) =>
  (await t.db.query<{ slug: string }>(`select slug from public.listed_cafes order by slug`)).rows.map((r) => r.slug);

describe("listed_cafes", () => {
  let t: TestDb;
  beforeEach(async () => {
    t = await createTestDb();
    await seed(t);
  });

  it("anon sees only published cafes with a published review", async () => {
    await t.as("anon");
    expect(await slugs(t)).toEqual(["reviewed"]);
  });

  it("an admin's session (which can read drafts) still gets only reviewed cafes", async () => {
    await t.as("authenticated", ADMIN);
    expect(await slugs(t)).toEqual(["reviewed"]);
  });

  it("a cafe drops out when its only published review is unpublished", async () => {
    await t.db.exec(`update public.reviews set status = 'draft'
                     where cafe_id = '10000000-0000-0000-0000-000000000001'`);
    await t.as("anon");
    expect(await slugs(t)).toEqual([]);
  });

  it("re-applying 009 is a no-op", async () => {
    await t.applyMigration("009");
    await t.as("anon");
    expect(await slugs(t)).toEqual(["reviewed"]);
  });
});
