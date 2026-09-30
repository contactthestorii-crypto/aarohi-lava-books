import { Package, User } from "@phosphor-icons/react/ssr";
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
      {announcement ? (
        <div className="bg-navy-900 text-white print:hidden">
          <p className="container-page py-2 text-center text-[13px] font-medium">
            {announcement.title}
            {announcement.linkUrl ? (
              <Link href={announcement.linkUrl} className="ml-2 font-bold text-gold-400 underline-offset-2 hover:underline">
                {announcement.linkLabel || "Learn more"}
              </Link>
            ) : null}
          </p>
        </div>
      ) : null}
      <header className="sticky top-0 z-30 print:hidden border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container-page flex h-16 items-center gap-2 lg:h-[72px] lg:gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${settings.store.name} home`}>
            <Image src="/brand/aarohi-lava-logo.png" alt="" width={62} height={47} priority className="h-10 w-auto lg:h-12" />
            <span translate="no" className="hidden flex-col leading-none sm:flex">
              <span className="font-display-condensed text-lg font-extrabold uppercase tracking-tight text-navy-900">
                {settings.store.short_name}
              </span>
              <span className="text-[11px] font-semibold text-muted">Publications</span>
            </span>
          </Link>

          <nav aria-label="Main" className="ml-2 hidden items-center lg:flex">
            <Link href="/books" className="inline-flex h-11 items-center rounded-[var(--radius-control)] px-3 text-sm font-semibold text-ink hover:bg-navy-50">
              Books
            </Link>
            <CategoryMenu categories={categories} />
          </nav>

          <HeaderSearch className="mx-2 hidden flex-1 lg:block lg:max-w-xl" />

          <div className="ml-auto flex items-center gap-0.5">
            <Link
              href="/track-order"
              className="hidden h-11 items-center gap-2 rounded-[var(--radius-control)] px-2.5 text-sm font-semibold text-ink hover:bg-navy-50 lg:inline-flex"
            >
              <Package size={22} />
              <span className="hidden xl:inline">Track order</span>
              <span className="sr-only xl:hidden">Track order</span>
            </Link>
            <Link
              href="/account"
              className="hidden h-11 items-center gap-2 rounded-[var(--radius-control)] px-2.5 text-sm font-semibold text-ink hover:bg-navy-50 lg:inline-flex"
            >
              <User size={22} />
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
