import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Invoice } from "@/components/orders/Invoice";
import { requireUser } from "@/lib/auth";
import { canDownloadInvoice } from "@/lib/orders/invoice";
import { createServerSupabase } from "@/lib/supabase/server";
import { getOrderById } from "@/services/order-queries";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/account/orders/${id}/invoice`);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await getOrderById(await createServerSupabase(), id);
  if (!order || !canDownloadInvoice(order)) notFound();
  return <Invoice order={order} settings={await getSettings()} />;
}
