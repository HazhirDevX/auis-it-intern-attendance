import { DeleteStudentButton } from "@/components/admin/delete-student";
import { notFound } from "next/navigation";
import { localDateString } from "@/lib/dates";

import {
  InternAccessButton,
  MembershipButton,
} from "@/components/admin/intern-profile-actions";
import {
  ActivityList,
  type ActivityListItem,
} from "@/components/portal/activity-list";
import { InsightsWorkspace } from "@/components/portal/insights-workspace";
import { PeriodProgress } from "@/components/portal/period-progress";
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
  if (detail.user.role === "ADMIN") {
    return (
      <>
        <PageHeader
          eyebrow="Administrator profile"
          title={detail.user.name}
          description={detail.user.email}
          truncateDescription
        />
        <div className="rounded-xl border bg-card p-5">
          <Badge>ADMIN</Badge>
          <p className="mt-3 text-sm text-muted-foreground">
            Department administrator. Full student management, semester
            reporting, analytics, and export access. Administrators do not log
            intern hours or receive personal targets.
          </p>
        </div>
      </>
    );
  }
  const items: ActivityListItem[] = detail.activities.map((item) => ({
    ...item,
    hours: Number(item.hours),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
  return (
    <>
      <PageHeader
        eyebrow="Intern profile"
        title={detail.user.name}
        description={detail.user.email}
        truncateDescription
        action={
          <div className="flex flex-wrap items-end gap-3">
            <SemesterPicker semesters={semesters} value={selected.id} />
            {detail.user.role === "STUDENT" && !detail.user.deletedAt && (
              <>
                <InternAccessButton userId={id} active={detail.user.active} />
                <DeleteStudentButton
                  id={id}
                  name={detail.user.name}
                  email={detail.user.email}
                />
              </>
            )}
          </div>
        }
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Badge>{detail.user.role}</Badge>
        <Badge variant={detail.user.active ? "outline" : "secondary"}>
          {detail.user.deletedAt
            ? "Account deleted · history retained"
            : detail.user.active
              ? "Authorized"
              : "Inactive"}
        </Badge>
        <Badge variant={membership?.active ? "outline" : "secondary"}>
          {membership?.active
            ? `Assigned to ${selected.name}`
            : `Not assigned to ${selected.name}`}
        </Badge>
        {!detail.user.deletedAt && (
          <MembershipButton
            userId={id}
            semesterId={selected.id}
            active={Boolean(membership?.active)}
          />
        )}
      </div>
      <PeriodProgress semester={selected} metrics={detail.metrics} />
      <InsightsWorkspace
        key={selected.id}
        data={detail.series}
        semester={selected}
        today={localDateString()}
      />
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
