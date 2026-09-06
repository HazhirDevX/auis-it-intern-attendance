import { PageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import { getAuditHistory } from "@/data/portal";
import { requireAdmin } from "@/lib/auth/dal";
import { formatDisplayDateTime } from "@/lib/dates";
export default async function AuditPage() {
  await requireAdmin();
  const events = await getAuditHistory();
  return (
    <>
      <PageHeader
        eyebrow="Accountability"
        title="Audit history"
        description="A readable record of the latest 100 important changes. Expand an event to inspect its full snapshot."
      />
      <section
        className="rounded-2xl border bg-white p-5 sm:p-7"
        aria-label="Audit events"
      >
        {!events.length && (
          <p className="py-8 text-sm text-muted-foreground">
            All quiet in the change log. Administrative changes will appear
            here.
          </p>
        )}
        {events.map((event) => (
          <article
            key={event.id}
            className="grid gap-3 border-b py-5 first:pt-0 last:border-0 sm:grid-cols-[150px_1fr]"
          >
            <time className="text-xs leading-5 text-muted-foreground">
              {formatDisplayDateTime(event.createdAt)}
            </time>
            <div className="min-w-0">
              <Badge
                variant="secondary"
                className="max-w-full whitespace-normal"
              >
                {event.action.replaceAll("_", " ")}
              </Badge>
              <p className="mt-2 text-sm font-medium">
                {event.actorName ?? "System"}
              </p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                {event.actorEmail}
              </p>
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer py-2">
                  Inspect {event.entityType.toLowerCase()} change
                </summary>
                <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-muted p-3 font-mono">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </details>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
