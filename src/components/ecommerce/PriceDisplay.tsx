import { cn } from "@/lib/utils/cn";
import { discountPercent, formatPaise } from "@/lib/utils/money";

type Size = "sm" | "md" | "lg";

const priceSize: Record<Size, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-3xl",
};

/** Selling price, struck MRP and discount badge. Never invents a price. */
export function PriceDisplay({
  pricePaise,
  mrpPaise,
  size = "md",
  className,
}: {
  pricePaise: number | null;
  mrpPaise: number | null;
  size?: Size;
  className?: string;
}) {
  if (pricePaise === null) {
    return <p className={cn("text-[15px] font-semibold text-muted", className)}>Price to be announced</p>;
  }
  const off = discountPercent(mrpPaise, pricePaise);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("font-display font-extrabold tabular-nums text-ink", priceSize[size])}>
        <span className="sr-only">Price </span>
        {formatPaise(pricePaise)}
      </span>
      {off !== null && mrpPaise !== null ? (
        <>
          <span className="text-sm text-muted">
            <span className="sr-only">MRP </span>
            <s className="tabular-nums">{formatPaise(mrpPaise)}</s>
          </span>
          <span className="rounded-full bg-gold-400 px-2 py-0.5 text-xs font-bold text-ink">{off}% off</span>
        </>
      ) : mrpPaise !== null && mrpPaise === pricePaise ? (
        <span className="text-xs text-muted">MRP</span>
      ) : null}
    </div>
  );
}
