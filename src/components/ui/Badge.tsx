import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type BadgeTone = "neutral" | "brand" | "highlight" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-navy-50 text-muted ring-line",
  brand: "bg-navy-100 text-navy-900 ring-navy-200",
  highlight: "bg-gold-400 text-ink ring-gold-400",
  success: "bg-success-50 text-success ring-success/20",
  warning: "bg-warning-50 text-warning ring-warning/20",
  danger: "bg-red-50 text-danger ring-danger/20",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
