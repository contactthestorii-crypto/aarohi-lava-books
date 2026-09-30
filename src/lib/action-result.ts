import type { z } from "zod";

/** Uniform result for Server Actions consumed by forms (useActionState). */
export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const initialActionState = { ok: false, error: "" } as ActionResult;

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}

export function invalid(error: z.ZodError, message = "Please check the highlighted fields."): ActionResult<never> {
  return { ok: false, error: message, fieldErrors: fieldErrorsFrom(error) };
}

export function failure(error: string): ActionResult<never> {
  return { ok: false, error };
}
