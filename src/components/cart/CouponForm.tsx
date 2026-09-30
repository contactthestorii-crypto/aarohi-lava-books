"use client";

import { Tag, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";
import { applyCouponAction, removeCouponAction } from "@/actions/cart";
import { Button } from "@/components/ui/Button";
import { initialActionState } from "@/lib/action-result";

export function CouponForm({ appliedCode, error }: { appliedCode: string | null; error: string | null }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(applyCouponAction, initialActionState);
  const [removing, startRemove] = useTransition();

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state, router]);

  if (appliedCode && !error) {
    return (
      <div className="flex items-center justify-between rounded-[var(--radius-control)] border border-success/30 bg-success-50 px-3 py-2 text-sm">
        <span className="flex items-center gap-2 font-semibold text-success">
          <Tag size={16} weight="fill" /> {appliedCode} applied
        </span>
        <button
          type="button"
          disabled={removing}
          onClick={() =>
            startRemove(async () => {
              await removeCouponAction();
              router.refresh();
            })
          }
          className="inline-flex items-center gap-1 font-semibold text-muted hover:text-danger"
          aria-label={`Remove coupon ${appliedCode}`}
        >
          <X size={14} weight="bold" /> Remove
        </button>
      </div>
    );
  }

  const message = !state.ok && state.error ? state.error : error;
  return (
    <form action={action}>
      <label htmlFor="coupon" className="text-sm font-semibold">
        Coupon code
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="coupon"
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          defaultValue={appliedCode ?? ""}
          className="h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line px-3 text-[15px] uppercase focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-700/20"
        />
        <Button type="submit" variant="secondary" loading={pending}>
          Apply
        </Button>
      </div>
      {message ? (
        <p role="alert" className="mt-1.5 text-sm text-danger">
          {message}
        </p>
      ) : null}
    </form>
  );
}
