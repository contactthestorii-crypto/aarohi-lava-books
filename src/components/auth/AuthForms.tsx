"use client";

import Link from "next/link";
import { useActionState, useRef } from "react";
import { useFocusFirstError } from "@/lib/hooks/useFocusFirstError";
import { forgotPasswordAction, registerAction, resetPasswordAction, signInAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { initialActionState, type ActionResult } from "@/lib/action-result";

function errorsOf(state: ActionResult) {
  return state.ok ? {} : state.fieldErrors ?? {};
}

function FormError({ state }: { state: ActionResult }) {
  if (state.ok || !state.error || state.fieldErrors) return null;
  return <Notice tone="error">{state.error}</Notice>;
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signInAction, initialActionState);
  const errors = errorsOf(state);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);
  return (
    <form ref={formRef} action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormError state={state} />
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        error={errors.password}
        hint={
          <Link href="/auth/forgot-password" className="font-semibold text-navy-700 hover:underline">
            Forgot password?
          </Link>
        }
      >
        <Input id="password" name="password" type="password" autoComplete="current-password" required invalid={Boolean(errors.password)} />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Sign in
      </Button>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(registerAction, initialActionState);
  const errors = errorsOf(state);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form ref={formRef} action={action} className="grid gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormError state={state} />
      <Field label="Full name" htmlFor="fullName" required error={errors.fullName}>
        <Input id="fullName" name="fullName" autoComplete="name" required invalid={Boolean(errors.fullName)} />
      </Field>
      <Field label="Email" htmlFor="email" required error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </Field>
      <Field label="Password" htmlFor="password" required error={errors.password} hint="At least 8 characters with a letter and a number.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required invalid={Boolean(errors.password)} />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" required error={errors.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required invalid={Boolean(errors.confirmPassword)} />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Create account
      </Button>
      <p className="text-xs text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialActionState);
  const errors = errorsOf(state);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);
  if (state.ok) return <Notice tone="success">{state.message}</Notice>;
  return (
    <form ref={formRef} action={action} className="grid gap-4" noValidate>
      <FormError state={state} />
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Send reset link
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, initialActionState);
  const errors = errorsOf(state);
  const formRef = useRef<HTMLFormElement>(null);
  useFocusFirstError(formRef, state);
  return (
    <form ref={formRef} action={action} className="grid gap-4" noValidate>
      <FormError state={state} />
      <Field label="New password" htmlFor="password" error={errors.password} hint="At least 8 characters with a letter and a number.">
        <Input id="password" name="password" type="password" autoComplete="new-password" required invalid={Boolean(errors.password)} />
      </Field>
      <Field label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required invalid={Boolean(errors.confirmPassword)} />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Update password
      </Button>
    </form>
  );
}
