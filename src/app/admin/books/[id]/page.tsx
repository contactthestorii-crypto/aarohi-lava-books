import { ArrowSquareOut } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setBookStatusAction } from "@/actions/admin/books";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { BookForm } from "@/components/admin/BookForm";
import { BookImages } from "@/components/admin/BookImages";
import { ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/States";
import { getAdminBook, listAllCategories } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Edit book" };

export default async function EditBookPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [book, categories, { created }] = await Promise.all([getAdminBook(id), listAllCategories(), searchParams]);
  if (!book) notFound();
  const { product, inventory } = book;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={product.title}
        back={{ href: "/admin/books", label: "Back to books" }}
        actions={
          <>
            {product.status === "published" ? (
              <ButtonLink href={`/books/${product.slug}`} target="_blank" variant="secondary" size="sm" icon={<ArrowSquareOut size={16} />}>
                View in store
              </ButtonLink>
            ) : (
              <ActionButton action={setBookStatusAction.bind(null, product.id, "published")} variant="primary">
                Publish
              </ActionButton>
            )}
            {product.status !== "archived" ? (
              <ActionButton action={setBookStatusAction.bind(null, product.id, "archived")} variant="danger" confirm="Archive this book? It will be hidden from the store. Past orders keep their details.">
                Archive
              </ActionButton>
            ) : (
              <ActionButton action={setBookStatusAction.bind(null, product.id, "draft")}>Restore as draft</ActionButton>
            )}
          </>
        }
      />
      {created ? <Notice tone="success">Book created. Add images below.</Notice> : null}
      <AdminCard title="Images">
        <BookImages productId={product.id} images={product.images} />
      </AdminCard>
      <BookForm
        product={product}
        inventory={{ quantity: inventory.quantity, reserved: inventory.reserved, lowStockThreshold: inventory.low_stock_threshold, allowBackorder: inventory.allow_backorder }}
        categories={categories}
      />
    </div>
  );
}
