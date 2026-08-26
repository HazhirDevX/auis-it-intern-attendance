import Link from "next/link";
import { History } from "lucide-react";

import { ActivityForm } from "@/components/portal/activity-form";
import { PageHeader } from "@/components/portal/page-header";
import { ProgressCard } from "@/components/portal/progress-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getActiveSemester,
  getMembership,
  getUserMetrics,
} from "@/data/portal";
import { requireUser } from "@/lib/auth/dal";
import { localDateString } from "@/lib/dates";

export default async function LogHoursPage() {
  const user = await requireUser();
  const semester = await getActiveSemester();

  if (!semester) {
    return (
      <>
        <PageHeader
          eyebrow="Daily attendance"
          title="Log daily hours"
          description="There is no active semester available for new entries."
        />
        <Card className="border-dashed">
          <CardContent className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground">
            An administrator must activate a semester before hours can be
            logged.
          </CardContent>
        </Card>
      </>
    );
  }

  const [membership, metrics] = await Promise.all([
    getMembership(user.id, semester.id),
    getUserMetrics(user.id, semester.id),
  ]);

  if (!membership?.active) {
    return (
      <>
        <PageHeader
          eyebrow="Daily attendance"
          title="Log daily hours"
          description={`You are not assigned to ${semester.name}.`}
        />
        <Card className="border-dashed">
          <CardContent className="grid min-h-64 place-items-center text-center text-sm text-muted-foreground">
            Contact the IT Department administrator to request a semester
            assignment.
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Daily attendance"
        title={`Welcome back, ${user.name.split(" ")[0]} 👋`}
        description="Great interns log their work. Legendary interns remember what they did."
        action={
          <Button asChild variant="outline">
            <Link href="/activities">
              <History className="size-4" />
              View history
            </Link>
          </Button>
        }
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <ActivityForm today={localDateString()} />
        <div className="xl:sticky xl:top-8">
          <ProgressCard
            hours={metrics.totalHours}
            target={Number(semester.targetHours)}
            semesterName={semester.name}
          />
        </div>
      </div>
    </>
  );
}
