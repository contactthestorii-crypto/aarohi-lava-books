"use client";

import { Heart } from "@phosphor-icons/react";
import { useState, useTransition } from "react";
import { toggleWishlistAction } from "@/actions/account";
import { useToast } from "@/components/ui/Toast";

/** Save / unsave a book. Signed-out visitors get a prompt to sign in (from the action). */
export function WishlistButton({ productId }: { productId: string }) {
  const toast = useToast();
  const [saved, setSaved] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved ?? false}
      onClick={() =>
        startTransition(async () => {
          const result = await toggleWishlistAction(productId);
          if (!result.ok) {
            toast.show(result.error, "error");
            return;
          }
          setSaved(result.data?.saved ?? null);
          toast.show(result.message ?? "Saved");
        })
      }
      className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-semibold text-navy-900 hover:bg-navy-50 disabled:opacity-60"
    >
      <Heart size={20} weight={saved ? "fill" : "regular"} className={saved ? "text-red-600" : undefined} />
      {saved ? "Saved" : "Save for later"}
    </button>
  );
}
