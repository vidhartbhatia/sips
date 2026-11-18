import { describe, expect, it } from "vitest";
import { byLatestVisit, homeLayout, showFilters, summarizeVisits } from "@/lib/listing";

describe("homeLayout", () => {
  it("is empty with no cafes", () => {
    expect(homeLayout(0)).toBe("empty");
  });

  it("features one or two cafes", () => {
    expect(homeLayout(1)).toBe("featured");
    expect(homeLayout(2)).toBe("featured");
  });

  it("is a grid from three cafes", () => {
    expect(homeLayout(3)).toBe("grid");
    expect(homeLayout(50)).toBe("grid");
  });
});

describe("showFilters", () => {
  it("hides filters below six cafes", () => {
    expect(showFilters(5)).toBe(false);
  });

  it("shows filters at six cafes", () => {
    expect(showFilters(6)).toBe(true);
  });
});

describe("summarizeVisits", () => {
  it("takes the latest visit's verdict and date and counts visits per cafe", () => {
    const rows = [
      { cafe_id: "a", verdict: "Old verdict", date_visited: "2026-09-01", created_at: "2026-09-01T10:00:00Z" },
      { cafe_id: "a", verdict: "New verdict", date_visited: "2026-11-01", created_at: "2026-11-02T10:00:00Z" },
      { cafe_id: "b", verdict: null, date_visited: "2026-10-05", created_at: "2026-10-05T10:00:00Z" },
    ];
    expect(summarizeVisits(rows)).toEqual({
      a: { verdict: "New verdict", latestVisit: "2026-11-01", visits: 2 },
      b: { verdict: null, latestVisit: "2026-10-05", visits: 1 },
    });
  });

  it("breaks a same-day tie by the later created_at", () => {
    const rows = [
      { cafe_id: "a", verdict: "Morning", date_visited: "2026-11-01", created_at: "2026-11-01T08:00:00Z" },
      { cafe_id: "a", verdict: "Afternoon", date_visited: "2026-11-01", created_at: "2026-11-01T15:00:00Z" },
    ];
    expect(summarizeVisits(rows).a.verdict).toBe("Afternoon");
  });

  it("gives {} for no rows", () => {
    expect(summarizeVisits([])).toEqual({});
  });
});

describe("byLatestVisit", () => {
  it("orders cafes by their latest visit, newest first, not by score", () => {
    const summaries = {
      old: { verdict: null, latestVisit: "2026-08-01", visits: 1 },
      mid: { verdict: null, latestVisit: "2026-10-01", visits: 1 },
      new: { verdict: null, latestVisit: "2026-11-01", visits: 1 },
    };
    const cafes = [
      { id: "old", overall_rating: 5 },
      { id: "new", overall_rating: 2 },
      { id: "none", overall_rating: 4 },
      { id: "mid", overall_rating: 3 },
    ];
    expect([...cafes].sort(byLatestVisit(summaries)).map((c) => c.id)).toEqual(["new", "mid", "old", "none"]);
  });
});
