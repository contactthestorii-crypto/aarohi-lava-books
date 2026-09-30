import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function AdminPageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6">
      {back ? (
        <Link href={back.href} className="text-sm font-semibold text-navy-700 hover:underline">
          {back.label}
        </Link>
      ) : null}
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function AdminCard({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-[var(--radius-card)] border border-line bg-white p-5", className)}>
      {title || actions ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title ? <h2 className="font-display text-lg font-extrabold">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Simple responsive table: scrolls horizontally inside its card on small screens. */
export function AdminTable({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
      <table className="w-full min-w-[40rem] text-sm">
        <thead className="border-b border-line bg-navy-50 text-left text-xs font-bold text-muted">
          <tr>
            {head.map((cell, index) => (
              <th key={index} className="whitespace-nowrap px-4 py-3">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}

export function StatTile({ label, value, hint, tone = "default", href }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "default" | "warning" | "danger"; href?: string }) {
  const content = (
    <>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-extrabold tabular-nums", tone === "warning" && "text-warning", tone === "danger" && "text-danger")}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </>
  );
  const className = "block rounded-[var(--radius-card)] border border-line bg-white p-4";
  return href ? (
    <Link href={href} className={cn(className, "hover:border-navy-700")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}
