"use client";

import { List, MagnifyingGlass, Package, User, BookOpen, Question, Phone } from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import type { Category } from "@/types";
import { HeaderSearch } from "./HeaderSearch";

/** Mobile header controls: search overlay and the menu drawer. */
export function MobileNav({ categories }: { categories: Category[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const exams = categories.filter((c) => c.kind === "exam");
  const others = categories.filter((c) => c.kind !== "exam");

  const primary = [
    { href: "/books", label: "All books", icon: BookOpen },
    { href: "/track-order", label: "Track order", icon: Package },
    { href: "/account", label: "My account", icon: User },
    { href: "/faq", label: "FAQ", icon: Question },
    { href: "/contact", label: "Contact", icon: Phone },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        aria-label="Search books"
        className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-ink hover:bg-navy-50 lg:hidden"
      >
        <MagnifyingGlass size={24} />
      </button>
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open menu"
        className="inline-flex size-11 items-center justify-center rounded-[var(--radius-control)] text-ink hover:bg-navy-50 lg:hidden"
      >
        <List size={24} />
      </button>

      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} title="Search books" className="mt-4 mb-auto">
        <HeaderSearch autoFocus onNavigate={() => setSearchOpen(false)} />
        <p className="mt-3 text-sm text-muted">Try &ldquo;Target Police&rdquo;, &ldquo;TSLPRB&rdquo; or an ISBN.</p>
      </Dialog>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu" variant="drawer-right">
        <nav aria-label="Mobile" className="-mx-2 flex flex-col">
          {primary.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-[var(--radius-control)] px-2 py-3 text-[15px] font-semibold text-ink hover:bg-navy-50"
            >
              <Icon size={20} className="text-navy-700" />
              {label}
            </Link>
          ))}
        </nav>
        {exams.length > 0 ? (
          <div className="mt-5 border-t border-line pt-5">
            <p className="mb-2 text-xs font-bold text-muted">Exams</p>
            <div className="flex flex-wrap gap-2">
              {exams.map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold text-navy-900 hover:border-navy-700"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {others.length > 0 ? (
          <div className="mt-5 border-t border-line pt-5">
            <p className="mb-2 text-xs font-bold text-muted">Subjects and book types</p>
            <ul className="grid grid-cols-2 gap-x-3">
              {others.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 text-sm text-ink hover:text-navy-700"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
