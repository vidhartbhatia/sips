import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeClient, type FakeClient } from "./fake-supabase";
import type { DraftItem } from "@/lib/actions/reviews";

// The actions run with a signed-in author and the service-role client; both are faked.
let client: FakeClient;
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn(async () => ({ id: "author-1", email: "a@example.com" })) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => client }));
vi.mock("@/lib/cover-photo", () => ({ syncCoverPhoto: vi.fn(async () => {}) }));
vi.mock("@/lib/ratings", () => ({ recalculateCafeRating: vi.fn(async () => {}) }));
vi.mock("@/lib/storage", () => ({ uploadPhoto: vi.fn(), deletePhoto: vi.fn() }));

const { addReviewItem, updateReviewItem } = await import("@/lib/actions/items");
const { setPhotoItem, updatePhotoCaption } = await import("@/lib/actions/photos");
const { saveAndPublishReview, unpublishReview, updateReview } = await import("@/lib/actions/reviews");

const drink: DraftItem = { name: "Cortado", category: "drink", type: null, rating: null, is_favorite: false, notes: null };

function seed() {
  client = fakeClient({
    cafes: [
      { id: "cafe-1", address: "1 Test St, Seattle, WA", lat: 47.61, lng: -122.32 },
      { id: "cafe-2", address: "2 Test St, Seattle, WA", lat: 47.62, lng: -122.33 },
    ],
    reviews: [
      { id: "draft-1", cafe_id: "cafe-1", status: "draft", overall_rating: null, date_visited: "2026-11-01" },
      { id: "pub-1", cafe_id: "cafe-2", status: "published", overall_rating: 4, date_visited: "2026-10-01" },
    ],
    items: [
      { id: "item-d", cafe_id: "cafe-1", review_id: "draft-1", name: "Latte", rating: null },
      { id: "item-p", cafe_id: "cafe-2", review_id: "pub-1", name: "Matcha", rating: 5 },
      { id: "item-legacy", cafe_id: "cafe-1", review_id: null, name: "Old", rating: 3 },
    ],
    photos: [
      { id: "photo-d", cafe_id: "cafe-1", review_id: "draft-1", item_id: null, caption: null },
      { id: "photo-p", cafe_id: "cafe-2", review_id: "pub-1", item_id: null, caption: null },
    ],
  });
}

describe("addReviewItem", () => {
  beforeEach(seed);

  it("takes cafe_id from the review row and saves the normalised item", async () => {
    const result = await addReviewItem("draft-1", { ...drink, name: "  Cortado ", notes: "" });
    expect(result.error).toBeNull();
    const added = client.tables.items.find((i) => i.id === result.itemId);
    expect(added).toEqual(expect.objectContaining({ cafe_id: "cafe-1", review_id: "draft-1", name: "Cortado", notes: null }));
  });

  it("allows an unscored drink on a draft but not on a published review", async () => {
    expect((await addReviewItem("draft-1", drink)).error).toBeNull();
    const rejected = await addReviewItem("pub-1", drink);
    expect(rejected.error).toMatch(/published/);
    expect(client.tables.items.filter((i) => i.review_id === "pub-1")).toHaveLength(1);
    expect((await addReviewItem("pub-1", { ...drink, rating: 3 })).error).toBeNull();
  });

  it("rejects an invalid item or an unknown review", async () => {
    expect((await addReviewItem("draft-1", { ...drink, name: " " })).error).toMatch(/name/i);
    expect((await addReviewItem("draft-1", { ...drink, rating: 7 })).error).toMatch(/1 to 5/);
    expect((await addReviewItem("nope", drink)).error).toMatch(/not found/i);
  });
});

describe("updateReviewItem", () => {
  beforeEach(seed);

  it("updates only the item's own fields", async () => {
    const result = await updateReviewItem("item-d", { ...drink, rating: 4, is_favorite: true });
    expect(result.error).toBeNull();
    expect(client.tables.items.find((i) => i.id === "item-d")).toEqual(
      expect.objectContaining({ name: "Cortado", rating: 4, is_favorite: true, review_id: "draft-1", cafe_id: "cafe-1" }),
    );
  });

  it("rejects clearing a score on a published review", async () => {
    const result = await updateReviewItem("item-p", { ...drink, name: "Matcha", rating: null });
    expect(result.error).toMatch(/published/);
    expect(client.tables.items.find((i) => i.id === "item-p")?.rating).toBe(5);
  });

  it("rejects an unknown item or one with no review", async () => {
    expect((await updateReviewItem("nope", drink)).error).toBeTruthy();
    expect((await updateReviewItem("item-legacy", drink)).error).toMatch(/review/i);
    expect(client.tables.items.find((i) => i.id === "item-legacy")?.name).toBe("Old");
  });
});

