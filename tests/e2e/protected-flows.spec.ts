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
  for (const width of [
    320, 375, 390, 430, 768, 1024, 1280, 1366, 1440, 1536, 1920,
  ]) {
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
      await page.setViewportSize({
        width,
        height:
          width === 1366
            ? 768
            : width === 1440
              ? 800
              : width === 1536
                ? 864
                : width === 1920
                  ? 1080
                  : 900,
      });
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
          page.getByText("Developed by the GOAT — Hazhir 🐐"),
        ).toBeVisible();
        const footer = await page.locator(".portal-footer").boundingBox();
        const workspace = await page.locator(".workspace").boundingBox();
        expect(
          workspace!.y + workspace!.height,
          "scrolling content stays above footer",
        ).toBeLessThanOrEqual(footer!.y + 1);
        expect(footer!.y + footer!.height).toBeLessThanOrEqual(
          page.viewportSize()!.height + 1,
        );
        if (width >= 1024) {
          const railFits = await page
            .locator(".desktop-rail .rail-content")
            .evaluate((e) => e.scrollHeight <= e.clientHeight + 1);
          expect(railFits, "navigation must fit without scrolling").toBe(true);
          await expect(
            page.locator(".desktop-rail nav a").last(),
          ).toBeInViewport();
        }
        if (view === "activities") {
          const collisions = await page
            .locator(".filter-grid")
            .evaluate((grid) => {
              const r = Array.from(
                grid.querySelectorAll("input:not([type=hidden]),button"),
              )
                .map((e) => e.getBoundingClientRect())
                .filter((r) => r.width && r.height);
              return r.flatMap((a, i) =>
                r
                  .slice(i + 1)
                  .filter(
                    (b) =>
                      Math.min(a.right, b.right) - Math.max(a.left, b.left) >
                        1 &&
                      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
                  ),
              ).length;
            });
          expect(collisions, "filter controls overlap").toBe(0);
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth - innerWidth,
          ),
          view,
        ).toBeLessThanOrEqual(1);
        expect(
          await page
            .locator(".workspace")
            .evaluate((e) => e.scrollWidth - e.clientWidth),
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
for (const width of [375, 768, 1366, 1920]) {
  test(`expanded forms and chart controls at ${width}px`, async ({
    page,
    context,
  }) => {
    await session(context, "ha23109@auis.edu.krd");
    await page.setViewportSize({ width, height: width === 1366 ? 768 : 900 });
    await page.goto("/?view=analytics");
    await page.getByRole("button", { name: "Monthly", exact: true }).click();
    await page
      .getByRole("button", { name: "Activities logged", exact: true })
      .first()
      .click();
    await page
      .getByRole("region", { name: "Activity insights", exact: true })
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/analytics-controls-${width}.png`,
      caret: "initial",
    });
    await page
      .getByText("View cumulative and expected values", { exact: true })
      .click();
    await expect(
      page
        .getByRole("table")
        .filter({ has: page.getByText("Expected hours", { exact: true }) }),
    ).toBeVisible();
    await page.goto("/?view=interns");
    await page.getByText("Add an authorized intern", { exact: true }).click();
    await expect(page.getByLabel("Full name")).toBeVisible();
    await page.screenshot({
      path: `test-results/add-intern-${width}.png`,
      caret: "initial",
    });
    await page.goto("/?view=semesters");
    await page
      .getByText("Edit dates & target settings", { exact: true })
      .first()
      .click();
    await page
      .getByRole("button", { name: "Save target settings" })
      .first()
      .scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/target-settings-${width}.png`,
      caret: "initial",
    });
    const [student] =
      await sql!`select id from users where email='hazhir.a.2004@gmail.com'`;
    await page.goto(`/?view=intern&intern=${student.id}`);
    await page
      .getByRole("button", { name: "Delete student account", exact: true })
      .click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Cancel", exact: true }),
    ).toBeInViewport();
    await page.screenshot({
      path: `test-results/delete-dialog-${width}.png`,
      caret: "initial",
    });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    expect(
      await page
        .locator(".workspace")
        .evaluate((e) => e.scrollWidth - e.clientWidth),
    ).toBeLessThanOrEqual(1);
  });
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
test("student deletion preserves records, rejects admin targets and revokes old sessions", async ({
  page,
  context,
  browser,
}) => {
  test.setTimeout(120000);
  const email = `qa-delete-${Date.now()}@auis.edu.krd`;
  const [student] =
    await sql!`insert into users(name,email,role) values('QA deletion fixture',${email},'STUDENT') returning id`;
  const [semester] =
    await sql!`select id,start_date::text from semesters where status='ACTIVE'`;
  await sql!`insert into semester_memberships(user_id,semester_id) values(${student.id},${semester.id})`;
  await sql!`insert into activities(user_id,semester_id,work_date,hours,description) values(${student.id},${semester.id},${semester.start_date},1,'QA retained deletion history')`;
  await session(context, "ha23109@auis.edu.krd");
  await page.goto(`/?view=intern&intern=${student.id}`);
  await page
    .getByRole("button", { name: "Delete student account", exact: true })
    .click();
  const dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByText(/attendance or delete the Google account/),
  ).toBeVisible();
  await dialog.getByLabel("Type the student email to confirm").fill(email);
  const requestPromise = page.waitForRequest(
    (r) => r.method() === "POST" && Boolean(r.headers()["next-action"]),
  );
  await dialog
    .getByRole("button", { name: "Delete Student", exact: true })
    .click();
  const request = await requestPromise;
  await expect(
    page.getByText("Account deleted · history retained"),
  ).toBeVisible();
  const [state] =
    await sql!`select active,deleted_at,(select count(*) from activities where user_id=${student.id}) records,(select sum(hours) from activities where user_id=${student.id}) hours from users where id=${student.id}`;
  expect(state.active).toBe(false);
  expect(state.deleted_at).toBeTruthy();
  expect(Number(state.records)).toBe(1);
  expect(Number(state.hours)).toBe(1);
  await expect(
    page.getByRole("button", { name: "Restore access", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "test-results/deleted-student.png",
    caret: "initial",
    fullPage: true,
  });
  const headers = {
    "content-type": request.headers()["content-type"],
    "next-action": request.headers()["next-action"],
    origin: "http://localhost:3100",
  };
  const body = request.postDataBuffer()!;
  const studentContext = await browser.newContext({
    baseURL: "http://localhost:3100",
  });
  await session(studentContext, "hazhir.a.2004@gmail.com");
  const denied = await studentContext.request.post(request.url(), {
    headers,
    data: body,
  });
  expect(await denied.text()).toContain("Admin access required.");
  await studentContext.clearCookies();
  await session(studentContext, email);
  const removedPage = await studentContext.newPage();
  await removedPage.goto("/?view=dashboard");
  await expect(
    removedPage.getByRole("button", { name: /Continue with AUIS Google/ }),
  ).toBeVisible();
  await studentContext.close();
  const [admin] =
    await sql!`select id from users where email='ha23109@auis.edu.krd'`;
  const malicious = body
    .toString()
    .replaceAll(student.id, admin.id)
    .replaceAll(email, "ha23109@auis.edu.krd");
  const blocked = await context.request.post(request.url(), {
    headers,
    data: malicious,
  });
  expect(await blocked.text()).toContain(
    "Administrator accounts are protected.",
  );
  const [adminState] =
    await sql!`select active,deleted_at from users where id=${admin.id}`;
  expect(adminState.active).toBe(true);
  expect(adminState.deleted_at).toBeNull();
  const workbook = await context.request.get(
    `/api/export?semester=${semester.id}`,
  );
  expect(workbook.status()).toBe(200);
});

test("short-height navigation and pointer background are usable", async ({
  page,
  context,
}) => {
  await session(context, "ha23109@auis.edu.krd");
  await page.setViewportSize({ width: 1366, height: 600 });
  await page.goto("/?view=activities");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("link", { name: "Audit History", exact: true }),
  ).toBeInViewport();
  await page.getByRole("link", { name: "Audit History", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/?view=dashboard");
  const canvas = page.locator("canvas.digital-background");
  await expect(canvas).toHaveJSProperty("width", 1366);
  const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL());
  await page.mouse.move(800, 200);
  await expect
    .poll(() => canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL()))
    .not.toBe(before);
  const timings = await page.evaluate(async () => {
    const frames: number[] = [];
    for (let i = 0; i < 20; i++) {
      const start = performance.now();
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 300 + i * 20,
          clientY: 150,
        }),
      );
      await new Promise(requestAnimationFrame);
      frames.push(performance.now() - start);
    }
    return frames;
  });
  expect(timings.filter((t) => t > 100).length).toBeLessThan(3);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(canvas).toHaveCSS("display", "none");
});
