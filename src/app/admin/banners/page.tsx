import type { Metadata } from "next";
import { deleteBannerAction } from "@/actions/admin/content";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminCard, AdminPageHeader } from "@/components/admin/AdminUI";
import { BannerForm } from "@/components/admin/ContentForms";
import { Badge } from "@/components/ui/Badge";
import { createServerSupabase } from "@/lib/supabase/server";
import { toIstInput } from "@/lib/utils/dates";

export const metadata: Metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const { data } = await (await createServerSupabase()).from("banners").select("*").order("placement").order("sort_order");
  type Row = { id: string; placement: string; title: string; subtitle: string | null; link_url: string | null; link_label: string | null; sort_order: number; is_active: boolean; starts_at: string | null; ends_at: string | null };
  const banners = (data ?? []) as Row[];
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Banners" description="The announcement bar shows above the header on every store page." />
      <AdminCard title="Add banner">
        <BannerForm />
      </AdminCard>
      <AdminCard title="Banners">
        {banners.length === 0 ? (
          <p className="text-sm text-muted">No banners yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {banners.map((banner) => (
              <li key={banner.id} className="py-3">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <span>
                      <Badge tone="brand">{banner.placement}</Badge> <span className="font-semibold">{banner.title}</span>
                    </span>
                    <span className="flex items-center gap-2 text-sm">
                      {banner.is_active ? <Badge tone="success">active</Badge> : <Badge>inactive</Badge>}
                      <span className="font-semibold text-navy-700">Edit</span>
                    </span>
                  </summary>
                  <div className="mt-4 rounded-[var(--radius-control)] bg-navy-50 p-4">
                    <BannerForm
                      value={{
                        id: banner.id,
                        placement: banner.placement,
                        title: banner.title,
                        subtitle: banner.subtitle,
                        linkUrl: banner.link_url,
                        linkLabel: banner.link_label,
                        sortOrder: banner.sort_order,
                        isActive: banner.is_active,
                        startsAt: toIstInput(banner.starts_at),
                        endsAt: toIstInput(banner.ends_at),
                      }}
                    />
                    <div className="mt-4 border-t border-line pt-4">
                      <ActionButton action={deleteBannerAction.bind(null, banner.id)} variant="danger" confirm="Delete this banner?">
                        Delete
                      </ActionButton>
                    </div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>
    </div>
  );
}
