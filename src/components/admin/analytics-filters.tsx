"use client";

import { usePathname, useRouter } from "next/navigation";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

export function AdminAnalyticsFilters({
  semesters,
  interns,
  semester,
  intern,
}: {
  semesters: Option[];
  interns: Option[];
  semester: string;
  intern?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  function update(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value === "all") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  }
  return (
    <div className="grid min-w-[min(100%,28rem)] gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Semester
        </Label>
        <Select
          value={semester}
          onValueChange={(value) => update("semester", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {semesters.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Intern
        </Label>
        <Select
          value={intern ?? "all"}
          onValueChange={(value) => update("intern", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All interns</SelectItem>
            {interns.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
