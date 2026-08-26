import { describe, expect, it } from "vitest";

import {
  canAccessAdmin,
  canManageActivity,
  canViewUser,
} from "@/lib/permissions";

const student = {
  id: "student-1",
  name: "Student",
  email: "student@auis.edu.krd",
  role: "STUDENT" as const,
  image: null,
};
const admin = { ...student, id: "admin-1", role: "ADMIN" as const };

describe("activity authorization", () => {
  it("allows a student to manage only their own activity", () => {
    expect(canManageActivity(student, "student-1")).toBe(true);
    expect(canManageActivity(student, "student-2")).toBe(false);
  });

  it("allows an administrator to manage any activity", () => {
    expect(canManageActivity(admin, "student-2")).toBe(true);
  });

  it("allows only administrators to access administrator operations", () => {
    expect(canAccessAdmin(admin)).toBe(true);
    expect(canAccessAdmin(student)).toBe(false);
  });

  it("scopes student records to their owner while allowing admin oversight", () => {
    expect(canViewUser(student, "student-1")).toBe(true);
    expect(canViewUser(student, "student-2")).toBe(false);
    expect(canViewUser(admin, "student-2")).toBe(true);
  });
});
