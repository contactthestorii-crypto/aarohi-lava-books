"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { MAX_CART_LINE_QUANTITY } from "@/lib/config";
import { formatPaise } from "@/lib/utils/money";
import type { StockInfo } from "@/types";
import { BuyButtons } from "./BuyButtons";

/** Quantity selector + Add to Cart / Buy Now, plus the sticky mobile bar. */
export function ProductBuyBox({
  productId,
  pricePaise,
  stock,
  purchasable,
  disabledLabel,
}: {
  productId: string;
  pricePaise: number | null;
  stock: StockInfo;
  purchasable: boolean;
  disabledLabel: string;
}) {
  const max = stock.state === "backorder" ? MAX_CART_LINE_QUANTITY : Math.min(stock.available, MAX_CART_LINE_QUANTITY);
  const [quantity, setQuantity] = useState(1);

  return (
    <>
      {purchasable ? (
        <div className="flex items-center gap-3">
          <span id="qty-label" className="text-sm font-semibold">
            Quantity
          </span>
          <div role="group" aria-labelledby="qty-label" className="inline-flex h-11 items-center rounded-[var(--radius-control)] border border-line">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="inline-flex size-11 items-center justify-center text-ink disabled:text-line"
            >
              <Minus size={16} weight="bold" />
            </button>
            <output aria-live="polite" className="w-8 text-center font-semibold tabular-nums">
              {quantity}
            </output>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
              disabled={quantity >= max}
              aria-label="Increase quantity"
              className="inline-flex size-11 items-center justify-center text-ink disabled:text-line"
            >
              <Plus size={16} weight="bold" />
            </button>
          </div>
        </div>
      ) : null}
      <BuyButtons productId={productId} quantity={quantity} size="lg" disabled={!purchasable} disabledLabel={disabledLabel} className="mt-4" />

      {/* Sticky bar on mobile so the purchase action is always reachable. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-xs text-muted">{purchasable ? `Qty ${quantity}` : "Price"}</p>
            <p className="font-display text-lg font-extrabold tabular-nums">
              {pricePaise !== null ? formatPaise(pricePaise * quantity) : "TBA"}
            </p>
          </div>
          <BuyButtons productId={productId} quantity={quantity} disabled={!purchasable} disabledLabel={disabledLabel} className="flex-1" />
        </div>
      </div>
    </>
  );
}
