import { ChatCircleText } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";
import { setMessageStatusAction } from "@/actions/admin/content";
import { ActionButton } from "@/components/admin/ActionButton";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { formatDateTime } from "@/components/orders/OrderViews";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const supabase = await createServerSupabase();
  const [{ data }, { count: subscribers }] = await Promise.all([
    supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
  ]);
  type Row = { id: string; name: string; email: string; phone: string | null; subject: string | null; message: string; status: "new" | "read" | "resolved"; created_at: string };
  const messages = (data ?? []) as Row[];
  return (
    <div>
      <AdminPageHeader title="Messages" description={`Contact form messages. ${subscribers ?? 0} newsletter subscribers.`} />
      {messages.length === 0 ? (
        <EmptyState icon={<ChatCircleText />} title="No messages yet" description="Messages from the contact page appear here." />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-[var(--radius-card)] border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <span className="font-semibold">{m.name}</span>{" "}
                  <a href={`mailto:${m.email}`} className="text-sm text-navy-700 hover:underline">
                    {m.email}
                  </a>
                  {m.phone ? <span className="text-sm text-muted">, {m.phone}</span> : null}
                </span>
                <span className="flex items-center gap-2 text-xs text-muted">
                  <Badge tone={m.status === "new" ? "warning" : m.status === "resolved" ? "success" : "neutral"}>{m.status}</Badge>
                  {formatDateTime(m.created_at)}
                </span>
              </div>
              {m.subject ? <p className="mt-2 font-semibold">{m.subject}</p> : null}
              <p className="mt-1 whitespace-pre-line text-sm">{m.message}</p>
              <div className="mt-3 flex gap-2">
                {m.status !== "read" ? <ActionButton action={setMessageStatusAction.bind(null, m.id, "read")}>Mark read</ActionButton> : null}
                {m.status !== "resolved" ? (
                  <ActionButton action={setMessageStatusAction.bind(null, m.id, "resolved")} variant="primary">
                    Resolved
                  </ActionButton>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
