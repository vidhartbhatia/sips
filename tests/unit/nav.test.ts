import { describe, expect, it } from "vitest";
import { publicNav } from "@/lib/nav";

const hrefs = (hasStories: boolean) => publicNav(hasStories).map((l) => l.href);

describe("publicNav", () => {
  it("leaves Stories out until one is published", () => {
    expect(hrefs(false)).toEqual(["/cafes", "/about"]);
  });

  it("lists Stories between Cafes and About once one is published", () => {
    expect(hrefs(true)).toEqual(["/cafes", "/stories", "/about"]);
    expect(publicNav(true)[1]?.label).toBe("Stories");
  });

  it("never links the map or want-to-go", () => {
    for (const hasStories of [false, true]) {
      expect(hrefs(hasStories)).not.toContain("/map");
      expect(hrefs(hasStories)).not.toContain("/want-to-go");
    }
  });
});
