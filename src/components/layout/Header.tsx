import { Package, ShieldCheck, User } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { getActiveBanners, getCategories } from "@/services/catalog";
import { getSettings } from "@/services/settings";
import type { Banner, Category } from "@/types";
import { CartButton } from "./CartButton";
import { CategoryMenu } from "./CategoryMenu";
import { HeaderSearch } from "./HeaderSearch";
import { MobileNav } from "./MobileNav";

async function loadHeaderData(): Promise<{ categories: Category[]; announcement: Banner | null }> {
  try {
    const [categories, banners] = await Promise.all([getCategories(), getActiveBanners("announcement")]);
    return { categories, announcement: banners[0] ?? null };
  } catch {
    return { categories: [], announcement: null };
  }
}

export async function Header() {
  const [{ categories, announcement }, settings] = await Promise.all([loadHeaderData(), getSettings()]);

  return (
    <>
      {/* Top E-Commerce Announcement Bar */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white print:hidden border-b border-white/10">
        <div className="container-page flex items-center justify-between py-1.5 text-[12px] font-medium sm:text-[13px]">
          <div className="mx-auto flex items-center gap-2 text-center sm:mx-0">
            <span className="inline-flex size-2 rounded-full bg-gold-400 animate-pulse" />
            <span>
              {announcement ? (
                <>
                  {announcement.title}
                  {announcement.linkUrl ? (
                    <Link
                      href={announcement.linkUrl}
                      className="ml-2 font-bold text-gold-400 underline-offset-2 hover:underline"
                    >
                      {announcement.linkLabel || "Learn more"}
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <span className="font-bold text-gold-400">2026 Target Police Edition:</span> Official General Studies 360° Solved Papers Available Now
                </>
              )}
            </span>
          </div>

          <div className="hidden items-center gap-4 text-xs text-navy-200 sm:flex">
            <span className="flex items-center gap-1">
              <ShieldCheck size={14} className="text-emerald-400" /> Direct from Publisher
            </span>
            <span className="text-white/20">|</span>
            <Link href="/track-order" className="hover:text-white">
              Track Order
            </Link>
            <span className="text-white/20">|</span>
            <Link href="/contact" className="hover:text-white">
              Helpdesk
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-30 print:hidden border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 shadow-xs">
        <div className="container-page flex h-16 items-center gap-2 lg:h-[72px] lg:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${settings.store.name} home`}>
            <Image
              src="/brand/aarohi-lava-logo.png"
              alt={`${settings.store.name} Logo`}
              width={64}
              height={64}
              priority
              className="size-10 rounded-lg object-contain drop-shadow-sm lg:size-12"
            />
            <span translate="no" className="hidden flex-col leading-none sm:flex">
              <span className="font-display-condensed text-lg font-extrabold uppercase tracking-tight text-navy-900">
                {settings.store.short_name}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Official Bookstore</span>
            </span>
          </Link>

          <nav aria-label="Main" className="ml-2 hidden items-center lg:flex">
            <Link
              href="/books"
              className="inline-flex h-10 items-center rounded-[var(--radius-control)] px-3 text-sm font-bold text-ink hover:bg-navy-50"
            >
              All Books
            </Link>
            <CategoryMenu categories={categories} />
          </nav>

          <HeaderSearch className="mx-2 hidden flex-1 md:block lg:max-w-xl" />

          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/track-order"
              className="hidden h-10 items-center gap-2 rounded-[var(--radius-control)] px-2.5 text-xs font-bold text-ink hover:bg-navy-50 lg:inline-flex"
            >
              <Package size={20} className="text-navy-700" />
              <span className="hidden xl:inline">Track Order</span>
              <span className="sr-only xl:hidden">Track order</span>
            </Link>
            <Link
              href="/account"
              className="hidden h-10 items-center gap-2 rounded-[var(--radius-control)] px-2.5 text-xs font-bold text-ink hover:bg-navy-50 lg:inline-flex"
            >
              <User size={20} className="text-navy-700" />
              <span className="hidden xl:inline">Account</span>
              <span className="sr-only xl:hidden">Account</span>
            </Link>
            <CartButton />
            <MobileNav categories={categories} />
          </div>
        </div>
      </header>
    </>
  );
}

