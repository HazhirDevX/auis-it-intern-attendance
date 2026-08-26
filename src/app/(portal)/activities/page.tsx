import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { ActivityFilters } from "@/components/portal/activity-filters";
import {
  ActivityList,
  type ActivityListItem,
} from "@/components/portal/activity-list";
import { PageHeader } from "@/components/portal/page-header";
import { Button } from "@/components/ui/button";
import { getActivitiesPage, getAllSemesters, getInterns } from "@/data/portal";
import { requireUser } from "@/lib/auth/dal";

type Params = {
  semester?: string;
  intern?: string;
  search?: string;
  sort?: "oldest" | "newest";
  from?: string;
  to?: string;
  page?: string;
};

function pageHref(params: Params, page: number) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params))
    if (value) next.set(key, value);
  next.set("page", String(page));
  return `/activities?${next.toString()}`;
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const [user, params, semesters] = await Promise.all([
    requireUser(),
    searchParams,
    getAllSemesters(),
  ]);
  const interns = user.role === "ADMIN" ? await getInterns() : undefined;
  const result = await getActivitiesPage(user, {
    semesterId: params.semester,
    internId: params.intern,
    search: params.search,
    sort: params.sort,
    from: params.from,
    to: params.to,
    page: Number(params.page ?? 1),
  });
  const items: ActivityListItem[] = result.rows.map((item) => ({
    ...item,
    hours: Number(item.hours),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return (
    <>
      <PageHeader
        eyebrow={user.role === "ADMIN" ? "Department records" : "Your records"}
        title="Activities"
        description={
          user.role === "ADMIN"
            ? "Review, search, edit, and audit activity across all authorized interns."
            : "Your internship timeline across current and previous semesters."
        }
        action={
          <Button asChild>
            <Link href="/log-hours">
              <Plus className="size-4" />
              Log hours
            </Link>
          </Button>
        }
      />
      <ActivityFilters
        semesters={semesters.map(({ id, name }) => ({ id, name }))}
        interns={interns?.map(({ id, name }) => ({ id, name }))}
        values={params}
      />
      <ActivityList items={items} isAdmin={user.role === "ADMIN"} />
      {result.pageCount > 1 && (
        <nav
          className="mt-5 flex items-center justify-between"
          aria-label="Activity pagination"
        >
          <p className="text-sm text-muted-foreground">
            Page {result.page} of {result.pageCount} · {result.total} records
          </p>
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              aria-disabled={result.page <= 1}
            >
              <Link href={pageHref(params, Math.max(1, result.page - 1))}>
                <ChevronLeft className="size-4" />
                Previous
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              aria-disabled={result.page >= result.pageCount}
            >
              <Link
                href={pageHref(
                  params,
                  Math.min(result.pageCount, result.page + 1),
                )}
              >
                Next
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </nav>
      )}
    </>
  );
}
