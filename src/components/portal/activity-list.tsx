"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarDays, Clock3, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteActivityAction,
  updateActivityAction,
} from "@/actions/activities";
import { initialActionState } from "@/actions/types";
import { SubmitButton } from "@/components/portal/submit-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDisplayDate, formatDisplayDateTime } from "@/lib/dates";

export type ActivityListItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  semesterName: string;
  semesterStatus: "DRAFT" | "ACTIVE" | "ARCHIVED";
  workDate: string;
  hours: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

function RowActions({
  activity,
  isAdmin,
}: {
  activity: ActivityListItem;
  isAdmin: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [updateState, updateAction] = useActionState(
    updateActivityAction,
    initialActionState,
  );
  const [deleteState, deleteAction] = useActionState(
    deleteActivityAction,
    initialActionState,
  );
  const isReadOnly = !isAdmin && activity.semesterStatus === "ARCHIVED";

  useEffect(() => {
    if (updateState.status === "success") {
      toast.success(updateState.message);
      const timer = window.setTimeout(() => setEditOpen(false), 0);
      return () => window.clearTimeout(timer);
    } else if (updateState.status === "error" && updateState.message) {
      toast.error(updateState.message);
    }
  }, [updateState]);

  useEffect(() => {
    if (deleteState.status === "success") {
      toast.success(deleteState.message);
      const timer = window.setTimeout(() => setDeleteOpen(false), 0);
      return () => window.clearTimeout(timer);
    } else if (deleteState.status === "error" && deleteState.message) {
      toast.error(deleteState.message);
    }
  }, [deleteState]);

  if (isReadOnly) {
    return <Badge variant="secondary">Archived</Badge>;
  }

  return (
    <div className="flex justify-end gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit activity from ${activity.workDate}`}
          >
            <Pencil className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit activity</DialogTitle>
            <DialogDescription>
              Changes are recorded in the administrative audit history.
            </DialogDescription>
          </DialogHeader>
          <form action={updateAction} className="space-y-4">
            <input type="hidden" name="id" value={activity.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`date-${activity.id}`}>Work date</Label>
                <Input
                  id={`date-${activity.id}`}
                  name="workDate"
                  type="date"
                  defaultValue={activity.workDate}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`hours-${activity.id}`}>Hours</Label>
                <Input
                  id={`hours-${activity.id}`}
                  name="hours"
                  type="number"
                  min="0.25"
                  max="12"
                  step="0.25"
                  defaultValue={activity.hours}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`description-${activity.id}`}>Description</Label>
              <Textarea
                id={`description-${activity.id}`}
                name="description"
                rows={6}
                defaultValue={activity.description}
                maxLength={1000}
                required
              />
            </div>
            <SubmitButton pendingLabel="Updating…">Save changes</SubmitButton>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            aria-label={`Delete activity from ${activity.workDate}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🗑️ Delete this activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the record from the timeline. A deletion event and
              snapshot remain in the audit history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep activity</AlertDialogCancel>
            <form action={deleteAction}>
              <input type="hidden" name="id" value={activity.id} />
              <AlertDialogAction
                type="submit"
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete activity
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function ActivityList({
  items,
  isAdmin,
}: {
  items: ActivityListItem[];
  isAdmin: boolean;
}) {
  if (!items.length) {
    return (
      <div className="grid min-h-64 place-items-center rounded-xl border border-dashed bg-card p-8 text-center">
        <div>
          <p className="text-4xl">😴</p>
          <h3 className="mt-4 font-semibold text-primary">Nothing here yet.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            The activity log is currently enjoying a peaceful coffee break.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-sm md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && <TableHead>Intern</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead className="min-w-80">Activity</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((activity) => (
              <TableRow key={activity.id}>
                {isAdmin && (
                  <TableCell>
                    <p className="font-medium text-primary">
                      {activity.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.userEmail}
                    </p>
                  </TableCell>
                )}
                <TableCell className="whitespace-nowrap">
                  {formatDisplayDate(activity.workDate)}
                </TableCell>
                <TableCell className="metric-number font-semibold">
                  {activity.hours.toFixed(2)}
                </TableCell>
                <TableCell className="max-w-md whitespace-normal leading-6">
                  {activity.description}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{activity.semesterName}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDisplayDateTime(new Date(activity.createdAt))}
                </TableCell>
                <TableCell>
                  <RowActions activity={activity} isAdmin={isAdmin} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((activity) => (
          <article
            key={activity.id}
            className="rounded-xl border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                {isAdmin && (
                  <p className="font-semibold text-primary">
                    {activity.userName}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {formatDisplayDate(activity.workDate)}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    <Clock3 className="size-3.5" />
                    {activity.hours.toFixed(2)} hrs
                  </span>
                </div>
              </div>
              <RowActions activity={activity} isAdmin={isAdmin} />
            </div>
            <p className="mt-4 text-sm leading-6">{activity.description}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Badge variant="secondary">{activity.semesterName}</Badge>
              <span className="text-[11px] text-muted-foreground">
                Added {formatDisplayDateTime(new Date(activity.createdAt))}
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
