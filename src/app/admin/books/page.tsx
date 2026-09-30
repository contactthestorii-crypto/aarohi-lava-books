import { Plus } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AdminPageHeader, AdminTable, EmptyRow, Td } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { formatPaise } from "@/lib/utils/money";
import { listAdminBooks } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Books" };

export default async function AdminBooksPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const { q, status } = await searchParams;
  const books = await listAdminBooks({ q, status });

  return (
    <div>
      <AdminPageHeader
        title="Books and stock"
        description="Prices, stock and publishing for every title."
        actions={
          <ButtonLink href="/admin/books/new" icon={<Plus size={16} weight="bold" />}>
            Add book
          </ButtonLink>
        }
      />
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <Input name="q" defaultValue={q} placeholder="Search title, author, ISBN, SKU" className="max-w-xs" aria-label="Search books" />
        <Select name="status" defaultValue={status ?? ""} className="max-w-44" aria-label="Status">
          <option value="">Active (not archived)</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
          <option value="archived">Archived</option>
        </Select>
        <button type="submit" className="h-11 rounded-[var(--radius-control)] bg-navy-900 px-4 text-sm font-semibold text-white">
          Filter
        </button>
      </form>
      <AdminTable head={["Book", "Status", "Price", "Stock", "Updated"]}>
        {books.length === 0 ? (
          <EmptyRow colSpan={5}>No books match.</EmptyRow>
        ) : (
          books.map((book) => (
            <tr key={book.id} className="hover:bg-navy-50">
              <Td>
                <Link href={`/admin/books/${book.id}`} className="flex items-center gap-3">
                  <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded bg-navy-50">
                    {book.cover ? <Image src={book.cover} alt="" fill sizes="36px" className="object-contain" /> : null}
                  </span>
                  <span>
                    <span className="line-clamp-1 font-semibold text-navy-700 hover:underline">{book.title}</span>
                    <span className="block text-xs text-muted">{[book.author, book.isbn ? `ISBN ${book.isbn}` : null].filter(Boolean).join(", ")}</span>
                  </span>
                </Link>
              </Td>
              <Td>
                <Badge tone={book.status === "published" ? "success" : book.status === "draft" ? "warning" : "neutral"}>{book.status}</Badge>
                {book.is_featured ? <Badge tone="brand" className="ml-1">featured</Badge> : null}
              </Td>
              <Td className="tabular-nums">
                {book.price_paise !== null ? formatPaise(book.price_paise) : <span className="text-warning">Not set</span>}
                {book.mrp_paise !== null && book.mrp_paise !== book.price_paise ? <s className="ml-1 text-xs text-muted">{formatPaise(book.mrp_paise)}</s> : null}
              </Td>
              <Td className="tabular-nums">
                <span className={book.stock.state === "out_of_stock" ? "font-semibold text-danger" : book.stock.state === "low_stock" ? "font-semibold text-warning" : undefined}>
                  {book.stock.available} available
                </span>
                {book.inventory?.reserved ? <span className="block text-xs text-muted">{book.inventory.reserved} reserved</span> : null}
              </Td>
              <Td className="text-muted">{new Date(book.updated_at).toLocaleDateString("en-IN")}</Td>
            </tr>
          ))
        )}
      </AdminTable>
    </div>
  );
}
