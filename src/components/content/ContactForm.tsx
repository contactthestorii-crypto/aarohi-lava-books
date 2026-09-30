"use client";

import { useActionState, useRef } from "react";
import { useFocusFirstError } from "@/lib/hooks/useFocusFirstError";
import { sendContactMessage } from "@/actions/contact";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { initialActionState } from "@/lib/action-result";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initialActionState);
  const e = state.ok ? {} : state.fieldErrors ?? {};
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      {!state.ok && state.error && !state.fieldErrors ? <Notice tone="error" className="sm:col-span-2">{state.error}</Notice> : null}
      <Field label="Name" htmlFor="ct-name" required error={e.name}>
        <Input id="ct-name" name="name" autoComplete="name" invalid={Boolean(e.name)} />
      </Field>
      <Field label="Email" htmlFor="ct-email" required error={e.email}>
        <Input id="ct-email" name="email" type="email" autoComplete="email" invalid={Boolean(e.email)} />
      </Field>
      <Field label="Mobile (optional)" htmlFor="ct-phone" error={e.phone}>
        <Input id="ct-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" invalid={Boolean(e.phone)} />
      </Field>
      <Field label="Subject (optional)" htmlFor="ct-subject" error={e.subject}>
        <Input id="ct-subject" name="subject" />
      </Field>
      <Field label="Message" htmlFor="ct-message" required error={e.message} className="sm:col-span-2">
        <Textarea id="ct-message" name="message" invalid={Boolean(e.message)} className="min-h-36" />
      </Field>
      <div aria-hidden="true" className="absolute left-[-9999px]">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Button type="submit" size="lg" loading={pending} className="sm:col-span-2 sm:justify-self-start">
        Send message
      </Button>
    </form>
  );
}
