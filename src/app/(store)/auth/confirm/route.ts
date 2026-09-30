import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { log } from "@/lib/utils/log";
import { safeNext } from "@/lib/validation/auth";
import { mergeGuestCartIntoUser } from "@/services/cart";

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

/**
 * Handles links from Supabase emails (verification, password recovery). Supports both
 * the token_hash template (recommended, works across devices) and the PKCE ?code= flow.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");

  try {
    const supabase = await createServerSupabase();
    let userId: string | null = null;
    if (tokenHash && type && OTP_TYPES.includes(type)) {
      const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (error) throw error;
      userId = data.user?.id ?? null;
    } else if (code) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      userId = data.user?.id ?? null;
    } else {
      return NextResponse.redirect(new URL("/auth/login?error=link", url));
    }
    if (userId) await mergeGuestCartIntoUser(userId).catch((error) => log.error("auth.confirm.merge", error));
    return NextResponse.redirect(new URL(type === "recovery" ? "/auth/reset-password" : next, url));
  } catch (error) {
    log.warn("auth.confirm", error instanceof Error ? error.message : "verification failed");
    return NextResponse.redirect(new URL("/auth/login?error=link", url));
  }
}
