import { WarningCircle } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { CheckoutClient, type CheckoutItem } from "@/components/checkout/CheckoutClient";
import { ErrorState } from "@/components/ui/States";
import { getProfile } from "@/lib/auth";
import { paymentProviderName } from "@/lib/env";
import { getPaymentProvider } from "@/lib/payments";
import { createServerSupabase } from "@/lib/supabase/server";
import { log } from "@/lib/utils/log";
import { getCart } from "@/services/cart";
import { mapAddress, type AddressRow } from "@/services/mappers";
import { getFreshSettings } from "@/services/settings";
import type { Address } from "@/types";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };
export const dynamic = "force-dynamic";

function onlinePaymentsAvailable(): boolean {
  try {
    return getPaymentProvider().isConfigured();
  } catch {
    return false;
  }
}

async function loadCheckout() {
  try {
    const [cart, settings, profile] = await Promise.all([getCart(), getFreshSettings(), getProfile().catch(() => null)]);
    if (cart.lines.length === 0 || cart.hasIssues) redirect("/cart");
    if (!profile && !settings.checkout.allow_guest) redirect("/auth/login?next=/checkout");

    let addresses: Address[] = [];
    if (profile) {
      try {
        const { data } = await (await createServerSupabase())
          .from("addresses")
          .select("id, full_name, phone, line1, line2, area, city, state, pincode, landmark, is_default")
          .order("is_default", { ascending: false });
        addresses = ((data ?? []) as AddressRow[]).map(mapAddress);
      } catch {
        addresses = [];
      }
    }
    return { cart, settings, profile, addresses };
  } catch (error) {
    unstable_rethrow(error); // let redirect() through
    log.error("page.checkout", error);
    return null;
  }
}

export default async function CheckoutPage() {
  const data = await loadCheckout();
  if (!data) {
    return (
      <div className="container-page py-10">
        <ErrorState icon={<WarningCircle />} title="Checkout is unavailable right now" description="Please refresh the page in a moment. Your cart is saved." />
      </div>
    );
  }
  const { cart, settings, profile, addresses } = data;
  const items: CheckoutItem[] = cart.lines.map((line) => ({
    productId: line.product.id,
    title: line.product.title,
    quantity: line.quantity,
    lineTotalPaise: line.lineTotalPaise,
    coverUrl: line.product.cover?.url ?? null,
  }));

  return (
    <div className="container-page py-6 md:py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Checkout</h1>
      <div className="mt-6">
        <CheckoutClient
          items={items}
          initialQuote={cart.quote}
          couponCode={cart.couponCode}
          contact={{ fullName: profile?.fullName ?? "", email: profile?.email ?? "", phone: profile?.phone ?? "" }}
          addresses={addresses}
          isSignedIn={Boolean(profile)}
          codEnabled={settings.cod.enabled}
          codFeePaise={settings.cod.fee_paise}
          onlineAvailable={onlinePaymentsAvailable()}
          testPayments={paymentProviderName() === "mock"}
          taxLabel={settings.tax.label}
          deliveryNote={settings.shipping.delivery_note}
        />
      </div>
    </div>
  );
}
