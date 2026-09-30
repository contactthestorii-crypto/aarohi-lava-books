"use client";

import { Lightning, ShoppingCartSimple } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCartAction } from "@/actions/cart";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { notifyCartUpdated } from "@/lib/cart-events";
import { cn } from "@/lib/utils/cn";

type Props = {
  productId: string;
  disabled?: boolean;
  disabledLabel?: string;
  quantity?: number;
  size?: "sm" | "md" | "lg";
  layout?: "row" | "stack";
  className?: string;
};

/** Add to Cart + Buy Now. Buy Now adds the book then goes straight to checkout. */
export function BuyButtons({ productId, disabled = false, disabledLabel = "Unavailable", quantity = 1, size = "md", layout = "row", className }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [intent, setIntent] = useState<"cart" | "buy" | null>(null);

  function submit(kind: "cart" | "buy") {
    setIntent(kind);
    startTransition(async () => {
      const result = await addToCartAction(productId, quantity);
      if (!result.ok) {
        toast.show(result.error, "error");
        return;
      }
      notifyCartUpdated();
      if (kind === "buy") router.push("/checkout");
      else toast.show(result.message ?? "Added to cart");
    });
  }

  if (disabled) {
    return (
      <Button variant="secondary" size={size} disabled className={cn("w-full", className)}>
        {disabledLabel}
      </Button>
    );
  }

  return (
    <div className={cn("grid gap-2", layout === "row" ? "grid-cols-2" : "grid-cols-1", className)}>
      <Button
        variant="secondary"
        size={size}
        loading={pending && intent === "cart"}
        disabled={pending}
        onClick={() => submit("cart")}
        icon={<ShoppingCartSimple size={18} weight="bold" />}
      >
        Add to cart
      </Button>
      <Button
        variant="primary"
        size={size}
        loading={pending && intent === "buy"}
        disabled={pending}
        onClick={() => submit("buy")}
        icon={<Lightning size={18} weight="fill" />}
      >
        Buy now
      </Button>
    </div>
  );
}
