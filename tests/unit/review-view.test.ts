import { describe, expect, it } from "vitest";
import { pickCafeCover } from "@/lib/cover-photo";
import { buildReviewPage, toPreviewInput, type ReviewPageInput } from "@/lib/review-view";
import type { Item, Photo, Review, ReviewAuthor } from "@/lib/supabase/types";

type Visit = Review & { author: ReviewAuthor | null };

const CAFE: ReviewPageInput["cafe"] = {
  name: "Larkspur Coffee",
  slug: "larkspur-coffee",
  neighborhood: "Capitol Hill",
  address: "100 Pine St, Seattle, WA",
  vibe_tags: ["cozy"],
  google_place_id: null,
};

function visit(id: string, over: Partial<Visit> = {}): Visit {
  return {
    id,
    cafe_id: "cafe-1",
    author_id: "u1",
    date_visited: "2026-11-01",
    note: null,
    overall_rating: 4,
    verdict: null,
    cover_photo_id: null,
    status: "published",
    created_at: "2026-11-01T12:00:00Z",
    updated_at: "2026-11-01T12:00:00Z",
    author: { display_name: "Lea" },
    ...over,
  };
}

function item(id: string, reviewId: string, over: Partial<Item> = {}): Item {
  return {
    id,
    cafe_id: "cafe-1",
    review_id: reviewId,
    name: "Cortado",
    category: "drink",
    type: null,
    rating: 4,
    photo_url: null,
    notes: null,
    is_favorite: false,
    created_at: "2026-11-01T12:00:00Z",
    ...over,
  };
}

function photo(id: string, reviewId: string, over: Partial<Photo> = {}): Photo {
  return {
    id,
    cafe_id: "cafe-1",
    review_id: reviewId,
    item_id: null,
    photo_url: `https://signed.example/${id}.jpg`,
    caption: null,
    created_at: `2026-11-01T12:00:0${id.slice(-1)}Z`,
    ...over,
  };
}

function input(over: Partial<ReviewPageInput> = {}): ReviewPageInput {
  return { cafe: CAFE, reviews: [visit("v1")], items: [], photos: [], ...over };
}

