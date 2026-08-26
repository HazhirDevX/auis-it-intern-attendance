import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden shadow-sm",
        accent && "border-[#c4981b]/40 bg-[#fffdf7]",
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="metric-number mt-2 text-3xl font-semibold text-primary">
              {value}
            </p>
            {helper && (
              <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
            )}
          </div>
          <span
            className={cn(
              "grid size-10 place-items-center rounded-xl bg-muted text-primary",
              accent && "bg-[#f7edcf] text-[#8a6a11]",
            )}
          >
            <Icon className="size-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
