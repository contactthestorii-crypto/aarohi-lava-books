import type { Metadata } from "next";
import { deleteFaqAction } from "@/actions/admin/content";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { FaqForm } from "@/components/admin/ContentForms";
import { Badge } from "@/components/ui/Badge";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "FAQs" };
export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  const { data } = await (await createServerSupabase()).from("faqs").select("id, question, answer, sort_order, is_active").order("sort_order");
  const faqs = (data ?? []) as { id: string; question: string; answer: string; sort_order: number; is_active: boolean }[];
  return (
    <div className="space-y-6">
      <AdminPageHeader title="FAQs" description="Shown on the FAQ page and the homepage." />
      <AdminCard title="Add FAQ">
        <FaqForm />
      </AdminCard>
      <AdminCard title="Questions">
        <ul className="divide-y divide-line">
          {faqs.map((faq) => (
            <li key={faq.id} className="py-3">
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                  <span className="font-semibold">{faq.question}</span>
                  <span className="flex shrink-0 items-center gap-2 text-sm">
                    {!faq.is_active ? <Badge>hidden</Badge> : null}
                    <span className="font-semibold text-navy-700">Edit</span>
                  </span>
                </summary>
                <div className="mt-4 rounded-[var(--radius-control)] bg-navy-50 p-4">
                  <FaqForm value={{ id: faq.id, question: faq.question, answer: faq.answer, sortOrder: faq.sort_order, isActive: faq.is_active }} />
                  <div className="mt-4 border-t border-line pt-4">
                    <ActionButton action={deleteFaqAction.bind(null, faq.id)} variant="danger" confirm="Delete this FAQ?">
                      Delete
                    </ActionButton>
                  </div>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
