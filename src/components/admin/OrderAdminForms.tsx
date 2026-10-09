"use client";

import { useActionState } from "react";
import {
  addTrackingEventAction,
  cancelOrderAction,
  refundOrderAction,
  saveAdminNoteAction,
  saveManualShipmentAction,
  updateOrderStatusAction,
} from "@/actions/admin/orders";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { initialActionState, type ActionResult } from "@/lib/action-result";
import { ORDER_STATUS_LABEL } from "@/lib/orders/status";
import type { OrderStatus } from "@/types";

function Result({ state }: { state: ActionResult }) {
  if (state.ok && state.message) return <Notice tone="success">{state.message}</Notice>;
  if (!state.ok && state.error) return <Notice tone="error">{state.error}</Notice>;
  return null;
}

function errorsOf(state: ActionResult) {
  return state.ok ? {} : state.fieldErrors ?? {};
}

export function StatusForm({ orderId, allowed }: { orderId: string; allowed: OrderStatus[] }) {
  const [state, action, pending] = useActionState(updateOrderStatusAction, initialActionState);
  if (allowed.length === 0) return <p className="text-sm text-muted">No manual status changes are available for this order.</p>;
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <Field label="Move order to" htmlFor="status">
        <Select id="status" name="status" defaultValue={allowed[0]}>
          {allowed.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABEL[status]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Note for the timeline (optional)" htmlFor="status-note">
        <Input id="status-note" name="note" maxLength={300} />
      </Field>
      <Button type="submit" variant="dark" loading={pending} className="justify-self-start">
        Update status
      </Button>
    </form>
  );
}

export function ManualShipmentForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(saveManualShipmentAction, initialActionState);
  const e = errorsOf(state);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <Field label="Courier" htmlFor="courierName" error={e.courierName}>
        <Input id="courierName" name="courierName" placeholder="India Post, DTDC, Delhivery…" invalid={Boolean(e.courierName)} />
      </Field>
      <Field label="Tracking number (AWB)" htmlFor="awb" error={e.awb}>
        <Input id="awb" name="awb" invalid={Boolean(e.awb)} />
      </Field>
      <Field label="Tracking link (optional)" htmlFor="trackingUrl" error={e.trackingUrl}>
        <Input id="trackingUrl" name="trackingUrl" type="url" placeholder="https://" invalid={Boolean(e.trackingUrl)} />
      </Field>
      <Button type="submit" variant="dark" loading={pending} className="justify-self-start">
        Mark as shipped
      </Button>
    </form>
  );
}

export function TrackingEventForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(addTrackingEventAction, initialActionState);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <Field label="Courier update" htmlFor="track-status">
        <Select id="track-status" name="status">
          <option value="OUT_FOR_DELIVERY">Out for delivery</option>
          <option value="DELIVERED">Delivered</option>
          <option value="RETURN_REQUESTED">Returning to us (RTO)</option>
          <option value="RETURNED">Returned to us</option>
        </Select>
      </Field>
      <Field label="Details (optional)" htmlFor="track-note">
        <Input id="track-note" name="note" maxLength={200} />
      </Field>
      <Button type="submit" variant="secondary" loading={pending} className="justify-self-start">
        Add update
      </Button>
    </form>
  );
}

export function CancelForm({ orderId, paidOnline }: { orderId: string; paidOnline: boolean }) {
  const [state, action, pending] = useActionState(cancelOrderAction, initialActionState);
  const e = errorsOf(state);
  return (
    <form
      action={action}
      className="grid gap-3"
      onSubmit={(event) => {
        if (!window.confirm("Cancel this order?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <Field label="Reason (shown to the customer)" htmlFor="cancel-reason" error={e.reason}>
        <Input id="cancel-reason" name="reason" maxLength={300} invalid={Boolean(e.reason)} />
      </Field>
      <Checkbox name="restock" defaultChecked label="Put the books back into stock" />
      {paidOnline ? <p className="text-sm text-warning">This order was paid online. Issue a refund below after cancelling.</p> : null}
      <Button type="submit" variant="danger" loading={pending} className="justify-self-start">
        Cancel order
      </Button>
    </form>
  );
}

export function RefundForm({ orderId, maxRupees }: { orderId: string; maxRupees: string }) {
  const [state, action, pending] = useActionState(refundOrderAction, initialActionState);
  const e = errorsOf(state);
  return (
    <form
      action={action}
      className="grid gap-3"
      onSubmit={(event) => {
        if (!window.confirm("Send this refund through the payment gateway? This cannot be undone.")) event.preventDefault();
      }}
    >
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <Field label={`Amount (₹, up to ${maxRupees})`} htmlFor="refund-amount" error={e.amount}>
        <Input id="refund-amount" name="amount" inputMode="decimal" defaultValue={maxRupees} invalid={Boolean(e.amount)} />
      </Field>
      <Field label="Reason" htmlFor="refund-reason" error={e.reason}>
        <Input id="refund-reason" name="reason" maxLength={250} invalid={Boolean(e.reason)} />
      </Field>
      <Button type="submit" variant="danger" loading={pending} className="justify-self-start">
        Refund
      </Button>
    </form>
  );
}

export function AdminNoteForm({ orderId, note, needsAttention }: { orderId: string; note: string; needsAttention: boolean }) {
  const [state, action, pending] = useActionState(saveAdminNoteAction, initialActionState);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="orderId" value={orderId} />
      <Result state={state} />
      <Textarea name="adminNote" defaultValue={note} maxLength={2000} aria-label="Internal note" placeholder="Visible to admins only" />
      <Checkbox name="needsAttention" defaultChecked={needsAttention} label="Needs attention" />
      <Button type="submit" variant="secondary" loading={pending} className="justify-self-start">
        Save note
      </Button>
    </form>
  );
}

// Exported component for admin order display
export function OrderAdminForms({ order }: { order: Record<string, unknown> | unknown }) {
  return (
    <div className="p-4 border rounded bg-white shadow">
      {/* Placeholder UI – you can replace with a richer layout later */}
      <pre className="text-sm overflow-x-auto">{JSON.stringify(order, null, 2)}</pre>
    </div>
  );
}

