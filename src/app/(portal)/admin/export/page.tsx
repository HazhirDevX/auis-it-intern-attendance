import { Download, FileSpreadsheet } from "lucide-react";

import { PageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAllSemesters } from "@/data/portal";
import { requireAdmin } from "@/lib/auth/dal";

export default async function ExportPage() {
  await requireAdmin();
  const semesters = await getAllSemesters();
  return (
    <>
      <PageHeader
        eyebrow="Reporting"
        title="Excel export"
        description="Download a genuine .xlsx workbook with styled Activities and Intern Summary sheets."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {semesters.map((semester) => (
          <Card key={semester.id} className="shadow-sm">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-[#c4981b]/10 p-2.5 text-[#a57c10]">
                  <FileSpreadsheet className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{semester.name}</CardTitle>
                  <CardDescription>
                    {semester.memberCount} interns ·{" "}
                    {Number(semester.targetHours)} hour target ·{" "}
                    {semester.status.toLowerCase()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href={`/api/export?semester=${semester.id}`}>
                  <Download className="size-4" />
                  Export Excel
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
