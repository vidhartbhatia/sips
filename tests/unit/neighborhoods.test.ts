import { describe, expect, it } from "vitest";
import { neighborhoodFromComponents, NEIGHBORHOODS, type AddressComponent } from "@/lib/neighborhoods";

const hood = (longText: string, types = ["neighborhood", "political"]): AddressComponent => ({
  longText,
  shortText: longText,
  types,
});
const city: AddressComponent = { longText: "Seattle", shortText: "Seattle", types: ["locality", "political"] };

describe("neighborhoodFromComponents", () => {
  it("maps Google's neighborhood onto ours", () => {
    expect(neighborhoodFromComponents([hood("Capitol Hill"), city])).toBe("Capitol Hill");
    expect(neighborhoodFromComponents([hood("Ballard"), city])).toBe("Ballard");
  });

  it("maps a sub-area that contains one of ours", () => {
    expect(neighborhoodFromComponents([hood("Lower Queen Anne")])).toBe("Queen Anne");
    expect(neighborhoodFromComponents([hood("North Capitol Hill")])).toBe("Capitol Hill");
    expect(neighborhoodFromComponents([hood("North Beacon Hill")])).toBe("Beacon Hill");
  });

  it("maps Google's other names for ours", () => {
    expect(neighborhoodFromComponents([hood("U District")])).toBe("University District");
    expect(neighborhoodFromComponents([hood("Pike Place Market")])).toBe("Pike Place");
    expect(neighborhoodFromComponents([hood("Uptown")])).toBe("Queen Anne");
  });

  it("prefers the neighborhood over a sublocality", () => {
    const components = [hood("Fremont", ["sublocality_level_1", "sublocality"]), hood("Wallingford")];
    expect(neighborhoodFromComponents(components)).toBe("Wallingford");
  });

  it("falls back to the sublocality when the neighborhood doesn't map", () => {
    const components = [hood("Belltown"), hood("Georgetown", ["sublocality_level_1", "sublocality"])];
    expect(neighborhoodFromComponents(components)).toBe("Georgetown");
  });

  it("returns null when nothing maps, never 'Other'", () => {
    expect(neighborhoodFromComponents([hood("Belltown"), city])).toBeNull();
    expect(neighborhoodFromComponents([city])).toBeNull();
    expect(neighborhoodFromComponents([hood("Other")])).toBeNull();
    expect(neighborhoodFromComponents([])).toBeNull();
    expect(neighborhoodFromComponents(undefined)).toBeNull();
  });

  it("doesn't match a name inside another word", () => {
    expect(neighborhoodFromComponents([hood("Ballardvale")])).toBeNull();
  });

  it("only ever suggests a neighbourhood from the list", () => {
    for (const n of NEIGHBORHOODS.filter((x) => x !== "Other")) {
      expect(neighborhoodFromComponents([hood(n)])).toBe(n);
    }
  });
});
