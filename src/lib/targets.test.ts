import { describe, it, expect } from "vitest";
import {
  calculateSemesterTarget,
  periodTargets,
  expectedHours,
  progressState,
  targetMessage,
} from "./targets";
import { aggregateSeries, trajectory } from "./analytics";
const semester = {
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  weeklyTargetHours: 7,
  monthlyTargetHours: 30,
  targetBasis: "WEEKLY" as const,
  targetHours: 30,
};
describe("calendar-based internship targets", () => {
  it("uses inclusive dates and prorates partial weeks", () => {
    expect(
      calculateSemesterTarget("2026-09-01", "2026-09-30", 7, 30, "WEEKLY"),
    ).toBe(30);
    expect(
      calculateSemesterTarget("2026-09-01", "2026-09-01", 7, 30, "WEEKLY"),
    ).toBe(1);
    expect(periodTargets(semester, "2026-09-06").week).toEqual({
      start: "2026-08-31",
      end: "2026-09-06",
      target: 6,
    });
    expect(periodTargets(semester, "2026-09-28").week.target).toBe(3);
  });
  it("handles calendar months, leap years and partial months", () => {
    expect(
      calculateSemesterTarget("2024-02-01", "2024-02-29", 7, 29, "MONTHLY"),
    ).toBe(29);
    expect(
      calculateSemesterTarget("2024-02-15", "2024-02-29", 7, 29, "MONTHLY"),
    ).toBe(15);
    expect(
      calculateSemesterTarget("2026-12-01", "2027-01-31", 10, 40, "MONTHLY"),
    ).toBe(80);
  });
  it("does not fabricate legacy goals or goals outside the semester", () => {
    expect(
      periodTargets(
        { startDate: "2026-09-01", endDate: "2026-09-30", targetHours: 120 },
        "2026-09-05",
      ).week.target,
    ).toBeNull();
    expect(periodTargets(semester, "2026-10-15").month.target).toBe(0);
    expect(expectedHours(semester, "2026-08-30")).toBe(0);
    expect(expectedHours(semester, "2026-09-06")).toBe(6);
    expect(expectedHours(semester, "2026-10-01")).toBe(30);
  });
  it("keeps excess numeric progress but caps the visual bar", () => {
    expect(progressState(15, 10)).toMatchObject({
      percentage: 150,
      bar: 100,
      excess: 5,
      remaining: 0,
      complete: true,
    });
    expect(progressState(0, 0).complete).toBe(false);
    expect(targetMessage("Week", 10, 10)).toContain("10 hours");
  });
  it("fills zero days and keeps monthly and weekly aggregation exact", () => {
    const data = [
      { date: "2026-09-01", hours: 2.25, count: 1 },
      { date: "2026-09-07", hours: 3.75, count: 2 },
    ];
    expect(aggregateSeries(data, "weekly", "2026-09-01", "2026-09-13")).toEqual(
      [
        { date: "2026-08-31", hours: 2.25, count: 1 },
        { date: "2026-09-07", hours: 3.75, count: 2 },
      ],
    );
    expect(
      aggregateSeries(data, "monthly", "2026-09-01", "2026-09-30")[0],
    ).toMatchObject({ hours: 6, count: 3 });
    const points = trajectory(data, semester, "2026-09-07");
    expect(points).toHaveLength(7);
    expect(points[6]).toMatchObject({ cumulative: 6, expected: 7 });
  });
});
