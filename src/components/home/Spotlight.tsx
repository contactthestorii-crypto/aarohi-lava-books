import { CheckCircle } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { BuyButtons } from "@/components/ecommerce/BuyButtons";
import { PriceDisplay } from "@/components/ecommerce/PriceDisplay";
import { BookCover } from "@/components/ecommerce/ProductCard";
import { StockStatus, isPurchasable } from "@/components/ecommerce/StockStatus";
import { Rating } from "@/components/ui/Rating";
import type { Product } from "@/types";

/** Featured section when the store has a single featured title: one book, presented fully. */
export function Spotlight({ product }: { product: Product }) {
  const purchasable = isPurchasable(product.pricePaise, product.stock);
  return (
    <div className="grid gap-8 rounded-[var(--radius-card)] border border-line bg-navy-50 p-5 sm:p-8 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-12">
      <Link href={`/books/${product.slug}`} className="mx-auto w-full max-w-[16rem] md:max-w-none">
        <BookCover product={product} sizes="(min-width: 768px) 288px, 256px" className="bg-white" />
      </Link>
      <div className="flex flex-col">
        <div className="flex flex-wrap gap-1.5">
          {product.exams.map((exam) => (
            <span key={exam} className="rounded-full bg-navy-900 px-2.5 py-0.5 text-xs font-bold text-white">
              {exam}
            </span>
          ))}
          {product.edition ? (
            <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-xs font-bold text-ink ring-1 ring-inset ring-gold-400">
              {product.edition}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl">
          <Link href={`/books/${product.slug}`} className="hover:text-navy-700">
            {product.title}
          </Link>
        </h3>
        {product.subtitle ? <p className="mt-1 text-lg font-semibold text-navy-700">{product.subtitle}</p> : null}
        {product.author ? <p className="mt-2 text-[15px] text-muted">by {product.author}</p> : null}
        <Rating value={product.ratingAvg} count={product.ratingCount} className="mt-2" />

        {product.keyFeatures.length > 0 ? (
          <ul className="mt-5 grid gap-2 text-[15px] sm:grid-cols-2">
            {product.keyFeatures.slice(0, 4).map((feature) => (
              <li key={feature} className="flex gap-2">
                <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-success" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-col gap-4 pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <PriceDisplay pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} size="lg" />
            <StockStatus stock={product.stock} pricePaise={product.pricePaise} className="mt-1" />
          </div>
          <BuyButtons
            productId={product.id}
            disabled={!purchasable}
            disabledLabel={product.pricePaise === null ? "Coming soon" : "Out of stock"}
            className="w-full sm:w-auto sm:min-w-[20rem]"
          />
        </div>
        <Link href={`/books/${product.slug}`} className="mt-4 text-sm font-semibold text-navy-700 hover:underline">
          See full details, contents and specifications
        </Link>
      </div>
    </div>
  );
}
