"use server";

import { and, eq, lt, gt, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { errorState, type ActionState } from "@/actions/types";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import {
  activities,
  auditLogs,
  semesterMemberships,
  semesters,
} from "@/lib/db/schema";
import { semesterSchema } from "@/lib/validation";
import { calculateSemesterTarget } from "@/lib/targets";
import { z } from "zod";

export async function updateSemesterTargetsAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN")
    return errorState("Admin access required.");
  const id = z.uuid().safeParse(formData.get("semesterId"));
  if (!id.success) return errorState("Invalid semester.");
  const parsed = semesterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    return {
      status: "error",
      message: "Check the semester settings.",
      errors: parsed.error.flatten().fieldErrors,
    };
  try {
    const [existing] = await db
      .select()
      .from(semesters)
      .where(eq(semesters.id, id.data))
      .limit(1);
    if (!existing || existing.status === "ARCHIVED")
      return errorState(
        "Archived semesters are read-only. Their original targets are preserved.",
      );
    const [outside] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(
        and(
          eq(activities.semesterId, id.data),
          or(
            lt(activities.workDate, parsed.data.startDate),
            gt(activities.workDate, parsed.data.endDate),
          ),
        ),
      )
      .limit(1);
    if (outside)
      return errorState(
        "These dates would exclude existing activity records. Widen the range to keep every recorded work date.",
      );
    const {
      startDate,
      endDate,
      weeklyTargetHours,
      monthlyTargetHours,
      targetBasis,
    } = parsed.data;
    const targetHours = calculateSemesterTarget(
      startDate,
      endDate,
      weeklyTargetHours,
      monthlyTargetHours,
      targetBasis,
    );
    const settings = {
      startDate,
      endDate,
      weeklyTargetHours,
      monthlyTargetHours,
      targetBasis,
      targetHours,
    };
    await db.batch([
      db
        .update(semesters)
        .set({ ...settings, updatedAt: new Date() })
        .where(
          and(
            eq(semesters.id, id.data),
            or(eq(semesters.status, "ACTIVE"), eq(semesters.status, "DRAFT")),
          ),
        ),
      db.insert(auditLogs).values({
        actorUserId: actor.id,
        action: "SEMESTER_TARGETS_UPDATED",
        entityType: "SEMESTER",
        entityId: id.data,
        metadata: {
          before: {
            startDate: existing.startDate,
            endDate: existing.endDate,
            targetHours: existing.targetHours,
            weeklyTargetHours: existing.weeklyTargetHours,
            monthlyTargetHours: existing.monthlyTargetHours,
            targetBasis: existing.targetBasis,
          },
          after: settings,
        },
      }),
    ]);
    refreshSemesterViews();
    return {
      status: "success",
      message: `Settings saved. Official semester target: ${targetHours} hours. Existing activities are unchanged.`,
    };
  } catch (error) {
    console.error("Semester target update failed", error);
    return errorState(
      "Settings could not be saved. Your existing semester is unchanged.",
    );
  }
}

function refreshSemesterViews() {
  revalidatePath("/", "layout");
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
    weeklyTargetHours: formData.get("weeklyTargetHours"),
    monthlyTargetHours: formData.get("monthlyTargetHours"),
    targetBasis: formData.get("targetBasis"),
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
      weeklyTargetHours: parsed.data.weeklyTargetHours,
      monthlyTargetHours: parsed.data.monthlyTargetHours,
      targetBasis: parsed.data.targetBasis,
      targetHours: calculateSemesterTarget(
        parsed.data.startDate,
        parsed.data.endDate,
        parsed.data.weeklyTargetHours,
        parsed.data.monthlyTargetHours,
        parsed.data.targetBasis,
      ),
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
    db
      .update(semesters)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(eq(semesters.status, "ACTIVE")),
    db
      .update(semesters)
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
    db
      .update(semesters)
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
