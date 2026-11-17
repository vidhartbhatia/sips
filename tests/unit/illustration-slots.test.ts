import { afterEach, describe, expect, it, vi } from "vitest";
import { fixturesEnabled } from "@/lib/fixtures";
import { DIVIDER, DOODLES, ILLUSTRATIONS, ORNAMENTS, doodleFor } from "@/lib/illustrations";

describe("doodleFor", () => {
  it("matches keywords in priority order", () => {
    expect(doodleFor("Iced matcha latte", "drink")).toBe("matcha"); // matcha beats latte
    expect(doodleFor("Hojicha", "drink")).toBe("matcha");
    expect(doodleFor("Cortado", "drink")).toBe("coffee");
    expect(doodleFor("Masala chai", "drink")).toBe("tea");
    expect(doodleFor("Almond croissant", "food")).toBe("pastry");
    expect(doodleFor("Breakfast sandwich", "food")).toBe("pastry");
  });

  it("never defaults an unknown drink to coffee", () => {
    expect(doodleFor("Lemonade", "drink")).toBeNull();
  });

  it("matches whole words only", () => {
    // "steamed" contains "tea"; it must not become a tea doodle.
    expect(doodleFor("Steamed milk", "drink")).toBeNull();
  });
});

describe("illustration slots", () => {
  it("point at today's files until K1", () => {
    expect(ILLUSTRATIONS.hero.src).toBe("/illustrations/cafe-scene.svg");
    expect(ILLUSTRATIONS.logo.src).toBe("/illustrations/coffee-cup.svg");
    expect(ILLUSTRATIONS.empty.src).toBe("/illustrations/coffee-cup.svg");
    expect(ILLUSTRATIONS["404"].src).toBe("/illustrations/coffee-cup.svg");
    expect(ILLUSTRATIONS.about.src).toBe("/illustrations/cat-with-cup.svg");
    expect(DOODLES).toEqual({});
    expect(ORNAMENTS).toEqual({});
    expect(DIVIDER).toBeNull();
  });
});

describe("fixturesEnabled", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is off when SIPS_FIXTURES is unset", () => {
    vi.stubEnv("SIPS_FIXTURES", undefined);
    vi.stubEnv("VERCEL", undefined);
    expect(fixturesEnabled()).toBe(false);
  });

  it("is off on Vercel even with SIPS_FIXTURES=1", () => {
    vi.stubEnv("SIPS_FIXTURES", "1");
    vi.stubEnv("VERCEL", "1");
    expect(fixturesEnabled()).toBe(false);
  });

  it("is on only with SIPS_FIXTURES=1 off Vercel", () => {
    vi.stubEnv("SIPS_FIXTURES", "1");
    vi.stubEnv("VERCEL", undefined);
    expect(fixturesEnabled()).toBe(true);
  });
});
