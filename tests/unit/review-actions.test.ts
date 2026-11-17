import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient, type FakeClient } from "./fake-supabase";

// The actions run with a signed-in author and the service-role client; both are faked.
let client: FakeClient;
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn(async () => ({ id: "author-1", email: "a@example.com" })) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => client }));
vi.mock("@/lib/cover-photo", () => ({ syncCoverPhoto: vi.fn(async () => {}) }));
vi.mock("@/lib/ratings", () => ({ recalculateCafeRating: vi.fn(async () => {}) }));

const { createReview } = await import("@/lib/actions/reviews");

const base = {
  cafe_id: "cafe-1",
  overall_rating: 4,
  note: "n",
  date_visited: "2026-11-01",
  items: [
    { name: "Latte", category: "drink" as const, type: "latte", rating: null as unknown as number, is_favorite: false },
  ],
};

describe("createReview (legacy)", () => {
  beforeEach(() => {
    client = fakeClient({ cafes: [{ id: "cafe-1" }], reviews: [], items: [], photos: [] });
  });

  it("rejects publishing with an unscored drink", async () => {
    const result = await createReview({ ...base, status: "published" });
    expect(result.error).toMatch(/Score every drink/);
    expect(client.tables.reviews).toEqual([]);
  });

  it("never relies on the database default status (published) when status is missing", async () => {
    // A Server Action receives whatever the client sends; TypeScript doesn't hold at runtime.
    const result = await createReview({ ...base } as unknown as Parameters<typeof createReview>[0]);
    const saved = client.tables.reviews[0];
    expect(result.error ?? saved?.status).not.toBe("published");
    if (saved) expect(saved.status).toBe("draft");
  });
});
