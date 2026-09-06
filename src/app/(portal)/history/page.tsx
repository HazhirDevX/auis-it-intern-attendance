import Link from "next/link";
import { ArrowUpRight, Archive } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import {
  getAllSemesters,
  getMembership,
  getUserMetrics,
  getInternProgress,
} from "@/data/portal";
import { PageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/dates";

export default async function HistoryPage() {
  const user = await requireUser();
  const semesters = await getAllSemesters();
  const summaries = await Promise.all(
    semesters.map(async (semester) => {
      if (user.role !== "ADMIN" && !(await getMembership(user.id, semester.id)))
        return null;
      const progress =
        user.role === "ADMIN" ? await getInternProgress(semester.id) : null;
      const metrics = progress
        ? {
            totalHours: progress.reduce((s, r) => s + r.hours, 0),
            activityCount: progress.reduce((s, r) => s + r.activityCount, 0),
          }
        : await getUserMetrics(user.id, semester.id);
      return { semester, metrics };
    }),
  );
  return (
    <>
      <PageHeader
        eyebrow="Your internship archive"
        title="History"
        description="Every semester has a story. Revisit the hours, activities, and progress without mixing them into your current work."
      />
      <section
        className="rounded-2xl border bg-white p-5 sm:p-7"
        aria-label="Semester history"
      >
        <div className="mb-6 flex items-center gap-3">
          <Archive aria-hidden className="size-5 text-[#947011]" />
          <h2 className="font-semibold">Semester timeline</h2>
        </div>
        {summaries.filter(Boolean).length === 0 && (
          <p className="py-10 text-sm text-muted-foreground">
            No semesters in your archive yet. Your story starts when an
            administrator assigns you to a semester.
          </p>
        )}
        {summaries.map(
          (row) =>
            row && (
              <article
                key={row.semester.id}
                className="grid gap-5 border-b py-6 first:pt-0 last:border-0 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {row.semester.name}
                    </h3>
                    <Badge variant="secondary">{row.semester.status}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatDisplayDate(row.semester.startDate)} —{" "}
                    {formatDisplayDate(row.semester.endDate)}
                  </p>
                  <p className="mt-3 text-sm">
                    <strong>{row.metrics.totalHours.toFixed(1)} hours</strong> ·{" "}
                    {row.metrics.activityCount} activities logged
                    {user.role !== "ADMIN" &&
                      ` · ${row.semester.targetHours} hrs target`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                  <Link
                    className="flex min-h-11 items-center gap-1 underline-offset-4 hover:underline"
                    href={`/?view=activities&semester=${row.semester.id}`}
                  >
                    Activities <ArrowUpRight className="size-4" />
                  </Link>
                  <Link
                    className="flex min-h-11 items-center gap-1 underline-offset-4 hover:underline"
                    href={`/?view=analytics&semester=${row.semester.id}`}
                  >
                    Analytics <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </article>
            ),
        )}
      </section>
    </>
  );
}
