"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Option = { id: string; name: string };

export function ActivityFilters({
  semesters,
  interns,
  values,
}: {
  semesters: Option[];
  interns?: Option[];
  values: {
    semester?: string;
    intern?: string;
    search?: string;
    sort?: string;
    from?: string;
    to?: string;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="filter-panel">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
        <SlidersHorizontal className="size-4 text-[#a57c10]" />
        Filter activity
      </div>
      <div className="filter-grid">
        <div className="filter-search space-y-2">
          <Label htmlFor="activity-search">Search</Label>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              update("search", String(data.get("search") ?? ""));
            }}
            className="flex min-w-0 gap-2"
          >
            <Input
              id="activity-search"
              name="search"
              key={values.search ?? ""}
              defaultValue={values.search}
              placeholder="Description or intern"
            />
            <Button
              type="submit"
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label="Search activities"
            >
              <Search className="size-4" />
            </Button>
          </form>
        </div>
        <div className="space-y-2">
          <Label>Semester</Label>
          <Select
            value={values.semester ?? "all"}
            onValueChange={(value) => update("semester", value)}
          >
            <SelectTrigger aria-label="Semester">
              <SelectValue placeholder="All semesters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {interns && (
          <div className="space-y-2">
            <Label>Intern</Label>
            <Select
              value={values.intern ?? "all"}
              onValueChange={(value) => update("intern", value)}
            >
              <SelectTrigger aria-label="Intern">
                <SelectValue placeholder="All interns" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All interns</SelectItem>
                {interns.map((intern) => (
                  <SelectItem key={intern.id} value={intern.id}>
                    {intern.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="filter-date space-y-2">
          <Label htmlFor="activity-from">From date</Label>
          <Input
            id="activity-from"
            type="date"
            key={values.from ?? ""}
            defaultValue={values.from}
            onChange={(event) => update("from", event.target.value)}
          />
        </div>
        <div className="filter-date space-y-2">
          <Label htmlFor="activity-to">To date</Label>
          <Input
            id="activity-to"
            type="date"
            key={values.to ?? ""}
            defaultValue={values.to}
            onChange={(event) => update("to", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Order</Label>
          <Select
            value={values.sort ?? "newest"}
            onValueChange={(value) => update("sort", value)}
          >
            <SelectTrigger aria-label="Order">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.push(`${pathname}?view=activities`)}
          >
            Clear filters
          </Button>
        </div>
      </div>
    </div>
  );
}
