import { test, expect, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { neon } from "@neondatabase/serverless";

const safeQA = Boolean(
  process.env.QA_DATABASE_HOST &&
  process.env.DATABASE_URL &&
  new URL(process.env.DATABASE_URL).hostname === process.env.QA_DATABASE_HOST,
);
test.skip(!safeQA, "Protected tests require the isolated QA database runner.");
const sql = safeQA ? neon(process.env.DATABASE_URL!) : null;
async function session(
  context: BrowserContext,
  email: string,
  claimedRole = "ADMIN",
) {
  if (!safeQA || !process.env.AUTH_SECRET)
    throw new Error("Isolated QA database and AUTH_SECRET required");
  const token = await encode({
    token: { email, role: claimedRole, active: true },
    secret: process.env.AUTH_SECRET,
    salt: "authjs.session-token",
    maxAge: 3600,
  });
  await context.addCookies([
    {
      name: "authjs.session-token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: false,
    },
  ]);
}
for (const role of ["STUDENT", "ADMIN"] as const) {
  for (const width of [320, 375, 430, 768, 1024, 1280, 1440, 1920]) {
    test(`${role} complete navigation at ${width}px`, async ({
      page,
      context,
    }) => {
      test.setTimeout(240_000);
      await session(
        context,
        role === "ADMIN" ? "ha23109@auis.edu.krd" : "hazhir.a.2004@gmail.com",
        role,
      );
      await page.setViewportSize({ width, height: 960 });
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      const sections = [
        "dashboard",
        "log-hours",
        "analytics",
        "activities",
        "history",
        ...(role === "ADMIN"
          ? ["interns", "semesters", "export", "audit"]
          : []),
      ];
      for (const view of sections) {
        await page.goto(`/?view=${view}`);
        await expect(page.locator("h1")).toBeVisible();
        await expect(
          page.getByText("Developed by Hazhir IT-Intern"),
        ).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ),
          view,
        ).toBeLessThanOrEqual(1);
        await expect(
          page.getByText("Preparing your activity timeline…", { exact: true }),
        ).toHaveCount(0);
        await page.screenshot({
          caret: "initial",
          path: `test-results/${role}-${view}-${width}.png`,
          fullPage: true,
        });
      }
      await page.goto("/?view=dashboard");
      if (width < 1024)
        await page.getByRole("button", { name: "Open navigation" }).click();
      await page.getByRole("link", { name: "History", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "History", exact: true }),
      ).toBeVisible();
      if (width < 1024)
        await expect(page.getByRole("dialog")).not.toBeVisible();
      await page.reload();
      await expect(
        page.getByRole("heading", { name: "History", exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}
test("database role overrides forged client claims and blocks export", async ({
  page,
  context,
}) => {
  await session(context, "hazhir.a.2004@gmail.com", "ADMIN");
  await page.goto("/?view=interns");
  await expect(
    page.getByRole("heading", { name: "Access denied" }),
  ).toBeVisible();
  const response = await context.request.get("/api/export");
  expect([401, 403]).toContain(response.status());
});
test("all three configured administrators share server access", async ({
  page,
  context,
}) => {
  for (const email of [
    "zhir.barzan@auis.edu.krd",
    "karo.omed@auis.edu.krd",
    "ha23109@auis.edu.krd",
  ]) {
    await context.clearCookies();
    await session(context, email, "STUDENT");
    await page.goto("/?view=semesters");
    await expect(
      page.getByRole("heading", { name: "Semester management" }),
    ).toBeVisible();
  }
});
test("student activity saves and invalid submission retains text", async ({
  page,
  context,
}) => {
  await session(context, "hazhir.a.2004@gmail.com", "STUDENT");
  const [semester] =
    await sql!`select start_date::text from semesters where status='ACTIVE'`;
  await page.goto("/?view=log-hours");
  const description = `QA redesign activity ${Date.now()}`;
  await page.getByLabel("Work date").fill("2000-01-01");
  await expect(page.getByLabel("Work date")).toHaveValue("2000-01-01");
  await page.getByLabel("Hours worked").fill("0.25");
  await page
    .getByLabel("Activity description", { exact: true })
    .fill(description);
  await page.getByRole("button", { name: "Log activity", exact: true }).click();
  await expect(
    page.getByLabel("Activity description", { exact: true }),
  ).toHaveValue(description);
  await expect(
    page.getByText(/Work date must be within/).first(),
  ).toBeVisible();
  await page.getByLabel("Work date").fill(semester.start_date);
  await page.getByRole("button", { name: "Log activity", exact: true }).click();
  await expect(
    page.getByLabel("Activity description", { exact: true }),
  ).toHaveValue("");
  const rows =
    await sql!`select id from activities where description=${description}`;
  expect(rows).toHaveLength(1);
  await page.goto(
    `/?view=activities&search=${encodeURIComponent(description)}`,
  );
  await expect(
    page.getByText(description, { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Edit activity from/ })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Hours", { exact: true }).fill("0.5");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(dialog).not.toBeVisible();
  const [updated] =
    await sql!`select hours from activities where description=${description}`;
  expect(Number(updated.hours)).toBe(0.5);
  // Deletion is limited to this test-created record in the isolated branch.
  await page
    .getByRole("button", { name: /Delete activity from/ })
    .first()
    .click();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete activity", exact: true })
    .click();
  await expect(page.getByText(description, { exact: true })).toHaveCount(0);
  const deleted =
    await sql!`select id from activities where description=${description}`;
  expect(deleted).toHaveLength(0);
});

test("admin creates calculated targets without trusting a client total", async ({
  page,
  context,
}) => {
  await session(context, "ha23109@auis.edu.krd");
  await page.goto("/?view=semesters");
  await page.getByText("Create a new semester", { exact: true }).click();
  const form = page
    .locator("form")
    .filter({ has: page.getByLabel("Semester name", { exact: true }) });
  const name = `QA target calculation ${Date.now()}`;
  await form.getByLabel("Semester name").fill(name);
  await form.getByLabel("Start date", { exact: true }).fill("2027-01-01");
  await form.getByLabel("End date", { exact: true }).fill("2027-01-14");
  await form.getByLabel("Weekly target (hours)").fill("10");
  await form.getByLabel("Monthly target (hours)").fill("20");
  await expect(
    form.getByText(/These targets imply different workloads/),
  ).toBeVisible();
  await form
    .getByRole("button", { name: "Create semester", exact: true })
    .click();
  await expect(form.getByText(/Semester created successfully/)).toBeVisible();
  const [created] =
    await sql!`select target_hours,weekly_target_hours,monthly_target_hours,status from semesters where name=${name}`;
  expect(Number(created.target_hours)).toBe(20);
  expect(Number(created.weekly_target_hours)).toBe(10);
  expect(created.status).toBe("DRAFT");
});

test("admin Excel export is a workbook and reduced motion disables background", async ({
  page,
  context,
}) => {
  await session(context, "ha23109@auis.edu.krd");
  const [semester] = await sql!`select id from semesters where status='ACTIVE'`;
  const response = await context.request.get(
    `/api/export?semester=${semester.id}`,
  );
  expect(response.status()).toBe(200);
  expect((await response.body()).subarray(0, 2).toString()).toBe("PK");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?view=dashboard");
  await expect(page.locator(".digital-background")).toHaveCSS(
    "display",
    "none",
  );
});
