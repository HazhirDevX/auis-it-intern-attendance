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
        description="Choose a semester to download its activities and intern summary. Exports include the full semester history, not just the current page."
      />
      <div className="space-y-4">
        {!semesters.length && (
          <p className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
            No semesters to export yet. Create a semester to start collecting
            activities.
          </p>
        )}
        {semesters.map((semester) => (
          <Card
            key={semester.id}
            className="shadow-sm sm:flex sm:flex-row sm:items-center sm:justify-between"
          >
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
            <CardContent className="sm:pt-6">
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
