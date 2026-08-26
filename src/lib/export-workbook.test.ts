import ExcelJS from "exceljs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildAttendanceWorkbook } from "@/lib/export-workbook";

describe("Excel export", () => {
  it("produces a readable xlsx with activity and summary sheets", async () => {
    const output = await buildAttendanceWorkbook(
      [
        {
          internName: "Example Intern",
          email: "intern@auis.edu.krd",
          semester: "Fall 2026",
          workDate: "2026-09-01",
          hours: 4.5,
          description: "Configured workstations",
          submittedAt: new Date("2026-09-01T10:00:00Z"),
        },
      ],
      [
        {
          name: "Example Intern",
          email: "intern@auis.edu.krd",
          hours: 4.5,
          targetHours: 120,
          progress: 3.75,
          activityCount: 1,
        },
      ],
    );
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(output);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Activities",
      "Intern Summary",
    ]);
    expect(workbook.getWorksheet("Activities")?.getCell("A2").value).toBe(
      "Example Intern",
    );
    expect(workbook.getWorksheet("Intern Summary")?.getCell("E2").value).toBe(
      115.5,
    );
  });
});
