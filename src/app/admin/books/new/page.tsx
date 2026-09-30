import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { BookForm } from "@/components/admin/BookForm";
import { listAllCategories } from "@/services/admin-catalog";

export const metadata: Metadata = { title: "Add book" };

export default async function NewBookPage() {
  const categories = await listAllCategories();
  return (
    <div>
      <AdminPageHeader title="Add book" description="Save the book first, then add images." back={{ href: "/admin/books", label: "Back to books" }} />
      <BookForm product={null} inventory={{ quantity: 0, reserved: 0, lowStockThreshold: 5, allowBackorder: false }} categories={categories} />
    </div>
  );
}
