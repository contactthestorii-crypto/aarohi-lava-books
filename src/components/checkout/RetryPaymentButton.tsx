"use client";

import { ArrowClockwise } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { usePaymentGateway } from "./usePaymentGateway";

/** Re-opens the gateway for an unpaid order. */
export function RetryPaymentButton({ orderNumber, token }: { orderNumber: string; token: string }) {
  const { pay, status, error, gatewayElement } = usePaymentGateway();
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function retry() {
    setMessage(null);
    setLoading(true);
    try {
      const response = await fetch("/api/payments/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, token }),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(body.error ?? "Payment could not be started.");
        return;
      }
      await pay(body);
    } catch {
      setMessage("Payment could not be started. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <Button onClick={retry} loading={loading || status === "opening" || status === "verifying"} icon={<ArrowClockwise size={18} weight="bold" />}>
        Pay now
      </Button>
      {message || error ? (
        <p role="alert" className="text-sm text-danger">
          {message ?? error}
        </p>
      ) : null}
      {gatewayElement}
    </div>
  );
}
