import Image from "next/image";
import Link from "next/link";
import { Rating } from "@/components/ui/Rating";
import { cn } from "@/lib/utils/cn";
import type { ProductSummary } from "@/types";
import { BuyButtons } from "./BuyButtons";
import { PriceDisplay } from "./PriceDisplay";
import { StockStatus, isPurchasable } from "./StockStatus";

export function BookCover({
  product,
  sizes,
  priority = false,
  className,
}: {
  product: Pick<ProductSummary, "title" | "cover">;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative aspect-[3/4] overflow-hidden rounded-[var(--radius-control)] bg-navy-50", className)}>
      {product.cover ? (
        <Image
          src={product.cover.url}
          alt={product.cover.alt || `${product.title} cover`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-3 drop-shadow-[0_8px_16px_rgb(16_33_77/0.18)]"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-4 text-center font-display text-sm font-bold text-navy-700">
          {product.title}
        </div>
      )}
    </div>
  );
}

export function ProductCard({ product, priority = false }: { product: ProductSummary; priority?: boolean }) {
  const purchasable = isPurchasable(product.pricePaise, product.stock);
  const href = `/books/${product.slug}`;
  return (
    <article className="group flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-white p-3 transition-shadow hover:shadow-[var(--shadow-card)] sm:p-4">
      <Link href={href} className="block" tabIndex={-1} aria-hidden="true">
        <BookCover product={product} sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 45vw" priority={priority} />
      </Link>
      <div className="mt-3 flex flex-1 flex-col">
        {product.exams.length > 0 ? (
          <p className="mb-1.5 flex flex-wrap gap-1">
            {product.exams.slice(0, 3).map((exam) => (
              <span key={exam} className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-bold text-navy-900">
                {exam}
              </span>
            ))}
          </p>
        ) : null}
        <h3 className="font-display text-[15px] font-bold leading-snug text-ink sm:text-base">
          <Link href={href} className="line-clamp-2 hover:text-navy-700">
            {product.title}
          </Link>
        </h3>
        {product.author ? <p className="mt-0.5 line-clamp-1 text-sm text-muted">{product.author}</p> : null}
        <Rating value={product.ratingAvg} count={product.ratingCount} size={14} className="mt-1.5" />
        <div className="mt-auto pt-3">
          <PriceDisplay pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} size="sm" />
          <StockStatus stock={product.stock} pricePaise={product.pricePaise} className="mt-0.5" />
          <BuyButtons
            productId={product.id}
            size="sm"
            layout="stack"
            disabled={!purchasable}
            disabledLabel={product.pricePaise === null ? "Coming soon" : "Out of stock"}
            className="mt-3 sm:grid-cols-2"
          />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0, className }: { products: ProductSummary[]; priorityCount?: number; className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard product={product} priority={index < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
