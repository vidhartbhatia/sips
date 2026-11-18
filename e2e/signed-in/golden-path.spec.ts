import { expect, test, type Page } from "@playwright/test";

// The signed-in golden path against a LOCAL Supabase stack (never production): sign in through
// the real login page with the emailed code, capture a visit with a photo, publish it, and see
// it on the public cafe page. Seeded by e2e/signed-in/seed.mjs.

const EMAIL = process.env.ALLOWED_EMAILS ?? "e2e-admin@example.com";
const MAILPIT = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
const CAFE = "E2E Test Cafe";
const SLUG = "e2e-test-cafe";

async function latestCode(after: number): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const list = await (await fetch(`${MAILPIT}/api/v1/messages?limit=5`)).json();
    const msg = list.messages.find(
      (m: { To: { Address: string }[]; Created: string }) =>
        m.To[0]?.Address === EMAIL && Date.parse(m.Created) >= after
    );
    if (msg) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json();
      const code = String(full.Text ?? "").match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("No sign-in code arrived in Mailpit");
}

async function signIn(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@email.com").fill(EMAIL);
  const sentAt = Date.now() - 1000;
  await page.getByRole("button", { name: "Send magic link" }).click();
  await page.getByRole("textbox", { name: "Enter the 6-digit code" }).fill(await latestCode(sentAt));
  await page.getByRole("button", { name: "Sign in with code" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Cafe slugs in the sitemap, as an anonymous visitor's crawler sees it. */
async function sitemapCafes(page: Page): Promise<string[]> {
  const xml = await (await page.request.get("/sitemap.xml")).text();
  return [...xml.matchAll(/<loc>[^<]*\/cafes\/([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/**
 * Whether the share card carries the photo rather than the watercolour fallback. The photo is a
 * sage-to-terracotta gradient whose top-left is green-dominant; the watercolour's corner fades
 * to cream paper, which is red-dominant.
 */
async function sharePhotoFetched(page: Page, slug: string): Promise<boolean> {
  return page.evaluate(async (path) => {
    const res = await fetch(path);
    const bitmap = await createImageBitmap(await res.blob());
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    const [r, g, b] = ctx.getImageData(20, 20, 1, 1).data;
    return g > r && g > b;
  }, `/cafes/${slug}/opengraph-image`);
}

/** A phone-sized JPEG made in the browser, so no image file is committed. */
async function cameraJpeg(page: Page): Promise<Buffer> {
  const dataUrl = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 4032;
    c.height = 3024;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, "#8BAA8F");
    g.addColorStop(1, "#C4735B");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.95);
  });
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test("capture a visit with a photo, publish it, and read it on the public page", async ({ page }) => {
  await signIn(page);

  await page.goto("/admin/capture");
  await page.locator('input[type="file"][multiple]').setInputFiles({
    name: "IMG_0001.jpg",
    mimeType: "image/jpeg",
    buffer: await cameraJpeg(page),
  });
  await page.getByPlaceholder("Search cafes…").fill("E2E");
  await page.getByRole("button", { name: new RegExp(CAFE) }).click();
  await page.getByPlaceholder(/Drink, e\.g\./).first().fill("Cortado");
  await page.getByRole("radiogroup").first().getByRole("radio", { name: "5 out of 5" }).click();
  await page.getByRole("radiogroup", { name: "Overall score" }).getByRole("radio", { name: "4 out of 5" }).click();
  const verdict = `A cortado worth the walk ${Date.now()}`;
  await page.getByPlaceholder("The hojicha alone is worth the walk.").fill(verdict);
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page).toHaveURL(/\/admin\/review\/[^/]+\/edit/, { timeout: 30_000 });

  // A draft never shows publicly: no page, no share image, not in the sitemap.
  const anon = await page.context().browser()!.newPage();
  expect((await anon.goto(`/cafes/${SLUG}`))?.status()).toBe(404);
  expect((await anon.request.get(`/cafes/${SLUG}/opengraph-image`)).status()).toBe(404);
  expect(await sitemapCafes(anon)).not.toContain(SLUG);

  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Published", { exact: true }).first()).toBeVisible({ timeout: 15_000 });

  const res = await anon.goto(`/cafes/${SLUG}`);
  expect(res?.status()).toBe(200);
  await expect(anon.getByText(verdict)).toBeVisible();
  // The photo is served through a signed URL and actually loads.
  const hero = anon.locator("main img").first();
  await expect(hero).toBeVisible();
  expect(await hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  // Published: listed in the sitemap, and the share card is drawn from the signed photo.
  expect(await sitemapCafes(anon)).toContain(SLUG);
  const ogUrl = new URL((await anon.locator('meta[property="og:image"]').getAttribute("content")) ?? "");
  expect(ogUrl.pathname).toBe(`/cafes/${SLUG}/opengraph-image`);
  const og = await anon.request.get(`${ogUrl.pathname}${ogUrl.search}`);
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toBe("image/png");
  // The card embeds the photo's pixels; the signed (or any storage) URL never reaches it.
  expect((await og.body()).includes(Buffer.from("/storage/v1/object"))).toBe(false);
  expect(await sharePhotoFetched(anon, SLUG)).toBe(true);
  const ld = JSON.parse((await anon.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(ld["@graph"].filter((n: { "@type": string }) => n["@type"] === "Review")).toHaveLength(1);
  await anon.close();
});
