import { OrderAdminForms } from '@/components/admin/OrderAdminForms';
import { getOrders } from '@/services/orders';

export const dynamic = 'force-dynamic';

export default async function OrdersAdminPage() {
  const orders = await getOrders();

  return (
    <section className="container-page py-12">
      <h1 className="font-display text-2xl font-extrabold text-ink">
        Admin – Orders ({orders.length})
      </h1>

      <ul className="mt-6 space-y-6">
        {orders.map((order) => (
          <li key={order.id}>
            <OrderAdminForms order={order} />
          </li>
        ))}
      </ul>
    </section>
  );
}

