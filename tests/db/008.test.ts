import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./harness";

const ADMIN = "00000000-0000-0000-0000-00000000000a";
const READER = "00000000-0000-0000-0000-00000000000b";
const CAFE = "10000000-0000-0000-0000-000000000001";
const REVIEW = "20000000-0000-0000-0000-000000000001";

async function seed(t: TestDb) {
  await t.asSuperuser();
  await t.db.exec(`
    insert into auth.users (id) values ('${ADMIN}'), ('${READER}');
    update public.profiles set role = 'admin' where id = '${ADMIN}';
    insert into public.cafes (id, name, slug, address, lat, lng, neighborhood, status)
      values ('${CAFE}', 'Cafe', 'cafe', '', 0, 0, 'Capitol Hill', 'published');
    insert into public.want_to_go (name, address) values ('Somewhere', '1 Main St');
  `);
}

const count = async (t: TestDb, sql: string) =>
  (await t.db.query<{ n: number }>(`select count(*)::int as n from (${sql}) q`)).rows[0].n;

/** Columns, constraints, policies and indexes of the tables 008 touches. */
async function schemaSnapshot(t: TestDb) {
  await t.asSuperuser();
  const q = async (sql: string) => (await t.db.query(sql)).rows;
  return {
    columns: await q(`
      select table_name, column_name, is_nullable, data_type from information_schema.columns
      where table_schema = 'public' and table_name in ('reviews', 'items', 'photos', 'want_to_go')
      order by 1, 2`),
    constraints: await q(`
      select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def
      from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2`),
    policies: await q(`
      select tablename, policyname, cmd, qual from pg_policies
      where schemaname = 'public' order by 1, 2`),
    indexes: await q(`select indexname, indexdef from pg_indexes where schemaname = 'public' order by 1`),
  };
}

describe("before 008 (control)", () => {
  it("anon can read want_to_go and draft scores are required", async () => {
    const t = await createTestDb({ upTo: "007" });
    await seed(t);
    await t.as("anon");
    expect(await count(t, `select * from public.want_to_go`)).toBe(1);

    await t.asSuperuser();
    await expect(
      t.db.exec(`insert into public.reviews (cafe_id, author_id, date_visited, status)
                 values ('${CAFE}', '${ADMIN}', '2026-11-01', 'draft')`),
    ).rejects.toThrow(/null value/);
  });
});

describe("008_launch_authoring", () => {
  let t: TestDb;
  beforeEach(async () => {
    t = await createTestDb();
    await seed(t);
  });

  it("draft review with null overall_rating, note and item rating inserts", async () => {
    await t.as("authenticated", ADMIN);
    await t.db.exec(`
      insert into public.reviews (id, cafe_id, author_id, date_visited, status, verdict)
        values ('${REVIEW}', '${CAFE}', '${ADMIN}', '2026-11-01', 'draft', null);
      insert into public.items (cafe_id, review_id, name, category, type, rating)
        values ('${CAFE}', '${REVIEW}', 'Hojicha latte', 'drink', null, null);
    `);
    const row = await t.db.query<{ overall_rating: number | null; note: string | null; rating: number | null }>(
      `select r.overall_rating, r.note, i.rating from public.reviews r join public.items i on i.review_id = r.id`,
    );
    expect(row.rows).toEqual([{ overall_rating: null, note: null, rating: null }]);
  });

  it("publishing a review with null overall_rating violates reviews_published_needs_rating", async () => {
    await t.db.exec(`insert into public.reviews (id, cafe_id, author_id, date_visited, status)
                     values ('${REVIEW}', '${CAFE}', '${ADMIN}', '2026-11-01', 'draft')`);
    await expect(
      t.db.exec(`update public.reviews set status = 'published' where id = '${REVIEW}'`),
    ).rejects.toThrow(/reviews_published_needs_rating/);
    await expect(
      t.db.exec(`insert into public.reviews (cafe_id, author_id, date_visited, status)
                 values ('${CAFE}', '${ADMIN}', '2026-11-01', 'published')`),
    ).rejects.toThrow(/reviews_published_needs_rating/);

    // With a score it publishes, and the 1-5 range check still holds.
    await t.db.exec(`update public.reviews set overall_rating = 4, status = 'published' where id = '${REVIEW}'`);
    await expect(
      t.db.exec(`update public.reviews set overall_rating = 0 where id = '${REVIEW}'`),
    ).rejects.toThrow(/check constraint/);
  });

  it("anon cannot select want_to_go; admin can", async () => {
    await t.as("anon");
    expect(await count(t, `select * from public.want_to_go`)).toBe(0);
    await t.as("authenticated", READER);
    expect(await count(t, `select * from public.want_to_go`)).toBe(0);
    await t.as("authenticated", ADMIN);
    expect(await count(t, `select * from public.want_to_go`)).toBe(1);
  });

  it("deleting a photo nulls reviews.cover_photo_id", async () => {
    await t.db.exec(`
      insert into public.reviews (id, cafe_id, author_id, date_visited, status)
        values ('${REVIEW}', '${CAFE}', '${ADMIN}', '2026-11-01', 'draft');
      insert into public.photos (id, cafe_id, review_id, photo_url)
        values ('30000000-0000-0000-0000-000000000001', '${CAFE}', '${REVIEW}', 'cafes/cafe/a.jpg');
      update public.reviews set cover_photo_id = '30000000-0000-0000-0000-000000000001' where id = '${REVIEW}';
      delete from public.photos where id = '30000000-0000-0000-0000-000000000001';
    `);
    const r = await t.db.query<{ cover_photo_id: string | null }>(`select cover_photo_id from public.reviews`);
    expect(r.rows).toEqual([{ cover_photo_id: null }]);
  });

  it("deleting an item nulls photos.item_id and keeps the photo", async () => {
    await t.db.exec(`
      insert into public.reviews (id, cafe_id, author_id, date_visited, status)
        values ('${REVIEW}', '${CAFE}', '${ADMIN}', '2026-11-01', 'draft');
      insert into public.items (id, cafe_id, review_id, name, category)
        values ('40000000-0000-0000-0000-000000000001', '${CAFE}', '${REVIEW}', 'Cortado', 'drink');
      insert into public.photos (cafe_id, review_id, item_id, photo_url)
        values ('${CAFE}', '${REVIEW}', '40000000-0000-0000-0000-000000000001', 'cafes/cafe/b.jpg');
      delete from public.items where id = '40000000-0000-0000-0000-000000000001';
    `);
    const r = await t.db.query<{ item_id: string | null }>(`select item_id from public.photos`);
    expect(r.rows).toEqual([{ item_id: null }]);
  });

  it("re-applying 008 is a no-op", async () => {
    await t.db.exec(`
      insert into public.reviews (id, cafe_id, author_id, date_visited, status, overall_rating, verdict)
        values ('${REVIEW}', '${CAFE}', '${ADMIN}', '2026-11-01', 'published', 5, 'Go.');
    `);
    const before = await schemaSnapshot(t);
    await t.applyMigration("008");
    const after = await schemaSnapshot(t);
    expect(after).toEqual(before);
    const r = await t.db.query(`select verdict, overall_rating from public.reviews`);
    expect(r.rows).toEqual([{ verdict: "Go.", overall_rating: 5 }]);
  });
});
