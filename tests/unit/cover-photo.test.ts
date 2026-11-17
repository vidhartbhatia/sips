import { describe, expect, it } from "vitest";
import { syncCoverPhoto } from "@/lib/cover-photo";
import { fakeClient } from "./fake-supabase";

const CAFE = "cafe-1";

type Visit = { id: string; status: "draft" | "published"; date_visited: string; cover_photo_id: string | null };
type Pic = { id: string; review_id: string | null; created_at: string };

function setup(visits: Visit[], pics: Pic[], cover: string | null = null) {
  return fakeClient({
    cafes: [{ id: CAFE, cover_photo_url: cover }],
    reviews: visits.map((v) => ({ ...v, cafe_id: CAFE, created_at: `${v.date_visited}T12:00:00Z` })),
    photos: pics.map((p) => ({ ...p, cafe_id: CAFE, photo_url: `cafes/c/${p.id}.jpg` })),
  });
}

async function coverAfterSync(client: ReturnType<typeof setup>) {
  // The fake implements only the builder calls syncCoverPhoto makes.
  await syncCoverPhoto(client as never, CAFE);
  return client.tables.cafes[0].cover_photo_url;
}

describe("syncCoverPhoto", () => {
  it("uses latest published visit cover_photo_id", async () => {
    const client = setup(
      [
        { id: "v1", status: "published", date_visited: "2026-10-01", cover_photo_id: "p1" },
        { id: "v2", status: "published", date_visited: "2026-11-01", cover_photo_id: "p3" },
      ],
      [
        { id: "p1", review_id: "v1", created_at: "1" },
        { id: "p2", review_id: "v2", created_at: "2" },
        { id: "p3", review_id: "v2", created_at: "3" },
      ],
    );
    expect(await coverAfterSync(client)).toBe("cafes/c/p3.jpg");
  });

  it("falls back to the oldest photo of that visit without a cover_photo_id", async () => {
    const client = setup(
      [
        { id: "v1", status: "published", date_visited: "2026-10-01", cover_photo_id: "p0" },
        { id: "v2", status: "published", date_visited: "2026-11-01", cover_photo_id: null },
      ],
      [
        { id: "p0", review_id: "v1", created_at: "0" },
        { id: "p2", review_id: "v2", created_at: "2" },
        { id: "p1", review_id: "v2", created_at: "1" },
      ],
    );
    expect(await coverAfterSync(client)).toBe("cafes/c/p1.jpg");
  });

  it("ignores draft visits", async () => {
    const client = setup(
      [
        { id: "v1", status: "published", date_visited: "2026-10-01", cover_photo_id: "p1" },
        { id: "v2", status: "draft", date_visited: "2026-11-01", cover_photo_id: "p2" },
      ],
      [
        { id: "p1", review_id: "v1", created_at: "1" },
        { id: "p2", review_id: "v2", created_at: "2" },
      ],
    );
    expect(await coverAfterSync(client)).toBe("cafes/c/p1.jpg");
  });

  it("falls back to previous published visit when latest is unpublished", async () => {
    // v2 was the cover's visit; it has just been unpublished.
    const client = setup(
      [
        { id: "v1", status: "published", date_visited: "2026-10-01", cover_photo_id: "p1" },
        { id: "v2", status: "draft", date_visited: "2026-11-01", cover_photo_id: "p2" },
      ],
      [
        { id: "p1", review_id: "v1", created_at: "1" },
        { id: "p2", review_id: "v2", created_at: "2" },
      ],
      "cafes/c/p2.jpg",
    );
    expect(await coverAfterSync(client)).toBe("cafes/c/p1.jpg");
  });

  it("never uses a cover_photo_id that belongs to another visit", async () => {
    const client = setup(
      [
        { id: "v1", status: "published", date_visited: "2026-11-01", cover_photo_id: "p2" },
        { id: "v2", status: "draft", date_visited: "2026-10-01", cover_photo_id: null },
      ],
      [
        { id: "p1", review_id: "v1", created_at: "1" },
        { id: "p2", review_id: "v2", created_at: "2" },
      ],
    );
    expect(await coverAfterSync(client)).toBe("cafes/c/p1.jpg");
  });

  it("null when no published photos", async () => {
    const client = setup(
      [
        { id: "v1", status: "published", date_visited: "2026-10-01", cover_photo_id: null },
        { id: "v2", status: "draft", date_visited: "2026-11-01", cover_photo_id: "p2" },
      ],
      [{ id: "p2", review_id: "v2", created_at: "2" }],
      "cafes/c/p2.jpg",
    );
    expect(await coverAfterSync(client)).toBeNull();
  });

  it("null when the latest published visit has no photos", async () => {
    const client = setup(
      [
        { id: "v1", status: "published", date_visited: "2026-10-01", cover_photo_id: "p1" },
        { id: "v2", status: "published", date_visited: "2026-11-01", cover_photo_id: null },
      ],
      [{ id: "p1", review_id: "v1", created_at: "1" }],
      "cafes/c/p1.jpg",
    );
    expect(await coverAfterSync(client)).toBeNull();
  });

  it("doesn't write when the cover is already right", async () => {
    const client = setup(
      [{ id: "v1", status: "published", date_visited: "2026-10-01", cover_photo_id: "p1" }],
      [{ id: "p1", review_id: "v1", created_at: "1" }],
      "cafes/c/p1.jpg",
    );
    await coverAfterSync(client);
    expect(client.updates).toEqual([]);
  });
});
