import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
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

// Contract only: K1 repoints these slots and fills doodles/divider, so no file names here.
describe("illustration slots", () => {
  const isAsset = (a: { src: string; width: number; height: number }) =>
    a.src.startsWith("/illustrations/") && a.width > 0 && a.height > 0;

  it("every page slot has an asset under /illustrations/", () => {
    for (const slot of ["hero", "logo", "empty", "404", "about"] as const) {
      expect(isAsset(ILLUSTRATIONS[slot]), slot).toBe(true);
    }
  });

  it("set doodles, ornaments and the divider are valid assets", () => {
    for (const asset of [...Object.values(DOODLES), ...Object.values(ORNAMENTS)]) {
      expect(isAsset(asset)).toBe(true);
    }
    if (DIVIDER) expect(isAsset(DIVIDER)).toBe(true);
  });
});

describe("no raw illustration paths outside the registry", () => {
  // Every file under app/, components/ and lib/, marked for design rules or not. Pages use
  // slots, so deleting or swapping an asset only ever touches lib/illustrations.ts.
  const ROOT = path.resolve(import.meta.dirname, "../..");
  const REGISTRY = path.join("lib", "illustrations.ts");

  it("only lib/illustrations.ts names a /illustrations/ file", () => {
    const offenders = ["app", "components", "lib"]
      .flatMap((dir) => readdirSync(path.join(ROOT, dir), { withFileTypes: true, recursive: true }))
      .filter((e) => e.isFile() && /\.(?:tsx?|css|mdx?)$/.test(e.name))
      .map((e) => path.relative(ROOT, path.join(e.parentPath, e.name)))
      .filter((file) => file !== REGISTRY && /["'`(]\/illustrations\//.test(readFileSync(path.join(ROOT, file), "utf8")));
    expect(offenders, offenders.join("\n")).toEqual([]);
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
