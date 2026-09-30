import { Package } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { TrackOrderForm } from "@/components/orders/TrackOrderForm";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status and courier tracking of your Aarohi Lava Publications order.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return (
    <div className="container-page py-10 md:py-16">
      <div className="mx-auto grid max-w-4xl gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
        <div>
          <Package size={40} className="text-red-600" />
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Track your order</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Enter the order ID from your confirmation email or page, and the mobile number or email you used at checkout.
          </p>
          <p className="mt-4 text-sm text-muted">
            Signed in?{" "}
            <Link href="/account/orders" className="font-semibold text-navy-700 hover:underline">
              See all your orders
            </Link>
          </p>
        </div>
        <div className="rounded-[var(--radius-card)] border border-line p-5 sm:p-6">
          <TrackOrderForm />
        </div>
      </div>
    </div>
  );
}
