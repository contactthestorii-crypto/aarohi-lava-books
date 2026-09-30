import "server-only";
import { cronSecret, emailConfig, emailProviderName, paymentProviderName, razorpayConfig, shippingProviderName, shiprocketConfig } from "@/lib/env";
import { getAdminSupabase } from "@/lib/supabase/admin";
import type { DailyRevenue } from "@/components/admin/RevenueChart";
import { computeStock, type InventoryRow } from "./mappers";
import { getFreshSettings } from "./settings";

// Read models for the admin dashboard. Called only from admin pages (requireAdmin in layout).

export interface SalesSummary {
  revenue_paise: number;
  orders: number;
  pending_payment: number;
  paid: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  needs_attention: number;
}

export async function getDashboard() {
  const supabase = getAdminSupabase();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [allTime, last30, daily, best, lowStock, awaitingShipment] = await Promise.all([
    supabase.rpc("sales_summary", { p_since: "2000-01-01T00:00:00Z" }),
    supabase.rpc("sales_summary", { p_since: since30 }),
    supabase.rpc("daily_revenue", { p_days: 30 }),
    supabase.rpc("best_sellers", { p_limit: 5, p_since: "2000-01-01T00:00:00Z" }),
    getLowStock(),
    supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["PAID", "PROCESSING", "PACKED"]),
  ]);
  for (const result of [allTime, last30, daily, best]) if (result.error) throw result.error;
  return {
    allTime: allTime.data as SalesSummary,
    last30: last30.data as SalesSummary,
    daily: ((daily.data ?? []) as { day: string; revenue_paise: number; orders: number }[]).map<DailyRevenue>((d) => ({
      day: d.day,
      revenuePaise: Number(d.revenue_paise),
      orders: Number(d.orders),
    })),
    bestSellers: (best.data ?? []) as { product_id: string; title: string; units: number; revenue_paise: number }[],
    lowStock,
    awaitingShipment: awaitingShipment.count ?? 0,
  };
}

export async function getLowStock() {
  const { data, error } = await getAdminSupabase()
    .from("products")
    .select("id, title, price_paise, status, inventory(quantity, reserved, low_stock_threshold, allow_backorder)")
    .neq("status", "archived");
  if (error) throw error;
  type Row = { id: string; title: string; price_paise: number | null; status: string; inventory: InventoryRow | InventoryRow[] | null };
  return (data as unknown as Row[])
    .map((row) => {
      const inventory = Array.isArray(row.inventory) ? row.inventory[0] ?? null : row.inventory;
      return { id: row.id, title: row.title, status: row.status, inventory, stock: computeStock(inventory) };
    })
    .filter((row) => row.stock.state === "low_stock" || row.stock.state === "out_of_stock")
    .sort((a, b) => a.stock.available - b.stock.available);
}

export interface ChecklistItem {
  label: string;
  done: boolean;
  detail: string;
  href?: string;
}

/** What still needs real configuration before (or after) launch. Shown on the dashboard. */
export async function getSetupChecklist(): Promise<ChecklistItem[]> {
  const settings = await getFreshSettings();
  const supabase = getAdminSupabase();
  const { data: sellable } = await supabase
    .from("products")
    .select("id, inventory!inner(quantity)")
    .eq("status", "published")
    .not("price_paise", "is", null)
    .gt("inventory.quantity", 0)
    .limit(1);

  const razorpay = razorpayConfig();
  const shiprocket = shiprocketConfig();
  return [
    {
      label: "At least one book has a price and stock",
      done: (sellable ?? []).length > 0,
      detail: "Set MRP, selling price and quantity so customers can buy.",
      href: "/admin/books",
    },
    {
      label: "Store contact details",
      done: Boolean(settings.store.support_email && settings.store.support_phone),
      detail: "Support email and phone appear in the footer, emails and invoices.",
      href: "/admin/settings",
    },
    {
      label: "About and policy pages reviewed",
      done: settings.pages.reviewed,
      detail: "Edit the shipping, returns, privacy and terms pages to match how you operate.",
      href: "/admin/settings#pages",
    },
    {
      label: "Shipping fees reviewed",
      done: settings.shipping.reviewed,
      detail: "Confirm the flat fee and free-shipping threshold.",
      href: "/admin/settings",
    },
    {
      label: "Razorpay live keys",
      done: paymentProviderName() === "razorpay" && razorpay.configured,
      detail: paymentProviderName() === "mock" ? "PAYMENT_PROVIDER is set to mock (test mode)." : "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      href: "/admin/payments",
    },
    {
      label: "Razorpay webhook secret",
      done: Boolean(razorpay.webhookSecret),
      detail: "Set RAZORPAY_WEBHOOK_SECRET and add the webhook in Razorpay.",
      href: "/admin/payments",
    },
    {
      label: "Shipping provider",
      done: shippingProviderName() === "shiprocket" ? shiprocket.configured : true,
      detail:
        shippingProviderName() === "shiprocket"
          ? "Shiprocket credentials and pickup location."
          : "Manual mode: you enter courier and AWB for each order. Switch to Shiprocket to automate.",
      href: "/admin/shipping",
    },
    {
      label: "Transactional email",
      done: emailProviderName() === "resend" && Boolean(emailConfig().apiKey),
      detail: "EMAIL_PROVIDER=resend with EMAIL_API_KEY and a verified sender domain.",
    },
    {
      label: "Order alerts to the team",
      done: Boolean(emailConfig().adminEmail),
      detail: "Set ADMIN_NOTIFICATION_EMAIL.",
    },
    {
      label: "Unpaid order cleanup job",
      done: Boolean(cronSecret()),
      detail: "Set CRON_SECRET so the scheduled job can release stock from abandoned payments.",
    },
  ];
}

export async function listCustomers(q: string | undefined, page: number) {
  const supabase = getAdminSupabase();
  const pageSize = 25;
  let query = supabase.from("profiles").select("id, email, full_name, phone, role, created_at", { count: "exact" });
  const term = q?.trim().replace(/[,()"\\%]/g, "");
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, from + pageSize - 1);
  if (error) throw error;
  const ids = (data ?? []).map((p) => p.id as string);
  const { data: orders } = ids.length
    ? await supabase.from("orders").select("user_id, total_paise, status").in("user_id", ids)
    : { data: [] as { user_id: string; total_paise: number; status: string }[] };
  const stats = new Map<string, { orders: number; spentPaise: number }>();
  for (const order of orders ?? []) {
    const current = stats.get(order.user_id as string) ?? { orders: 0, spentPaise: 0 };
    current.orders += 1;
    if (!["PENDING_PAYMENT", "CANCELLED", "REFUNDED"].includes(order.status as string)) current.spentPaise += order.total_paise as number;
    stats.set(order.user_id as string, current);
  }
  const total = count ?? 0;
  return {
    items: (data ?? []).map((p) => ({
      id: p.id as string,
      email: p.email as string | null,
      fullName: p.full_name as string | null,
      phone: p.phone as string | null,
      role: p.role as string,
      createdAt: p.created_at as string,
      ...(stats.get(p.id as string) ?? { orders: 0, spentPaise: 0 }),
    })),
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  };
}
