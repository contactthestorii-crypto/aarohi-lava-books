import "server-only";
import { shippingProviderName } from "@/lib/env";
import { manualProvider } from "./manual";
import { shiprocketProvider } from "./shiprocket";
import type { ShippingProvider } from "./types";

export * from "./types";
export { mapShiprocketStatus, shouldAdvanceStatus } from "./status-map";

const providers: Record<string, ShippingProvider> = {
  manual: manualProvider,
  shiprocket: shiprocketProvider,
};

/** Active provider from SHIPPING_PROVIDER. Falls back to manual if Shiprocket lacks credentials. */
export function getShippingProvider(): ShippingProvider {
  const selected = providers[shippingProviderName()] ?? manualProvider;
  return selected.isConfigured() ? selected : manualProvider;
}

export function getShippingProviderByName(name: string): ShippingProvider | null {
  return providers[name] ?? null;
}
