import { ShieldCheck, ShoppingCartSimple, WarningCircle } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { CartItemRow, type CartItemView } from "@/components/cart/CartItemRow";
import { CouponForm } from "@/components/cart/CouponForm";
import { PriceBreakdown } from "@/components/checkout/OrderSummary";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, Notice } from "@/components/ui/States";
import { isAdminClientConfigured } from "@/lib/supabase/admin";
import { log } from "@/lib/utils/log";
import { getCart, type CartView } from "@/services/cart";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  if (!isAdminClientConfigured()) {
    return (
      <div className="container-page py-10">
        <EmptyState icon={<ShoppingCartSimple />} title="The cart is not available yet" description="The store is still being set up. Please check back soon." />
      </div>
    );
  }

  let cart: CartView;
  try {
    cart = await getCart();
  } catch (error) {
    log.error("page.cart", error);
    return (
      <div className="container-page py-10">
        <ErrorState icon={<WarningCircle />} title="We could not load your cart" description="Please refresh the page in a moment." />
      </div>
    );
  }
  const settings = await getSettings();

  if (cart.lines.length === 0) {
    return (
      <div className="container-page py-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Your cart</h1>
        <EmptyState
          className="mt-6"
          icon={<ShoppingCartSimple />}
          title="Your cart is empty"
          description="Find the right book for your exam and add it here."
          action={<ButtonLink href="/books">Explore books</ButtonLink>}
        />
      </div>
    );
  }

  const items: CartItemView[] = cart.lines.map((line) => ({
    productId: line.product.id,
    slug: line.product.slug,
    title: line.product.title,
    author: line.product.author,
    coverUrl: line.product.cover?.url ?? null,
    unitPricePaise: line.product.pricePaise,
    unitMrpPaise: line.product.mrpPaise,
    quantity: line.quantity,
    lineTotalPaise: line.lineTotalPaise,
    available: line.product.stock.available,
    backorder: line.product.stock.state === "backorder",
    issue: line.issue,
  }));

  const freeAbove = settings.shipping.free_above_paise;
  const remainingForFree = freeAbove !== null ? freeAbove - (cart.quote.subtotalPaise - cart.quote.discountPaise) : null;

  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Your cart</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <section aria-label="Cart items">
          {cart.hasIssues ? (
            <Notice tone="warning">Some items need your attention before you can check out.</Notice>
          ) : null}
          <ul className="divide-y divide-line border-b border-line">
            {items.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </ul>
          <ButtonLink href="/books" variant="ghost" className="mt-4">
            Continue shopping
          </ButtonLink>
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[var(--radius-card)] border border-line p-5">
            <h2 className="font-display text-xl font-extrabold">Order summary</h2>
            <div className="mt-4">
              <CouponForm appliedCode={cart.couponCode} error={cart.couponCode ? cart.quote.couponError : null} />
            </div>
            <div className="mt-5">
              <PriceBreakdown quote={cart.quote} taxLabel={settings.tax.label} />
            </div>
            {remainingForFree !== null && remainingForFree > 0 && cart.quote.shippingPaise > 0 ? (
              <p className="mt-3 text-sm text-muted">
                Add books worth <strong className="text-ink">₹{Math.ceil(remainingForFree / 100)}</strong> more for free shipping.
              </p>
            ) : null}
            <ButtonLink
              href="/checkout"
              size="lg"
              className="mt-5 w-full"
              aria-disabled={cart.hasIssues || cart.quote.itemCount === 0}
              tabIndex={cart.hasIssues ? -1 : undefined}
            >
              Proceed to checkout
            </ButtonLink>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
              <ShieldCheck size={16} className="text-success" /> Prices and stock are confirmed again at checkout
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
