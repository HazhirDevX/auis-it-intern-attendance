import "server-only";

import ExcelJS from "exceljs";

import { formatDisplayDate, formatDisplayDateTime } from "@/lib/dates";

type ExportActivity = {
  internName: string;
  email: string;
  semester: string;
  workDate: string;
  hours: number;
  description: string;
  submittedAt: Date;
};

type ExportSummary = {
  name: string;
  email: string;
  hours: number;
  targetHours: number;
  progress: number;
  activityCount: number;
};

const navy = "0B2545";
const gold = "C4981B";

function styleHeader(row: ExcelJS.Row) {
  row.height = 24;
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: navy } };
    cell.alignment = { vertical: "middle" };
    cell.border = {
      bottom: { style: "thin", color: { argb: gold } },
    };
  });
}

export async function buildAttendanceWorkbook(
  activities: ExportActivity[],
  summary: ExportSummary[],
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AUIS IT Department";
  workbook.created = new Date();
  workbook.modified = new Date();

  const activitySheet = workbook.addWorksheet("Activities", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  activitySheet.columns = [
    { header: "Intern Name", key: "internName", width: 24 },
    { header: "AUIS Email", key: "email", width: 30 },
    { header: "Semester", key: "semester", width: 18 },
    { header: "Work Date", key: "workDate", width: 16 },
    { header: "Hours", key: "hours", width: 12 },
    { header: "Activity Description", key: "description", width: 62 },
    { header: "Submitted At", key: "submittedAt", width: 24 },
  ];
  styleHeader(activitySheet.getRow(1));
  activitySheet.autoFilter = "A1:G1";
  for (const item of activities) {
    const row = activitySheet.addRow({
      ...item,
      workDate: formatDisplayDate(item.workDate),
      submittedAt: formatDisplayDateTime(item.submittedAt),
    });
    row.alignment = { vertical: "top", wrapText: true };
    row.getCell("hours").numFmt = "0.00";
  }
  activitySheet.eachRow((row, index) => {
    if (index > 1 && index % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF7F8FA" },
        };
      });
    }
  });

  const summarySheet = workbook.addWorksheet("Intern Summary", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  summarySheet.columns = [
    { header: "Intern", key: "name", width: 24 },
    { header: "AUIS Email", key: "email", width: 30 },
    { header: "Total Hours", key: "hours", width: 16 },
    { header: "Target Hours", key: "targetHours", width: 16 },
    { header: "Remaining Hours", key: "remaining", width: 18 },
    { header: "Completion Percentage", key: "progress", width: 24 },
    { header: "Total Activities", key: "activityCount", width: 18 },
  ];
  styleHeader(summarySheet.getRow(1));
  summarySheet.autoFilter = "A1:G1";
  for (const item of summary) {
    const row = summarySheet.addRow({
      ...item,
      remaining: Math.max(0, Number(item.targetHours) - Number(item.hours)),
      progress: item.progress / 100,
    });
    row.getCell("hours").numFmt = "0.00";
    row.getCell("targetHours").numFmt = "0.00";
    row.getCell("remaining").numFmt = "0.00";
    row.getCell("progress").numFmt = "0.0%";
  }

  return workbook.xlsx.writeBuffer();
}
