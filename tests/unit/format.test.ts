import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatMonthYear, formatScore, formatVisits, mapsUrl, toParagraphs } from "@/lib/format";

describe("formatMonthYear", () => {
  it("reads the month from the string, never shifting it", () => {
    expect(formatMonthYear("2026-11-01")).toBe("November 2026");
    expect(formatMonthYear("2026-01-31")).toBe("January 2026");
  });

  it("lib/format.ts never constructs a Date", () => {
    const source = readFileSync(join(import.meta.dirname, "../../lib/format.ts"), "utf8");
    expect(source).not.toMatch(/new Date\(/);
  });
});

describe("formatScore", () => {
  it("drops a trailing .0 and keeps halves", () => {
    expect(formatScore(4)).toBe("4");
    expect(formatScore(4.5)).toBe("4.5");
  });
});

describe("formatVisits", () => {
  it("pluralises", () => {
    expect(formatVisits(1)).toBe("1 visit");
    expect(formatVisits(2)).toBe("2 visits");
  });
});

describe("toParagraphs", () => {
  it("treats any run of newlines as a paragraph break", () => {
    expect(toParagraphs("a\r\n\r\nb")).toEqual(["a", "b"]);
    expect(toParagraphs("a\nb")).toEqual(["a", "b"]);
    expect(toParagraphs("a\n\n\n\nb  ")).toEqual(["a", "b"]);
  });

  it("drops whitespace-only lines", () => {
    expect(toParagraphs("a\n  \nb")).toEqual(["a", "b"]);
  });

  it("returns [] for blank or null text", () => {
    expect(toParagraphs("  ")).toEqual([]);
    expect(toParagraphs(null)).toEqual([]);
  });

  it("keeps five or more paragraphs", () => {
    expect(toParagraphs("one\ntwo\nthree\nfour\nfive")).toHaveLength(5);
  });
});

describe("mapsUrl", () => {
  it("encodes name and address as one query", () => {
    const url = mapsUrl("Elm Coffee", "240 2nd Ave S", null);
    expect(url).toContain("query=Elm%20Coffee%2C%20240%202nd%20Ave%20S");
    expect(url).not.toContain("query_place_id");
  });

  it("adds the place id when set", () => {
    expect(mapsUrl("Elm Coffee", "240 2nd Ave S", "ChIJ123")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Elm%20Coffee%2C%20240%202nd%20Ave%20S&query_place_id=ChIJ123",
    );
  });
});
