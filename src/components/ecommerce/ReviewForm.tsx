"use client";

import { Star } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { submitReview } from "@/actions/reviews";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { initialActionState } from "@/lib/action-result";

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const [state, action, pending] = useActionState(submitReview, initialActionState);
  const [rating, setRating] = useState(0);
  const errors = state.ok ? {} : state.fieldErrors ?? {};

  if (state.ok) return <Notice tone="success">{state.message}</Notice>;

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating || ""} />
      <fieldset>
        <legend className="text-sm font-semibold">
          Your rating <span className="text-danger">*</span>
        </legend>
        <div className="mt-1.5 flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              className="p-1"
            >
              <Star size={28} weight={value <= rating ? "fill" : "regular"} className={value <= rating ? "text-gold-400" : "text-navy-200"} />
            </button>
          ))}
        </div>
        {errors.rating ? <p className="mt-1 text-sm text-danger">{errors.rating}</p> : null}
      </fieldset>
      <Field label="Title" htmlFor="review-title" error={errors.title}>
        <Input id="review-title" name="title" maxLength={120} invalid={Boolean(errors.title)} />
      </Field>
      <Field label="Review" htmlFor="review-body" required error={errors.body}>
        <Textarea id="review-body" name="body" required minLength={10} maxLength={3000} invalid={Boolean(errors.body)} />
      </Field>
      {!state.ok && state.error && !state.fieldErrors ? <Notice tone="error">{state.error}</Notice> : null}
      <Button type="submit" variant="dark" loading={pending} className="justify-self-start">
        Submit review
      </Button>
    </form>
  );
}
