import type { Metadata } from "next";
import Link from "next/link";
import { AdminPageHeader, AdminTable, EmptyRow, Td } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { formatPaise } from "@/lib/utils/money";
import { listCustomers } from "@/services/admin";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const result = await listCustomers(params.q, page);

  return (
    <div>
      <AdminPageHeader title="Customers" description={`${result.total} registered accounts. Guest orders are listed under Orders.`} />
      <form method="get" className="mb-4 flex gap-2">
        <Input name="q" defaultValue={params.q} placeholder="Name, email or phone" className="max-w-sm" aria-label="Search customers" />
        <button type="submit" className="h-11 rounded-[var(--radius-control)] bg-navy-900 px-4 text-sm font-semibold text-white">
          Search
        </button>
      </form>
      <AdminTable head={["Customer", "Phone", "Orders", "Spent", "Joined"]}>
        {result.items.length === 0 ? (
          <EmptyRow colSpan={5}>No customers found.</EmptyRow>
        ) : (
          result.items.map((customer) => (
            <tr key={customer.id}>
              <Td>
                <span className="font-semibold">{customer.fullName ?? "No name"}</span>
                {customer.role === "admin" ? <Badge tone="brand" className="ml-2">admin</Badge> : null}
                <span className="block text-xs text-muted">{customer.email}</span>
              </Td>
              <Td>{customer.phone ?? "-"}</Td>
              <Td className="tabular-nums">
                {customer.orders > 0 && customer.email ? (
                  <Link href={`/admin/orders?q=${encodeURIComponent(customer.email)}`} className="text-navy-700 hover:underline">
                    {customer.orders}
                  </Link>
                ) : (
                  customer.orders
                )}
              </Td>
              <Td className="tabular-nums">{formatPaise(customer.spentPaise)}</Td>
              <Td className="text-muted">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</Td>
            </tr>
          ))
        )}
      </AdminTable>
      <div className="mt-6">
        <Pagination page={result.page} totalPages={result.totalPages} hrefFor={(p) => `/admin/customers?${new URLSearchParams({ ...(params.q ? { q: params.q } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`} />
      </div>
    </div>
  );
}
