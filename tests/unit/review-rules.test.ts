import { describe, expect, it } from "vitest";
import { canPublish } from "@/lib/review-rules";

describe("canPublish", () => {
  it("rejects publish without overall", () => {
    const result = canPublish({ overall_rating: null }, [{ name: "Latte", rating: 4 }]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/overall/i);
  });

  it("rejects publish when any drink unscored", () => {
    const result = canPublish({ overall_rating: 4 }, [
      { name: "Latte", rating: 4 },
      { name: "Hojicha", rating: null },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("Hojicha");
  });

  it("allows publish with all scores", () => {
    expect(canPublish({ overall_rating: 4 }, [{ name: "Latte", rating: 5 }])).toEqual({ ok: true });
    expect(canPublish({ overall_rating: 3 }, [])).toEqual({ ok: true });
  });

  it("rejects a score outside 1-5", () => {
    expect(canPublish({ overall_rating: 0 }, []).ok).toBe(false);
    expect(canPublish({ overall_rating: 4 }, [{ name: "Latte", rating: 6 }]).ok).toBe(false);
  });
});

describe("canPublish: the cafe needs an address", () => {
  const located = { address: "1000 E Pike St, Seattle, WA 98122, USA", lat: 47.6139, lng: -122.3194 };
  const ADDRESS = "Add the cafe's address before publishing.";

  it("allows a cafe with an address and coordinates", () => {
    expect(canPublish({ overall_rating: 4 }, [], located)).toEqual({ ok: true });
  });

  it("refuses a cafe with no address", () => {
    expect(canPublish({ overall_rating: 4 }, [], { ...located, address: "" })).toEqual({ ok: false, reason: ADDRESS });
    expect(canPublish({ overall_rating: 4 }, [], { ...located, address: "   " })).toEqual({ ok: false, reason: ADDRESS });
    expect(canPublish({ overall_rating: 4 }, [], { ...located, address: null })).toEqual({ ok: false, reason: ADDRESS });
  });

  it("refuses a cafe at 0,0 (the old 'no location' value)", () => {
    expect(canPublish({ overall_rating: 4 }, [], { ...located, lat: 0, lng: 0 })).toEqual({ ok: false, reason: ADDRESS });
    expect(canPublish({ overall_rating: 4 }, [], { ...located, lat: null, lng: null })).toEqual({ ok: false, reason: ADDRESS });
  });

  it("asks for the scores first", () => {
    const result = canPublish({ overall_rating: null }, [], { address: "", lat: 0, lng: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/overall/i);
  });

  it("skips the cafe check when no cafe is given (a review that's already live)", () => {
    expect(canPublish({ overall_rating: 4 }, [])).toEqual({ ok: true });
  });
});
