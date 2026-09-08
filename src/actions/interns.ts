"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { errorState, type ActionState } from "@/actions/types";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { auditLogs, semesterMemberships, users } from "@/lib/db/schema";
import { internSchema } from "@/lib/validation";
import { isUniqueViolation } from "@/lib/db/errors";

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
  if (existing.length) return errorState("This email already has an account.");

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

    if (parsed.data.semesterId && parsed.data.role === "STUDENT") {
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
    if (isUniqueViolation(error))
      return errorState("This email already has an account.");
    console.error("Intern creation failed", error);
    return errorState("The intern could not be added.");
  }

  revalidatePath("/", "layout");
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
  if (!z.uuid().safeParse(userId).success)
    return errorState("Invalid student account.");
  if (userId === actor.id && !active) {
    return errorState("You cannot deactivate your own administrator account.");
  }

  const [target] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return errorState("Intern not found.");
  if (target.role !== "STUDENT")
    return errorState("Administrator access cannot be changed here.");
  if (target.deletedAt)
    return errorState(
      "This account was permanently deleted. Access cannot be restored.",
    );

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

  revalidatePath("/", "layout");
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
  if (
    !z.uuid().safeParse(userId).success ||
    !z.uuid().safeParse(semesterId).success
  )
    return errorState("Valid intern and semester are required.");
  const [target] = await db
    .select({ deletedAt: users.deletedAt, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target || target.deletedAt)
    return errorState("Deleted accounts cannot be assigned.");
  if (target.role !== "STUDENT")
    return errorState("Only students can be assigned as interns.");

  await db.batch([
    db
      .insert(semesterMemberships)
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
  revalidatePath("/", "layout");
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

export async function deleteStudentAccountAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await getCurrentUser();
  if (!actor || actor.role !== "ADMIN")
    return errorState("Admin access required.");
  const id = String(formData.get("userId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "")
    .trim()
    .toLowerCase();
  if (!z.uuid().safeParse(id).success)
    return errorState("Invalid student account.");
  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  if (!target || target.role !== "STUDENT" || target.id === actor.id)
    return errorState(
      "Only student accounts can be deleted. Administrator accounts are protected.",
    );
  if (target.deletedAt)
    return errorState("This student account has already been deleted.");
  if (confirmation !== target.email)
    return errorState("Enter the student's exact email to confirm deletion.");
  try {
    // One atomic statement: preserve every foreign key and historical record.
    // Conditional UPDATE also rejects a concurrent role change or repeat deletion.
    const result = await db.execute(sql`
      WITH removed AS (
        UPDATE users SET active=false, deleted_at=now(), image=NULL, updated_at=now()
        WHERE id=${id}::uuid AND role='STUDENT' AND deleted_at IS NULL AND email=${confirmation}
        RETURNING id
      ), memberships AS (
        UPDATE semester_memberships SET active=false WHERE user_id IN (SELECT id FROM removed)
      ), audit AS (
        INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id,metadata)
        SELECT ${actor.id}::uuid,'STUDENT_ACCOUNT_DELETED','USER',id,
          jsonb_build_object('historyPreserved',true,'policy','Permanent access removal; identified reporting archive retained')
        FROM removed
      )
      SELECT id FROM removed
    `);
    if (!result.rows.length)
      return errorState(
        "Account changed. Refresh and review it before trying again.",
      );
  } catch {
    return errorState("The account could not be deleted. Nothing was removed.");
  }
  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      "Student account deleted. Login is permanently disabled; attendance and semester reports are preserved.",
  };
}
