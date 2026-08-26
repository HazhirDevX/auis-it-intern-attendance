import Link from "next/link";
import { Activity, ArrowRight, Clock3, Target, Users } from "lucide-react";

import { MetricCard } from "@/components/portal/metric-card";
import { PageHeader } from "@/components/portal/page-header";
import { ProgressCard } from "@/components/portal/progress-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/dal";
import { formatDisplayDate } from "@/lib/dates";
import {
  getActiveSemester,
  getActivitiesPage,
  getInternProgress,
  getMembership,
  getRecentActivities,
  getUserMetrics,
} from "@/data/portal";

export default async function DashboardPage() {
  const user = await requireUser();
  const semester = await getActiveSemester();
  if (!semester) {
    return (
      <>
        <PageHeader
          eyebrow="Overview"
          title={`Welcome back, ${user.name.split(" ")[0]}`}
          description="There is no active internship semester yet."
        />
        <Card className="border-dashed">
          <CardContent className="grid min-h-64 place-items-center text-center">
            <div>
              <p className="text-4xl">🎓</p>
              <h2 className="mt-4 font-semibold">
                Waiting for the next semester
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                An administrator can create and activate the next internship
                period.
              </p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (user.role === "ADMIN") {
    const [progress, recent] = await Promise.all([
      getInternProgress(semester.id),
      getRecentActivities(semester.id),
    ]);
    const totalHours = progress.reduce((sum, item) => sum + item.hours, 0);
    const completed = progress.filter(
      (item) => item.hours >= Number(item.targetHours),
    ).length;
    return (
      <>
        <PageHeader
          eyebrow="Admin overview"
          title={`Welcome back, ${user.name.split(" ")[0]}`}
          description={`${semester.name} is active. Here is the department-wide internship picture.`}
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active interns"
            value={String(
              progress.filter(
                (item) => item.userActive && item.membershipActive,
              ).length,
            )}
            helper="Assigned this semester"
            icon={Users}
            accent
          />
          <MetricCard
            label="Department hours"
            value={totalHours.toFixed(1)}
            helper={semester.name}
            icon={Clock3}
          />
          <MetricCard
            label="Target reached"
            value={String(completed)}
            helper={`${progress.length - completed} still progressing`}
            icon={Target}
          />
          <MetricCard
            label="Activity entries"
            value={String(
              progress.reduce((sum, item) => sum + item.activityCount, 0),
            )}
            helper="Across all interns"
            icon={Activity}
          />
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <Card className="shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Intern progress</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/interns">
                  Manage interns
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {progress.slice(0, 7).map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div>
                      <p className="font-medium text-primary">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.email}
                      </p>
                    </div>
                    <p className="metric-number font-semibold">
                      {item.hours.toFixed(1)} / {Number(item.targetHours)} hrs
                    </p>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#c4981b]"
                      style={{ width: `${Math.min(100, item.progress)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recent.length ? (
                recent.map((item) => (
                  <div
                    key={item.id}
                    className="border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-primary">
                        {item.userName}
                      </p>
                      <Badge variant="secondary">
                        {Number(item.hours).toFixed(1)} hrs
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDisplayDate(item.workDate)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No activity yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const membership = await getMembership(user.id, semester.id);
  if (!membership?.active) {
    return (
      <>
        <PageHeader
          eyebrow="Overview"
          title={`Welcome back, ${user.name.split(" ")[0]}`}
          description={`${semester.name} is active, but you are not assigned to it.`}
        />
        <Card className="border-dashed">
          <CardContent className="grid min-h-64 place-items-center text-center">
            <div>
              <p className="text-4xl">🛰️</p>
              <h2 className="mt-4 font-semibold">
                Awaiting semester assignment
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Contact the IT Department administrator to join the active
                semester.
              </p>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }
  const [metrics, activityPage] = await Promise.all([
    getUserMetrics(user.id, semester.id),
    getActivitiesPage(user, { semesterId: semester.id, page: 1 }),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Student overview"
        title={`Welcome back, ${user.name.split(" ")[0]} 👋`}
        description={`${semester.name} · Another productive day in the IT universe.`}
        action={
          <Button asChild>
            <Link href="/log-hours">
              Log today’s hours
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      />
      <ProgressCard
        hours={metrics.totalHours}
        target={Number(semester.targetHours)}
        semesterName={semester.name}
      />
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Hours this week"
          value={metrics.weekHours.toFixed(1)}
          icon={Clock3}
        />
        <MetricCard
          label="Activities"
          value={String(metrics.activityCount)}
          icon={Activity}
        />
        <MetricCard
          label="Average entry"
          value={`${metrics.averageHours.toFixed(1)} hrs`}
          icon={Target}
        />
      </div>
      <Card className="mt-6 shadow-sm">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Latest activity</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/activities">
              View history
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {activityPage.rows[0] ? (
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge>
                  {Number(activityPage.rows[0].hours).toFixed(1)} hrs
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatDisplayDate(activityPage.rows[0].workDate)}
                </span>
              </div>
              <p className="mt-3 leading-6">
                {activityPage.rows[0].description}
              </p>
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              😴 No logs yet. Even servers need a coffee break.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
