import { Heart } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/ecommerce/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { requireUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { PRODUCT_SUMMARY_SELECT, mapProductSummary, type ProductSummaryRow } from "@/services/mappers";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

export default async function WishlistPage() {
  await requireUser("/account/wishlist");
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("wishlists").select(`created_at, products(${PRODUCT_SUMMARY_SELECT})`).order("created_at", { ascending: false });
  const products = ((data ?? []) as unknown as { products: ProductSummaryRow | null }[])
    .map((row) => row.products)
    .filter((p): p is ProductSummaryRow => Boolean(p))
    .map(mapProductSummary);

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Wishlist</h1>
      {products.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<Heart />}
          title="Your wishlist is empty"
          description="Tap Save on any book page to keep it here for later."
          action={<ButtonLink href="/books">Explore books</ButtonLink>}
        />
      ) : (
        <ProductGrid products={products} className="mt-6 lg:grid-cols-3" />
      )}
    </div>
  );
}
