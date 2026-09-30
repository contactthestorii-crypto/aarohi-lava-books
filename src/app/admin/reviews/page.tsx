import { SealCheck, Star } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { moderateReviewAction } from "@/actions/admin/content";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { createServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

const TABS = [
  { value: "pending", label: "Waiting for approval" },
  { value: "approved", label: "Published" },
  { value: "hidden", label: "Hidden" },
];

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const requested = (await searchParams).status;
  const status = TABS.some((t) => t.value === requested) ? requested! : "pending";
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, body, author_name, verified_purchase, status, created_at, products(title, slug)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);
  type Row = { id: string; rating: number; title: string | null; body: string | null; author_name: string; verified_purchase: boolean; created_at: string; products: { title: string; slug: string } | null };
  const reviews = (data ?? []) as unknown as Row[];

  return (
    <div>
      <AdminPageHeader title="Reviews" description="Only published reviews appear on book pages and count towards ratings." />
      <nav className="mb-4 flex gap-1">
        {TABS.map((tab) => (
          <Link key={tab.value} href={`/admin/reviews?status=${tab.value}`} className={cn("rounded-full px-3 py-1.5 text-sm font-semibold", status === tab.value ? "bg-navy-900 text-white" : "bg-white ring-1 ring-line hover:bg-navy-50")}>
            {tab.label}
          </Link>
        ))}
      </nav>
      {reviews.length === 0 ? (
        <EmptyState icon={<Star />} title="Nothing here" description="New reviews appear here for moderation." />
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-[var(--radius-card)] border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="flex" aria-label={`${review.rating} stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={16} weight="fill" className={i < review.rating ? "text-gold-400" : "text-navy-100"} />
                    ))}
                  </span>
                  <span className="font-semibold">{review.author_name}</span>
                  {review.verified_purchase ? (
                    <Badge tone="success">
                      <SealCheck size={12} weight="fill" /> verified
                    </Badge>
                  ) : null}
                </span>
                <span className="text-xs text-muted">
                  {review.products ? `${review.products.title}, ` : ""}
                  {new Date(review.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
              {review.title ? <p className="mt-2 font-semibold">{review.title}</p> : null}
              {review.body ? <p className="mt-1 whitespace-pre-line text-sm">{review.body}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {status !== "approved" ? (
                  <ActionButton action={moderateReviewAction.bind(null, review.id, "approved")} variant="primary">
                    Publish
                  </ActionButton>
                ) : null}
                {status !== "hidden" ? <ActionButton action={moderateReviewAction.bind(null, review.id, "hidden")}>Hide</ActionButton> : null}
                <ActionButton action={moderateReviewAction.bind(null, review.id, "deleted")} variant="danger" confirm="Delete this review permanently?">
                  Delete
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
