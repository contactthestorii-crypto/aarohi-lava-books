import type { ReactNode } from "react";
import { formatPaise } from "@/lib/utils/money";
import type { Quote } from "@/services/pricing";

/** Price breakdown shared by cart, checkout and order pages. All numbers come from the server. */
export function PriceBreakdown({ quote, taxLabel = "GST", children }: { quote: Quote; taxLabel?: string; children?: ReactNode }) {
  const rate = (quote.taxRateBps / 100).toFixed(quote.taxRateBps % 100 === 0 ? 0 : 2);
  return (
    <dl className="space-y-2.5 text-[15px]">
      <Row label={`Subtotal (${quote.itemCount} ${quote.itemCount === 1 ? "item" : "items"})`} value={formatPaise(quote.subtotalPaise)} />
      {quote.mrpSavingsPaise > 0 ? (
        <Row label="You save on MRP" value={formatPaise(quote.mrpSavingsPaise)} tone="success" note="Already included in the subtotal" />
      ) : null}
      {quote.discountPaise > 0 ? (
        <Row label={`Coupon ${quote.coupon?.code ?? ""}`.trim()} value={`- ${formatPaise(quote.discountPaise)}`} tone="success" />
      ) : null}
      <Row label="Shipping" value={quote.shippingPaise === 0 ? "Free" : formatPaise(quote.shippingPaise)} />
      {quote.codFeePaise > 0 ? <Row label="Cash on delivery fee" value={formatPaise(quote.codFeePaise)} /> : null}
      {quote.taxRateBps > 0 ? (
        <Row
          label={quote.pricesIncludeTax ? `${taxLabel} included (${rate}%)` : `${taxLabel} (${rate}%)`}
          value={quote.pricesIncludeTax ? formatPaise(quote.taxPaise) : `+ ${formatPaise(quote.taxPaise)}`}
          tone={quote.pricesIncludeTax ? "muted" : undefined}
        />
      ) : null}
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="font-display text-2xl font-extrabold tabular-nums">{formatPaise(quote.totalPaise)}</dd>
      </div>
      {children}
    </dl>
  );
}

function Row({ label, value, tone, note }: { label: string; value: string; tone?: "success" | "muted"; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={tone === "muted" ? "text-muted" : undefined}>
        {label}
        {note ? <span className="block text-xs text-muted">{note}</span> : null}
      </dt>
      <dd className={tone === "success" ? "font-semibold text-success tabular-nums" : tone === "muted" ? "text-muted tabular-nums" : "font-semibold tabular-nums"}>
        {value}
      </dd>
    </div>
  );
}
