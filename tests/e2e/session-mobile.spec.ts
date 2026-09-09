import { test, expect } from "@playwright/test";
import { encode, decode } from "next-auth/jwt";

const safeQA = Boolean(
  process.env.QA_DATABASE_HOST &&
  process.env.DATABASE_URL &&
  new URL(process.env.DATABASE_URL).hostname === process.env.QA_DATABASE_HOST,
);
test.skip(!safeQA, "Requires the isolated QA database.");
const cookieName = "authjs.session-token";

for (const email of ["hazhir.a.2004@gmail.com", "ha23109@auis.edu.krd"]) {
  test(`persistent rolling session for ${email}`, async ({ browser }) => {
    const context = await browser.newContext();
    const token = await encode({
      token: { email },
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
      maxAge: 3600,
    });
    await context.addCookies([
      {
        name: cookieName,
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await context.newPage();
    await page.goto("http://localhost:3100/");
    const cookie = (await context.cookies()).find(
      (c) => c.name === cookieName,
    )!;
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("Lax");
    expect(cookie.expires - Date.now() / 1000).toBeGreaterThan(29 * 86400);
    expect(cookie.expires - Date.now() / 1000).toBeLessThanOrEqual(
      30 * 86400 + 5,
    );
    const renewed = await decode({
      token: cookie.value,
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
    });
    expect(renewed?.sub).toBeTruthy();
    expect(renewed!.exp! - Date.now() / 1000).toBeGreaterThan(29 * 86400);
    const state = await context.storageState();
    await context.close();
    const reopened = await browser.newContext({ storageState: state });
    const reopenedPage = await reopened.newPage();
    await reopenedPage.goto("http://localhost:3100/");
    await expect(
      reopenedPage.getByRole("button", { name: /Sign out/i }),
    ).toBeAttached();
    await reopened.close();
  });
}

for (const width of [320, 375, 390, 430, 768]) {
  test(`touch background animates at ${width}px without blocking controls`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    const token = await encode({
      token: { email: "hazhir.a.2004@gmail.com" },
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
      maxAge: 3600,
    });
    await context.addCookies([
      {
        name: cookieName,
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    const page = await context.newPage();
    await page.goto("http://localhost:3100/?view=log-hours");
    const canvas = page.locator("canvas.digital-background");
    await expect(canvas).toBeVisible();
    const before = await canvas.evaluate((c: HTMLCanvasElement) =>
      c.toDataURL(),
    );
    await expect
      .poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()))
      .not.toBe(before);
    await page.getByLabel("Hours worked").tap();
    await page.getByLabel("Hours worked").fill("2");
    await expect(page.getByLabel("Hours worked")).toHaveValue("2");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/mobile-background-${width}.png`,
    });
    await page.getByRole("button", { name: "Open navigation" }).tap();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("link", { name: "Analytics", exact: true }).tap();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(page.locator("h1")).toHaveText("Analytics");
    const chartData = page
      .locator("summary")
      .filter({ hasText: "View accessible chart data" });
    await chartData.scrollIntoViewIfNeeded();
    await chartData.tap();
    await expect(chartData.locator("..")).toHaveAttribute("open", "");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(canvas).toBeHidden();
    await context.close();
  });
}
