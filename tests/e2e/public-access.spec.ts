import { expect, test } from "@playwright/test";

test("renders the AUIS login experience", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Internship progress,\s*accounted for\./,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Continue with AUIS Google/ }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("shows clear unauthorized-user guidance", async ({ page }) => {
  await page.goto("/access-denied?reason=unauthorized");
  await expect(
    page.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
  await expect(
    page.getByText(/not currently registered as an IT intern/),
  ).toBeVisible();
});

test("redirects legacy page paths to the root workspace URL", async ({ request }) => {
  const response = await request.fetch("/dashboard", { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(response.headers()["location"]).toBe("/?view=dashboard");
});

for (const width of [375, 768, 1024, 1440]) {
  test(`login page fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
