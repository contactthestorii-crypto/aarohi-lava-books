"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/actions/newsletter";
import { Button } from "@/components/ui/Button";
import { initialActionState } from "@/lib/action-result";

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeNewsletter, initialActionState);
  return (
    <form action={action} className="mt-3">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-white/20 bg-white/5 px-3 text-[15px] text-white placeholder:text-navy-200 focus:border-gold-400 focus:outline-none"
        />
        <Button type="submit" loading={pending}>
          Subscribe
        </Button>
      </div>
      <p aria-live="polite" className={state.ok ? "mt-2 text-sm text-gold-400" : "mt-2 text-sm text-red-50"}>
        {state.ok ? state.message : state.error}
      </p>
    </form>
  );
}
