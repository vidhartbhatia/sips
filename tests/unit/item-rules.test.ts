import { describe, expect, it } from "vitest";
import { isDrinkDirty, itemChangeAllowed, validateDraftItem } from "@/lib/item-rules";
import type { DraftItem } from "@/lib/actions/reviews";

const base: DraftItem = {
  name: "Hojicha latte",
  category: "drink",
  type: null,
  rating: null,
  is_favorite: false,
  notes: null,
};

describe("validateDraftItem", () => {
  it("rejects an empty or whitespace name", () => {
    for (const name of ["", "   ", "\n\t"]) {
      const result = validateDraftItem({ ...base, name });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/name/i);
    }
  });

  it("trims name and nulls empty notes and type", () => {
    const result = validateDraftItem({ ...base, name: "  Cortado  ", type: "  ", notes: "" });
    expect(result).toEqual({ ok: true, item: { ...base, name: "Cortado", type: null, notes: null } });
    const kept = validateDraftItem({ ...base, type: " oat ", notes: " Nutty. " });
    expect(kept).toEqual({ ok: true, item: { ...base, type: "oat", notes: "Nutty." } });
  });

  it("rejects ratings 0, 6 and 3.5", () => {
    for (const rating of [0, 6, 3.5, Number.NaN]) {
      const result = validateDraftItem({ ...base, rating });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/1 to 5/);
    }
  });

  it("accepts null and 1..5", () => {
    for (const rating of [null, 1, 2, 3, 4, 5]) {
      expect(validateDraftItem({ ...base, rating })).toEqual({ ok: true, item: { ...base, rating } });
    }
  });

  it("rejects an unknown category", () => {
    const result = validateDraftItem({ ...base, category: "pastry" as DraftItem["category"] });
    expect(result.ok).toBe(false);
  });

  it("rejects malformed input from the client instead of throwing", () => {
    const junk = [null, {}, { ...base, name: 42 }, { ...base, rating: "4" }] as unknown as DraftItem[];
    for (const item of junk) expect(validateDraftItem(item).ok).toBe(false);
    const fav = validateDraftItem({ ...base, is_favorite: "yes" } as unknown as DraftItem);
    expect(fav).toEqual({ ok: true, item: { ...base, is_favorite: false } });
  });
});

describe("itemChangeAllowed", () => {
  it("allows an unscored drink on a draft", () => {
    expect(itemChangeAllowed("draft", null)).toEqual({ ok: true });
    expect(itemChangeAllowed("draft", 3)).toEqual({ ok: true });
  });

  it("rejects an unscored drink on a published review", () => {
    const result = itemChangeAllowed("published", null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/published/);
    expect(itemChangeAllowed("published", 4)).toEqual({ ok: true });
  });
});

describe("isDrinkDirty", () => {
  it("an empty new row isn't dirty; a named new row is", () => {
    expect(isDrinkDirty({ ...base, name: "  " }, null)).toBe(false);
    expect(isDrinkDirty(base, null)).toBe(true);
  });

  it("compares a saved row after normalising", () => {
    expect(isDrinkDirty({ ...base, name: " Hojicha latte ", notes: "" }, base)).toBe(false);
    expect(isDrinkDirty({ ...base, rating: 4 }, base)).toBe(true);
    // A saved row whose name was cleared is dirty (and invalid), not silently clean.
    expect(isDrinkDirty({ ...base, name: "" }, base)).toBe(true);
  });
});
