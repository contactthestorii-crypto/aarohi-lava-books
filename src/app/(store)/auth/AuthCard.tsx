import type { ReactNode } from "react";

export function AuthCard({ title, description, children, footer }: { title: string; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="container-page flex justify-center py-10 md:py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 text-[15px] text-muted">{description}</p> : null}
        <div className="mt-6 rounded-[var(--radius-card)] border border-line p-5 sm:p-6">{children}</div>
        {footer ? <div className="mt-5 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </div>
  );
}
