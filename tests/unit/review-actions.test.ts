import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient, type FakeClient } from "./fake-supabase";

// The actions run with a signed-in author and the service-role client; both are faked.
let client: FakeClient;
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn(async () => ({ id: "author-1", email: "a@example.com" })) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => client }));
vi.mock("@/lib/cover-photo", () => ({ syncCoverPhoto: vi.fn(async () => {}) }));
vi.mock("@/lib/ratings", () => ({ recalculateCafeRating: vi.fn(async () => {}) }));

const { createReviewDraft } = await import("@/lib/actions/reviews");

const input = {
  id: "7d0f6f4e-6a52-4c2a-9a63-0f8a1c2b3d4e",
  cafe_id: "cafe-1",
  date_visited: "2026-11-01",
  overall_rating: null,
  verdict: "  Go for the hojicha.  ",
  note: "",
  items: [
    { name: "Hojicha latte", category: "drink" as const, type: null, rating: null, is_favorite: true, notes: null },
    { name: "  ", category: "drink" as const, type: null, rating: 4, is_favorite: false, notes: null },
  ],
};

describe("createReviewDraft", () => {
  beforeEach(() => {
    client = fakeClient({ cafes: [{ id: "cafe-1" }], reviews: [], items: [], photos: [] });
  });

  it("always saves a draft by the signed-in author, unscored allowed", async () => {
    const result = await createReviewDraft(input);
    expect(result.error).toBeNull();
    expect(client.tables.reviews).toEqual([
      expect.objectContaining({
        id: result.reviewId,
        status: "draft",
        author_id: "author-1",
        overall_rating: null,
        verdict: "Go for the hojicha.",
        note: null,
      }),
    ]);
    // Empty drink rows are dropped; item ids come back in order.
    expect(client.tables.items).toEqual([
      expect.objectContaining({ name: "Hojicha latte", rating: null, review_id: result.reviewId }),
    ]);
    expect(result.itemIds).toEqual([client.tables.items[0].id]);
  });

  it("rejects a score that isn't a whole number 1-5", async () => {
    const result = await createReviewDraft({ ...input, overall_rating: 7 });
    expect(result.error).toMatch(/1 to 5/);
    expect(client.tables.reviews).toEqual([]);
  });

  it("is idempotent: the same draft id again returns the existing draft, not a copy", async () => {
    const first = await createReviewDraft(input);
    // The response was lost on a phone connection; the form sends the same draft again.
    const again = await createReviewDraft(input);
    expect(again).toEqual(first);
    expect(client.tables.reviews).toHaveLength(1);
    expect(client.tables.items).toHaveLength(1);
  });

  it("won't reuse another author's or another cafe's review id", async () => {
    await createReviewDraft(input);
    client.tables.cafes.push({ id: "cafe-2" });
    const other = await createReviewDraft({ ...input, cafe_id: "cafe-2" });
    expect(other.error).toBeTruthy();
    expect(client.tables.reviews).toHaveLength(1);
  });

  it("rejects an unknown cafe", async () => {
    const result = await createReviewDraft({ ...input, cafe_id: "nope" });
    expect(result.error).toMatch(/cafe/i);
  });
});
