import { notFound } from "next/navigation";
import { Activity, Clock3, Mail, Target } from "lucide-react";

import {
  InternAccessButton,
  MembershipButton,
} from "@/components/admin/intern-profile-actions";
import {
  ActivityList,
  type ActivityListItem,
} from "@/components/portal/activity-list";
import { AnalyticsCharts } from "@/components/portal/analytics-charts";
import { MetricCard } from "@/components/portal/metric-card";
import { PageHeader } from "@/components/portal/page-header";
import { SemesterPicker } from "@/components/portal/semester-picker";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllSemesters, getInternDetail, getMembership } from "@/data/portal";
import { requireAdmin } from "@/lib/auth/dal";

export default async function InternDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ semester?: string }>;
}) {
  await requireAdmin();
  const [{ id }, query, semesters] = await Promise.all([
    params,
    searchParams,
    getAllSemesters(),
  ]);
  const selected =
    semesters.find((item) => item.id === query.semester) ??
    semesters.find((item) => item.status === "ACTIVE") ??
    semesters[0];
  if (!selected) notFound();
  const [detail, membership] = await Promise.all([
    getInternDetail(id, selected.id),
    getMembership(id, selected.id),
  ]);
  if (!detail) notFound();
  const items: ActivityListItem[] = detail.activities.map((item) => ({
    ...item,
    hours: Number(item.hours),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
  const target = Number(selected.targetHours);
  return (
    <>
      <PageHeader
        eyebrow="Intern profile"
        title={detail.user.name}
        description={detail.user.email}
        action={
          <div className="flex flex-wrap items-end gap-3">
            <SemesterPicker semesters={semesters} value={selected.id} />
            <InternAccessButton userId={id} active={detail.user.active} />
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge>{detail.user.role}</Badge>
        <Badge variant={detail.user.active ? "outline" : "secondary"}>
          {detail.user.active ? "Authorized" : "Inactive"}
        </Badge>
        <Badge variant={membership?.active ? "outline" : "secondary"}>
          {membership?.active
            ? `Assigned to ${selected.name}`
            : `Not assigned to ${selected.name}`}
        </Badge>
        <MembershipButton
          userId={id}
          semesterId={selected.id}
          active={Boolean(membership?.active)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total hours"
          value={detail.metrics.totalHours.toFixed(1)}
          icon={Clock3}
          accent
        />
        <MetricCard
          label="Target"
          value={`${target.toFixed(0)} hrs`}
          icon={Target}
        />
        <MetricCard
          label="Activities"
          value={String(detail.metrics.activityCount)}
          icon={Activity}
        />
        <MetricCard
          label="Average entry"
          value={`${detail.metrics.averageHours.toFixed(1)} hrs`}
          icon={Mail}
        />
      </div>
      <div className="mt-6">
        <AnalyticsCharts data={detail.series} target={target} />
      </div>
      <Card className="mt-6 border-0 bg-transparent shadow-none">
        <CardHeader className="px-0">
          <CardTitle className="text-lg">Activity history</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <ActivityList items={items} isAdmin />
        </CardContent>
      </Card>
    </>
  );
}
