const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Formats integer paise as rupees, e.g. 45000 -> "₹450", 45050 -> "₹450.50". */
export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}

/** Converts a rupee amount typed by an admin ("450", "450.5") to paise. Returns null if invalid. */
export function rupeesToPaise(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : Number(String(value).replace(/[,₹\s]/g, ""));
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}

export function paiseToRupeesInput(paise: number | null | undefined): string {
  if (paise === null || paise === undefined) return "";
  return (paise / 100).toFixed(paise % 100 === 0 ? 0 : 2);
}

/** Discount percentage from MRP to selling price, rounded down; null when not applicable. */
export function discountPercent(mrpPaise: number | null, pricePaise: number | null): number | null {
  if (!mrpPaise || pricePaise === null || pricePaise >= mrpPaise) return null;
  return Math.floor(((mrpPaise - pricePaise) / mrpPaise) * 100);
}
