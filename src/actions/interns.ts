"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { errorState, type ActionState } from "@/actions/types";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { auditLogs, semesterMemberships, users } from "@/lib/db/schema";
import { internSchema } from "@/lib/validation";

export async function addInternAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN")
    return errorState("Admin access required.");

  const parsed = internSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    semesterId: formData.get("semesterId"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the intern details.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing.length)
    return errorState("That AUIS email is already registered.");

  try {
    const userId = crypto.randomUUID();
    const insertUser = db.insert(users).values({
      id: userId,
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      active: true,
    });
    const insertAudit = db.insert(auditLogs).values({
      actorUserId: actor.id,
      action: "INTERN_ADDED",
      entityType: "USER",
      entityId: userId,
      metadata: { email: parsed.data.email, role: parsed.data.role },
    });

    if (parsed.data.semesterId) {
      await db.batch([
        insertUser,
        db.insert(semesterMemberships).values({
          userId,
          semesterId: parsed.data.semesterId,
          active: true,
        }),
        insertAudit,
      ]);
    } else {
      await db.batch([insertUser, insertAudit]);
    }
  } catch (error) {
    console.error("Intern creation failed", error);
    return errorState("The intern could not be added.");
  }

  revalidatePath("/admin/interns");
  revalidatePath("/dashboard");
  return { status: "success", message: "✅ Intern access created." };
}

export async function setInternActiveAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN")
    return errorState("Admin access required.");

  const userId = String(formData.get("userId") ?? "");
  const active = formData.get("active") === "true";
  if (userId === actor.id && !active) {
    return errorState("You cannot deactivate your own administrator account.");
  }

  const [target] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return errorState("Intern not found.");

  const updateUser = db
    .update(users)
    .set({ active, updatedAt: new Date() })
    .where(eq(users.id, userId));
  const insertAudit = db.insert(auditLogs).values({
    actorUserId: actor.id,
    action: active ? "INTERN_REACTIVATED" : "INTERN_DEACTIVATED",
    entityType: "USER",
    entityId: userId,
    metadata: { email: target.email },
  });
  if (active) {
    await db.batch([updateUser, insertAudit]);
  } else {
    await db.batch([
      updateUser,
      db
        .update(semesterMemberships)
        .set({ active: false })
        .where(and(eq(semesterMemberships.userId, userId))),
      insertAudit,
    ]);
  }

  revalidatePath("/admin/interns");
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: active
      ? "Intern access restored."
      : "Intern access deactivated; history retained.",
  };
}

export async function setSemesterMembershipAction(formData: FormData) {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN")
    return errorState("Admin access required.");

  const userId = String(formData.get("userId") ?? "");
  const semesterId = String(formData.get("semesterId") ?? "");
  const active = formData.get("active") === "true";
  if (!userId || !semesterId)
    return errorState("Intern and semester are required.");

  await db.batch([
    db.insert(semesterMemberships)
      .values({ userId, semesterId, active })
      .onConflictDoUpdate({
        target: [semesterMemberships.userId, semesterMemberships.semesterId],
        set: { active },
      }),
    db.insert(auditLogs).values({
      actorUserId: actor.id,
      action: active ? "INTERN_ASSIGNED" : "INTERN_UNASSIGNED",
      entityType: "SEMESTER_MEMBERSHIP",
      metadata: { userId, semesterId },
    }),
  ]);

  revalidatePath(`/admin/interns/${userId}`);
  revalidatePath("/admin/interns");
  revalidatePath("/analytics");
  revalidatePath("/dashboard");
  return {
    status: "success",
    message: active
      ? "Intern assigned to semester."
      : "Semester participation disabled; history retained.",
  };
}
