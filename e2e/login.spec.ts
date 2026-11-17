import { test, expect, type Page, type Request } from "@playwright/test";

/**
 * Login code fallback. Every Supabase Auth call from the browser is mocked with `page.route`:
 * no real email is sent and production auth is never contacted. Any auth request without a
 * mock is aborted and fails the test. After a mocked sign-in, the `/admin` navigation is
 * stubbed and every other request carrying the fake session cookie is aborted, so it never
 * reaches the Next server (whose proxy would check it against the real auth server).
 *
 * The address uses a reserved domain, so even a leaked request could not reach a person.
 */

const EMAIL = "someone@example.com";
const CODE = "123456";
const CODE_LABEL = "Enter the 6-digit code";
const BAD_CODE_MESSAGE = "That code didn't work. Request a new link.";

interface AuthMocks {
  /** Auth requests that had no mock (aborted). Must stay empty. */
  unmocked: string[];
  otpRequests: Request[];
  verifyRequests: Request[];
}

/** base64url-encodes a JSON object (for a JWT-shaped fake token). */
function b64url(value: object): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const userId = "00000000-0000-4000-8000-000000000001";
  const accessToken = [
    b64url({ alg: "HS256", typ: "JWT" }),
    b64url({ sub: userId, email: EMAIL, role: "authenticated", aud: "authenticated", exp: now + 3600 }),
    "signature",
  ].join(".");
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: "fake-refresh-token",
    user: {
      id: userId,
      aud: "authenticated",
      role: "authenticated",
      email: EMAIL,
      app_metadata: { provider: "email" },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * Mocks Supabase Auth. Playwright runs the most recently registered matching route first,
 * so the abort-everything guard is registered before the specific mocks.
 */
async function mockAuth(page: Page, verify: "success" | "invalid"): Promise<AuthMocks> {
  const mocks: AuthMocks = { unmocked: [], otpRequests: [], verifyRequests: [] };

  // Lowest priority: once the mocked sign-in sets the fake session cookie, abort any
  // request that carries it (a late prefetch, a navigation), because proxy.ts would check
  // it with the real auth server. The /admin stub below runs before this guard.
  await page.route("**/*", async (route) => {
    const cookie = (await route.request().headerValue("cookie")) ?? "";
    if (/(^|;\s*)sb-/.test(cookie)) return route.abort();
    return route.continue();
  });
  await page.route("**/auth/v1/**", (route) => {
    mocks.unmocked.push(`${route.request().method()} ${route.request().url()}`);
    return route.abort();
  });
  await page.route("**/auth/v1/otp*", (route) => {
    mocks.otpRequests.push(route.request());
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });
  await page.route("**/auth/v1/verify*", (route) => {
    mocks.verifyRequests.push(route.request());
    if (verify === "success") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakeSession()) });
    }
    return route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" }),
    });
  });
  // Never let the fake session reach the server.
  await page.route("**/admin**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<h1>admin stub</h1>" }),
  );

  return mocks;
}

async function sendMagicLink(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByRole("button", { name: "Send magic link" }).click();
}

test.describe("login code fallback", () => {
  test("login page offers a 6-digit code field after sending", async ({ page }) => {
    const mocks = await mockAuth(page, "invalid");
    await sendMagicLink(page);

    const code = page.getByLabel(CODE_LABEL);
    await expect(code).toBeVisible();
    await expect(code).toHaveAttribute("inputmode", "numeric");
    await expect(code).toHaveAttribute("autocomplete", "one-time-code");
    // Opening the link uses up the code, so the page says to use one or the other.
    await expect(page.getByText(/enter the code from the email here instead of tapping the link/i)).toBeVisible();

    expect(mocks.otpRequests).toHaveLength(1);
    expect(mocks.otpRequests[0].postDataJSON()).toMatchObject({ email: EMAIL, create_user: false });
    expect(mocks.unmocked).toEqual([]);
  });

  test("a valid code signs in and goes to /admin", async ({ page }) => {
    const mocks = await mockAuth(page, "success");
    await sendMagicLink(page);

    await page.getByLabel(CODE_LABEL).fill(CODE);
    await page.getByRole("button", { name: "Sign in with code" }).click();

    await page.waitForURL("**/admin");
    expect(mocks.verifyRequests).toHaveLength(1);
    expect(mocks.verifyRequests[0].postDataJSON()).toMatchObject({ email: EMAIL, token: CODE, type: "email" });
    expect(mocks.unmocked).toEqual([]);

    // The fake session cookie is set now. Nothing carrying it may reach the server.
    await expect(page.goto("/")).rejects.toThrow();
  });

  test("a rejected code shows an announced error and stays on the page", async ({ page }) => {
    const mocks = await mockAuth(page, "invalid");
    await sendMagicLink(page);

    // The live region is in the accessibility tree before it gets a message, so the
    // message is announced when it arrives.
    const region = page.locator("#login-code-error");
    await expect(region).toHaveAttribute("role", "alert");
    expect(await region.evaluate((el) => getComputedStyle(el).display)).not.toBe("none");

    await page.getByLabel(CODE_LABEL).fill("000000");
    await page.getByRole("button", { name: "Sign in with code" }).click();

    // Next's route announcer is also role="alert", so pick ours by its text.
    await expect(page.getByRole("alert").filter({ hasText: BAD_CODE_MESSAGE })).toBeVisible();
    const code = page.getByLabel(CODE_LABEL);
    await expect(code).toHaveAttribute("aria-invalid", "true");
    await expect(code).toHaveAccessibleDescription(BAD_CODE_MESSAGE);
    await expect(page).toHaveURL(/\/login/);
    expect(mocks.verifyRequests).toHaveLength(1);
    expect(mocks.unmocked).toEqual([]);
  });

  test("a code can be entered without sending again (reloaded tab)", async ({ page }) => {
    const mocks = await mockAuth(page, "success");
    await page.goto("/login");

    await page.getByRole("button", { name: "Already have a code?" }).click();
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel(CODE_LABEL).fill(CODE);
    await page.getByRole("button", { name: "Sign in with code" }).click();

    await page.waitForURL("**/admin");
    expect(mocks.otpRequests).toHaveLength(0);
    expect(mocks.verifyRequests[0].postDataJSON()).toMatchObject({ email: EMAIL, token: CODE, type: "email" });
    expect(mocks.unmocked).toEqual([]);
  });
});
