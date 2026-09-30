import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const controlBase =
  "w-full rounded-[var(--radius-control)] border bg-white px-3 text-[15px] text-ink placeholder:text-muted/80 transition-colors focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-700/20 disabled:bg-navy-50 disabled:text-muted";

function controlClass(invalid: boolean, className?: string) {
  return cn(controlBase, invalid ? "border-danger" : "border-line", className);
}

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label above, control, then hint or error below (docs/DESIGN.md forms). */
export function Field({ label, htmlFor, error, hint, required, children, className }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = ComponentProps<"input"> & { invalid?: boolean };

export function Input({ invalid = false, className, id, ...props }: InputProps) {
  // Emails, codes and IDs should not be "corrected" by the browser.
  const noSpellcheck = props.type === "email" || props.autoCapitalize === "characters" || props.name === "pincode";
  return (
    <input
      id={id}
      spellCheck={noSpellcheck ? false : props.spellCheck}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={controlClass(invalid, cn("h-11", className))}
      {...props}
    />
  );
}

type TextareaProps = ComponentProps<"textarea"> & { invalid?: boolean };

export function Textarea({ invalid = false, className, id, ...props }: TextareaProps) {
  return (
    <textarea
      id={id}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && id ? `${id}-error` : undefined}
      className={controlClass(invalid, cn("min-h-28 py-2.5", className))}
      {...props}
    />
  );
}

type SelectProps = ComponentProps<"select"> & { invalid?: boolean };

export function Select({ invalid = false, className, id, children, ...props }: SelectProps) {
  return (
    <select
      id={id}
      aria-invalid={invalid || undefined}
      className={controlClass(invalid, cn("h-11 appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9", className))}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath fill='%234b5673' d='M213.7 101.7l-80 80a8 8 0 0 1-11.4 0l-80-80a8 8 0 0 1 11.4-11.4L128 164.7l74.3-74.4a8 8 0 0 1 11.4 11.4Z'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...props }: ComponentProps<"input"> & { label: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5 text-[15px]", className)}>
      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-navy-900" {...props} />
      <span>{label}</span>
    </label>
  );
}
