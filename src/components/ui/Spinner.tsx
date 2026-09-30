import { cn } from "@/lib/utils/cn";

/** Small inline spinner for buttons. Page-level loading uses Skeleton instead. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}
