import type { ProductSummary } from "@/types";

/**
 * Designed stand-in built from the book's data, used until real product photos are
 * uploaded in the admin. Scales with its container (container query units).
 */
export function TypographicCover({ product }: { product: Pick<ProductSummary, "title"> & Partial<Pick<ProductSummary, "subtitle" | "author" | "exams">> }) {
  const [brand, ...rest] = product.title.split(":");
  const title = rest.join(":").trim();
  return (
    <div aria-label={`${product.title}${product.author ? ` by ${product.author}` : ""}`} role="img" className="@container flex h-full flex-col bg-navy-900 text-white">
      {product.exams && product.exams.length > 0 ? (
        <p className="bg-red-600 px-[6cqw] py-[3cqw] text-[6cqw] font-bold leading-tight">For {product.exams.join(" | ")}</p>
      ) : (
        <span className="h-[3cqw] bg-red-600" />
      )}
      <div className="flex flex-1 flex-col justify-center px-[7cqw]">
        <p className="font-display-condensed text-[15cqw] font-extrabold uppercase leading-[0.9] tracking-tight">{brand.trim()}</p>
        {title ? <p className="mt-[3cqw] font-display text-[7cqw] font-bold leading-tight text-gold-400">{title}</p> : null}
        {product.subtitle ? <p className="mt-[2cqw] text-[5.5cqw] font-semibold uppercase leading-tight tracking-wide text-navy-200">{product.subtitle}</p> : null}
      </div>
      {product.author ? <p className="border-t border-white/15 px-[7cqw] py-[4cqw] text-[5.5cqw] text-navy-100">{product.author}</p> : null}
    </div>
  );
}
