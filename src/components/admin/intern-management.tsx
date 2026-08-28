"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { addInternAction } from "@/actions/interns";
import { initialActionState } from "@/actions/types";
import { SubmitButton } from "@/components/portal/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Progress = {
  hours: number;
  targetHours: number;
  progress: number;
  activityCount: number;
};
type Intern = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  active: boolean;
  createdAt: string;
  progress?: Progress;
};

export function AddInternForm({
  semesters,
}: {
  semesters: Array<{ id: string; name: string; status: string }>;
}) {
  const [state, action] = useActionState(addInternAction, initialActionState);
  useEffect(() => {
    if (state.status === "success") toast.success(state.message);
    if (state.status === "error" && state.message) toast.error(state.message);
  }, [state]);

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="size-5 text-[#a57c10]" />
          Add authorized intern
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={action}
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" name="name" placeholder="Full name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">AUIS email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="student@auis.edu.krd"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select name="role" defaultValue="STUDENT">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Student</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Semester</Label>
            <Select
              name="semesterId"
              defaultValue={
                semesters.find((item) => item.status === "ACTIVE")?.id ?? "none"
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No assignment</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 xl:col-span-4">
            <SubmitButton pendingLabel="Adding intern…">
              Create intern access
            </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function InternTable({ interns }: { interns: Intern[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return interns;
    return interns.filter((intern) =>
      `${intern.name} ${intern.email}`.toLowerCase().includes(term),
    );
  }, [interns, query]);
  return (
    <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="border-b p-4">
        <Label htmlFor="intern-search" className="sr-only">
          Search interns
        </Label>
        <Input
          id="intern-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or AUIS email…"
          className="max-w-md"
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Intern</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Activities</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Profile</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((intern) => (
              <TableRow key={intern.id}>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-primary">{intern.name}</p>
                    <Badge
                      variant={
                        intern.role === "ADMIN" ? "default" : "secondary"
                      }
                    >
                      {intern.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {intern.email}
                  </p>
                </TableCell>
                <TableCell className="metric-number">
                  {intern.progress
                    ? `${intern.progress.hours.toFixed(1)} / ${Number(intern.progress.targetHours)}`
                    : "—"}
                </TableCell>
                <TableCell>
                  {intern.progress
                    ? `${intern.progress.progress.toFixed(1)}%`
                    : "Not assigned"}
                </TableCell>
                <TableCell>{intern.progress?.activityCount ?? 0}</TableCell>
                <TableCell>
                  <Badge
                    variant={intern.active ? "outline" : "secondary"}
                    className={
                      intern.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : ""
                    }
                  >
                    {intern.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/?view=intern&intern=${intern.id}`}>
                      <Eye className="size-4" />
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
