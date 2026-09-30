"use client";

import { useActionState } from "react";
import { saveBookAction } from "@/actions/admin/books";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Notice } from "@/components/ui/States";
import { initialActionState, type ActionResult } from "@/lib/action-result";
import { paiseToRupeesInput } from "@/lib/utils/money";
import type { Category, Product } from "@/types";

export interface BookFormValues {
  product: Product | null;
  inventory: { quantity: number; reserved: number; lowStockThreshold: number; allowBackorder: boolean };
}

const NOT_KNOWN = "Leave empty if not known yet";

export function BookForm({ product, inventory, categories }: BookFormValues & { categories: Category[] }) {
  const [state, action, pending] = useActionState(saveBookAction, initialActionState as ActionResult<{ id: string }>);
  const e = state.ok ? {} : state.fieldErrors ?? {};
  const selected = new Set(product?.categories.map((c) => c.id) ?? []);
  const lines = (values: string[] | undefined) => (values ?? []).join("\n");

  return (
    <form action={action} className="grid gap-6" noValidate>
      {product ? <input type="hidden" name="id" value={product.id} /> : null}
      {state.ok && state.message ? <Notice tone="success">{state.message}</Notice> : null}
      {!state.ok && state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <Section title="Basics">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" htmlFor="title" required error={e.title} className="md:col-span-2">
            <Input id="title" name="title" defaultValue={product?.title} required invalid={Boolean(e.title)} />
          </Field>
          <Field label="Subtitle" htmlFor="subtitle" error={e.subtitle}>
            <Input id="subtitle" name="subtitle" defaultValue={product?.subtitle ?? ""} />
          </Field>
          <Field label="URL slug" htmlFor="slug" error={e.slug} hint="Generated from the title if empty. Changing it changes the page URL.">
            <Input id="slug" name="slug" defaultValue={product?.slug} invalid={Boolean(e.slug)} />
          </Field>
          <Field label="Author" htmlFor="author" error={e.author}>
            <Input id="author" name="author" defaultValue={product?.author ?? ""} />
          </Field>
          <Field label="Publisher" htmlFor="publisher" error={e.publisher}>
            <Input id="publisher" name="publisher" defaultValue={product?.publisher ?? ""} />
          </Field>
          <Field label="Description" htmlFor="description" error={e.description} className="md:col-span-2">
            <Textarea id="description" name="description" defaultValue={product?.description ?? ""} className="min-h-40" />
          </Field>
          <Field label="About the author" htmlFor="authorBio" error={e.authorBio} className="md:col-span-2">
            <Textarea id="authorBio" name="authorBio" defaultValue={product?.authorBio ?? ""} />
          </Field>
        </div>
      </Section>

      <Section title="Price and stock">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="MRP (₹)" htmlFor="mrp" error={e.mrpPaise} hint={NOT_KNOWN}>
            <Input id="mrp" name="mrp" inputMode="decimal" defaultValue={paiseToRupeesInput(product?.mrpPaise)} invalid={Boolean(e.mrpPaise)} />
          </Field>
          <Field label="Selling price (₹)" htmlFor="price" error={e.pricePaise} hint="Without a price the book shows 'Price to be announced'.">
            <Input id="price" name="price" inputMode="decimal" defaultValue={paiseToRupeesInput(product?.pricePaise)} invalid={Boolean(e.pricePaise)} />
          </Field>
          <Field label="SKU" htmlFor="sku" error={e.sku}>
            <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} invalid={Boolean(e.sku)} />
          </Field>
          <Field label="Stock on hand" htmlFor="quantity" error={e.quantity} hint={inventory.reserved > 0 ? `${inventory.reserved} reserved by unpaid orders` : "Copies you can ship now"}>
            <Input id="quantity" name="quantity" type="number" min={0} defaultValue={inventory.quantity} invalid={Boolean(e.quantity)} />
          </Field>
          <Field label="Low-stock alert at" htmlFor="lowStockThreshold" error={e.lowStockThreshold}>
            <Input id="lowStockThreshold" name="lowStockThreshold" type="number" min={0} defaultValue={inventory.lowStockThreshold} />
          </Field>
          <div className="flex items-end pb-2">
            <Checkbox name="allowBackorder" defaultChecked={inventory.allowBackorder} label="Allow orders when out of stock (backorder)" />
          </div>
        </div>
      </Section>

      <Section title="Book specifications">
        <p className="-mt-2 mb-4 text-sm text-muted">Only enter facts you have. Empty fields show as &ldquo;Not yet available&rdquo; on the book page.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="ISBN" htmlFor="isbn" error={e.isbn}>
            <Input id="isbn" name="isbn" defaultValue={product?.isbn ?? ""} invalid={Boolean(e.isbn)} />
          </Field>
          <Field label="Edition" htmlFor="edition" error={e.edition}>
            <Input id="edition" name="edition" defaultValue={product?.edition ?? ""} />
          </Field>
          <Field label="Publication year" htmlFor="publicationYear" error={e.publicationYear}>
            <Input id="publicationYear" name="publicationYear" inputMode="numeric" defaultValue={product?.publicationYear ?? ""} invalid={Boolean(e.publicationYear)} />
          </Field>
          <Field label="Pages" htmlFor="pages" error={e.pages}>
            <Input id="pages" name="pages" inputMode="numeric" defaultValue={product?.pages ?? ""} invalid={Boolean(e.pages)} />
          </Field>
          <Field label="Language" htmlFor="language" error={e.language}>
            <Input id="language" name="language" defaultValue={product?.language ?? ""} />
          </Field>
          <Field label="Binding" htmlFor="binding" error={e.binding}>
            <Input id="binding" name="binding" defaultValue={product?.binding ?? ""} placeholder="Paperback" />
          </Field>
          <Field label="Dimensions" htmlFor="dimensions" error={e.dimensions}>
            <Input id="dimensions" name="dimensions" defaultValue={product?.dimensions ?? ""} placeholder="24 x 18 x 2 cm" />
          </Field>
          <Field label="Weight (grams)" htmlFor="weightGrams" error={e.weightGrams} hint="Used for courier booking">
            <Input id="weightGrams" name="weightGrams" inputMode="numeric" defaultValue={product?.weightGrams ?? ""} invalid={Boolean(e.weightGrams)} />
          </Field>
        </div>
      </Section>

      <Section title="Content (one item per line)">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Key features" htmlFor="keyFeatures">
            <Textarea id="keyFeatures" name="keyFeatures" defaultValue={lines(product?.keyFeatures)} className="min-h-40" />
          </Field>
          <Field label="Contents / chapters" htmlFor="contents">
            <Textarea id="contents" name="contents" defaultValue={lines(product?.contents)} className="min-h-40" />
          </Field>
          <Field label="Exam coverage (subjects)" htmlFor="examCoverage">
            <Textarea id="examCoverage" name="examCoverage" defaultValue={lines(product?.examCoverage)} />
          </Field>
          <Field label="Exams (shown as tags, e.g. TSLPRB)" htmlFor="exams">
            <Textarea id="exams" name="exams" defaultValue={lines(product?.exams)} />
          </Field>
          <Field label="Search keywords" htmlFor="keywords" hint="Extra words people may search for" className="md:col-span-2">
            <Textarea id="keywords" name="keywords" defaultValue={lines(product?.keywords)} className="min-h-20" />
          </Field>
        </div>
      </Section>

      <Section title="Categories">
        {categories.length === 0 ? (
          <p className="text-sm text-muted">Create categories first.</p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <Checkbox key={category.id} name="categoryIds" value={category.id} defaultChecked={selected.has(category.id)} label={`${category.name} (${category.kind})`} />
              ))}
            </div>
            <Field label="Main category (used in breadcrumbs)" htmlFor="primaryCategoryId" className="mt-4 max-w-sm">
              <Select id="primaryCategoryId" name="primaryCategoryId" defaultValue={product?.primaryCategory?.id ?? ""}>
                <option value="">First selected category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}
      </Section>

      <Section title="Visibility and SEO">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Status" htmlFor="status">
            <Select id="status" name="status" defaultValue={product?.status ?? "draft"}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published</option>
              <option value="archived">Archived (hidden)</option>
            </Select>
          </Field>
          <div className="flex flex-col justify-end gap-2 pb-2 md:col-span-2">
            <Checkbox name="isFeatured" defaultChecked={product?.isFeatured} label="Featured on the homepage" />
            <Checkbox name="isBestseller" defaultChecked={product?.isBestseller} label="Show in Best sellers" />
          </div>
          <Field label="SEO title" htmlFor="seoTitle" error={e.seoTitle} hint="Up to 70 characters. Defaults to the book title.">
            <Input id="seoTitle" name="seoTitle" maxLength={70} defaultValue={product?.seoTitle ?? ""} />
          </Field>
          <Field label="SEO description" htmlFor="seoDescription" error={e.seoDescription} hint="Up to 170 characters" className="md:col-span-2">
            <Input id="seoDescription" name="seoDescription" maxLength={170} defaultValue={product?.seoDescription ?? ""} />
          </Field>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-line bg-white/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Button type="submit" size="lg" loading={pending}>
          {product ? "Save changes" : "Create book"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-[var(--radius-card)] border border-line bg-white p-5">
      <legend className="px-1 font-display text-lg font-extrabold">{title}</legend>
      {children}
    </fieldset>
  );
}
