"use client";

import { usePathname, useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SemesterPicker({
  semesters,
  value,
}: {
  semesters: Array<{ id: string; name: string; status: string }>;
  value: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <div className="w-full min-w-0 space-y-2 sm:w-56">
      <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <GraduationCap className="size-4" />
        Semester
      </Label>
      <Select
        value={value}
        onValueChange={(semester) => {
          const params = new URLSearchParams(window.location.search);
          params.set("semester", semester);
          params.delete("page");
          router.push(`${pathname}?${params.toString()}`);
        }}
      >
        <SelectTrigger aria-label="Semester">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {semesters.map((semester) => (
            <SelectItem key={semester.id} value={semester.id}>
              {semester.name}
              {semester.status === "ACTIVE" ? " · Active" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
