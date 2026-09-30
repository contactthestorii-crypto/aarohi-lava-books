"use client";

import { useEffect, type RefObject } from "react";

/** After a failed submit, moves focus to the first invalid field inside `container`. */
export function useFocusFirstError(container: RefObject<HTMLElement | null>, trigger: unknown) {
  useEffect(() => {
    const first = container.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    first?.focus();
  }, [container, trigger]);
}
