import "server-only";
import { isProductionDeployment, paymentProviderName } from "@/lib/env";
import { mockProvider } from "./mock";
import { razorpayProvider } from "./razorpay";
import { PaymentError, type PaymentProvider } from "./types";

export * from "./types";

/** Active gateway. The mock gateway can never run on a production deployment. */
export function getPaymentProvider(): PaymentProvider {
  if (paymentProviderName() === "mock") {
    if (isProductionDeployment) {
      throw new PaymentError("PAYMENT_PROVIDER=mock is not allowed in production", "Online payments are not available right now.");
    }
    return mockProvider;
  }
  return razorpayProvider;
}

export function getPaymentProviderByName(name: string): PaymentProvider | null {
  if (name === "razorpay") return razorpayProvider;
  if (name === "mock" && !isProductionDeployment) return mockProvider;
  return null;
}
