"use client";

import { CheckCircle, CreditCard, Money, PencilSimple, ShieldCheck, Truck } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useFocusFirstError } from "@/lib/hooks/useFocusFirstError";
import { AddressFields } from "@/components/account/AddressForm";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { fieldErrorsFrom } from "@/lib/action-result";
import { cn } from "@/lib/utils/cn";
import { formatPaise } from "@/lib/utils/money";
import { addressSchema, type AddressInput } from "@/lib/validation/common";
import { contactSchema } from "@/lib/validation/checkout";
import type { Quote } from "@/services/pricing";
import type { Address, PaymentMethod } from "@/types";
import { PriceBreakdown } from "./OrderSummary";
import { usePaymentGateway } from "./usePaymentGateway";
import { useRouter } from "next/navigation";

type Contact = { fullName: string; email: string; phone: string };

export interface CheckoutItem {
  productId: string;
  title: string;
  quantity: number;
  lineTotalPaise: number;
  coverUrl: string | null;
}

interface Props {
  items: CheckoutItem[];
  initialQuote: Quote;
  couponCode: string | null;
  contact: Contact;
  addresses: Address[];
  isSignedIn: boolean;
  codEnabled: boolean;
  codFeePaise: number;
  onlineAvailable: boolean;
  testPayments: boolean;
  taxLabel: string;
  deliveryNote: string;
}

type Step = 1 | 2 | 3 | 4;

function addressFromSaved(address: Address): AddressInput {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    area: address.area,
    city: address.city,
    state: address.state as AddressInput["state"],
    pincode: address.pincode,
    landmark: address.landmark,
  };
}

