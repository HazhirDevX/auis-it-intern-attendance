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
    await db.transaction(async (tx) => {
      if (parsed.data.activate) {
        await tx
          .update(semesters)
          .set({ status: "ARCHIVED", updatedAt: new Date() })
          .where(eq(semesters.status, "ACTIVE"));
      }

      const [semester] = await tx
        .insert(semesters)
        .values({
          name: parsed.data.name,
          startDate: parsed.data.startDate,
          endDate: parsed.data.endDate,
          targetHours: parsed.data.targetHours,
          status: parsed.data.activate ? "ACTIVE" : "DRAFT",
          createdBy: actor.id,
        })
        .returning({ id: semesters.id });

      if (parsed.data.internIds.length) {
        await tx.insert(semesterMemberships).values(
          parsed.data.internIds.map((userId) => ({
            userId,
            semesterId: semester.id,
            active: true,
          })),
        );
      }

      await tx.insert(auditLogs).values({
        actorUserId: actor.id,
        action: "SEMESTER_CREATED",
        entityType: "SEMESTER",
        entityId: semester.id,
        metadata: {
          name: parsed.data.name,
          active: parsed.data.activate,
          internCount: parsed.data.internIds.length,
        },
      });
    });
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

  await db.transaction(async (tx) => {
    await tx
      .update(semesters)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(semesters.status, "ACTIVE"));
    const [updated] = await tx
      .update(semesters)
      .set({ status: "ACTIVE", updatedAt: new Date() })
      .where(eq(semesters.id, semesterId))
      .returning({ id: semesters.id, name: semesters.name });
    if (!updated) throw new Error("Semester not found");
    await tx.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "SEMESTER_ACTIVATED",
      entityType: "SEMESTER",
      entityId: updated.id,
      metadata: { name: updated.name },
    });
  });

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
    .update(semesters)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(semesters.id, semesterId))
    .returning({ id: semesters.id, name: semesters.name });
  if (!semester) return errorState("Semester not found.");

  await db.insert(auditLogs).values({
    actorUserId: actor.id,
    action: "SEMESTER_ARCHIVED",
    entityType: "SEMESTER",
    entityId: semester.id,
    metadata: { name: semester.name },
  });

  refreshSemesterViews();
  return {
    status: "success",
    message: "Semester closed; all history remains available.",
  };
}
