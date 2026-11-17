import { describe, expect, it } from "vitest";
import { createTestDb } from "./harness";

describe("migrations", () => {
  it("applies 001-007 cleanly and anon cannot read draft items", async () => {
    const { db, as } = await createTestDb({ upTo: "007" });

    await db.exec(`
      insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a');
      update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a';
      insert into public.cafes (id, name, slug, address, lat, lng, neighborhood, status)
        values ('10000000-0000-0000-0000-000000000001', 'Cafe', 'cafe', '', 0, 0, 'Capitol Hill', 'published');
      insert into public.reviews (id, cafe_id, author_id, date_visited, note, overall_rating, status)
        values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
                '00000000-0000-0000-0000-00000000000a', '2026-11-01', 'n', 4, 'draft');
      insert into public.items (cafe_id, review_id, name, category, type, rating)
        values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
                'Latte', 'drink', 'latte', 4);
    `);

    await as("anon");
    const anon = await db.query<{ n: number }>(`select count(*)::int as n from public.items`);
    expect(anon.rows[0].n).toBe(0);

    // Control: the admin sees the draft item, so 0 above is RLS, not an empty table.
    await as("authenticated", "00000000-0000-0000-0000-00000000000a");
    const admin = await db.query<{ n: number }>(`select count(*)::int as n from public.items`);
    expect(admin.rows[0].n).toBe(1);
  });
});
