import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const og = await import("@/lib/og");

/** Width and height from a PNG's IHDR chunk; throws if it isn't a PNG. */
function pngSize(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function rendered(res: Response) {
  expect(res.headers.get("content-type")).toBe("image/png");
  return pngSize(Buffer.from(await res.arrayBuffer()));
}

/** A photo-like JPEG as a data: URI, so nothing is committed and nothing is fetched. */
async function photoUri(): Promise<string> {
  const jpeg = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: "#8BAA8F" } })
    .jpeg()
    .toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

describe("OG_COLORS", () => {
  it("match the :root tokens in app/globals.css", () => {
    const css = readFileSync(join(import.meta.dirname, "../../app/globals.css"), "utf8");
    const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
    const token = (name: string) => root.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toUpperCase();
    expect(og.OG_COLORS).toEqual({
      cream: token("cream"),
      stone: token("stone"),
      espresso: token("espresso"),
      espressoMuted: token("espresso-muted"),
      terracottaDark: token("terracotta-dark"),
    });
  });
});

describe("clip", () => {
  it("leaves short text alone and cuts long text at a word with an ellipsis", () => {
    expect(og.clip("  A bright   room ", 40)).toBe("A bright room");
    const cut = og.clip("Everything here is done with care, from the pour-overs to the cups", 40);
    expect(cut.length).toBeLessThanOrEqual(40);
    expect(cut).toBe("Everything here is done with care, from…");
  });
});

describe("share images", () => {
  it("draws a cafe card from a photo", async () => {
    const res = await og.cafeImage({
      name: "Larkspur Coffee",
      neighborhood: "Capitol Hill",
      verdict: "A bright little room with a cortado worth crossing town for.",
      score: 4.5,
      photoUrl: await photoUri(),
    });
    expect(await rendered(res)).toEqual(og.OG_SIZE);
    expect(res.headers.get("cache-control")).toBe(og.CAFE_CACHE);
  });

  it("falls back to the watercolour when the photo can't be read, without failing", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await og.loadPhoto("data:text/plain,not-an-image")).toBeNull();
    expect(await og.loadPhoto(null)).toBeNull();
    const res = await og.cafeImage({
      name: "The Very Long Name Coffee & Tea Roasters",
      neighborhood: "Capitol Hill",
      verdict: null,
      score: null,
      photoUrl: "data:text/plain,not-an-image",
    });
    expect(await rendered(res)).toEqual(og.OG_SIZE);
    error.mockRestore();
  });

  it("draws the story card and the site default", async () => {
    expect(await rendered(await og.storyImage({ title: "Hello from Sips", date: "November 16, 2026", author: "V." }))).toEqual(
      og.OG_SIZE,
    );
    expect(await rendered(await og.siteImage())).toEqual(og.OG_SIZE);
  });
});