describe("buildReviewPage", () => {
  it("returns null with no visits", () => {
    expect(buildReviewPage(input({ reviews: [] }))).toBeNull();
  });

  it("orders visits by date then created_at; lead is newest", () => {
    const view = buildReviewPage(
      input({
        reviews: [
          visit("old", { date_visited: "2026-10-01" }),
          visit("same-day-early", { date_visited: "2026-11-05", created_at: "2026-11-05T08:00:00Z" }),
          visit("same-day-late", { date_visited: "2026-11-05", created_at: "2026-11-05T18:00:00Z" }),
        ],
      }),
    );
    expect(view?.lead.id).toBe("same-day-late");
    expect(view?.earlier.map((v) => v.id)).toEqual(["same-day-early", "old"]);
  });

  it("leadVisitId puts a draft first and the rest in earlier", () => {
    const view = buildReviewPage(
      input({
        reviews: [
          visit("pub-new", { date_visited: "2026-11-10" }),
          visit("draft", { status: "draft", date_visited: "2026-11-01" }),
          visit("pub-old", { date_visited: "2026-10-01" }),
        ],
      }),
      { leadVisitId: "draft" },
    );
    expect(view?.lead.id).toBe("draft");
    expect(view?.lead.status).toBe("draft");
    expect(view?.earlier.map((v) => v.id)).toEqual(["pub-new", "pub-old"]);
  });

  it("an unknown leadVisitId falls back to the newest visit", () => {
    const view = buildReviewPage(input({ reviews: [visit("a")] }), { leadVisitId: "missing" });
    expect(view?.lead.id).toBe("a");
  });

  it("score is the 0.5-rounded mean of scored visits; null when none scored", () => {
    const three = buildReviewPage(
      input({
        reviews: [
          visit("a", { overall_rating: 5 }),
          visit("b", { overall_rating: 4 }),
          visit("c", { overall_rating: 4 }),
        ],
      }),
    );
    expect(three?.score).toEqual({ value: 4.5, visits: 3 });

    const partial = buildReviewPage(
      input({ reviews: [visit("a", { overall_rating: 4 }), visit("b", { overall_rating: null })] }),
    );
    expect(partial?.score).toEqual({ value: 4, visits: 1 });

    const none = buildReviewPage(input({ reviews: [visit("a", { overall_rating: null })] }));
    expect(none?.score).toEqual({ value: null, visits: 0 });
  });

  describe("hero", () => {
    it("uses the photo named by cover_photo_id", () => {
      const view = buildReviewPage(
        input({
          reviews: [visit("v1", { cover_photo_id: "p2" })],
          photos: [photo("p1", "v1"), photo("p2", "v1")],
        }),
      );
      expect(view?.lead.hero?.id).toBe("p2");
    });

    it("falls back to the visit's oldest photo, drink photos included", () => {
      const view = buildReviewPage(
        input({
          items: [item("i1", "v1")],
          photos: [photo("p2", "v1"), photo("p1", "v1", { item_id: "i1" })],
        }),
      );
      expect(view?.lead.hero?.id).toBe("p1");
    });

    it("cover_photo_id points at a dropped photo → falls back", () => {
      const view = buildReviewPage(
        input({
          reviews: [visit("v1", { cover_photo_id: "gone" })],
          photos: [photo("p2", "v1"), photo("p1", "v1")],
        }),
      );
      expect(view?.lead.hero?.id).toBe("p1");
    });

    it("cover_photo_id pointing at another visit's photo is ignored", () => {
      const view = buildReviewPage(
        input({
          reviews: [
            visit("v2", { date_visited: "2026-11-10", cover_photo_id: "other" }),
            visit("v1", { date_visited: "2026-10-01" }),
          ],
          photos: [photo("other", "v1"), photo("p1", "v2")],
        }),
      );
      expect(view?.lead.hero?.id).toBe("p1");
    });

    it("no photos → null", () => {
      expect(buildReviewPage(input())?.lead.hero).toBeNull();
    });

    it("hero agrees with pickCafeCover", () => {
      const cases: ReviewPageInput[] = [
        input({
          reviews: [visit("v1", { cover_photo_id: "p3" })],
          photos: [photo("p1", "v1"), photo("p3", "v1"), photo("p2", "v1")],
        }),
        input({
          items: [item("i1", "v1")],
          photos: [photo("p3", "v1"), photo("p1", "v1", { item_id: "i1" }), photo("p2", "v1")],
        }),
        input(),
      ];
      for (const c of cases) {
        const view = buildReviewPage(c);
        expect(view?.lead.hero?.url ?? null).toBe(pickCafeCover(c.reviews, c.photos));
      }
    });
  });

  it("drink photo attaches by item_id and is excluded from the strip", () => {
    const view = buildReviewPage(
      input({
        items: [item("i1", "v1")],
        photos: [photo("p1", "v1"), photo("p2", "v1", { item_id: "i1" }), photo("p3", "v1")],
      }),
    );
    expect(view?.lead.hero?.id).toBe("p1");
    expect(view?.lead.drinks[0].photo?.id).toBe("p2");
    expect(view?.lead.strip.map((p) => p.id)).toEqual(["p3"]);
  });

  it("a second photo of the same drink goes to the strip", () => {
    const view = buildReviewPage(
      input({
        items: [item("i1", "v1")],
        photos: [
          photo("p1", "v1"),
          photo("p2", "v1", { item_id: "i1" }),
          photo("p3", "v1", { item_id: "i1" }),
        ],
      }),
    );
    expect(view?.lead.drinks[0].photo?.id).toBe("p2");
    expect(view?.lead.strip.map((p) => p.id)).toEqual(["p3"]);
  });

  it("hero never doubles as a drink photo or strip photo", () => {
    const view = buildReviewPage(
      input({
        reviews: [visit("v1", { cover_photo_id: "p2" })],
        items: [item("i1", "v1", { name: "Cortado" })],
        photos: [photo("p1", "v1"), photo("p2", "v1", { item_id: "i1" })],
      }),
    );
    expect(view?.lead.hero?.id).toBe("p2");
    expect(view?.lead.drinks[0].photo).toBeNull();
    expect(view?.lead.drinks[0].doodle).toBe("coffee");
    expect(view?.lead.strip.map((p) => p.id)).toEqual(["p1"]);
  });

  it("drops photos missing from input", () => {
    // The query dropped the visit's only photo (it failed to sign), but the cover still names it.
    const view = buildReviewPage(input({ reviews: [visit("v1", { cover_photo_id: "p1" })], photos: [] }));
    expect(view?.lead.hero).toBeNull();
    expect(view?.lead.strip).toEqual([]);
  });

  it("alt uses caption, else drink name, else visit description", () => {
    const view = buildReviewPage(
      input({
        reviews: [visit("v1", { date_visited: "2026-11-01" })],
        items: [item("i1", "v1", { name: "Cortado" }), item("i2", "v1", { name: "Iced matcha latte" })],
        photos: [
          photo("p1", "v1"),
          photo("p2", "v1", { item_id: "i1" }),
          photo("p3", "v1", { item_id: "i2", caption: "  Matcha on the window ledge " }),
          photo("p4", "v1"),
          photo("p5", "v1", { caption: "The bar at opening" }),
          photo("p6", "v1"),
        ],
      }),
    );
    expect(view?.lead.hero?.alt).toBe("Our visit to Larkspur Coffee, November 2026");
    expect(view?.lead.drinks[0].photo?.alt).toBe("Cortado at Larkspur Coffee");
    expect(view?.lead.drinks[1].photo?.alt).toBe("Matcha on the window ledge");
    expect(view?.lead.strip.map((p) => p.alt)).toEqual([
      "Photo 1 from our visit to Larkspur Coffee",
      "The bar at opening",
      "Photo 3 from our visit to Larkspur Coffee",
    ]);
  });

  it("null author gives author null", () => {
    expect(buildReviewPage(input({ reviews: [visit("v1", { author: null })] }))?.lead.author).toBeNull();
    expect(
      buildReviewPage(input({ reviews: [visit("v1", { author: { display_name: "  " } })] }))?.lead.author,
    ).toBeNull();
    expect(buildReviewPage(input())?.lead.author).toBe("Lea");
  });

  it("lemonade gets doodle null; iced matcha latte gets matcha", () => {
    const view = buildReviewPage(
      input({
        items: [
          item("i1", "v1", { name: "Lavender lemonade", created_at: "2026-11-01T12:00:01Z" }),
          item("i2", "v1", { name: "Iced matcha latte", created_at: "2026-11-01T12:00:02Z" }),
        ],
      }),
    );
    expect(view?.lead.drinks.map((d) => d.doodle)).toEqual([null, "matcha"]);
  });

  it("C-shaped items (name only, type null) still get doodles", () => {
    const view = buildReviewPage(input({ items: [item("i1", "v1", { name: "Cortado", type: null })] }));
    expect(view?.lead.drinks[0].doodle).toBe("coffee");
  });

  it("drinks follow created_at and stay with their own visit", () => {
    const view = buildReviewPage(
      input({
        reviews: [visit("v2", { date_visited: "2026-11-10" }), visit("v1", { date_visited: "2026-10-01" })],
        items: [
          item("b", "v2", { name: "Second", created_at: "2026-11-10T12:00:02Z" }),
          item("a", "v2", { name: "First", created_at: "2026-11-10T12:00:01Z" }),
          item("c", "v1", { name: "Old" }),
        ],
      }),
    );
    expect(view?.lead.drinks.map((d) => d.name)).toEqual(["First", "Second"]);
    expect(view?.earlier[0].drinks.map((d) => d.name)).toEqual(["Old"]);
  });

  it("maps visit fields: paragraphs, month, cafe facts", () => {
    const view = buildReviewPage(
      input({
        reviews: [visit("v1", { note: "One.\r\n\r\n\nTwo.  \nThree.", verdict: "Worth the walk." })],
      }),
    );
    expect(view?.lead.paragraphs).toEqual(["One.", "Two.", "Three."]);
    expect(view?.lead.monthYear).toBe("November 2026");
    expect(view?.lead.verdict).toBe("Worth the walk.");
    expect(view?.cafe.tags).toEqual(["cozy"]);
    expect(view?.cafe.mapsUrl).toContain("google.com/maps");
  });
});

