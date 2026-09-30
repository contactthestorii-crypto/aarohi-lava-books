"use server";

import { redirect } from "next/navigation";
import { failure, invalid, type ActionResult } from "@/lib/action-result";
import { isSupabaseConfigured, siteUrl } from "@/lib/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { log } from "@/lib/utils/log";
import { forgotSchema, loginSchema, registerSchema, resetSchema, safeNext } from "@/lib/validation/auth";
import { mergeGuestCartIntoUser } from "@/services/cart";

const NOT_READY = "Accounts are not available yet. Please try again later.";

export async function signInAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured) return failure(NOT_READY);
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") {
      return failure("Please confirm your email address first. Check your inbox for the verification link.");
    }
    // Same message for unknown email and wrong password (no account enumeration).
    return failure("Incorrect email or password.");
  }
  try {
    await mergeGuestCartIntoUser(data.user.id);
  } catch (mergeError) {
    log.error("auth.mergeCart", mergeError);
  }
  redirect(safeNext(formData.get("next")));
}

export async function registerAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured) return failure(NOT_READY);
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createServerSupabase();
  const next = safeNext(formData.get("next"));
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    if (error.code === "weak_password") return failure("Choose a stronger password.");
    if (error.code === "over_email_send_rate_limit") return failure("Too many sign-up attempts. Please wait a few minutes.");
    log.error("auth.register", error);
    return failure("We could not create your account. Please try again.");
  }
  // Supabase returns success for existing emails too (no account enumeration).
  return {
    ok: true,
    message: `We sent a verification link to ${parsed.data.email}. Open it to activate your account.`,
  };
}

export async function forgotPasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured) return failure(NOT_READY);
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/auth/reset-password`,
  });
  if (error && error.code !== "user_not_found") log.error("auth.forgot", error);
  return { ok: true, message: "If an account exists for that email, we have sent a password reset link." };
}

export async function resetPasswordAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  if (!isSupabaseConfigured) return failure(NOT_READY);
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return failure("Your reset link has expired. Please request a new one.");
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return failure("Choose a password you have not used before.");
    log.error("auth.reset", error);
    return failure("We could not update your password. Please request a new link.");
  }
  redirect("/account?password=updated");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  redirect("/");
}
