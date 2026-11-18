import { describe, expect, it } from "vitest";
import { toMeta } from "@/lib/blog-meta";

const base = { title: "A story", date: "2026-11-02" };

describe("toMeta", () => {
  it("cafes frontmatter keeps valid slugs only", () => {
    const meta = toMeta("a-story", { ...base, cafes: ["elm-coffee-roasters", "Bad Slug", 3] });
    expect(meta?.cafes).toEqual(["elm-coffee-roasters"]);
  });

  it("missing cafes gives []", () => {
    expect(toMeta("a-story", base)?.cafes).toEqual([]);
  });

  it("cafes that isn't a list gives []", () => {
    expect(toMeta("a-story", { ...base, cafes: "elm-coffee-roasters" })?.cafes).toEqual([]);
  });

  it("a draft gives null from toMeta", () => {
    expect(toMeta("a-story", { ...base, draft: true, cafes: ["elm-coffee-roasters"] })).toBeNull();
  });
});
