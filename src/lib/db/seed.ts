import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const { and, eq } = await import("drizzle-orm");
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  const schema = await import("./schema");
  const { activities, auditLogs, semesterMemberships, semesters, users } =
    schema;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed the database.");
  }

  const db = drizzle(neon(process.env.DATABASE_URL), { schema });

  const adminEmail = "ha23109@auis.edu.krd";

  const [admin] = await db
    .insert(users)
    .values({
      name: "Hazhir",
      email: adminEmail,
      role: "ADMIN",
      active: true,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: "ADMIN", active: true, updatedAt: new Date() },
    })
    .returning();

  const [semester] = await db
    .insert(semesters)
    .values({
      name: "Fall 2026",
      startDate: "2026-08-23",
      endDate: "2026-12-20",
      targetHours: 120,
      status: "ACTIVE",
      createdBy: admin.id,
    })
    .onConflictDoUpdate({
      target: semesters.name,
      set: { targetHours: 120, updatedAt: new Date() },
    })
    .returning();

  await db
    .insert(semesterMemberships)
    .values({ userId: admin.id, semesterId: semester.id, active: true })
    .onConflictDoUpdate({
      target: [semesterMemberships.userId, semesterMemberships.semesterId],
      set: { active: true },
    });

  if (process.env.SEED_DEMO_DATA === "true") {
    const demoUsers = [
      { name: "Danyar Ahmed", email: "dd23103@auis.edu.krd" },
      { name: "Lana Karim", email: "lk23111@auis.edu.krd" },
    ];

    for (const fixture of demoUsers) {
      const [student] = await db
        .insert(users)
        .values({ ...fixture, role: "STUDENT", active: true })
        .onConflictDoUpdate({
          target: users.email,
          set: { name: fixture.name, active: true, updatedAt: new Date() },
        })
        .returning();

      await db
        .insert(semesterMemberships)
        .values({ userId: student.id, semesterId: semester.id, active: true })
        .onConflictDoNothing();

      const existing = await db
        .select({ id: activities.id })
        .from(activities)
        .where(
          and(
            eq(activities.userId, student.id),
            eq(activities.semesterId, semester.id),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(activities).values([
          {
            userId: student.id,
            semesterId: semester.id,
            workDate: "2026-08-24",
            hours: 4,
            description:
              "Configured lab workstations and documented setup steps.",
            createdBy: student.id,
          },
          {
            userId: student.id,
            semesterId: semester.id,
            workDate: "2026-08-25",
            hours: 3.5,
            description:
              "Resolved help desk tickets and updated the asset register.",
            createdBy: student.id,
          },
        ]);
      }
    }
  }

  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    action: "SYSTEM_SEEDED",
    entityType: "SYSTEM",
    metadata: {
      semester: semester.name,
      demoData: process.env.SEED_DEMO_DATA === "true",
    },
  });

  console.log(`Seed complete: ${admin.email}, ${semester.name}.`);
}

void main().catch((error) => {
  console.error("Seed failed.", error);
  process.exitCode = 1;
});
