"use client";

import { useActionState, useEffect } from "react";
import { saveAddressAction } from "@/actions/account";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { initialActionState } from "@/lib/action-result";
import { INDIAN_STATES } from "@/lib/validation/common";
import type { Address } from "@/types";

/** Address fields, reused by the account address book and (uncontrolled) by checkout. */
export function AddressFields({
  defaults,
  errors = {},
  prefix = "",
}: {
  defaults?: Partial<Address>;
  errors?: Record<string, string>;
  prefix?: string;
}) {
  const id = (name: string) => `${prefix}${name}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" htmlFor={id("fullName")} required error={errors.fullName}>
        <Input id={id("fullName")} name="fullName" autoComplete="name" defaultValue={defaults?.fullName} required invalid={Boolean(errors.fullName)} />
      </Field>
      <Field label="Mobile number" htmlFor={id("phone")} required error={errors.phone} hint="10-digit number for delivery updates">
        <Input id={id("phone")} name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={14} defaultValue={defaults?.phone} required invalid={Boolean(errors.phone)} />
      </Field>
      <Field label="House / flat no., building, street" htmlFor={id("line1")} required error={errors.line1} className="sm:col-span-2">
        <Input id={id("line1")} name="line1" autoComplete="address-line1" defaultValue={defaults?.line1} required invalid={Boolean(errors.line1)} />
      </Field>
      <Field label="Apartment, floor (optional)" htmlFor={id("line2")} error={errors.line2}>
        <Input id={id("line2")} name="line2" autoComplete="address-line2" defaultValue={defaults?.line2 ?? ""} />
      </Field>
      <Field label="Area / locality (optional)" htmlFor={id("area")} error={errors.area}>
        <Input id={id("area")} name="area" autoComplete="address-level3" defaultValue={defaults?.area ?? ""} />
      </Field>
      <Field label="City / town" htmlFor={id("city")} required error={errors.city}>
        <Input id={id("city")} name="city" autoComplete="address-level2" defaultValue={defaults?.city} required invalid={Boolean(errors.city)} />
      </Field>
      <Field label="State" htmlFor={id("state")} required error={errors.state}>
        <Select id={id("state")} name="state" autoComplete="address-level1" defaultValue={defaults?.state ?? "Telangana"} required invalid={Boolean(errors.state)}>
          {INDIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Pincode" htmlFor={id("pincode")} required error={errors.pincode}>
        <Input id={id("pincode")} name="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} defaultValue={defaults?.pincode} required invalid={Boolean(errors.pincode)} />
      </Field>
      <Field label="Landmark (optional)" htmlFor={id("landmark")} error={errors.landmark}>
        <Input id={id("landmark")} name="landmark" defaultValue={defaults?.landmark ?? ""} />
      </Field>
    </div>
  );
}

export function AddressForm({ address, onSaved }: { address?: Address; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(saveAddressAction, initialActionState);
  const errors = state.ok ? {} : state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) onSaved?.();
  }, [state, onSaved]);

  return (
    <form action={action} className="grid gap-4" noValidate>
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      {!state.ok && state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <AddressFields defaults={address} errors={errors} prefix={address ? `a-${address.id}-` : "new-"} />
      <Checkbox name="isDefault" defaultChecked={address?.isDefault} label="Use as my default address" />
      <Button type="submit" variant="dark" loading={pending} className="justify-self-start">
        Save address
      </Button>
    </form>
  );
}
