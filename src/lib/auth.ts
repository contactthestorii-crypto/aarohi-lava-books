import "server-only";
import type { User } from "@supabase/supabase-js";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/config";
import { createServerSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/types";

export interface Profile {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: UserRole;
}

/** Verified current user (validated with Supabase Auth on every request). */
export const getUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("profiles").select("id, email, full_name, phone, role").eq("id", user.id).maybeSingle();
  if (!data) return { id: user.id, email: user.email ?? null, fullName: null, phone: null, role: "customer" };
  return { id: data.id, email: data.email ?? user.email ?? null, fullName: data.full_name, phone: data.phone, role: data.role };
});

/** Redirects to login (returning to `next`) when signed out. */
export async function requireUser(next: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  return user;
}

/**
 * Admin gate for admin pages and actions. Signed-out users go to login; signed-in
 * non-admins get a 404 so the admin area is not advertised.
 */
export async function requireAdmin(): Promise<Profile> {
  const user = await getUser();
  if (!user) redirect("/auth/login?next=/admin");
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") notFound();
  return profile;
}

/** Same check for Server Actions / route handlers: returns null instead of redirecting. */
export async function getAdminOrNull(): Promise<Profile | null> {
  const profile = await getProfile();
  return profile?.role === "admin" ? profile : null;
}
