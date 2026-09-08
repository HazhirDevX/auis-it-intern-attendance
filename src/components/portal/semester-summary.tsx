import { GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type SemesterSummaryProps = {
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  memberCount: number;
  targetHours: number;
};

export function SemesterSummary({
  name,
  status,
  memberCount,
  targetHours,
}: SemesterSummaryProps) {
  return (
    <div className="flex min-w-0 items-start gap-3" data-semester-summary>
      <div className="shrink-0 rounded-xl bg-[#c4981b]/10 p-2.5 text-[#947011]">
        <GraduationCap className="size-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold leading-snug text-primary [overflow-wrap:break-word]">
          {name.replace(/ (\d{4})$/, "\u00a0$1")}
        </h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">{memberCount} interns</span>
          <span className="whitespace-nowrap">
            {Number(targetHours)} hour target
          </span>
          <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        </div>
      </div>
    </div>
  );
}