describe("toPreviewInput", () => {
  const rows = (over: Partial<Parameters<typeof toPreviewInput>[0]> = {}) => ({
    review: visit("draft", { status: "draft" as const }),
    cafe: CAFE,
    published: [visit("pub")],
    items: [],
    photos: [],
    ...over,
  });

  it("previewing a published review includes it once", () => {
    const pub = visit("pub");
    const { input: out, leadVisitId } = toPreviewInput(rows({ review: pub, published: [pub, visit("other")] }));
    expect(out.reviews.map((r) => r.id).sort()).toEqual(["other", "pub"]);
    expect(leadVisitId).toBe("pub");
  });

  it("another draft of the same cafe is excluded, with its items and photos", () => {
    const { input: out } = toPreviewInput(
      rows({
        published: [visit("pub"), visit("other-draft", { status: "draft" })],
        items: [item("i1", "draft"), item("i2", "other-draft"), item("i3", "pub")],
        photos: [photo("p1", "draft"), photo("p2", "other-draft"), photo("p3", "pub")],
      }),
    );
    expect(out.reviews.map((r) => r.id).sort()).toEqual(["draft", "pub"]);
    expect(out.items.map((i) => i.id).sort()).toEqual(["i1", "i3"]);
    expect(out.photos.map((p) => p.id).sort()).toEqual(["p1", "p3"]);
  });

  it("items and photos of unrelated reviews are dropped", () => {
    const { input: out } = toPreviewInput(
      rows({
        items: [item("i1", "draft"), item("i9", "elsewhere"), item("i0", null as unknown as string)],
        photos: [photo("p1", "draft"), photo("p9", "elsewhere")],
      }),
    );
    expect(out.items.map((i) => i.id)).toEqual(["i1"]);
    expect(out.photos.map((p) => p.id)).toEqual(["p1"]);
  });

  it("preview: a draft dated earlier than the latest published visit still leads, and the score includes it", () => {
    const { input: out, leadVisitId } = toPreviewInput(
      rows({
        review: visit("draft", { status: "draft", date_visited: "2026-11-01", overall_rating: 3 }),
        published: [visit("pub", { date_visited: "2026-11-10", overall_rating: 5 })],
      }),
    );
    const view = buildReviewPage(out, { leadVisitId });
    expect(view?.lead.status).toBe("draft");
    expect(view?.earlier.length).toBe(1);
    expect(view?.score).toEqual({ value: 4, visits: 2 });
  });
});
