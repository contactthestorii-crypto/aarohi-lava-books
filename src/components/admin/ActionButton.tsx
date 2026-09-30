"use client";

import { useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult } from "@/lib/action-result";

/** Button that runs a server action, shows the result as a toast and refreshes the page. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "secondary",
  size = "sm",
  icon,
  className,
}: {
  action: () => Promise<ActionResult<unknown>>;
  children: ReactNode;
  confirm?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant={variant}
      size={size}
      icon={icon}
      loading={pending}
      className={className}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            if (result.message) toast.show(result.message);
          } else {
            toast.show(result.error, "error");
          }
          router.refresh();
        });
      }}
    >
      {children}
    </Button>
  );
}
