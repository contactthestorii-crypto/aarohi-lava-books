import { EnvelopeSimple, MapPin, Phone, ShieldCheck } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import type { Category } from "@/types";
import { NewsletterForm } from "./NewsletterForm";

const SHOP_LINKS = [
  { href: "/books", label: "All books" },
  { href: "/search", label: "Search" },
  { href: "/track-order", label: "Track order" },
  { href: "/account/orders", label: "My orders" },
];

const HELP_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/shipping-policy", label: "Shipping policy" },
  { href: "/returns", label: "Returns & refunds" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms", label: "Terms & conditions" },
];

export async function Footer() {
  const settings = await getSettings();
  let exams: Category[] = [];
  try {
    exams = (await getCategories("exam")).slice(0, 6);
  } catch {
    exams = [];
  }
  const { store } = settings;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 bg-ink print:hidden text-navy-100">
      <div className="container-page grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-[1fr_1fr_1.4fr] lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/aarohi-lava-logo.png"
              alt={`${store.name} Logo`}
              width={56}
              height={56}
              className="size-14 rounded-xl bg-white p-1 shadow-md object-contain"
            />
            <div>
              <p className="font-display-condensed text-2xl font-extrabold uppercase text-white">{store.name}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-500">Official Publisher</p>
            </div>
          </div>
          {store.tagline ? <p className="mt-3 max-w-xs text-xs text-navy-200">{store.tagline}</p> : null}
          <ul className="mt-5 space-y-2.5 text-sm">
            {store.support_phone ? (
              <li className="flex items-center gap-2.5">
                <Phone size={18} className="text-gold-400" />
                <a href={`tel:${store.support_phone}`} className="hover:text-white">
                  {store.support_phone}
                </a>
              </li>
            ) : null}
            {store.support_email ? (
              <li className="flex items-center gap-2.5">
                <EnvelopeSimple size={18} className="text-gold-400" />
                <a href={`mailto:${store.support_email}`} className="hover:text-white">
                  {store.support_email}
                </a>
              </li>
            ) : null}
            {store.address ? (
              <li className="flex items-start gap-2.5">
                <MapPin size={18} className="mt-0.5 shrink-0 text-gold-400" />
                <span className="whitespace-pre-line">{store.address}</span>
              </li>
            ) : null}
          </ul>
        </div>

        <FooterColumn title="Shop" links={[...SHOP_LINKS, ...exams.map((c) => ({ href: `/categories/${c.slug}`, label: c.name }))]} />
        <FooterColumn title="Help" links={HELP_LINKS} />

        <div className="col-span-2 md:col-span-1">
          <p className="text-sm font-bold text-white">New books and exam updates</p>
          <p className="mt-1 text-sm text-navy-200">Get an email when we publish a new title. No spam.</p>
          <NewsletterForm />
          <p className="mt-6 flex items-center gap-2 text-sm text-navy-200">
            <ShieldCheck size={18} className="text-gold-400" />
            Payments secured by Razorpay
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="container-page py-5 text-xs text-navy-200">
          © {year} {store.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-sm font-bold text-white">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-navy-200 hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
