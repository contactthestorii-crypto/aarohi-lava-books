import type { ShippingProvider } from "./types";
import { ShippingProviderError } from "./types";

/**
 * Manual fulfilment (docs/DECISIONS.md ADR-009): staff book the courier themselves and
 * enter the courier name, AWB and tracking link in the admin. Nothing is automated or
 * invented: serviceability is "unknown" and tracking comes from admin-entered events.
 */
export const manualProvider: ShippingProvider = {
  name: "manual",
  automated: false,
  isConfigured: () => true,
  async checkServiceability() {
    return { serviceable: null, codAvailable: null, estimatedDays: null, courierName: null };
  },
  async createShipment() {
    throw new ShippingProviderError(
      "Manual provider cannot create shipments",
      "Automatic shipment creation is not enabled. Enter the courier and AWB manually.",
    );
  },
  async track() {
    throw new ShippingProviderError("Manual provider has no tracking API", "Live tracking is not available for this shipment.");
  },
  async cancel() {
    // Nothing to cancel remotely; the admin cancels with the courier directly.
  },
};
