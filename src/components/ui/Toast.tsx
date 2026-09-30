"use client";

import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ToastTone = "success" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };

type ToastContextValue = { show: (message: string, tone?: ToastTone) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = Date.now() + Math.random();
      setItems((current) => [...current.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:px-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            role={item.tone === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius-card)] border bg-white px-4 py-3 text-sm shadow-[var(--shadow-overlay)]",
              item.tone === "error" ? "border-danger/30" : "border-line",
            )}
          >
            {item.tone === "error" ? (
              <WarningCircle size={20} weight="fill" className="shrink-0 text-danger" />
            ) : (
              <CheckCircle size={20} weight="fill" className="shrink-0 text-success" />
            )}
            <p className="flex-1 text-ink">{item.message}</p>
            <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss" className="text-muted hover:text-ink">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
