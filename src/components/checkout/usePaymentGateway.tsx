"use client";

import { Flask } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { notifyCartUpdated } from "@/lib/cart-events";
import type { ClientCheckout } from "@/lib/payments/types";
import { formatPaise } from "@/lib/utils/money";

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: { error: { code: string; description: string; metadata?: { payment_id?: string; order_id?: string } } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const RAZORPAY_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Could not load Razorpay")));
    if (!existing) {
      script.src = RAZORPAY_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export interface GatewayOrder {
  orderNumber: string;
  token: string;
  payment: ClientCheckout;
}

type Status = "idle" | "opening" | "verifying" | "error";

/** Opens the payment gateway for an order, verifies the result on the server, then redirects. */
export function usePaymentGateway() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [mockOrder, setMockOrder] = useState<GatewayOrder | null>(null);

  const successUrl = (order: GatewayOrder) => `/order-success?order=${encodeURIComponent(order.orderNumber)}&token=${order.token}`;

  const verify = useCallback(
    async (order: GatewayOrder, result: { providerOrderId: string; providerPaymentId: string; signature: string }) => {
      setStatus("verifying");
      try {
        const response = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderNumber: order.orderNumber, token: order.token, ...result }),
        });
        const body = (await response.json()) as { redirect?: string; error?: string };
        notifyCartUpdated();
        router.push(body.redirect ?? successUrl(order));
      } catch {
        // Network trouble after paying: the webhook still completes the order.
        router.push(successUrl(order));
      }
    },
    [router],
  );

  const reportFailure = useCallback(async (order: GatewayOrder, providerPaymentId: string, code: string, description: string) => {
    await fetch("/api/payments/failed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber: order.orderNumber, token: order.token, providerOrderId: order.payment.providerOrderId, providerPaymentId, code, description }),
    }).catch(() => undefined);
  }, []);

  const pay = useCallback(
    async (order: GatewayOrder) => {
      setError(null);
      setStatus("opening");
      if (order.payment.provider === "mock") {
        setMockOrder(order);
        return;
      }
      const checkout = order.payment;
      try {
        await loadRazorpay();
      } catch {
        setStatus("error");
        setError("Could not load the payment window. Check your connection and try again. Your order is saved.");
        return;
      }
      const instance = new window.Razorpay!({
        key: checkout.keyId,
        amount: checkout.amountPaise,
        currency: checkout.currency,
        name: checkout.name,
        description: checkout.description,
        order_id: checkout.providerOrderId,
        prefill: checkout.prefill,
        theme: { color: "#10214d" },
        handler: (response: RazorpayResponse) =>
          verify(order, {
            providerOrderId: response.razorpay_order_id,
            providerPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        modal: {
          ondismiss: () => router.push(successUrl(order)),
        },
      });
      instance.on("payment.failed", (response) => {
        reportFailure(order, response.error.metadata?.payment_id ?? "", response.error.code, response.error.description);
      });
      instance.open();
      setStatus("idle");
    },
    [reportFailure, router, verify],
  );

  const gatewayElement = (
    <Dialog open={mockOrder !== null} onClose={() => mockOrder && router.push(successUrl(mockOrder))} title="Test payment">
      {mockOrder ? (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-gold-100 p-3 text-sm font-semibold text-ink">
            <Flask size={18} className="mt-0.5 shrink-0" />
            Test mode: no real payment is taken. This option only exists in development.
          </p>
          <p className="text-[15px]">
            Order <strong>{mockOrder.orderNumber}</strong>, amount <strong>{formatPaise(mockOrder.payment.amountPaise)}</strong>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              loading={status === "verifying"}
              onClick={() =>
                verify(mockOrder, {
                  providerOrderId: mockOrder.payment.providerOrderId,
                  providerPaymentId: `mock_pay_${Date.now()}`,
                  signature: "mock-success",
                })
              }
            >
              Simulate success
            </Button>
            <Button
              variant="danger"
              disabled={status === "verifying"}
              onClick={async () => {
                await reportFailure(mockOrder, `mock_pay_${Date.now()}`, "MOCK_DECLINED", "Simulated failure");
                router.push(successUrl(mockOrder));
              }}
            >
              Simulate failure
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );

  return { pay, status, error, gatewayElement };
}
