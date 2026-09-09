import { test, expect } from "@playwright/test";
import { neon } from "@neondatabase/serverless";
import { encode } from "next-auth/jwt";

const safeQA = Boolean(
  process.env.QA_DATABASE_HOST &&
  process.env.DATABASE_URL &&
  new URL(process.env.DATABASE_URL).hostname === process.env.QA_DATABASE_HOST,
);
test.skip(!safeQA, "Only run against the isolated QA database.");

test("removed account has no database row, UI row or usable stale session", async ({
  page,
  context,
}) => {
  const sql = neon(process.env.DATABASE_URL!);
  const removedEmail = "hazhir.a.2004@auis.edu.krd";
  expect(
    await sql`select id from users where lower(btrim(email))=${removedEmail}`,
  ).toHaveLength(0);
  const cookie = async (email: string, sub?: string) => {
    await context.clearCookies();
    await context.addCookies([
      {
        name: "authjs.session-token",
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
        value: await encode({
          token: { email, sub },
          secret: process.env.AUTH_SECRET!,
          salt: "authjs.session-token",
          maxAge: 86400,
        }),
      },
    ]);
  };
  await cookie("ha23109@auis.edu.krd");
  await page.goto("/?view=interns");
  await expect(
    page.getByRole("heading", { name: "Authorized interns" }),
  ).toBeVisible();
  await expect(page.getByText(removedEmail, { exact: true })).toHaveCount(0);
  await page.getByLabel("Search interns").fill(removedEmail);
  await expect(
    page.locator("tbody tr").filter({ hasText: removedEmail }),
  ).toHaveCount(0);
  await page.screenshot({ path: "test-results/removed-account-interns.png" });
  await cookie(removedEmail, "349bdd7b-ec04-4377-b399-92a590206289");
  expect(
    await (await context.request.get("/api/auth/session")).json(),
  ).toBeNull();
  await page.goto("/?view=dashboard");
  await expect(
    page.getByRole("button", { name: "Continue with AUIS Google" }),
  ).toBeVisible();
  expect(
    await sql`select id from users where lower(btrim(email))=${removedEmail}`,
  ).toHaveLength(0);
});