export function CheckoutClient(props: Props) {
  const router = useRouter();
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState<Step>(1);
  const [contact, setContact] = useState<Contact>(props.contact);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const defaultSaved = props.addresses.find((a) => a.isDefault) ?? props.addresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">(defaultSaved?.id ?? "new");
  const [address, setAddress] = useState<AddressInput | null>(null);
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(props.onlineAvailable ? "online" : "cod");
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<Quote>(props.initialQuote);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<{ message: string; cartChanged: boolean } | null>(null);
  const gateway = usePaymentGateway();
  const rootRef = useRef<HTMLDivElement>(null);
  useFocusFirstError(rootRef, [contactErrors, addressErrors]);

  const refreshQuote = useCallback(
    async (method: PaymentMethod) => {
      setQuoteLoading(true);
      try {
        const response = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentMethod: method, couponCode: props.couponCode, email: contact.email, phone: contact.phone }),
        });
        const body = await response.json();
        if (response.ok) setQuote(body.quote);
      } finally {
        setQuoteLoading(false);
      }
    },
    [contact.email, contact.phone, props.couponCode],
  );

  function choosePayment(method: PaymentMethod) {
    setPaymentMethod(method);
    refreshQuote(method);
  }

  function goToDelivery(next: AddressInput) {
    setAddress(next);
    setStep(3);
    refreshQuote(paymentMethod);
  }

  function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      setContactErrors(fieldErrorsFrom(parsed.error));
      return;
    }
    setContactErrors({});
    setContact(parsed.data);
    setStep(2);
  }

  function submitAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedAddressId !== "new") {
      const saved = props.addresses.find((a) => a.id === selectedAddressId);
      if (saved) {
        goToDelivery(addressFromSaved(saved));
        return;
      }
    }
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = addressSchema.safeParse(data);
    if (!parsed.success) {
      setAddressErrors(fieldErrorsFrom(parsed.error));
      return;
    }
    setAddressErrors({});
    goToDelivery(parsed.data);
  }

  async function placeOrder() {
    if (!address) return;
    setError(null);
    setPlacing(true);
    try {
      const response = await fetch("/api/checkout/place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          contact,
          address,
          saveAddress: props.isSignedIn && selectedAddressId === "new" && saveAddress,
          shippingMethod: "standard",
          paymentMethod,
          couponCode: props.couponCode,
          customerNote: note || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError({ message: body.error ?? "We could not place your order.", cartChanged: body.code === "CART_CHANGED" || body.code === "CART_ISSUES" });
        return;
      }
      if (!body.payment) {
        router.push(`/order-success?order=${encodeURIComponent(body.orderNumber)}&token=${body.token}`);
        return;
      }
      await gateway.pay({ orderNumber: body.orderNumber, token: body.token, payment: body.payment });
    } catch {
      setError({ message: "Network error. Check your connection and try again. You have not been charged.", cartChanged: false });
    } finally {
      setPlacing(false);
    }
  }

  const summary = (
    <div className="rounded-[var(--radius-card)] border border-line p-5">
      <h2 className="font-display text-lg font-extrabold">Order summary</h2>
      <ul className="mt-4 space-y-3">
        {props.items.map((item) => (
          <li key={item.productId} className="flex items-center gap-3">
            <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-navy-50">
              {item.coverUrl ? <Image src={item.coverUrl} alt="" fill sizes="40px" className="object-contain p-0.5" /> : null}
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-white">
                {item.quantity}
              </span>
            </span>
            <span className="line-clamp-2 flex-1 text-sm font-semibold">{item.title}</span>
            <span className="text-sm tabular-nums">{formatPaise(item.lineTotalPaise)}</span>
          </li>
        ))}
      </ul>
      <div className={cn("mt-4 border-t border-line pt-4 transition-opacity", quoteLoading && "opacity-50")} aria-busy={quoteLoading}>
        <PriceBreakdown quote={quote} taxLabel={props.taxLabel} />
      </div>
      {props.couponCode && !quote.coupon ? (
        <p className="mt-2 text-sm text-danger">Coupon {props.couponCode}: {quote.couponError}</p>
      ) : null}
      <Link href="/cart" className="mt-3 inline-block text-sm font-semibold text-navy-700 hover:underline">
        Edit cart or coupon
      </Link>
    </div>
  );

  return (
    <div ref={rootRef} className="grid gap-6 lg:grid-cols-[1fr_24rem] lg:gap-10">
      <div className="space-y-4">
        <StepCard number={1} title="Contact details" step={step} onEdit={() => setStep(1)} done={<p>{contact.fullName}, {contact.phone}<br />{contact.email}</p>}>
          <form onSubmit={submitContact} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Full name" htmlFor="c-name" required error={contactErrors.fullName}>
              <Input id="c-name" name="fullName" autoComplete="name" defaultValue={contact.fullName} invalid={Boolean(contactErrors.fullName)} />
            </Field>
            <Field label="Mobile number" htmlFor="c-phone" required error={contactErrors.phone} hint="For delivery updates from the courier">
              <Input id="c-phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" defaultValue={contact.phone} invalid={Boolean(contactErrors.phone)} />
            </Field>
            <Field label="Email" htmlFor="c-email" required error={contactErrors.email} hint="Your order confirmation is sent here" className="sm:col-span-2">
              <Input id="c-email" name="email" type="email" autoComplete="email" defaultValue={contact.email} invalid={Boolean(contactErrors.email)} />
            </Field>
            {!props.isSignedIn ? (
              <p className="text-sm text-muted sm:col-span-2">
                Checking out as a guest.{" "}
                <Link href="/auth/login?next=/checkout" className="font-semibold text-navy-700 underline">
                  Sign in
                </Link>{" "}
                to use saved addresses.
              </p>
            ) : null}
            <Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start">
              Continue to address
            </Button>
          </form>
        </StepCard>

        <StepCard
          number={2}
          title="Delivery address"
          step={step}
          onEdit={() => setStep(2)}
          done={
            address ? (
              <p>
                {address.fullName}, {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.pincode}
              </p>
            ) : null
          }
        >
          <form onSubmit={submitAddress} className="grid gap-4" noValidate>
            {props.addresses.length > 0 ? (
              <fieldset className="grid gap-2">
                <legend className="mb-1 text-sm font-semibold">Saved addresses</legend>
                {props.addresses.map((saved) => (
                  <label
                    key={saved.id}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-[var(--radius-control)] border p-3 text-sm",
                      selectedAddressId === saved.id ? "border-navy-700 bg-navy-50" : "border-line",
                    )}
                  >
                    <input type="radio" name="savedAddress" checked={selectedAddressId === saved.id} onChange={() => setSelectedAddressId(saved.id)} className="mt-1 accent-navy-900" />
                    <span>
                      <span className="font-semibold">{saved.fullName}</span>, {saved.phone}
                      <br />
                      {saved.line1}
                      {saved.line2 ? `, ${saved.line2}` : ""}, {saved.city}, {saved.state} {saved.pincode}
                    </span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer gap-3 rounded-[var(--radius-control)] border p-3 text-sm font-semibold", selectedAddressId === "new" ? "border-navy-700 bg-navy-50" : "border-line")}>
                  <input type="radio" name="savedAddress" checked={selectedAddressId === "new"} onChange={() => setSelectedAddressId("new")} className="accent-navy-900" />
                  Deliver to a new address
                </label>
              </fieldset>
            ) : null}
            {selectedAddressId === "new" ? (
              <>
                <AddressFields errors={addressErrors} defaults={{ fullName: contact.fullName, phone: contact.phone, ...(address ?? {}) }} prefix="ship-" />
                {props.isSignedIn ? <Checkbox checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} label="Save this address to my account" /> : null}
              </>
            ) : null}
            <Button type="submit" size="lg" className="sm:justify-self-start">
              Continue to delivery
            </Button>
          </form>
        </StepCard>

        <StepCard number={3} title="Delivery method" step={step} onEdit={() => setStep(3)} done={<p>Standard delivery, {quote.shippingPaise === 0 ? "free" : formatPaise(quote.shippingPaise)}</p>}>
          <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-navy-700 bg-navy-50 p-4">
            <Truck size={22} className="shrink-0 text-navy-700" />
            <div className="flex-1">
              <p className="font-semibold">Standard delivery</p>
              <p className="text-sm text-muted">{props.deliveryNote || "Shipped with our courier partner. You get the tracking number by email once it ships."}</p>
            </div>
            <p className="font-semibold tabular-nums">{quote.shippingPaise === 0 ? "Free" : formatPaise(quote.shippingPaise)}</p>
          </div>
          <Field label="Note for us (optional)" htmlFor="note" className="mt-4">
            <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="min-h-20" />
          </Field>
          <Button size="lg" className="mt-4" onClick={() => setStep(4)}>
            Continue to payment
          </Button>
        </StepCard>

        <StepCard number={4} title="Payment" step={step} onEdit={() => setStep(4)} done={null}>
          <fieldset className="grid gap-2">
            <legend className="sr-only">Payment method</legend>
            <PaymentOption
              checked={paymentMethod === "online"}
              disabled={!props.onlineAvailable}
              onChange={() => choosePayment("online")}
              icon={<CreditCard size={22} />}
              title={props.testPayments ? "Pay online (test mode)" : "Pay online"}
              description={props.onlineAvailable ? "UPI, debit or credit card, net banking and wallets via Razorpay" : "Online payment is not available right now."}
            />
            {props.codEnabled ? (
              <PaymentOption
                checked={paymentMethod === "cod"}
                disabled={!quote.codAvailable}
                onChange={() => choosePayment("cod")}
                icon={<Money size={22} />}
                title="Cash on delivery"
                description={
                  quote.codAvailable
                    ? props.codFeePaise > 0
                      ? `Pay when your books arrive. Cash on delivery fee ${formatPaise(props.codFeePaise)}.`
                      : "Pay when your books arrive"
                    : quote.codUnavailableReason ?? "Not available for this order."
                }
              />
            ) : null}
          </fieldset>
          {error ? (
            <Notice tone="error" className="mt-4">
              {error.message}{" "}
              {error.cartChanged ? (
                <Link href="/cart" className="font-semibold underline">
                  Review cart
                </Link>
              ) : null}
            </Notice>
          ) : null}
          {gateway.error ? <Notice tone="error" className="mt-4">{gateway.error}</Notice> : null}
          <Button
            size="lg"
            className="mt-5 w-full sm:w-auto"
            loading={placing || gateway.status === "opening" || gateway.status === "verifying"}
            disabled={quoteLoading || (paymentMethod === "online" && !props.onlineAvailable)}
            onClick={placeOrder}
          >
            {paymentMethod === "cod" ? `Place order, pay ${formatPaise(quote.totalPaise)} on delivery` : `Pay ${formatPaise(quote.totalPaise)}`}
          </Button>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck size={16} className="text-success" /> Your total is calculated and verified on our server before payment.
          </p>
        </StepCard>
      </div>
      <aside className="order-first lg:order-none lg:sticky lg:top-24 lg:self-start">{summary}</aside>
      {gateway.gatewayElement}
    </div>
  );
}

