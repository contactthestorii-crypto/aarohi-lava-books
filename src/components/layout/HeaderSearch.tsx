"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { formatPaise } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

export interface SearchSuggestion {
  slug: string;
  title: string;
  author: string | null;
  pricePaise: number | null;
  coverUrl: string | null;
}

type Status = "idle" | "loading" | "done" | "error";

/** Search box with debounced suggestions (title, author, ISBN, category, exam). */
export function HeaderSearch({ autoFocus = false, onNavigate, className }: { autoFocus?: boolean; onNavigate?: () => void; className?: string }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapper = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(String(response.status));
        const body = (await response.json()) as { items: SearchSuggestion[] };
        setResults(body.items);
        setStatus("done");
        setActive(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setStatus("error");
      }
    }, 200);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (wrapper.current && !wrapper.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  const term = query.trim();
  const showPanel = open && term.length >= 2;

  return (
    <form
      ref={wrapper}
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (active >= 0 && results[active]) return go(`/books/${results[active].slug}`);
        if (term) go(`/search?q=${encodeURIComponent(term)}`);
      }}
    >
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search books
      </label>
      <MagnifyingGlass size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        id={`${listId}-input`}
        type="search"
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder="Search by title, author, ISBN or exam…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (event.target.value.trim().length < 2) {
            setResults([]);
            setStatus("idle");
          }
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (!showPanel) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, -1));
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-navy-50 pl-10 pr-3 text-[15px] text-ink placeholder:text-muted focus:border-navy-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-700/20"
      />
      {showPanel ? (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-overlay)]">
          {status === "loading" && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">Searching…</p>
          ) : status === "error" ? (
            <p className="px-4 py-3 text-sm text-danger">Search is unavailable right now. Please try again.</p>
          ) : results.length === 0 && status === "done" ? (
            <p className="px-4 py-3 text-sm text-muted">No books match &ldquo;{term}&rdquo;. Try an exam name like TSLPRB or a subject.</p>
          ) : (
            <ul id={listId} role="listbox" className="max-h-96 overflow-y-auto py-1">
              {results.map((item, index) => (
                <li key={item.slug} id={`${listId}-${index}`} role="option" aria-selected={index === active}>
                  <Link
                    href={`/books/${item.slug}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={cn("flex items-center gap-3 px-3 py-2 hover:bg-navy-50", index === active && "bg-navy-50")}
                  >
                    <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-navy-50">
                      {item.coverUrl ? <Image src={item.coverUrl} alt="" fill sizes="40px" className="object-contain" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-semibold text-ink">{item.title}</span>
                      {item.author ? <span className="line-clamp-1 text-xs text-muted">{item.author}</span> : null}
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                      {item.pricePaise !== null ? formatPaise(item.pricePaise) : ""}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="submit"
                  className="w-full border-t border-line px-4 py-2.5 text-left text-sm font-semibold text-navy-700 hover:bg-navy-50"
                >
                  See all results for &ldquo;{term}&rdquo;
                </button>
              </li>
            </ul>
          )}
        </div>
      ) : null}
    </form>
  );
}
