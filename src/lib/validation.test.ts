import { describe, expect, it } from "vitest";

import {
  activitySchema,
  auisEmailSchema,
  internSchema,
  semesterSchema,
} from "@/lib/validation";

describe("server input validation", () => {
  it("accepts only normalized AUIS addresses", () => {
    expect(auisEmailSchema.parse(" HA23109@auis.edu.krd ")).toBe(
      "ha23109@auis.edu.krd",
    );
    expect(auisEmailSchema.safeParse("person@gmail.com").success).toBe(false);
    expect(auisEmailSchema.safeParse("person@notauis.edu.krd").success).toBe(
      false,
    );
  });

  it("enforces safe activity bounds", () => {
    expect(
      activitySchema.safeParse({
        workDate: "2026-09-01",
        hours: 2.5,
        description: "Configured new lab workstations",
      }).success,
    ).toBe(true);
    expect(
      activitySchema.safeParse({
        workDate: "2026-09-01",
        hours: 0,
        description: "Valid text",
      }).success,
    ).toBe(false);
    expect(
      activitySchema.safeParse({
        workDate: "2026-09-01",
        hours: 12.25,
        description: "Valid text",
      }).success,
    ).toBe(false);
  });

  it("rejects reversed semester dates", () => {
    const result = semesterSchema.safeParse({
      name: "Fall 2026",
      startDate: "2026-12-01",
      endDate: "2026-09-01",
      targetHours: 120,
      activate: true,
      internIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("supports an intern with no semester assignment", () => {
    const result = internSchema.parse({
      name: "Example Intern",
      email: "intern@auis.edu.krd",
      role: "STUDENT",
      semesterId: "none",
    });
    expect(result.semesterId).toBeUndefined();
  });
});
