"use client";

import {
  BookOpen,
  ChartBar,
  ChatCircleText,
  CreditCard,
  Gear,
  List,
  Megaphone,
  Package,
  Question,
  SealPercent,
  Star,
  Storefront,
  Tag,
  Truck,
  Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Dialog } from "@/components/ui/Dialog";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: ChartBar },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/books", label: "Books & stock", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/coupons", label: "Coupons", icon: SealPercent },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/shipping", label: "Shipping", icon: Truck },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/banners", label: "Banners", icon: Megaphone },
  { href: "/admin/faqs", label: "FAQs", icon: Question },
  { href: "/admin/messages", label: "Messages", icon: ChatCircleText },
  { href: "/admin/settings", label: "Settings", icon: Gear },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '';
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm font-semibold",
              active ? "bg-white/10 text-white" : "text-navy-200 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children, userEmail }: { children: ReactNode; userEmail: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-navy-50 print:block print:bg-white lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden bg-ink p-4 print:!hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <Link href="/admin" className="mb-6 px-3 font-display-condensed text-xl font-extrabold uppercase text-white">
          Aarohi Lava <span className="text-gold-400">Admin</span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <Link href="/" className="mt-4 flex items-center gap-2 px-3 py-2 text-sm text-navy-200 hover:text-white">
          <Storefront size={18} /> View store
        </Link>
        <p className="truncate px-3 text-xs text-navy-200">{userEmail}</p>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 print:hidden items-center justify-between border-b border-line bg-white px-4 lg:hidden">
          <Link href="/admin" className="font-display-condensed text-lg font-extrabold uppercase text-navy-900">
            Admin
          </Link>
          <button type="button" onClick={() => setOpen(true)} aria-label="Open admin menu" className="inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] hover:bg-navy-50">
            <List size={22} />
          </button>
        </header>
        <Dialog open={open} onClose={() => setOpen(false)} title="Admin" variant="drawer-left" className="bg-ink text-white [&_h2]:text-white">
          <NavLinks onNavigate={() => setOpen(false)} />
        </Dialog>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
