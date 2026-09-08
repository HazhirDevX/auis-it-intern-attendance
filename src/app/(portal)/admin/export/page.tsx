import { Download } from "lucide-react";

import { PageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SemesterSummary } from "@/components/portal/semester-summary";
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
          <Card key={semester.id} className="shadow-sm">
            <CardContent className="grid min-w-0 items-center gap-5 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
              <SemesterSummary {...semester} />
              <Button asChild className="justify-self-start">
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
