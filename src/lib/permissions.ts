import type { UserRole } from "@/lib/db/schema";

type Actor = { id: string; role: UserRole };

export function canManageActivity(actor: Actor, activityUserId: string) {
  return actor.role === "ADMIN" || actor.id === activityUserId;
}

export function canAccessAdmin(actor: Actor) {
  return actor.role === "ADMIN";
}

export function canViewUser(actor: Actor, targetUserId: string) {
  return actor.role === "ADMIN" || actor.id === targetUserId;
}
