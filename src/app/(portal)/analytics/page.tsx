import { Activity, Clock3, Gauge, Target, TrendingUp } from "lucide-react";

import { InternComparisonChart } from "@/components/portal/analytics-charts";
import { AdminAnalyticsFilters } from "@/components/admin/analytics-filters";
import { MetricCard } from "@/components/portal/metric-card";
import { PageHeader } from "@/components/portal/page-header";
import { PeriodProgress } from "@/components/portal/period-progress";
import { InsightsWorkspace } from "@/components/portal/insights-workspace";
import { localDateString } from "@/lib/dates";
import { SemesterPicker } from "@/components/portal/semester-picker";
import {
  getAllSemesters,
  getHoursSeries,
  getInternDetail,
  getInternProgress,
  getInterns,
  getMembership,
  getUserMetrics,
} from "@/data/portal";
import { requireUser } from "@/lib/auth/dal";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ semester?: string; intern?: string }>;
}) {
  const [user, params, semesters] = await Promise.all([
    requireUser(),
    searchParams,
    getAllSemesters(),
  ]);
  const selected =
    semesters.find((item) => item.id === params.semester) ??
    semesters.find((item) => item.status === "ACTIVE") ??
    semesters[0];

  if (!selected) {
    return (
      <>
        <PageHeader
          eyebrow="Insights"
          title="Analytics"
          description="No semesters have been created yet."
        />
        <div className="rounded-xl border border-dashed p-16 text-center text-sm text-muted-foreground">
          Analytics will appear after a semester is created.
        </div>
      </>
    );
  }

  if (user.role === "ADMIN") {
    const [progress, interns, departmentSeries] = await Promise.all([
      getInternProgress(selected.id),
      getInterns(),
      getHoursSeries(null, selected.id),
    ]);
    const selectedIntern = params.intern
      ? await getInternDetail(params.intern, selected.id)
      : null;
    if (selectedIntern) {
      const target = Number(selected.targetHours);
      return (
        <>
          <PageHeader
            eyebrow="Intern insights"
            title={`${selectedIntern.user.name} analytics`}
            description={`Individual progress for ${selected.name}.`}
            action={
              <AdminAnalyticsFilters
                semesters={semesters}
                interns={interns}
                semester={selected.id}
                intern={params.intern}
              />
            }
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total hours"
              value={selectedIntern.metrics.totalHours.toFixed(1)}
              icon={Clock3}
              accent
            />
            <MetricCard
              label="Remaining"
              value={`${Math.max(0, target - selectedIntern.metrics.totalHours).toFixed(1)} hrs`}
              icon={Target}
            />
            <MetricCard
              label="Activities"
              value={String(selectedIntern.metrics.activityCount)}
              icon={Activity}
            />
            <MetricCard
              label="Average entry"
              value={`${selectedIntern.metrics.averageHours.toFixed(1)} hrs`}
              icon={Gauge}
            />
          </div>
          <div className="mt-6">
            <InsightsWorkspace
              key={selected.id + (params.intern ?? "all")}
              data={selectedIntern.series}
              semester={selected}
              today={localDateString()}
            />
          </div>
        </>
      );
    }
    const total = progress.reduce((sum, item) => sum + item.hours, 0);
    const completed = progress.filter(
      (item) => item.hours >= Number(item.targetHours),
    ).length;
    return (
      <>
        <PageHeader
          eyebrow="Department insights"
          title="System analytics"
          description="Compare internship progress without losing previous-semester context."
          action={
            <AdminAnalyticsFilters
              semesters={semesters}
              interns={interns}
              semester={selected.id}
            />
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Department hours"
            value={total.toFixed(1)}
            icon={Clock3}
            accent
          />
          <MetricCard
            label="Assigned interns"
            value={String(progress.length)}
            icon={Activity}
          />
          <MetricCard
            label="Target reached"
            value={String(completed)}
            helper={`${progress.length - completed} progressing`}
            icon={Target}
          />
          <MetricCard
            label="Average per intern"
            value={`${(total / Math.max(1, progress.length)).toFixed(1)} hrs`}
            icon={TrendingUp}
          />
        </div>
        <InsightsWorkspace
          key={selected.id + (params.intern ?? "all")}
          data={departmentSeries}
          semester={{
            ...selected,
            targetHours: selected.targetHours * progress.length,
            weeklyTargetHours:
              selected.weeklyTargetHours == null
                ? null
                : selected.weeklyTargetHours * progress.length,
            monthlyTargetHours:
              selected.monthlyTargetHours == null
                ? null
                : selected.monthlyTargetHours * progress.length,
          }}
          today={localDateString()}
        />
        <div className="mt-6">
          <InternComparisonChart
            data={progress.map((item) => ({
              name: item.name,
              hours: item.hours,
              activityCount: item.activityCount,
              targetHours: Number(item.targetHours),
            }))}
          />
        </div>
      </>
    );
  }

  const membership = await getMembership(user.id, selected.id);
  const [metrics, series] = await Promise.all([
    getUserMetrics(user.id, selected.id),
    getHoursSeries(user.id, selected.id),
  ]);
  return (
    <>
      <PageHeader
        eyebrow="Your insights"
        title="Analytics"
        description={
          membership
            ? `Your progress for ${selected.name}.`
            : `You were not assigned to ${selected.name}.`
        }
        action={<SemesterPicker semesters={semesters} value={selected.id} />}
      />
      <PeriodProgress semester={selected} metrics={metrics} compact />
      <InsightsWorkspace
        key={selected.id + (params.intern ?? "all")}
        data={series}
        semester={selected}
        today={localDateString()}
      />
    </>
  );
}
