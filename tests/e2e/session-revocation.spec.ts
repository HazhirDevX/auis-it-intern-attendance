import { test, expect } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { neon } from "@neondatabase/serverless";

const safeQA = Boolean(
  process.env.QA_DATABASE_HOST &&
  process.env.DATABASE_URL &&
  new URL(process.env.DATABASE_URL).hostname === process.env.QA_DATABASE_HOST,
);
test.skip(!safeQA, "Requires isolated QA database.");

test("existing cookies follow role changes, deactivation and identity deletion", async ({
  context,
}) => {
  const sql = neon(process.env.DATABASE_URL!);
  const email = `qa-session-${Date.now()}@auis.edu.krd`;
  const [user] =
    await sql`insert into users(name,email) values('QA session fixture',${email}) returning id`;
  const token = await encode({
    token: { email, sub: user.id, role: "STUDENT" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
    maxAge: 30 * 86400,
  });
  const restoreCookie = () =>
    context.addCookies([
      {
        name: "authjs.session-token",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
  const session = async () =>
    (await context.request.get("/api/auth/session")).json();
  try {
    await restoreCookie();
    expect((await session()).user.role).toBe("STUDENT");
    await sql`update users set role='ADMIN' where id=${user.id}`;
    expect((await session()).user.role).toBe("ADMIN");
    await sql`update users set role='STUDENT',active=false where id=${user.id}`;
    expect(await session()).toBeNull();
    await sql`update users set active=true where id=${user.id}`;
    await restoreCookie();
    expect((await session()).user.role).toBe("STUDENT");
    // This test-owned fixture has no application relationships.
    await sql`delete from users where id=${user.id}`;
    expect(await session()).toBeNull();
    await sql`insert into users(name,email) values('QA replacement fixture',${email})`;
    await restoreCookie();
    expect(await session()).toBeNull();
  } finally {
    await sql`delete from users where email=${email}`;
  }
});
