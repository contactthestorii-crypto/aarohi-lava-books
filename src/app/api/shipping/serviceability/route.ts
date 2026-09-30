import { NextResponse, type NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITED_MESSAGE } from "@/lib/rate-limit";
import { getShippingProvider, ShippingProviderError } from "@/lib/shipping";
import { log } from "@/lib/utils/log";
import { getSettings } from "@/services/settings";

const DEFAULT_WEIGHT_GRAMS = 500;

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode") ?? "";
  if (!/^[1-9]\d{5}$/.test(pincode)) {
    return NextResponse.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });
  }
  if (!(await checkRateLimit("pincode"))) return NextResponse.json({ error: RATE_LIMITED_MESSAGE }, { status: 429 });

  const [settings, provider] = [await getSettings(), getShippingProvider()];
  try {
    const result = await provider.checkServiceability(pincode, { weightGrams: DEFAULT_WEIGHT_GRAMS, cod: settings.cod.enabled });
    const codAvailable = settings.cod.enabled ? result.codAvailable : false;

    if (result.serviceable === null) {
      return NextResponse.json({
        serviceable: true,
        message: settings.shipping.delivery_note || `We will confirm the courier for ${pincode} when your order is packed.`,
        codAvailable: settings.cod.enabled ? null : false,
        estimate: null,
      });
    }
    if (!result.serviceable) {
      return NextResponse.json({
        serviceable: false,
        message: `Sorry, our courier partners do not deliver to ${pincode} yet.`,
        codAvailable: false,
        estimate: null,
      });
    }
    return NextResponse.json({
      serviceable: true,
      message: `Delivery available to ${pincode}.`,
      codAvailable,
      estimate: result.estimatedDays ? `Usually delivered in about ${result.estimatedDays} ${result.estimatedDays === 1 ? "day" : "days"} after dispatch.` : null,
    });
  } catch (error) {
    log.error("api.shipping.serviceability", error, { provider: provider.name });
    const message = error instanceof ShippingProviderError ? error.userMessage : "Could not check this pincode right now.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
