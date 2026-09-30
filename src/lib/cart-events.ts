/** Dispatched on window after any cart mutation so the header badge refreshes. */
export const CART_UPDATED_EVENT = "cart:updated";

export function notifyCartUpdated() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}
