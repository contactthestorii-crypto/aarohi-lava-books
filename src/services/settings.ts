import "server-only";
import { z } from "zod";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getPublicSupabase } from "@/lib/supabase/public";
import { log } from "@/lib/utils/log";

// Store settings with safe defaults. Values live in public.settings (editable in admin).

const storeSchema = z.object({
  name: z.string().default("Aarohi Lava Publications"),
  short_name: z.string().default("Aarohi Lava"),
  tagline: z.string().default(""),
  support_email: z.string().default(""),
  support_phone: z.string().default(""),
  whatsapp: z.string().default(""),
  address: z.string().default(""),
  business_hours: z.string().default(""),
});

const homeSchema = z.object({
  hero_title: z.string().default("Prepare smarter. Score better."),
  hero_subtitle: z
    .string()
    .default("Exam-focused books and previous question papers for TSLPRB, TGPSC and other competitive examinations."),
});

const shippingSchema = z.object({
  flat_fee_paise: z.number().int().min(0).default(0),
  free_above_paise: z.number().int().min(0).nullable().default(null),
  delivery_note: z.string().default(""),
  reviewed: z.boolean().default(false),
  // Parcel defaults sent to the courier when a book has no weight set (editable in admin).
  default_book_weight_grams: z.number().int().min(50).max(10000).default(500),
  package_length_cm: z.number().min(1).max(200).default(25),
  package_breadth_cm: z.number().min(1).max(200).default(20),
  package_height_cm: z.number().min(1).max(200).default(5),
});

const codSchema = z.object({
  enabled: z.boolean().default(false),
  fee_paise: z.number().int().min(0).default(0),
  max_order_paise: z.number().int().min(0).nullable().default(null),
});

const taxSchema = z.object({
  enabled: z.boolean().default(false),
  rate_bps: z.number().int().min(0).max(10000).default(0),
  prices_include_tax: z.boolean().default(true),
  label: z.string().default("GST"),
  gstin: z.string().default(""),
});

const checkoutSchema = z.object({ allow_guest: z.boolean().default(true) });
const reviewsSchema = z.object({ moderation: z.boolean().default(true), verified_only: z.boolean().default(false) });
const ordersSchema = z.object({ auto_create_shipment: z.boolean().default(false) });

export const settingsSchemas = {
  store: storeSchema,
  home: homeSchema,
  shipping: shippingSchema,
  cod: codSchema,
  tax: taxSchema,
  checkout: checkoutSchema,
  reviews: reviewsSchema,
  orders: ordersSchema,
} as const;

export type SettingsKey = keyof typeof settingsSchemas;
export type StoreSettings = { [K in SettingsKey]: z.infer<(typeof settingsSchemas)[K]> };

function parseSettings(rows: { key: string; value: unknown }[]): StoreSettings {
  const byKey = new Map(rows.map((row) => [row.key, row.value]));
  const result = {} as Record<SettingsKey, unknown>;
  for (const key of Object.keys(settingsSchemas) as SettingsKey[]) {
    const parsed = settingsSchemas[key].safeParse(byKey.get(key) ?? {});
    result[key] = parsed.success ? parsed.data : settingsSchemas[key].parse({});
  }
  return result as StoreSettings;
}

export const defaultSettings: StoreSettings = parseSettings([]);

/** Cached settings for storefront rendering. */
export async function getSettings(): Promise<StoreSettings> {
  const supabase = getPublicSupabase();
  if (!supabase) return defaultSettings;
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) {
    log.error("settings.load", error);
    return defaultSettings;
  }
  return parseSettings(data ?? []);
}

/** Uncached settings for pricing and checkout decisions. */
export async function getFreshSettings(): Promise<StoreSettings> {
  const { data, error } = await getAdminSupabase().from("settings").select("key, value");
  if (error) throw error;
  return parseSettings(data ?? []);
}
