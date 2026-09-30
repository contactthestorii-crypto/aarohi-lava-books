"use client";

import { Minus, Plus, Trash } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeFromCartAction, updateCartQuantityAction } from "@/actions/cart";
import { useToast } from "@/components/ui/Toast";
import { notifyCartUpdated } from "@/lib/cart-events";
import { MAX_CART_LINE_QUANTITY } from "@/lib/config";
import { cn } from "@/lib/utils/cn";
import { formatPaise } from "@/lib/utils/money";
import type { CartIssue } from "@/services/cart";

const ISSUE_TEXT: Record<CartIssue, string> = {
  unavailable: "This book is no longer available. Please remove it.",
  no_price: "This book is not on sale yet. Please remove it.",
  out_of_stock: "Out of stock. Please remove it to continue.",
  insufficient_stock: "Not enough copies in stock. Reduce the quantity to continue.",
};

export interface CartItemView {
  productId: string;
  slug: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  unitPricePaise: number | null;
  unitMrpPaise: number | null;
  quantity: number;
  lineTotalPaise: number;
  available: number;
  backorder: boolean;
  issue: CartIssue | null;
}

export function CartItemRow({ item }: { item: CartItemView }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const max = item.backorder ? MAX_CART_LINE_QUANTITY : Math.min(MAX_CART_LINE_QUANTITY, Math.max(item.available, 1));

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) toast.show(result.error ?? "Could not update your cart.", "error");
      notifyCartUpdated();
      router.refresh();
    });
  }

  return (
    <li className={cn("flex gap-4 py-5", pending && "opacity-60")}>
      <Link href={`/books/${item.slug}`} className="relative h-28 w-20 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-navy-50 sm:h-32 sm:w-24">
        {item.coverUrl ? <Image src={item.coverUrl} alt={`${item.title} cover`} fill sizes="96px" className="object-contain p-1.5" /> : null}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/books/${item.slug}`} className="line-clamp-2 font-semibold text-ink hover:text-navy-700">
              {item.title}
            </Link>
            {item.author ? <p className="text-sm text-muted">{item.author}</p> : null}
          </div>
          <p className="shrink-0 text-right font-display font-extrabold tabular-nums">{formatPaise(item.lineTotalPaise)}</p>
        </div>
        {item.unitPricePaise !== null ? (
          <p className="mt-1 text-sm text-muted tabular-nums">
            {formatPaise(item.unitPricePaise)} each
            {item.unitMrpPaise && item.unitMrpPaise > item.unitPricePaise ? (
              <s className="ml-2">{formatPaise(item.unitMrpPaise)}</s>
            ) : null}
          </p>
        ) : null}
        {item.issue ? <p className="mt-2 text-sm font-semibold text-danger">{ISSUE_TEXT[item.issue]}</p> : null}
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="inline-flex h-10 items-center rounded-[var(--radius-control)] border border-line" role="group" aria-label={`Quantity for ${item.title}`}>
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={pending || item.quantity <= 1}
              onClick={() => run(() => updateCartQuantityAction(item.productId, item.quantity - 1))}
              className="inline-flex size-10 items-center justify-center disabled:text-line"
            >
              <Minus size={14} weight="bold" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={pending || item.quantity >= max || item.issue !== null}
              onClick={() => run(() => updateCartQuantityAction(item.productId, item.quantity + 1))}
              className="inline-flex size-10 items-center justify-center disabled:text-line"
            >
              <Plus size={14} weight="bold" />
            </button>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => removeFromCartAction(item.productId))}
            className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-control)] px-2 text-sm font-semibold text-muted hover:bg-red-50 hover:text-danger"
          >
            <Trash size={16} /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}
