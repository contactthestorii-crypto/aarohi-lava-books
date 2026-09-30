"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** "modal" is centred; "drawer-left" / "drawer-right" slide from the side. */
  variant?: "modal" | "drawer-left" | "drawer-right";
  footer?: ReactNode;
  className?: string;
};

/**
 * Native <dialog> gives focus trapping, Esc to close and inert background for free.
 * Used by Modal, Drawer, mobile menu and admin confirmations.
 */
export function Dialog({ open, onClose, title, children, variant = "modal", footer, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const position =
    variant === "modal"
      ? "m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-card)]"
      : cn(
          "my-0 h-dvh max-h-dvh w-[min(24rem,88vw)]",
          variant === "drawer-left" ? "ml-0 mr-auto" : "ml-auto mr-0",
        );

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      aria-label={title}
      className={cn(
        "max-w-none bg-white p-0 text-ink shadow-[var(--shadow-overlay)] backdrop:bg-ink/50",
        position,
        className,
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 inline-flex size-10 items-center justify-center rounded-[var(--radius-control)] text-muted hover:bg-navy-50 hover:text-ink"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4">{footer}</div> : null}
      </div>
    </dialog>
  );
}
