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
