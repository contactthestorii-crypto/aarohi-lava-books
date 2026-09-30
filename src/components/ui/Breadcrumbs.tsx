import { CaretRight } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { siteUrl } from "@/lib/config";
import { JsonLd } from "@/components/seo/JsonLd";

export interface Crumb {
  label: string;
  href?: string;
}

/** Visible breadcrumbs plus BreadcrumbList structured data. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          {all.map((crumb, index) => (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <CaretRight size={12} aria-hidden="true" /> : null}
              {crumb.href && index < all.length - 1 ? (
                <Link href={crumb.href} className="hover:text-navy-700 hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current={index === all.length - 1 ? "page" : undefined} className="line-clamp-1 text-ink">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.label,
            ...(crumb.href ? { item: `${siteUrl}${crumb.href}` } : {}),
          })),
        }}
      />
    </>
  );
}
