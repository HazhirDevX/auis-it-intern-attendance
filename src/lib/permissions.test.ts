import { describe, expect, it } from "vitest";

import { canManageActivity } from "@/lib/permissions";

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
});
