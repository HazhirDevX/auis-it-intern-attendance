"use client";

import { useActionState, useEffect } from "react";
import { Archive, GraduationCap, Play, Plus } from "lucide-react";
import { toast } from "sonner";

import { createSemesterAction } from "@/actions/semesters";
import {
  activateSemesterAction,
  archiveSemesterAction,
} from "@/actions/semesters";
import { initialActionState } from "@/actions/types";
import { SubmitButton } from "@/components/portal/submit-button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatDisplayDate } from "@/lib/dates";

export function CreateSemesterForm({
  interns,
}: {
  interns: Array<{ id: string; name: string; email: string }>;
}) {
  const [state, action] = useActionState(
    createSemesterAction,
    initialActionState,
  );
  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="size-5 text-[#a57c10]" />
          Create semester
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="semester-name">Semester name</Label>
              <Input
                id="semester-name"
                name="name"
                placeholder="Spring 2027"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester-start">Start date</Label>
              <Input
                id="semester-start"
                name="startDate"
                type="date"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester-end">End date</Label>
              <Input id="semester-end" name="endDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester-target">Required hours</Label>
              <Input
                id="semester-target"
                name="targetHours"
                type="number"
                min="1"
                step="0.5"
                defaultValue="120"
                required
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Assign active interns</p>
            <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto rounded-xl border bg-muted/30 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {interns.map((intern) => (
                <Label
                  key={intern.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 shadow-sm"
                >
                  <Checkbox name="internIds" value={intern.id} defaultChecked />
                  <span>
                    <span className="block text-sm font-medium">
                      {intern.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {intern.email}
                    </span>
                  </span>
                </Label>
              ))}
            </div>
          </div>
          <Label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#c4981b]/30 bg-[#fffaf0] p-4">
            <Checkbox name="activate" />
            <span>
              <span className="block text-sm font-semibold text-primary">
                Activate immediately
              </span>
              <span className="block text-xs text-muted-foreground">
                The current active semester will be archived without deleting
                its records.
              </span>
            </span>
          </Label>
          <SubmitButton pendingLabel="Creating semester…">
            <GraduationCap className="size-4" />
            Create semester
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}

type SemesterRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  targetHours: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  memberCount: number;
};

export function SemesterCards({ semesters }: { semesters: SemesterRow[] }) {
  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {semesters.map((semester) => (
        <Card key={semester.id} className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-primary">
                    {semester.name}
                  </h2>
                  <Badge
                    variant={
                      semester.status === "ACTIVE" ? "default" : "secondary"
                    }
                  >
                    {semester.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatDisplayDate(semester.startDate)} –{" "}
                  {formatDisplayDate(semester.endDate)}
                </p>
              </div>
              <p className="metric-number text-right text-sm font-semibold">
                {Number(semester.targetHours)} hrs
                <br />
                <span className="font-normal text-muted-foreground">
                  {semester.memberCount} interns
                </span>
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {semester.status !== "ACTIVE" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm">
                      <Play className="size-4" />
                      Activate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Activate {semester.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        The currently active semester will be archived.
                        Historical activities will remain available.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <form
                        action={async (formData) => {
                          await activateSemesterAction(formData);
                        }}
                      >
                        <input
                          type="hidden"
                          name="semesterId"
                          value={semester.id}
                        />
                        <AlertDialogAction type="submit">
                          Activate semester
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {semester.status === "ACTIVE" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Archive className="size-4" />
                      Close semester
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Close {semester.name}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Historical activities remain available, but this will no
                        longer be the active internship period.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep active</AlertDialogCancel>
                      <form
                        action={async (formData) => {
                          await archiveSemesterAction(formData);
                        }}
                      >
                        <input
                          type="hidden"
                          name="semesterId"
                          value={semester.id}
                        />
                        <AlertDialogAction type="submit">
                          Close semester
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
