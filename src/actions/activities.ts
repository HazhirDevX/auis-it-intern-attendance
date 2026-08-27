"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { errorState, type ActionState } from "@/actions/types";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { activities, auditLogs, semesters } from "@/lib/db/schema";
import { canManageActivity } from "@/lib/permissions";
import { activitySchema, activityUpdateSchema } from "@/lib/validation";
import { getActiveSemester, getMembership } from "@/data/portal";

function refreshActivityViews() {
  revalidatePath("/dashboard");
  revalidatePath("/log-hours");
  revalidatePath("/analytics");
  revalidatePath("/activities");
}

export async function createActivityAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor) return errorState("Your session has expired. Sign in again.");

  const parsed = activitySchema.safeParse({
    workDate: formData.get("workDate"),
    hours: formData.get("hours"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const semester = await getActiveSemester();
  if (!semester) return errorState("There is no active internship semester.");
  const membership = await getMembership(actor.id, semester.id);
  if (!membership?.active) {
    return errorState("You are not assigned to the active semester.");
  }
  if (
    parsed.data.workDate < semester.startDate ||
    parsed.data.workDate > semester.endDate
  ) {
    return errorState(
      `Work date must be within ${semester.name} (${semester.startDate} to ${semester.endDate}).`,
    );
  }

  try {
    const activityId = crypto.randomUUID();
    await db.batch([
      db.insert(activities).values({
        id: activityId,
        userId: actor.id,
        semesterId: semester.id,
        workDate: parsed.data.workDate,
        hours: parsed.data.hours,
        description: parsed.data.description,
        createdBy: actor.id,
      }),
      db.insert(auditLogs).values({
        actorUserId: actor.id,
        action: "ACTIVITY_CREATED",
        entityType: "ACTIVITY",
        entityId: activityId,
        metadata: { semesterId: semester.id, hours: parsed.data.hours },
      }),
    ]);
  } catch (error) {
    console.error("Activity creation failed", error);
    return errorState("The activity could not be saved. Please try again.");
  }

  refreshActivityViews();
  return {
    status: "success",
    message: "📡 Mission logged. Your hours reached the database.",
  };
}

export async function updateActivityAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor) return errorState("Your session has expired. Sign in again.");

  const parsed = activityUpdateSchema.safeParse({
    id: formData.get("id"),
    workDate: formData.get("workDate"),
    hours: formData.get("hours"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the activity details.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const [existing] = await db
    .select({
      activity: activities,
      semesterStatus: semesters.status,
      semesterName: semesters.name,
      semesterStart: semesters.startDate,
      semesterEnd: semesters.endDate,
    })
    .from(activities)
    .innerJoin(semesters, eq(semesters.id, activities.semesterId))
    .where(eq(activities.id, parsed.data.id))
    .limit(1);

  if (!existing) return errorState("Activity not found.");
  if (!canManageActivity(actor, existing.activity.userId)) {
    return errorState("You do not have permission to edit this activity.");
  }
  if (actor.role !== "ADMIN" && existing.semesterStatus === "ARCHIVED") {
    return errorState("Archived semester activities are read-only.");
  }
  if (
    parsed.data.workDate < existing.semesterStart ||
    parsed.data.workDate > existing.semesterEnd
  ) {
    return errorState(
      `Work date must be within ${existing.semesterName} (${existing.semesterStart} to ${existing.semesterEnd}).`,
    );
  }

  try {
    await db.batch([
      db.update(activities)
        .set({
          workDate: parsed.data.workDate,
          hours: parsed.data.hours,
          description: parsed.data.description,
          lastEditedBy: actor.id,
          updatedAt: new Date(),
        })
        .where(eq(activities.id, parsed.data.id)),
      db.insert(auditLogs).values({
        actorUserId: actor.id,
        action: "ACTIVITY_UPDATED",
        entityType: "ACTIVITY",
        entityId: parsed.data.id,
        metadata: {
          before: {
            workDate: existing.activity.workDate,
            hours: existing.activity.hours,
            description: existing.activity.description,
          },
          after: parsed.data,
        },
      }),
    ]);
  } catch (error) {
    console.error("Activity update failed", error);
    return errorState("The activity could not be updated.");
  }

  refreshActivityViews();
  return { status: "success", message: "✅ Activity successfully updated." };
}

export async function deleteActivityAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor) return errorState("Your session has expired. Sign in again.");

  const id = String(formData.get("id") ?? "");
  const [existing] = await db
    .select({ activity: activities, semesterStatus: semesters.status })
    .from(activities)
    .innerJoin(semesters, eq(semesters.id, activities.semesterId))
    .where(and(eq(activities.id, id)))
    .limit(1);

  if (!existing) return errorState("Activity not found.");
  if (!canManageActivity(actor, existing.activity.userId)) {
    return errorState("You do not have permission to delete this activity.");
  }
  if (actor.role !== "ADMIN" && existing.semesterStatus === "ARCHIVED") {
    return errorState("Archived semester activities are read-only.");
  }

  try {
    await db.batch([
      db.insert(auditLogs).values({
        actorUserId: actor.id,
        action: "ACTIVITY_DELETED",
        entityType: "ACTIVITY",
        entityId: existing.activity.id,
        metadata: { deletedRecord: existing.activity },
      }),
      db.delete(activities).where(eq(activities.id, existing.activity.id)),
    ]);
  } catch (error) {
    console.error("Activity deletion failed", error);
    return errorState("The activity could not be deleted.");
  }

  refreshActivityViews();
  return {
    status: "success",
    message: "🗑️ Activity removed from this timeline.",
  };
}
