"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, invalid, type ActionResult } from "@/lib/action-result";
import { getUser } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { log } from "@/lib/utils/log";
import { addressSchema, nameField, phoneField } from "@/lib/validation/common";

// Account mutations run with the user's own session: RLS guarantees they can only touch
// their own profile, addresses and wishlist.

const SIGNED_OUT = "Your session has expired. Please sign in again.";

const profileSchema = z.object({
  fullName: nameField,
  phone: z.union([z.literal(""), phoneField]).transform((v) => v || null),
});

export async function updateProfileAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return failure(SIGNED_OUT);
  const parsed = profileSchema.safeParse({ fullName: formData.get("fullName"), phone: formData.get("phone") ?? "" });
  if (!parsed.success) return invalid(parsed.error);
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("profiles").update({ full_name: parsed.data.fullName, phone: parsed.data.phone }).eq("id", user.id);
  if (error) {
    log.error("account.profile", error);
    return failure("We could not save your profile. Please try again.");
  }
  revalidatePath("/account", "layout");
  return { ok: true, message: "Profile saved." };
}

export async function saveAddressAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return failure(SIGNED_OUT);
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const id = z.uuid().safeParse(formData.get("id"));
  const makeDefault = formData.get("isDefault") === "on";

  const supabase = await createServerSupabase();
  const row = {
    user_id: user.id,
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
    line1: parsed.data.line1,
    line2: parsed.data.line2,
    area: parsed.data.area,
    city: parsed.data.city,
    state: parsed.data.state,
    pincode: parsed.data.pincode,
    landmark: parsed.data.landmark,
  };

  const { count } = await supabase.from("addresses").select("id", { count: "exact", head: true });
  const shouldBeDefault = makeDefault || (count ?? 0) === 0;
  if (shouldBeDefault) await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);

  const result = id.success
    ? await supabase.from("addresses").update({ ...row, is_default: shouldBeDefault || undefined }).eq("id", id.data)
    : await supabase.from("addresses").insert({ ...row, is_default: shouldBeDefault });
  if (result.error) {
    log.error("account.address.save", result.error);
    return failure("We could not save this address. Please try again.");
  }
  revalidatePath("/account/profile");
  revalidatePath("/checkout");
  return { ok: true, message: "Address saved." };
}

export async function deleteAddressAction(addressId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return failure(SIGNED_OUT);
  const id = z.uuid().safeParse(addressId);
  if (!id.success) return failure("Invalid address.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("addresses").delete().eq("id", id.data);
  if (error) return failure("We could not delete this address.");
  revalidatePath("/account/profile");
  return { ok: true, message: "Address deleted." };
}

export async function setDefaultAddressAction(addressId: string): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return failure(SIGNED_OUT);
  const id = z.uuid().safeParse(addressId);
  if (!id.success) return failure("Invalid address.");
  const supabase = await createServerSupabase();
  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id).eq("is_default", true);
  const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", id.data);
  if (error) return failure("We could not update your default address.");
  revalidatePath("/account/profile");
  return { ok: true };
}

export async function toggleWishlistAction(productId: string): Promise<ActionResult<{ saved: boolean }>> {
  const user = await getUser();
  if (!user) return failure("Sign in to save books to your wishlist.");
  const id = z.uuid().safeParse(productId);
  if (!id.success) return failure("Invalid book.");
  const supabase = await createServerSupabase();
  const { data: existing } = await supabase.from("wishlists").select("product_id").eq("product_id", id.data).maybeSingle();
  const { error } = existing
    ? await supabase.from("wishlists").delete().eq("user_id", user.id).eq("product_id", id.data)
    : await supabase.from("wishlists").insert({ user_id: user.id, product_id: id.data });
  if (error) return failure("We could not update your wishlist.");
  revalidatePath("/account/wishlist");
  return { ok: true, data: { saved: !existing }, message: existing ? "Removed from wishlist" : "Saved to wishlist" };
}
