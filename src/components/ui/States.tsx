import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-[var(--radius-control)] bg-navy-100/70", className)} />;
}

type StateProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: StateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-6 py-12 text-center", className)}>
      {icon ? <div className="text-navy-700 [&_svg]:size-10">{icon}</div> : null}
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {description ? <p className="max-w-md text-[15px] text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ icon, title, description, action, className }: StateProps) {
  return (
    <div role="alert" className={cn("flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-danger/30 bg-red-50 px-6 py-10 text-center", className)}>
      {icon ? <div className="text-danger [&_svg]:size-9">{icon}</div> : null}
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {description ? <p className="max-w-md text-[15px] text-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Inline notice for forms and pages (info / success / warning / error). */
export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "error";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-navy-200 bg-navy-50 text-navy-900",
    success: "border-success/25 bg-success-50 text-success",
    warning: "border-warning/25 bg-warning-50 text-warning",
    error: "border-danger/25 bg-red-50 text-danger",
  } as const;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("rounded-[var(--radius-control)] border px-3.5 py-2.5 text-sm", tones[tone], className)}>
      {children}
    </div>
  );
}
