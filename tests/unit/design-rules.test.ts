import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Design rules ("Ink & Paper", AGENTS.md and the launch spec), checked in source.
 *
 * Opt-in per file: only `.tsx` files under `app/` and `components/` whose first line is the
 * marker below are checked. Each PR adds the marker to the files it owns, so no PR edits a
 * shared list. The launch gate flips enforcement to every public file.
 *
 * Terracotta text sizing is left to axe and the launch gate: a className heuristic can't follow
 * responsive prefixes.
 */

const MARKER = "// design-rules: enforced";

const ROOT = path.resolve(import.meta.dirname, "../..");
const DIRS = ["app", "components"];

interface Rule {
  name: string;
  pattern: RegExp;
}

const RULES: Rule[] = [
  { name: "text-pink (pink is never text)", pattern: /text-pink/ },
  { name: "text-sage (sage is never text)", pattern: /text-sage/ },
  { name: "text-brown (deprecated)", pattern: /text-brown/ },
  { name: "font-hand (deprecated)", pattern: /font-hand/ },
  { name: "hand-drawn-border (deprecated)", pattern: /hand-drawn-border/ },
  { name: "text-[10px] (mono minimum is 11px)", pattern: /text-\[10px\]/ },
  { name: "text-[9px] (mono minimum is 11px)", pattern: /text-\[9px\]/ },
  { name: "whileInView (no entrance animation)", pattern: /whileInView/ },
  { name: "staggerChildren (no entrance animation)", pattern: /staggerChildren/ },
  { name: "initial={{ opacity: 0 (render visible from the server)", pattern: /initial\s*=\s*\{\{[^}]*\bopacity:\s*0(?:\.0+)?(?![.\d])/ },
  { name: "SipsRating import (use Score)", pattern: /["']@\/components\/ui\/SipsRating["']/ },
  { name: "raw /illustrations/ path (use the slots in lib/illustrations.ts)", pattern: /["'`(]\/illustrations\// },
  { name: "hover:text-terracotta (use hover:text-terracotta-dark)", pattern: /hover:text-terracotta(?![\w-])/ },
];

/** Names of the rules `source` breaks. */
function violations(source: string): string[] {
  return RULES.filter((r) => r.pattern.test(source)).map((r) => r.name);
}

function isEnforced(source: string): boolean {
  return source.split(/\r?\n/, 1)[0]?.trim() === MARKER;
}

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith(".tsx"))
    .map((e) => path.join(e.parentPath, e.name));
}

describe("design-rules checker (self-test)", () => {
  const breaking: [string, string][] = [
    ["text-pink", '<p className="text-pink">'],
    ["text-sage", '<p className="md:text-sage-dark">'],
    ["text-brown", '<p className="text-brown-muted">'],
    ["font-hand", '<h2 className="font-hand">'],
    ["hand-drawn-border", '<div className="hand-drawn-border">'],
    ["text-[10px]", '<span className="text-[10px]">'],
    ["text-[9px]", '<span className="text-[9px]">'],
    ["whileInView", "<motion.div whileInView={{ opacity: 1 }}>"],
    ["staggerChildren", "transition: { staggerChildren: 0.1 }"],
    ["initial={{ opacity: 0", "<motion.div initial={{ opacity: 0, y: 8 }}>"],
    ["initial={{opacity:0", "<motion.div initial={{opacity:0}}>"],
    ["initial={{ opacity: 0.0", "<motion.div initial={{ opacity: 0.0 }}>"],
    ["opacity: 0 after another key", "<motion.div initial={{ y: 8, opacity: 0 }}>"],
    ["spaces around =", "<motion.div initial = {{ opacity: 0 }}>"],
    ["SipsRating import", 'import SipsRating from "@/components/ui/SipsRating";'],
    ["raw /illustrations/ path", '<Image src="/illustrations/coffee-cup.svg" />'],
    ["raw /illustrations/ path in url()", 'style={{ background: "url(/illustrations/x.svg)" }}'],
    ["hover:text-terracotta then quote", '<a className="hover:text-terracotta">'],
    ["hover:text-terracotta then space", '<a className="hover:text-terracotta underline">'],
  ];

  it.each(breaking)("catches %s", (_label, source) => {
    expect(violations(source)).toHaveLength(1);
  });

  const clean: [string, string][] = [
    ["hover:text-terracotta-dark", '<a className="hover:text-terracotta-dark underline">'],
    ["font-heading", '<h1 className="font-heading">'],
    ["text-[11px]", '<span className="font-mono text-[11px]">'],
    ["initial={{ opacity: 0.6", "<motion.div initial={{ opacity: 0.6 }}>"],
    ["the slot registry", 'import { ILLUSTRATIONS } from "@/lib/illustrations";'],
    ["bg-sage", '<div className="bg-sage">'],
  ];

  it.each(clean)("allows %s", (_label, source) => {
    expect(violations(source)).toEqual([]);
  });

  it("enforces only files whose first line is the marker", () => {
    expect(isEnforced(`${MARKER}\nexport {};`)).toBe(true);
    expect(isEnforced(`${MARKER}\r\n"use client";`)).toBe(true);
    expect(isEnforced(`"use client";\n${MARKER}`)).toBe(false);
    expect(isEnforced("export {};")).toBe(false);
  });
});

describe("files marked `// design-rules: enforced`", () => {
  // One test over every marked file (none may be marked yet; Vitest rejects an empty `each`).
  it("follow the design rules", () => {
    const files = DIRS.flatMap((d) => tsxFiles(path.join(ROOT, d)));
    expect(files.length, "no .tsx files found: wrong root?").toBeGreaterThan(0);
    const found: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      if (!isEnforced(source)) continue;
      for (const rule of violations(source)) found.push(`${path.relative(ROOT, file)}: ${rule}`);
    }
    expect(found, found.join("\n")).toEqual([]);
  });
});
