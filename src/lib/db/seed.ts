import { config } from "dotenv";

import { INITIAL_AUTHORIZED_USERS } from "@/lib/constants";

config({ path: ".env.local" });

const LEGACY_ADMIN_EMAIL = "ha23109@auis.edu.krd";

async function main() {
  const { and, eq } = await import("drizzle-orm");
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const { auditLogs, semesterMemberships, semesters, users } = await import(
    "./schema"
  );

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const db = drizzle(neon(process.env.DATABASE_URL));

  const seededUsers = [];

  for (const account of INITIAL_AUTHORIZED_USERS) {
    const [user] = await db
      .insert(users)
      .values({ ...account, active: true })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          role: account.role,
          active: true,
          updatedAt: new Date(),
        },
      })
      .returning({ id: users.id, email: users.email, role: users.role });
    seededUsers.push(user);
  }

  // Preserve the former administrator and all related history, but remove the
  // obsolete sole-admin grant from the previous initial configuration.
  await db
    .update(users)
    .set({ role: "STUDENT", updatedAt: new Date() })
    .where(
      and(eq(users.email, LEGACY_ADMIN_EMAIL), eq(users.role, "ADMIN")),
    );

  const primaryAdmin = seededUsers.find((user) => user.role === "ADMIN");
  if (!primaryAdmin) throw new Error("At least one seeded admin is required.");

  const [semester] = await db
    .insert(semesters)
    .values({
      name: "Fall 2026",
      startDate: "2026-08-23",
      endDate: "2026-12-20",
      targetHours: 120,
      status: "ACTIVE",
      createdBy: primaryAdmin.id,
    })
    .onConflictDoUpdate({
      target: semesters.name,
      set: { targetHours: 120, updatedAt: new Date() },
    })
    .returning({ id: semesters.id, name: semesters.name });

  for (const user of seededUsers) {
    await db
      .insert(semesterMemberships)
      .values({ userId: user.id, semesterId: semester.id, active: true })
      .onConflictDoUpdate({
        target: [semesterMemberships.userId, semesterMemberships.semesterId],
        set: { active: true },
      });
  }

  const [existingAudit] = await db
    .select({ id: auditLogs.id })
    .from(auditLogs)
    .where(eq(auditLogs.action, "INITIAL_ACCESS_CONFIGURED"))
    .limit(1);

  if (!existingAudit) {
    await db.insert(auditLogs).values({
      actorUserId: primaryAdmin.id,
      action: "INITIAL_ACCESS_CONFIGURED",
      entityType: "SYSTEM",
      metadata: {
        accounts: INITIAL_AUTHORIZED_USERS.map(({ email, role }) => ({
          email,
          role,
        })),
      },
    });
  }

  console.log(
    `Seed complete: ${INITIAL_AUTHORIZED_USERS.length} authorized accounts and Fall 2026.`,
  );
}

void main().catch((error) => {
  console.error("Seed failed.", error);
  process.exitCode = 1;
});
