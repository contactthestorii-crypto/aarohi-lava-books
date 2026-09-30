"use client";

import { useState } from "react";
import { formatPaise } from "@/lib/utils/money";

export interface DailyRevenue {
  day: string;
  revenuePaise: number;
  orders: number;
}

// Single-series column chart (dataviz skill): one validated hue (#3b5fae, passes the
// lightness band and 3:1 contrast on white), <=24px columns, 4px rounded data-end,
// 2px surface gaps, hairline grid, hover tooltip, and a table view.
const BAR = "#3b5fae";
const HEIGHT = 180;

function niceMax(value: number): number {
  if (value <= 0) return 1000_00;
  const rupees = value / 100;
  const magnitude = 10 ** Math.floor(Math.log10(rupees));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s * 4 >= rupees) ?? magnitude * 10;
  return step * 4 * 100;
}

function shortDate(day: string) {
  return new Date(`${day}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function RevenueChart({ data }: { data: DailyRevenue[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.revenuePaise)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const total = data.reduce((sum, d) => sum + d.revenuePaise, 0);
  const current = active !== null ? data[active] : null;

  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm text-muted">Revenue per day from paid and COD orders, last {data.length} days (IST)</span>
        <span className="font-display text-lg font-extrabold tabular-nums">{formatPaise(total)}</span>
      </figcaption>
      <div className="relative flex gap-2">
        <div className="flex h-[180px] flex-col justify-between text-right text-[11px] tabular-nums text-muted" aria-hidden="true">
          {[...ticks].reverse().map((tick) => (
            <span key={tick} className="-translate-y-1/2 leading-none first:translate-y-0 last:translate-y-0">
              {formatPaise(tick)}
            </span>
          ))}
        </div>
        <div className="relative flex-1" onMouseLeave={() => setActive(null)}>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick} className="h-px w-full bg-line" />
            ))}
          </div>
          <div className="relative flex h-[180px] items-end gap-[2px]" role="img" aria-label={`Daily revenue chart, total ${formatPaise(total)}`}>
            {data.map((d, index) => {
              const height = d.revenuePaise > 0 ? Math.max(3, (d.revenuePaise / max) * HEIGHT) : 0;
              return (
                <div
                  key={d.day}
                  className="flex h-full flex-1 cursor-default items-end justify-center"
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  tabIndex={0}
                  aria-label={`${shortDate(d.day)}: ${formatPaise(d.revenuePaise)}, ${d.orders} orders`}
                >
                  <span
                    className="block w-full max-w-6 rounded-t-[4px] transition-opacity"
                    style={{ height, background: BAR, opacity: active === null || active === index ? 1 : 0.45 }}
                  />
                </div>
              );
            })}
          </div>
          {current ? (
            <div
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-[var(--radius-control)] border border-line bg-white px-3 py-2 text-xs shadow-[var(--shadow-overlay)]"
              style={{ left: `${((active! + 0.5) / data.length) * 100}%` }}
            >
              <p className="font-semibold text-ink">{shortDate(current.day)}</p>
              <p className="tabular-nums text-ink">{formatPaise(current.revenuePaise)}</p>
              <p className="text-muted">
                {current.orders} {current.orders === 1 ? "order" : "orders"}
              </p>
            </div>
          ) : null}
          <div className="mt-1.5 flex justify-between text-[11px] text-muted" aria-hidden="true">
            <span>{data[0] ? shortDate(data[0].day) : ""}</span>
            <span>{data.at(-1) ? shortDate(data.at(-1)!.day) : ""}</span>
          </div>
        </div>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-navy-700">Show as table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-muted">
            <tr>
              <th className="py-1">Day</th>
              <th className="py-1 text-right">Orders</th>
              <th className="py-1 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((d) => (
              <tr key={d.day}>
                <td className="py-1">{shortDate(d.day)}</td>
                <td className="py-1 text-right tabular-nums">{d.orders}</td>
                <td className="py-1 text-right tabular-nums">{formatPaise(d.revenuePaise)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
