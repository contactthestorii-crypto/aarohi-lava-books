"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { saveBannerAction, saveCategoryAction, saveCouponAction, saveFaqAction, saveSettingsAction } from "@/actions/admin/content";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { initialActionState, type ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

/** Form shell: runs the action, shows the result, refreshes and optionally resets on success. */
function AdminForm({ action, children, submitLabel, resetOnSuccess = false, className }: { action: Action; children: (errors: Record<string, string>) => ReactNode; submitLabel: string; resetOnSuccess?: boolean; className?: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    if (resetOnSuccess) formRef.current?.reset();
  }, [state, router, resetOnSuccess]);
  const errors = state.ok ? {} : state.fieldErrors ?? {};
  return (
    <form ref={formRef} action={formAction} className={className ?? "grid gap-4"} noValidate>
      {state.ok && state.message ? <Notice tone="success">{state.message}</Notice> : null}
      {!state.ok && state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {children(errors)}
      <Button type="submit" variant="dark" loading={pending} className="justify-self-start">
        {submitLabel}
      </Button>
    </form>
  );
}

export interface CategoryValues {
  id?: string;
  name?: string;
  slug?: string;
  kind?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

export function CategoryForm({ value }: { value?: CategoryValues }) {
  const p = value?.id ? `c-${value.id}-` : "c-new-";
  return (
    <AdminForm action={saveCategoryAction} submitLabel={value?.id ? "Save category" : "Add category"} resetOnSuccess={!value?.id}>
      {(e) => (
        <div className="grid gap-4 md:grid-cols-2">
          {value?.id ? <input type="hidden" name="id" value={value.id} /> : null}
          <Field label="Name" htmlFor={`${p}name`} error={e.name}>
            <Input id={`${p}name`} name="name" defaultValue={value?.name} invalid={Boolean(e.name)} />
          </Field>
          <Field label="Slug" htmlFor={`${p}slug`} error={e.slug} hint="Generated from the name if empty">
            <Input id={`${p}slug`} name="slug" defaultValue={value?.slug} invalid={Boolean(e.slug)} />
          </Field>
          <Field label="Type" htmlFor={`${p}kind`}>
            <Select id={`${p}kind`} name="kind" defaultValue={value?.kind ?? "subject"}>
              <option value="exam">Exam</option>
              <option value="subject">Subject</option>
              <option value="type">Book type</option>
            </Select>
          </Field>
          <Field label="Sort order" htmlFor={`${p}sort`} hint="Lower shows first">
            <Input id={`${p}sort`} name="sortOrder" type="number" min={0} defaultValue={value?.sortOrder ?? 0} />
          </Field>
          <Field label="Description" htmlFor={`${p}desc`} className="md:col-span-2">
            <Textarea id={`${p}desc`} name="description" defaultValue={value?.description ?? ""} className="min-h-20" />
          </Field>
          <Field label="SEO title" htmlFor={`${p}seoTitle`}>
            <Input id={`${p}seoTitle`} name="seoTitle" maxLength={70} defaultValue={value?.seoTitle ?? ""} />
          </Field>
          <Field label="SEO description" htmlFor={`${p}seoDesc`}>
            <Input id={`${p}seoDesc`} name="seoDescription" maxLength={170} defaultValue={value?.seoDescription ?? ""} />
          </Field>
          <Checkbox name="isActive" defaultChecked={value?.isActive ?? true} label="Visible in the store" />
        </div>
      )}
    </AdminForm>
  );
}

export interface CouponValues {
  id?: string;
  code?: string;
  description?: string | null;
  type?: "percent" | "fixed";
  value?: string;
  maxDiscount?: string;
  minOrder?: string;
  startsAt?: string;
  expiresAt?: string;
  maxUses?: string;
  perCustomerLimit?: string;
  appliesTo?: "all" | "products" | "categories";
  productIds?: string[];
  categoryIds?: string[];
  isActive?: boolean;
}

export function CouponForm({ value, books, categories }: { value?: CouponValues; books: { id: string; title: string }[]; categories: { id: string; name: string }[] }) {
  const [appliesTo, setAppliesTo] = useState(value?.appliesTo ?? "all");
  const [type, setType] = useState(value?.type ?? "percent");
  const p = value?.id ? `k-${value.id}-` : "k-new-";
  return (
    <AdminForm action={saveCouponAction} submitLabel={value?.id ? "Save coupon" : "Create coupon"} resetOnSuccess={!value?.id}>
      {(e) => (
        <div className="grid gap-4 md:grid-cols-3">
          {value?.id ? <input type="hidden" name="id" value={value.id} /> : null}
          <Field label="Code" htmlFor={`${p}code`} error={e.code}>
            <Input id={`${p}code`} name="code" defaultValue={value?.code} className="uppercase" invalid={Boolean(e.code)} />
          </Field>
          <Field label="Type" htmlFor={`${p}type`}>
            <Select id={`${p}type`} name="type" value={type} onChange={(ev) => setType(ev.target.value as "percent" | "fixed")}>
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off (₹)</option>
            </Select>
          </Field>
          <Field label={type === "percent" ? "Percent (1-100)" : "Amount (₹)"} htmlFor={`${p}value`} error={e.value}>
            <Input id={`${p}value`} name="value" inputMode="decimal" defaultValue={value?.value} invalid={Boolean(e.value)} />
          </Field>
          {type === "percent" ? (
            <Field label="Maximum discount (₹)" htmlFor={`${p}max`} error={e.maxDiscount} hint="Optional cap">
              <Input id={`${p}max`} name="maxDiscount" inputMode="decimal" defaultValue={value?.maxDiscount} />
            </Field>
          ) : null}
          <Field label="Minimum order (₹)" htmlFor={`${p}min`} error={e.minOrder}>
            <Input id={`${p}min`} name="minOrder" inputMode="decimal" defaultValue={value?.minOrder} />
          </Field>
          <Field label="Description (internal)" htmlFor={`${p}desc`}>
            <Input id={`${p}desc`} name="description" defaultValue={value?.description ?? ""} />
          </Field>
          <Field label="Starts (IST)" htmlFor={`${p}start`} error={e.startsAt}>
            <Input id={`${p}start`} name="startsAt" type="datetime-local" defaultValue={value?.startsAt} />
          </Field>
          <Field label="Expires (IST)" htmlFor={`${p}end`} error={e.expiresAt}>
            <Input id={`${p}end`} name="expiresAt" type="datetime-local" defaultValue={value?.expiresAt} invalid={Boolean(e.expiresAt)} />
          </Field>
          <Field label="Total uses allowed" htmlFor={`${p}uses`} error={e.maxUses} hint="Empty = unlimited">
            <Input id={`${p}uses`} name="maxUses" inputMode="numeric" defaultValue={value?.maxUses} />
          </Field>
          <Field label="Uses per customer" htmlFor={`${p}per`} error={e.perCustomerLimit} hint="Matched by account, email or phone">
            <Input id={`${p}per`} name="perCustomerLimit" inputMode="numeric" defaultValue={value?.perCustomerLimit} />
          </Field>
          <Field label="Applies to" htmlFor={`${p}applies`}>
            <Select id={`${p}applies`} name="appliesTo" value={appliesTo} onChange={(ev) => setAppliesTo(ev.target.value as "all" | "products" | "categories")}>
              <option value="all">Whole order</option>
              <option value="products">Selected books</option>
              <option value="categories">Selected categories</option>
            </Select>
          </Field>
          {appliesTo === "products" ? (
            <fieldset className="md:col-span-3">
              <legend className="mb-2 text-sm font-semibold">Books {e.productIds ? <span className="text-danger">({e.productIds})</span> : null}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {books.map((book) => (
                  <Checkbox key={book.id} name="productIds" value={book.id} defaultChecked={value?.productIds?.includes(book.id)} label={book.title} />
                ))}
              </div>
            </fieldset>
          ) : null}
          {appliesTo === "categories" ? (
            <fieldset className="md:col-span-3">
              <legend className="mb-2 text-sm font-semibold">Categories {e.categoryIds ? <span className="text-danger">({e.categoryIds})</span> : null}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {categories.map((category) => (
                  <Checkbox key={category.id} name="categoryIds" value={category.id} defaultChecked={value?.categoryIds?.includes(category.id)} label={category.name} />
                ))}
              </div>
            </fieldset>
          ) : null}
          <Checkbox name="isActive" defaultChecked={value?.isActive ?? true} label="Active" className="md:col-span-3" />
        </div>
      )}
    </AdminForm>
  );
}

export interface BannerValues {
  id?: string;
  placement?: string;
  title?: string;
  subtitle?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export function BannerForm({ value }: { value?: BannerValues }) {
  const p = value?.id ? `b-${value.id}-` : "b-new-";
  return (
    <AdminForm action={saveBannerAction} submitLabel={value?.id ? "Save banner" : "Add banner"} resetOnSuccess={!value?.id}>
      {(e) => (
        <div className="grid gap-4 md:grid-cols-2">
          {value?.id ? <input type="hidden" name="id" value={value.id} /> : null}
          <Field label="Placement" htmlFor={`${p}placement`} hint="Announcement = thin bar above the header">
            <Select id={`${p}placement`} name="placement" defaultValue={value?.placement ?? "announcement"}>
              <option value="announcement">Announcement bar</option>
              <option value="promo">Promo</option>
              <option value="hero">Hero</option>
            </Select>
          </Field>
          <Field label="Sort order" htmlFor={`${p}sort`}>
            <Input id={`${p}sort`} name="sortOrder" type="number" min={0} defaultValue={value?.sortOrder ?? 0} />
          </Field>
          <Field label="Text" htmlFor={`${p}title`} error={e.title} className="md:col-span-2">
            <Input id={`${p}title`} name="title" defaultValue={value?.title} invalid={Boolean(e.title)} />
          </Field>
          <Field label="Secondary text" htmlFor={`${p}subtitle`} className="md:col-span-2">
            <Input id={`${p}subtitle`} name="subtitle" defaultValue={value?.subtitle ?? ""} />
          </Field>
          <Field label="Link" htmlFor={`${p}link`} error={e.linkUrl} hint="/books/... or https://...">
            <Input id={`${p}link`} name="linkUrl" defaultValue={value?.linkUrl ?? ""} invalid={Boolean(e.linkUrl)} />
          </Field>
          <Field label="Link label" htmlFor={`${p}label`}>
            <Input id={`${p}label`} name="linkLabel" maxLength={40} defaultValue={value?.linkLabel ?? ""} />
          </Field>
          <Field label="Show from (IST)" htmlFor={`${p}start`}>
            <Input id={`${p}start`} name="startsAt" type="datetime-local" defaultValue={value?.startsAt} />
          </Field>
          <Field label="Show until (IST)" htmlFor={`${p}end`}>
            <Input id={`${p}end`} name="endsAt" type="datetime-local" defaultValue={value?.endsAt} />
          </Field>
          <Checkbox name="isActive" defaultChecked={value?.isActive ?? true} label="Active" />
        </div>
      )}
    </AdminForm>
  );
}

export function FaqForm({ value }: { value?: { id: string; question: string; answer: string; sortOrder: number; isActive: boolean } }) {
  const p = value?.id ? `f-${value.id}-` : "f-new-";
  return (
    <AdminForm action={saveFaqAction} submitLabel={value?.id ? "Save" : "Add FAQ"} resetOnSuccess={!value?.id}>
      {(e) => (
        <div className="grid gap-4">
          {value?.id ? <input type="hidden" name="id" value={value.id} /> : null}
          <Field label="Question" htmlFor={`${p}q`} error={e.question}>
            <Input id={`${p}q`} name="question" defaultValue={value?.question} invalid={Boolean(e.question)} />
          </Field>
          <Field label="Answer" htmlFor={`${p}a`} error={e.answer}>
            <Textarea id={`${p}a`} name="answer" defaultValue={value?.answer} invalid={Boolean(e.answer)} />
          </Field>
          <div className="flex flex-wrap items-center gap-4">
            <Field label="Sort order" htmlFor={`${p}s`} className="w-32">
              <Input id={`${p}s`} name="sortOrder" type="number" min={0} defaultValue={value?.sortOrder ?? 0} />
            </Field>
            <Checkbox name="isActive" defaultChecked={value?.isActive ?? true} label="Visible" />
          </div>
        </div>
      )}
    </AdminForm>
  );
}

export type SettingsFieldDef =
  | { name: string; label: string; type: "text" | "email" | "tel" | "textarea"; value: string; hint?: string }
  | { name: string; label: string; type: "money" | "number" | "percent"; value: string; hint?: string }
  | { name: string; label: string; type: "checkbox"; value: boolean; hint?: string };

export function SettingsSection({ section, fields }: { section: string; fields: SettingsFieldDef[] }) {
  return (
    <AdminForm action={saveSettingsAction} submitLabel="Save">
      {(e) => (
        <div className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="section" value={section} />
          {fields.map((field) => {
            const fieldId = `${section}-${field.name}`;
            if (field.type === "checkbox") {
              return (
                <div key={field.name} className="md:col-span-2">
                  <Checkbox name={field.name} defaultChecked={field.value} label={field.label} />
                  {field.hint ? <p className="ml-7 text-sm text-muted">{field.hint}</p> : null}
                </div>
              );
            }
            const label = field.type === "money" ? `${field.label} (₹)` : field.type === "percent" ? `${field.label} (%)` : field.label;
            return (
              <Field key={field.name} label={label} htmlFor={fieldId} error={e[field.name]} hint={field.hint} className={field.type === "textarea" ? "md:col-span-2" : undefined}>
                {field.type === "textarea" ? (
                  <Textarea id={fieldId} name={field.name} defaultValue={field.value} className={field.value.length > 300 ? "min-h-64 font-mono text-sm" : "min-h-20"} />
                ) : (
                  <Input
                    id={fieldId}
                    name={field.name}
                    type={field.type === "email" || field.type === "tel" ? field.type : "text"}
                    inputMode={field.type === "money" || field.type === "number" || field.type === "percent" ? "decimal" : undefined}
                    defaultValue={field.value}
                    invalid={Boolean(e[field.name])}
                  />
                )}
              </Field>
            );
          })}
        </div>
      )}
    </AdminForm>
  );
}
