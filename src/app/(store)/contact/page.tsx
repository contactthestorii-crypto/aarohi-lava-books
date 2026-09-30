import { Clock, EnvelopeSimple, MapPin, Phone, WhatsappLogo } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { ContactForm } from "@/components/content/ContactForm";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getSettings } from "@/services/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about a book or an order? Contact Aarohi Lava Publications.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const { store } = await getSettings();
  const details = [
    store.support_phone ? { icon: Phone, label: "Phone", value: store.support_phone, href: `tel:${store.support_phone}` } : null,
    store.whatsapp ? { icon: WhatsappLogo, label: "WhatsApp", value: store.whatsapp, href: `https://wa.me/91${store.whatsapp.replace(/\D/g, "").slice(-10)}` } : null,
    store.support_email ? { icon: EnvelopeSimple, label: "Email", value: store.support_email, href: `mailto:${store.support_email}` } : null,
    store.business_hours ? { icon: Clock, label: "Hours", value: store.business_hours } : null,
    store.address ? { icon: MapPin, label: "Address", value: store.address } : null,
  ].filter((d): d is NonNullable<typeof d> => d !== null);

  return (
    <div className="container-page py-8 md:py-12">
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">Contact us</h1>
          <p className="mt-3 max-w-md text-[15px] text-muted">Questions about a book, an order or bulk purchases? Send us a message. For order questions, include your order ID.</p>
          {details.length > 0 ? (
            <ul className="mt-6 space-y-4">
              {details.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex gap-3">
                  <Icon size={22} className="mt-0.5 shrink-0 text-red-600" />
                  <span>
                    <span className="block text-sm text-muted">{label}</span>
                    {href ? (
                      <a href={href} className="font-semibold text-navy-900 hover:underline">
                        {value}
                      </a>
                    ) : (
                      <span className="whitespace-pre-line font-semibold">{value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-[var(--radius-card)] border border-line p-5 sm:p-6">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
