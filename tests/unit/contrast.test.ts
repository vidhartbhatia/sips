import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Hex tokens from the `:root` block only. `@theme inline` re-declares the same
// names as `var(...)`, so reading the whole file would overwrite these.
function rootColors(): Record<string, string> {
  const css = readFileSync(join(import.meta.dirname, "../../app/globals.css"), "utf8");
  const root = css.match(/:root\s*\{([^}]*)\}/);
  if (!root) throw new Error("no :root block in app/globals.css");
  const colors: Record<string, string> = {};
  for (const [, name, hex] of root[1].matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    colors[name] = hex;
  }
  return colors;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const c = rootColors();

describe("AA contrast tokens", () => {
  it("parses the tokens it checks", () => {
    for (const name of ["cream", "stone", "espresso", "espresso-muted", "terracotta", "terracotta-dark"]) {
      expect(c[name], name).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it.each([
    ["espresso-muted", "cream"],
    ["espresso-muted", "stone"],
    ["terracotta-dark", "cream"],
    ["terracotta-dark", "stone"],
    ["cream", "terracotta-dark"],
    ["espresso", "stone"],
  ])("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrastRatio(c[fg], c[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it("terracotta on cream is large-text only (3:1 to 4.5:1)", () => {
    const ratio = contrastRatio(c.terracotta, c.cream);
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio).toBeLessThan(4.5);
  });

  it("terracotta is never text on stone (below 3:1)", () => {
    expect(contrastRatio(c.terracotta, c.stone)).toBeLessThan(3);
  });
});
