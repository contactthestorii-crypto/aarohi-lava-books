import { Package } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/actions/auth";
import { OrderStatusBadge, formatDate } from "@/components/orders/OrderViews";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Notice } from "@/components/ui/States";
import { getProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/utils/money";
import { listOrdersForUser } from "@/services/order-queries";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const profile = await getProfile();
  if (!profile) return null;
  const orders = await listOrdersForUser(await createServerSupabase(), profile.id);
  const { password } = await searchParams;
  const firstName = profile.fullName?.split(" ")[0];

  return (
    <div className="space-y-8">
      {password === "updated" ? <Notice tone="success">Your password has been updated.</Notice> : null}
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{firstName ? `Hello, ${firstName}` : "My account"}</h1>
        <p className="mt-1 text-[15px] text-muted">{profile.email}</p>
      </div>

      <section aria-labelledby="recent-heading">
        <div className="flex items-end justify-between">
          <h2 id="recent-heading" className="font-display text-xl font-extrabold">
            Recent orders
          </h2>
          {orders.length > 3 ? (
            <Link href="/account/orders" className="text-sm font-semibold text-navy-700 hover:underline">
              All orders
            </Link>
          ) : null}
        </div>
        {orders.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={<Package />}
            title="No orders yet"
            description="Orders you place while signed in appear here."
            action={<ButtonLink href="/books">Explore books</ButtonLink>}
          />
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line">
            {orders.slice(0, 3).map((order) => (
              <li key={order.id}>
                <Link href={`/account/orders/${order.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-navy-50">
                  <div>
                    <p className="font-semibold tabular-nums">{order.orderNumber}</p>
                    <p className="text-sm text-muted">
                      {formatDate(order.createdAt)}, {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <span className="font-semibold tabular-nums">{formatPaise(order.totalPaise)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={signOutAction} className="lg:hidden">
        <button type="submit" className="text-sm font-semibold text-danger">
          Sign out
        </button>
      </form>
    </div>
  );
}
