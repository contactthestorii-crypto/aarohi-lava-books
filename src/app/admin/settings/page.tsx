import type { Metadata } from "next";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { SettingsSection } from "@/components/admin/ContentForms";
import { paiseToRupeesInput } from "@/lib/utils/money";
import { getFreshSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const s = await getFreshSettings();
  const money = (v: number | null) => paiseToRupeesInput(v);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Settings" description="Store details, delivery charges, cash on delivery and tax." />

      <AdminCard title="Store details">
        <SettingsSection
          section="store"
          fields={[
            { name: "name", label: "Store name", type: "text", value: s.store.name },
            { name: "short_name", label: "Short name (header)", type: "text", value: s.store.short_name },
            { name: "tagline", label: "Tagline", type: "text", value: s.store.tagline },
            { name: "support_email", label: "Support email", type: "email", value: s.store.support_email },
            { name: "support_phone", label: "Support phone", type: "tel", value: s.store.support_phone },
            { name: "whatsapp", label: "WhatsApp number", type: "tel", value: s.store.whatsapp },
            { name: "business_hours", label: "Business hours", type: "text", value: s.store.business_hours },
            { name: "address", label: "Business address (shown on invoices and contact page)", type: "textarea", value: s.store.address },
          ]}
        />
      </AdminCard>

      <AdminCard title="Homepage">
        <SettingsSection
          section="home"
          fields={[
            { name: "hero_title", label: "Headline", type: "text", value: s.home.hero_title },
            { name: "hero_subtitle", label: "Supporting line (keep it under 20 words)", type: "textarea", value: s.home.hero_subtitle },
          ]}
        />
      </AdminCard>

      <AdminCard title="Delivery charges">
        <SettingsSection
          section="shipping"
          fields={[
            { name: "flat_fee_paise", label: "Shipping fee per order", type: "money", value: money(s.shipping.flat_fee_paise), hint: "0 for free shipping on every order" },
            { name: "free_above_paise", label: "Free shipping above", type: "money", value: money(s.shipping.free_above_paise), hint: "Empty = no threshold" },
            { name: "delivery_note", label: "Delivery note shown at checkout and pincode check", type: "textarea", value: s.shipping.delivery_note },
            { name: "default_book_weight_grams", label: "Default book weight (g) for courier booking", type: "number", value: String(s.shipping.default_book_weight_grams) },
            { name: "package_length_cm", label: "Parcel length (cm)", type: "number", value: String(s.shipping.package_length_cm) },
            { name: "package_breadth_cm", label: "Parcel breadth (cm)", type: "number", value: String(s.shipping.package_breadth_cm) },
            { name: "package_height_cm", label: "Parcel height (cm)", type: "number", value: String(s.shipping.package_height_cm) },
            { name: "reviewed", label: "I have reviewed these delivery charges", type: "checkbox", value: s.shipping.reviewed },
          ]}
        />
      </AdminCard>

      <AdminCard title="Cash on delivery">
        <SettingsSection
          section="cod"
          fields={[
            { name: "enabled", label: "Offer cash on delivery", type: "checkbox", value: s.cod.enabled },
            { name: "fee_paise", label: "COD fee", type: "money", value: money(s.cod.fee_paise) },
            { name: "max_order_paise", label: "Maximum order value for COD", type: "money", value: money(s.cod.max_order_paise), hint: "Empty = no limit" },
          ]}
        />
      </AdminCard>

      <AdminCard title="Tax (GST)">
        <p className="mb-4 text-sm text-muted">Printed books are generally exempt from GST in India. Confirm with your accountant before enabling tax.</p>
        <SettingsSection
          section="tax"
          fields={[
            { name: "enabled", label: "Charge / show tax", type: "checkbox", value: s.tax.enabled },
            { name: "rate_bps", label: "Tax rate", type: "percent", value: String(s.tax.rate_bps / 100) },
            { name: "prices_include_tax", label: "Book prices already include tax", type: "checkbox", value: s.tax.prices_include_tax },
            { name: "label", label: "Tax label", type: "text", value: s.tax.label },
            { name: "gstin", label: "GSTIN (printed on invoices)", type: "text", value: s.tax.gstin },
          ]}
        />
      </AdminCard>

      <div className="grid gap-6 md:grid-cols-3">
        <AdminCard title="Checkout">
          <SettingsSection section="checkout" fields={[{ name: "allow_guest", label: "Allow guest checkout", type: "checkbox", value: s.checkout.allow_guest }]} />
        </AdminCard>
        <AdminCard title="Reviews">
          <SettingsSection
            section="reviews"
            fields={[
              { name: "moderation", label: "Approve reviews before publishing", type: "checkbox", value: s.reviews.moderation },
              { name: "verified_only", label: "Only buyers can review", type: "checkbox", value: s.reviews.verified_only },
            ]}
          />
        </AdminCard>
        <AdminCard title="Orders">
          <SettingsSection
            section="orders"
            fields={[{ name: "auto_create_shipment", label: "Create the courier shipment automatically when an order is paid", type: "checkbox", value: s.orders.auto_create_shipment, hint: "Needs Shiprocket" }]}
          />
        </AdminCard>
      </div>
    </div>
  );
}