function StepCard({
  number,
  title,
  step,
  onEdit,
  done,
  children,
}: {
  number: Step;
  title: string;
  step: Step;
  onEdit: () => void;
  done: ReactNode;
  children: ReactNode;
}) {
  const state = step === number ? "active" : step > number ? "done" : "upcoming";
  return (
    <section aria-labelledby={`step-${number}`} className={cn("rounded-[var(--radius-card)] border p-5", state === "active" ? "border-navy-700" : "border-line")}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`step-${number}`} className={cn("flex items-center gap-2.5 font-display text-lg font-extrabold", state === "upcoming" && "text-muted")}>
          {state === "done" ? (
            <CheckCircle size={24} weight="fill" className="text-success" />
          ) : (
            <span className={cn("flex size-6 items-center justify-center rounded-full text-sm", state === "active" ? "bg-navy-900 text-white" : "bg-navy-100 text-muted")}>
              {number}
            </span>
          )}
          {title}
        </h2>
        {state === "done" ? (
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:underline">
            <PencilSimple size={14} /> Change
          </button>
        ) : null}
      </div>
      {state === "done" && done ? <div className="mt-2 pl-8 text-sm text-muted">{done}</div> : null}
      {state === "active" ? <div className="mt-5">{children}</div> : null}
    </section>
  );
}

function PaymentOption({
  checked,
  disabled,
  onChange,
  icon,
  title,
  description,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        "flex gap-3 rounded-[var(--radius-control)] border p-4",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        checked ? "border-navy-700 bg-navy-50" : "border-line",
      )}
    >
      <input type="radio" name="paymentMethod" checked={checked} disabled={disabled} onChange={onChange} className="mt-1 accent-navy-900" />
      <span className="text-navy-700">{icon}</span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted">{description}</span>
      </span>
    </label>
  );
}
