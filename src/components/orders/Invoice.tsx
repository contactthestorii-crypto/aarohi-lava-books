import { formatPaise } from "@/lib/utils/money";
import type { OrderDetailView } from "@/services/order-queries";
import type { StoreSettings } from "@/services/settings";
import { formatDate } from "./OrderViews";
import { PrintButton } from "./PrintButton";

/** Printable invoice built only from the stored order snapshot and store settings. */
export function Invoice({ order, settings }: { order: OrderDetailView; settings: StoreSettings }) {
  const { store, tax } = settings;
  const address = order.shippingAddress;
  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-sm print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="flex flex-wrap justify-between gap-6 border-b-2 border-ink pb-5">
        <div>
          <p className="font-display text-2xl font-extrabold uppercase">{store.name}</p>
          {store.address ? <p className="mt-1 whitespace-pre-line text-muted">{store.address}</p> : null}
          {store.support_email ? <p className="text-muted">{store.support_email}</p> : null}
          {store.support_phone ? <p className="text-muted">{store.support_phone}</p> : null}
          {tax.gstin ? <p className="mt-1 font-semibold">GSTIN: {tax.gstin}</p> : null}
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-extrabold">{tax.gstin ? "Tax invoice" : "Invoice"}</p>
          <p className="mt-1">
            Order <span className="font-semibold">{order.orderNumber}</span>
          </p>
          <p>Date {formatDate(order.paidAt ?? order.createdAt)}</p>
          <p>Payment: {order.paymentMethod === "cod" ? "Cash on delivery" : "Online (Razorpay)"}</p>
        </div>
      </header>
      <section className="grid gap-4 py-5 sm:grid-cols-2">
        <div>
          <p className="font-semibold">Billed and shipped to</p>
          <p className="mt-1 leading-relaxed">
            {address.fullName}
            <br />
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.area ? `${address.area}, ` : ""}
            {address.city}, {address.state} {address.pincode}
            <br />
            {order.customerPhone}, {order.customerEmail}
          </p>
        </div>
      </section>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-y border-ink text-left">
            <th className="py-2 pr-2 font-semibold">Item</th>
            <th className="py-2 pr-2 text-right font-semibold">Qty</th>
            <th className="py-2 pr-2 text-right font-semibold">Unit price</th>
            <th className="py-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-line">
              <td className="py-2 pr-2">{item.title}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{item.quantity}</td>
              <td className="py-2 pr-2 text-right tabular-nums">{formatPaise(item.unitPricePaise)}</td>
              <td className="py-2 text-right tabular-nums">{formatPaise(item.lineTotalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1">
        <Row label="Subtotal" value={formatPaise(order.subtotalPaise)} />
        {order.discountPaise > 0 ? <Row label={`Discount ${order.couponCode ?? ""}`} value={`- ${formatPaise(order.discountPaise)}`} /> : null}
        <Row label="Shipping" value={formatPaise(order.shippingPaise)} />
        {order.codFeePaise > 0 ? <Row label="COD fee" value={formatPaise(order.codFeePaise)} /> : null}
        {order.taxPaise > 0 ? (
          <Row
            label={`${tax.label} ${order.taxRateBps / 100}%${order.pricesIncludeTax ? " (included)" : ""}`}
            value={formatPaise(order.taxPaise)}
          />
        ) : null}
        <div className="flex justify-between border-t border-ink pt-1.5 text-base font-bold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatPaise(order.totalPaise)}</dd>
        </div>
      </dl>
      <p className="mt-10 text-xs text-muted">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
