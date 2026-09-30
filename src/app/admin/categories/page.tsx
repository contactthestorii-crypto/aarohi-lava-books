import type { Metadata } from "next";
import Link from "next/link";
import { deleteCategoryAction } from "@/actions/admin/content";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { CategoryForm } from "@/components/admin/ContentForms";
import { Badge } from "@/components/ui/Badge";
import { listAllCategories } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await listAllCategories();
  const groups = [
    { kind: "exam", label: "Exams" },
    { kind: "type", label: "Book types" },
    { kind: "subject", label: "Subjects" },
  ] as const;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Categories" description="Exams, book types and subjects shown in navigation and filters." />
      <AdminCard title="Add category">
        <CategoryForm />
      </AdminCard>
      {groups.map((group) => {
        const items = categories.filter((c) => c.kind === group.kind);
        return (
          <AdminCard key={group.kind} title={`${group.label} (${items.length})`}>
            {items.length === 0 ? (
              <p className="text-sm text-muted">None yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {items.map((category) => (
                  <li key={category.id} className="py-3">
                    <details>
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">
                          {category.name} <span className="text-xs font-normal text-muted">/{category.slug}</span>
                          {!category.isActive ? <Badge className="ml-2">hidden</Badge> : null}
                        </span>
                        <span className="flex items-center gap-3 text-sm">
                          <Link href={`/categories/${category.slug}`} target="_blank" className="text-navy-700 hover:underline">
                            View
                          </Link>
                          <span className="font-semibold text-navy-700">Edit</span>
                        </span>
                      </summary>
                      <div className="mt-4 rounded-[var(--radius-control)] bg-navy-50 p-4">
                        <CategoryForm
                          value={{
                            id: category.id,
                            name: category.name,
                            slug: category.slug,
                            kind: category.kind,
                            description: category.description,
                            sortOrder: category.sortOrder,
                            isActive: category.isActive,
                            seoTitle: category.seoTitle,
                            seoDescription: category.seoDescription,
                          }}
                        />
                        <div className="mt-4 border-t border-line pt-4">
                          <ActionButton action={deleteCategoryAction.bind(null, category.id)} variant="danger" confirm={`Delete ${category.name}?`}>
                            Delete category
                          </ActionButton>
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        );
      })}
    </div>
  );
}
