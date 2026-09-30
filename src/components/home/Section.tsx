import { ArrowRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Section wrapper: one heading, optional "view all" link, content below. */
export function Section({
  title,
  description,
  href,
  hrefLabel = "View all",
  children,
  className,
  id,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("container-page py-12 md:py-16", className)}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 id={headingId} className="font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl">
            {title}
          </h2>
          {description ? <p className="mt-1.5 max-w-[65ch] text-[15px] text-muted">{description}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-navy-700 hover:underline">
            {hrefLabel}
            <ArrowRight size={14} weight="bold" />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}
