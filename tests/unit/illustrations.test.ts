import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as registry from "@/lib/illustrations";
import { DIVIDER, DOODLES, ILLUSTRATIONS, ORNAMENTS, type Asset } from "@/lib/illustrations";

const PUBLIC = path.join(import.meta.dirname, "../../public");
const PALETTE = new Set(["#2c2420", "#8baa8f", "#c4735b", "none", "currentcolor"]);
const KB = 1024;

// HERO_MOBILE is optional: it exists only if the hero ships an art-directed mobile crop.
const heroMobile = (registry as { HERO_MOBILE?: Asset }).HERO_MOBILE;

const slots: Array<[string, Asset]> = [
  ...Object.entries(ILLUSTRATIONS),
  ...Object.entries(DOODLES).filter((e): e is [string, Asset] => e[1] !== undefined),
  ...Object.entries(ORNAMENTS).filter((e): e is [string, Asset] => e[1] !== undefined),
  ...(DIVIDER ? [["divider", DIVIDER] as [string, Asset]] : []),
  ...(heroMobile ? [["hero-mobile", heroMobile] as [string, Asset]] : []),
];

const file = (asset: Asset) => path.join(PUBLIC, asset.src);
const isSvg = (asset: Asset) => asset.src.endsWith(".svg");
const isWebp = (asset: Asset) => asset.src.endsWith(".webp");

/** Canvas size and alpha flag from a WebP's VP8X header; null if it isn't an extended WebP. */
function vp8x(buf: Buffer): { alpha: boolean; width: number; height: number } | null {
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return null;
  if (buf.toString("ascii", 12, 16) !== "VP8X") return null;
  return {
    alpha: (buf[20] & 0x10) !== 0,
    width: buf.readUIntLE(24, 3) + 1,
    height: buf.readUIntLE(27, 3) + 1,
  };
}

function viewBox(svg: string): { width: number; height: number } {
  const m = svg.match(/viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/);
  if (!m) throw new Error("SVG has no viewBox");
  return { width: Number(m[1]), height: Number(m[2]) };
}

describe("illustration registry (K1)", () => {
  it("fills every doodle slot and the divider", () => {
    expect(Object.keys(DOODLES).sort()).toEqual(["coffee", "matcha", "pastry", "tea"]);
    expect(DIVIDER).not.toBeNull();
  });

  it.each(slots)("%s: file exists under public/", (_, asset) => {
    expect(asset.src.startsWith("/illustrations/")).toBe(true);
    expect(statSync(file(asset)).isFile()).toBe(true);
  });

  it.each(slots)("%s: within its size budget", (name, asset) => {
    const size = statSync(file(asset)).size;
    const budget = isSvg(asset) ? 20 * KB : name.startsWith("hero") ? 300 * KB : 60 * KB;
    expect(size).toBeLessThanOrEqual(budget);
  });

  it.each(slots)("%s: registry ratio matches the file", (_, asset) => {
    const buf = readFileSync(file(asset));
    const real = isSvg(asset) ? viewBox(buf.toString("utf8")) : vp8x(buf);
    expect(real).not.toBeNull();
    expect(asset.width / asset.height).toBeCloseTo(real!.width / real!.height, 2);
  });

  it.each(slots.filter(([, a]) => isWebp(a)))("%s: WebP has an alpha channel", (_, asset) => {
    expect(vp8x(readFileSync(file(asset)))?.alpha).toBe(true);
  });

  it.each(slots.filter(([, a]) => isSvg(a)))("%s: SVG uses only the palette, no background", (_, asset) => {
    const svg = readFileSync(file(asset), "utf8");
    const colours = [...svg.matchAll(/(?:fill|stroke|stop-color|color)\s*[=:]\s*"?\s*([^";\s>]+)/gi)].map((m) =>
      m[1].toLowerCase(),
    );
    const hexes = (svg.match(/#[0-9a-f]{3,8}\b/gi) ?? []).map((h) => h.toLowerCase());
    for (const c of [...colours, ...hexes]) expect(PALETTE, `colour ${c}`).toContain(c);
    expect(svg).not.toMatch(/<rect\b/i);
    expect(svg).not.toMatch(/<image\b/i);
  });
});

describe("palette check self-test", () => {
  it("catches an off-palette fill and a white background", () => {
    const bad = '<svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#fff"/></svg>';
    const hexes = (bad.match(/#[0-9a-f]{3,8}\b/gi) ?? []).map((h) => h.toLowerCase());
    expect(hexes.some((h) => !PALETTE.has(h))).toBe(true);
    expect(bad).toMatch(/<rect\b/i);
  });
});
