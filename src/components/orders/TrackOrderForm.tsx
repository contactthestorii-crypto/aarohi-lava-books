"use client";

import { useActionState } from "react";
import { trackOrderAction } from "@/actions/track";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { initialActionState } from "@/lib/action-result";

export function TrackOrderForm() {
  const [state, action, pending] = useActionState(trackOrderAction, initialActionState);
  const errors = state.ok ? {} : state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4" noValidate>
      {!state.ok && state.error && !state.fieldErrors ? <Notice tone="error">{state.error}</Notice> : null}
      <Field label="Order ID" htmlFor="orderNumber" required error={errors.orderNumber} hint="Looks like AL260930-1A2B3">
        <Input id="orderNumber" name="orderNumber" autoCapitalize="characters" autoComplete="off" className="uppercase tabular-nums" invalid={Boolean(errors.orderNumber)} />
      </Field>
      <Field label="Mobile number or email" htmlFor="contact" required error={errors.contact}>
        <Input id="contact" name="contact" autoComplete="email" invalid={Boolean(errors.contact)} />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Track order
      </Button>
    </form>
  );
}
