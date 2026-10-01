import {
  ArrowsClockwise,
  CreditCard,
  SealCheck,
  Truck,
} from "@phosphor-icons/react/ssr";

const USPS = [
  {
    icon: SealCheck,
    title: "Direct from Publisher",
    subtitle: "100% genuine print runs, verified syllabus and latest 2026 revisions.",
    color: "text-red-600 bg-red-50",
  },
  {
    icon: Truck,
    title: "Express Dispatch",
    subtitle: "Dispatched within 24-48 hours with real-time SMS & courier tracking.",
    color: "text-navy-700 bg-navy-50",
  },
  {
    icon: CreditCard,
    title: "Secure Razorpay Checkout",
    subtitle: "Instant UPI (GPay/PhonePe), Debit/Credit cards and Net Banking.",
    color: "text-emerald-700 bg-emerald-50",
  },
  {
    icon: ArrowsClockwise,
    title: "Assured Delivery Support",
    subtitle: "Dedicated support team for any order or delivery status queries.",
    color: "text-amber-700 bg-amber-50",
  },
];

export function EcommerceUspStrip() {
  return (
    <section aria-label="Store Benefits" className="border-y border-line bg-white py-8">
      <div className="container-page">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {USPS.map(({ icon: Icon, title, subtitle, color }) => (
            <li
              key={title}
              className="group flex items-start gap-3.5 rounded-xl p-2 transition-colors hover:bg-navy-50/50"
            >
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${color} shadow-sm transition-transform duration-200 group-hover:scale-105`}
              >
                <Icon size={24} weight="duotone" />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-ink">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{subtitle}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
