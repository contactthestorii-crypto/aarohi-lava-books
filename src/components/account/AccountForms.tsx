"use client";

import { PencilSimple, Plus, Star, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { deleteAddressAction, setDefaultAddressAction, updateProfileAction } from "@/actions/account";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Field, Input } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { initialActionState } from "@/lib/action-result";
import type { Address } from "@/types";
import { AddressForm } from "./AddressForm";

export function ProfileForm({ fullName, phone, email }: { fullName: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialActionState);
  const errors = state.ok ? {} : state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:max-w-md" noValidate>
      {state.ok && state.message ? <Notice tone="success">{state.message}</Notice> : null}
      {!state.ok && state.error && !state.fieldErrors ? <Notice tone="error">{state.error}</Notice> : null}
      <Field label="Email" htmlFor="profile-email" hint="Contact us to change your sign-in email.">
        <Input id="profile-email" value={email} disabled readOnly />
      </Field>
      <Field label="Full name" htmlFor="profile-name" required error={errors.fullName}>
        <Input id="profile-name" name="fullName" defaultValue={fullName} autoComplete="name" invalid={Boolean(errors.fullName)} />
      </Field>
      <Field label="Mobile number" htmlFor="profile-phone" error={errors.phone}>
        <Input id="profile-phone" name="phone" type="tel" inputMode="numeric" defaultValue={phone} autoComplete="tel-national" invalid={Boolean(errors.phone)} />
      </Field>
      <Button type="submit" variant="dark" loading={pending} className="justify-self-start">
        Save profile
      </Button>
    </form>
  );
}

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Address | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) toast.show(result.error ?? "Something went wrong.", "error");
      else if (result.message) toast.show(result.message);
      router.refresh();
    });
  }

  return (
    <div>
      {addresses.length === 0 ? <p className="text-[15px] text-muted">You have no saved addresses yet.</p> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <li key={address.id} className="flex flex-col rounded-[var(--radius-card)] border border-line p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              {address.fullName}
              {address.isDefault ? <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-bold text-navy-900">Default</span> : null}
            </p>
            <p className="mt-1 leading-relaxed text-muted">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.area ? `${address.area}, ` : ""}
              {address.city}, {address.state} {address.pincode}
              <br />
              {address.phone}
            </p>
            <div className="mt-auto flex flex-wrap gap-1 pt-3">
              <Button size="sm" variant="ghost" icon={<PencilSimple size={16} />} onClick={() => setEditing(address)}>
                Edit
              </Button>
              {!address.isDefault ? (
                <Button size="sm" variant="ghost" icon={<Star size={16} />} disabled={pending} onClick={() => run(() => setDefaultAddressAction(address.id))}>
                  Make default
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash size={16} />}
                disabled={pending}
                className="text-danger hover:bg-red-50"
                onClick={() => {
                  if (window.confirm("Delete this address?")) run(() => deleteAddressAction(address.id));
                }}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" className="mt-4" icon={<Plus size={16} weight="bold" />} onClick={() => setEditing("new")}>
        Add address
      </Button>
      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add address" : "Edit address"} className="w-[min(40rem,calc(100vw-2rem))]">
        {editing !== null ? (
          <AddressForm
            key={editing === "new" ? "new" : editing.id}
            address={editing === "new" ? undefined : editing}
            onSaved={() => {
              setEditing(null);
              toast.show("Address saved");
              router.refresh();
            }}
          />
        ) : null}
      </Dialog>
    </div>
  );
}
