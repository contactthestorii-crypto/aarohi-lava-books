"use client";

import { ShoppingCartSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CART_UPDATED_EVENT } from "@/lib/cart-events";

/**
 * Client island so catalog pages stay statically cacheable: the count is fetched after load
 * and refreshed whenever the cart changes (CART_UPDATED_EVENT) or the route changes.
 */
export function CartButton() {
  const [count, setCount] = useState<number | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/cart/count", { cache: "no-store" });
        if (!response.ok) return;
        const body = (await response.json()) as { count: number };
        if (!cancelled) setCount(body.count);
      } catch {
        // Count is decorative; the cart page shows the real state.
      }
    }
    load();
    window.addEventListener(CART_UPDATED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(CART_UPDATED_EVENT, load);
    };
  }, [pathname]);

  const label = count ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";

  return (
    <Link
      href="/cart"
      aria-label={label}
      className="relative inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] px-2.5 text-sm font-semibold text-ink hover:bg-navy-50"
    >
      <ShoppingCartSimple size={24} />
      <span className="hidden xl:inline">Cart</span>
      {count ? (
        <span className="absolute -right-0.5 top-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-5 text-white tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
