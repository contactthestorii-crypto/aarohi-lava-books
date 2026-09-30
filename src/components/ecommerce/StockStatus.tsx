import { cn } from "@/lib/utils/cn";
import type { StockInfo } from "@/types";

const LABELS: Record<StockInfo["state"], { text: (available: number) => string; className: string }> = {
  in_stock: { text: () => "In stock", className: "text-success" },
  low_stock: { text: (n) => `Only ${n} left`, className: "text-warning" },
  out_of_stock: { text: () => "Out of stock", className: "text-danger" },
  backorder: { text: () => "Available on backorder", className: "text-warning" },
};

export function StockStatus({ stock, pricePaise, className }: { stock: StockInfo; pricePaise: number | null; className?: string }) {
  if (pricePaise === null) return <p className={cn("text-sm font-semibold text-muted", className)}>Coming soon</p>;
  const label = LABELS[stock.state];
  return <p className={cn("text-sm font-semibold", label.className, className)}>{label.text(stock.available)}</p>;
}

export function isPurchasable(pricePaise: number | null, stock: StockInfo): boolean {
  return pricePaise !== null && (stock.state === "in_stock" || stock.state === "low_stock" || stock.state === "backorder");
}
