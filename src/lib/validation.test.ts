import { describe, expect, it } from "vitest";

import {
  activitySchema,
  auisEmailSchema,
  isAllowedGoogleEmail,
  internSchema,
  normalizeEmail,
  semesterSchema,
} from "@/lib/validation";

describe("server input validation", () => {
  it.each([
    "hazhir.a.2004@gmail.com",
    "HAZHIR.A.2004@gmail.com",
    "  hazhir.a.2004@gmail.com  ",
  ])("canonicalizes account identity: %s", (email) => {
    expect(normalizeEmail(email)).toBe("hazhir.a.2004@gmail.com");
    expect(internSchema.parse({ name: "Hazhir", email }).email).toBe(
      "hazhir.a.2004@gmail.com",
    );
  });
  it("accepts only normalized AUIS addresses", () => {
    expect(auisEmailSchema.parse(" HA23109@auis.edu.krd ")).toBe(
      "ha23109@auis.edu.krd",
    );
    expect(auisEmailSchema.safeParse("person@gmail.com").success).toBe(false);
    expect(auisEmailSchema.safeParse("person@notauis.edu.krd").success).toBe(
      false,
    );
  });

  it("allows only the explicitly approved personal Google account", () => {
    expect(isAllowedGoogleEmail("hazhir.a.2004@gmail.com")).toBe(true);
    expect(isAllowedGoogleEmail("HAZHIR.A.2004@GMAIL.COM")).toBe(true);
    expect(isAllowedGoogleEmail("person@gmail.com")).toBe(false);
    expect(isAllowedGoogleEmail("student@auis.edu.krd")).toBe(true);
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
      weeklyTargetHours: 10,
      monthlyTargetHours: 40,
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
  it("discards a client-supplied official semester total", () => {
    const parsed = semesterSchema.parse({
      name: "Test semester",
      startDate: "2027-01-01",
      endDate: "2027-01-14",
      weeklyTargetHours: 10,
      monthlyTargetHours: 40,
      targetHours: 99999,
      targetBasis: "WEEKLY",
    });
    expect(parsed).not.toHaveProperty("targetHours");
    expect(parsed.weeklyTargetHours).toBe(10);
  });
});
