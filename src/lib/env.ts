import "server-only";

// Server-only environment access. Secrets are read lazily so the app builds without them;
// each integration reports whether it is configured instead of crashing at import time.

export type PaymentProviderName = "razorpay" | "mock";
export type ShippingProviderName = "shiprocket" | "manual";
export type EmailProviderName = "resend" | "console";

export const isProductionDeployment = process.env.VERCEL_ENV === "production";

function read(name: string): string {
  return (process.env[name] || "").trim();
}

export function serviceRoleKey(): string {
  return read("SUPABASE_SERVICE_ROLE_KEY");
}

export function paymentProviderName(): PaymentProviderName {
  return read("PAYMENT_PROVIDER") === "mock" ? "mock" : "razorpay";
}

export function razorpayConfig() {
  const keyId = read("RAZORPAY_KEY_ID");
  const keySecret = read("RAZORPAY_KEY_SECRET");
  const webhookSecret = read("RAZORPAY_WEBHOOK_SECRET");
  return { keyId, keySecret, webhookSecret, configured: Boolean(keyId && keySecret) };
}

export function shippingProviderName(): ShippingProviderName {
  return read("SHIPPING_PROVIDER") === "shiprocket" ? "shiprocket" : "manual";
}

export function shiprocketConfig() {
  const email = read("SHIPPING_API_KEY");
  const password = read("SHIPPING_API_SECRET");
  const pickupLocation = read("SHIPROCKET_PICKUP_LOCATION");
  const pickupPincode = read("SHIPROCKET_PICKUP_PINCODE");
  const webhookToken = read("SHIPROCKET_WEBHOOK_TOKEN");
  return {
    email,
    password,
    pickupLocation,
    pickupPincode,
    webhookToken,
    configured: Boolean(email && password && pickupLocation && pickupPincode),
  };
}

export function emailProviderName(): EmailProviderName {
  return read("EMAIL_PROVIDER") === "resend" ? "resend" : "console";
}

export function emailConfig() {
  return {
    apiKey: read("EMAIL_API_KEY"),
    from: read("EMAIL_FROM") || "Aarohi Lava Publications <orders@example.com>",
    adminEmail: read("ADMIN_NOTIFICATION_EMAIL"),
  };
}

export function cronSecret(): string {
  return read("CRON_SECRET");
}

/** Integrations running in a development-only mode, shown in the "Test mode" banner. */
export function testModeIntegrations(): string[] {
  const list: string[] = [];
  if (paymentProviderName() === "mock") list.push("payments");
  if (emailProviderName() === "console") list.push("email");
  return list;
}
