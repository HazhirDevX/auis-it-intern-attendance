import type { LucideIcon } from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-heading">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a11]">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-[#e5c766] shadow-sm">
              <Icon className="size-5" />
            </span>
          )}
          <h1 className="text-balance text-2xl font-semibold tracking-[-0.035em] text-primary sm:text-3xl">
            {title}
          </h1>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </header>
  );
}