describe("setPhotoItem", () => {
  beforeEach(seed);

  it("links a photo to a drink of the same review, and unlinks it", async () => {
    expect((await setPhotoItem("photo-d", "item-d")).error).toBeNull();
    expect(client.tables.photos.find((p) => p.id === "photo-d")?.item_id).toBe("item-d");
    expect((await setPhotoItem("photo-d", null)).error).toBeNull();
    expect(client.tables.photos.find((p) => p.id === "photo-d")?.item_id).toBeNull();
  });

  it("rejects a drink from another review", async () => {
    const result = await setPhotoItem("photo-d", "item-p");
    expect(result.error).toMatch(/isn't part of this review/);
    expect(client.tables.photos.find((p) => p.id === "photo-d")?.item_id).toBeNull();
  });
});

describe("updatePhotoCaption", () => {
  beforeEach(seed);

  it("trims and stores empty as null", async () => {
    expect((await updatePhotoCaption("photo-d", "  A cortado on the window ledge  ")).error).toBeNull();
    expect(client.tables.photos.find((p) => p.id === "photo-d")?.caption).toBe("A cortado on the window ledge");
    expect((await updatePhotoCaption("photo-d", "   ")).error).toBeNull();
    expect(client.tables.photos.find((p) => p.id === "photo-d")?.caption).toBeNull();
  });

  it("rejects more than 200 characters rather than cutting it", async () => {
    expect((await updatePhotoCaption("photo-d", "x".repeat(200))).error).toBeNull();
    const result = await updatePhotoCaption("photo-d", "y".repeat(201));
    expect(result.error).toMatch(/200/);
    expect(client.tables.photos.find((p) => p.id === "photo-d")?.caption).toBe("x".repeat(200));
  });
});

describe("saveAndPublishReview", () => {
  beforeEach(seed);
  const fields = { overall_rating: 4, verdict: " Worth the walk. ", note: "", date_visited: "2026-11-02" };

  it("publishes with the form's score even when the stored one is empty", async () => {
    client.tables.items.find((i) => i.id === "item-d")!.rating = 3;
    const result = await saveAndPublishReview("draft-1", fields);
    expect(result.error).toBeNull();
    expect(client.tables.reviews.find((r) => r.id === "draft-1")).toEqual(
      expect.objectContaining({ status: "published", overall_rating: 4, verdict: "Worth the walk.", note: null, date_visited: "2026-11-02" }),
    );
  });

  it("rejects when the form clears the score, and writes nothing", async () => {
    client.tables.reviews.find((r) => r.id === "draft-1")!.overall_rating = 4;
    client.tables.items.find((i) => i.id === "item-d")!.rating = 3;
    const result = await saveAndPublishReview("draft-1", { ...fields, overall_rating: null });
    expect(result.error).toMatch(/overall score/);
    expect(client.updates.filter((u) => u.table === "reviews")).toEqual([]);
  });

  it("names the unscored drink and stays a draft", async () => {
    const result = await saveAndPublishReview("draft-1", fields);
    expect(result.error).toMatch(/Latte/);
    expect(client.tables.reviews.find((r) => r.id === "draft-1")?.status).toBe("draft");
  });

  it("rejects a malformed date", async () => {
    client.tables.items.find((i) => i.id === "item-d")!.rating = 3;
    expect((await saveAndPublishReview("draft-1", { ...fields, date_visited: "" })).error).toMatch(/date/i);
    expect((await updateReview("draft-1", { date_visited: "11/02/2026" })).error).toMatch(/date/i);
    expect(client.updates).toEqual([]);
  });
});

describe("unpublishReview", () => {
  beforeEach(seed);

  it("moves a published review back to draft", async () => {
    expect((await unpublishReview("pub-1")).error).toBeNull();
    expect(client.tables.reviews.find((r) => r.id === "pub-1")?.status).toBe("draft");
  });
});
