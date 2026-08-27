"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { errorState, type ActionState } from "@/actions/types";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { auditLogs, semesterMemberships, semesters } from "@/lib/db/schema";
import { semesterSchema } from "@/lib/validation";

function refreshSemesterViews() {
  revalidatePath("/dashboard");
  revalidatePath("/log-hours");
  revalidatePath("/analytics");
  revalidatePath("/activities");
  revalidatePath("/admin/semesters");
}

export async function createSemesterAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN")
    return errorState("Admin access required.");

  const parsed = semesterSchema.safeParse({
    name: formData.get("name"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    targetHours: formData.get("targetHours"),
    activate: formData.get("activate") === "on",
    internIds: formData.getAll("internIds"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the semester details.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const semesterId = crypto.randomUUID();
    const insertSemester = db.insert(semesters).values({
      id: semesterId,
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      targetHours: parsed.data.targetHours,
      status: parsed.data.activate ? "ACTIVE" : "DRAFT",
      createdBy: actor.id,
    });
    const insertAudit = db.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "SEMESTER_CREATED",
      entityType: "SEMESTER",
      entityId: semesterId,
      metadata: {
        name: parsed.data.name,
        active: parsed.data.activate,
        internCount: parsed.data.internIds.length,
      },
    });
    const insertMemberships = parsed.data.internIds.length
      ? db.insert(semesterMemberships).values(
          parsed.data.internIds.map((userId) => ({
            userId,
            semesterId,
            active: true,
          })),
        )
      : null;
    const archiveActive = db
      .update(semesters)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(semesters.status, "ACTIVE"));

    if (parsed.data.activate && insertMemberships) {
      await db.batch([
        archiveActive,
        insertSemester,
        insertMemberships,
        insertAudit,
      ]);
    } else if (parsed.data.activate) {
      await db.batch([archiveActive, insertSemester, insertAudit]);
    } else if (insertMemberships) {
      await db.batch([insertSemester, insertMemberships, insertAudit]);
    } else {
      await db.batch([insertSemester, insertAudit]);
    }
  } catch (error) {
    console.error("Semester creation failed", error);
    return errorState(
      "The semester could not be created. Check for duplicate names.",
    );
  }

  refreshSemesterViews();
  return { status: "success", message: "🎓 Semester created successfully." };
}

export async function activateSemesterAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN")
    return errorState("Admin access required.");
  const semesterId = String(formData.get("semesterId") ?? "");

  const [target] = await db
    .select({ id: semesters.id, name: semesters.name })
    .from(semesters)
    .where(eq(semesters.id, semesterId))
    .limit(1);
  if (!target) return errorState("Semester not found.");

  await db.batch([
    db.update(semesters)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(semesters.status, "ACTIVE")),
    db.update(semesters)
      .set({ status: "ACTIVE", updatedAt: new Date() })
      .where(eq(semesters.id, semesterId)),
    db.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "SEMESTER_ACTIVATED",
      entityType: "SEMESTER",
      entityId: target.id,
      metadata: { name: target.name },
    }),
  ]);

  refreshSemesterViews();
  return {
    status: "success",
    message: "Active semester updated; history retained.",
  };
}

export async function archiveSemesterAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN")
    return errorState("Admin access required.");
  const semesterId = String(formData.get("semesterId") ?? "");

  const [semester] = await db
    .select({ id: semesters.id, name: semesters.name })
    .from(semesters)
    .where(eq(semesters.id, semesterId))
    .limit(1);
  if (!semester) return errorState("Semester not found.");

  await db.batch([
    db.update(semesters)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(semesters.id, semesterId)),
    db.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "SEMESTER_ARCHIVED",
      entityType: "SEMESTER",
      entityId: semester.id,
      metadata: { name: semester.name },
    }),
  ]);

  refreshSemesterViews();
  return {
    status: "success",
    message: "Semester closed; all history remains available.",
  };
}
