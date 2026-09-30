"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Re-renders the page periodically while a payment confirmation may still arrive by webhook. */
export function AutoRefresh({ intervalMs = 10_000, maxMs = 180_000 }: { intervalMs?: number; maxMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started > maxMs) window.clearInterval(timer);
      else router.refresh();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [router, intervalMs, maxMs]);
  return null;
}
