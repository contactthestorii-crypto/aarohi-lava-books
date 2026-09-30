"use client";

import { CaretDown } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Category } from "@/types";

const GROUPS: { kind: Category["kind"]; label: string }[] = [
  { kind: "exam", label: "Exams" },
  { kind: "type", label: "Book type" },
  { kind: "subject", label: "Subjects" },
];

export function CategoryMenu({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-11 items-center gap-1 rounded-[var(--radius-control)] px-3 text-sm font-semibold text-ink hover:bg-navy-50"
      >
        Categories
        <CaretDown size={14} weight="bold" className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-2 grid w-[40rem] grid-cols-3 gap-6 rounded-[var(--radius-card)] border border-line bg-white p-5 shadow-[var(--shadow-overlay)]">
          {categories.length === 0 ? (
            <p className="col-span-3 text-sm text-muted">Categories will appear here once the catalog is set up.</p>
          ) : (
            GROUPS.map((group) => {
              const items = categories.filter((c) => c.kind === group.kind);
              if (items.length === 0) return null;
              return (
                <div key={group.kind}>
                  <p className="mb-2 text-xs font-bold text-muted">{group.label}</p>
                  <ul className="space-y-0.5">
                    {items.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/categories/${category.slug}`}
                          onClick={() => setOpen(false)}
                          className="-mx-2 block rounded-md px-2 py-1.5 text-sm text-ink hover:bg-navy-50 hover:text-navy-700"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
