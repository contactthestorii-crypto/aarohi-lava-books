import { notFound } from "next/navigation";
import { Invoice } from "@/components/orders/Invoice";
import { getAdminSupabase } from "@/lib/supabase/admin";
import { getOrderById } from "@/services/order-queries";
import { getSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

export default async function AdminInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await getOrderById(getAdminSupabase(), id);
  if (!order) notFound();
  return <Invoice order={order} settings={await getSettings()} />;
}
