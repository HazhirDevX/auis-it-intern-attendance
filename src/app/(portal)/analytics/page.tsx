import { Activity, Clock3, Gauge, Target, TrendingUp } from "lucide-react";

import {
  AnalyticsCharts,
  InternComparisonChart,
} from "@/components/portal/analytics-charts";
import { AdminAnalyticsFilters } from "@/components/admin/analytics-filters";
import { MetricCard } from "@/components/portal/metric-card";
import { PageHeader } from "@/components/portal/page-header";
import { ProgressCard } from "@/components/portal/progress-card";
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
    const [progress, interns] = await Promise.all([
      getInternProgress(selected.id),
      getInterns(),
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
            <AnalyticsCharts data={selectedIntern.series} target={target} />
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
        <div className="mt-6">
          <InternComparisonChart
            data={progress.map((item) => ({
              name: item.name,
              hours: item.hours,
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
  const target = Number(selected.targetHours);
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
      <ProgressCard
        hours={metrics.totalHours}
        target={target}
        semesterName={selected.name}
      />
      <div className="my-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Remaining"
          value={`${Math.max(0, target - metrics.totalHours).toFixed(1)} hrs`}
          icon={Target}
        />
        <MetricCard
          label="Activities"
          value={String(metrics.activityCount)}
          icon={Activity}
        />
        <MetricCard
          label="Average activity"
          value={`${metrics.averageHours.toFixed(1)} hrs`}
          icon={Gauge}
        />
        <MetricCard
          label="This month"
          value={`${metrics.monthHours.toFixed(1)} hrs`}
          helper={`${metrics.weekHours.toFixed(1)} this week`}
          icon={Clock3}
        />
      </div>
      <AnalyticsCharts data={series} target={target} />
    </>
  );
}
