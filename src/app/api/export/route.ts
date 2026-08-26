import { NextRequest } from "next/server";

import { getExportData } from "@/data/portal";
import { getCurrentUser } from "@/lib/auth/dal";
import { buildAttendanceWorkbook } from "@/lib/export-workbook";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  if (user.role !== "ADMIN")
    return Response.json({ error: "Admin access required." }, { status: 403 });
  const semesterId = request.nextUrl.searchParams.get("semester");
  if (!semesterId)
    return Response.json({ error: "Semester is required." }, { status: 400 });
  const data = await getExportData(semesterId);
  if (!data)
    return Response.json({ error: "Semester not found." }, { status: 404 });
  const buffer = await buildAttendanceWorkbook(data.activities, data.summary);
  const safeName = data.semester.name
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_|_$/g, "");
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="AUIS_IT_Intern_Attendance_${safeName}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
