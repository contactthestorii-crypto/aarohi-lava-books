"use client";

import { MapPin, Truck } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Result =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok"; serviceable: boolean; message: string; codAvailable: boolean | null; estimate: string | null }
  | { state: "error"; message: string };

/** Asks the shipping provider (via our API) whether we deliver to a pincode. */
export function PincodeChecker() {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<Result>({ state: "idle" });

  async function check(event: React.FormEvent) {
    event.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      setResult({ state: "error", message: "Enter a valid 6-digit pincode." });
      return;
    }
    setResult({ state: "loading" });
    try {
      const response = await fetch(`/api/shipping/serviceability?pincode=${pincode}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not check this pincode.");
      setResult({ state: "ok", ...body });
    } catch (error) {
      setResult({ state: "error", message: (error as Error).message || "Could not check this pincode right now." });
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-line p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Truck size={20} className="text-navy-700" /> Check delivery
      </p>
      <form onSubmit={check} className="mt-3 flex gap-2">
        <label htmlFor="pincode" className="sr-only">
          Delivery pincode
        </label>
        <div className="relative flex-1">
          <MapPin size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={pincode}
            onChange={(event) => setPincode(event.target.value.replace(/\D/g, ""))}
            placeholder="Enter pincode"
            className="h-11 w-full rounded-[var(--radius-control)] border border-line pl-10 pr-3 text-[15px] tabular-nums focus:border-navy-700 focus:outline-none focus:ring-2 focus:ring-navy-700/20"
          />
        </div>
        <Button type="submit" variant="secondary" loading={result.state === "loading"}>
          Check
        </Button>
      </form>
      <div aria-live="polite" className="mt-2 text-sm">
        {result.state === "ok" ? (
          <div className={result.serviceable ? "text-success" : "text-danger"}>
            <p className="font-semibold">{result.message}</p>
            {result.serviceable && result.estimate ? <p className="text-muted">{result.estimate}</p> : null}
            {result.serviceable && result.codAvailable === false ? <p className="text-muted">Cash on delivery is not available here.</p> : null}
          </div>
        ) : result.state === "error" ? (
          <p className="text-danger">{result.message}</p>
        ) : null}
      </div>
    </div>
  );
}
