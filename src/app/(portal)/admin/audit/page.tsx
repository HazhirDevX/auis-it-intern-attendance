import { PageHeader } from "@/components/portal/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
        description="The latest 100 important changes, including deletion snapshots retained for review."
      />
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Metadata</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDisplayDateTime(event.createdAt)}
                </TableCell>
                <TableCell>
                  <p className="font-medium">{event.actorName ?? "System"}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.actorEmail}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {event.action.replaceAll("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>{event.entityType}</TableCell>
                <TableCell className="max-w-md">
                  <code className="line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                    {JSON.stringify(event.metadata)}
                  </code>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
