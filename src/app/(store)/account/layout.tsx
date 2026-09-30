import { signOutAction } from "@/actions/auth";
import { AccountNav } from "@/components/account/AccountNav";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/account");
  return (
    <div className="container-page py-6 md:py-10">
      <div className="grid gap-6 lg:grid-cols-[14rem_1fr] lg:gap-10">
        <aside>
          <AccountNav />
          <form action={signOutAction} className="mt-2 hidden lg:block">
            <button
              type="submit"
              className="w-full rounded-[var(--radius-control)] px-3 py-2.5 text-left text-sm font-semibold text-muted hover:bg-red-50 hover:text-danger"
            >
              Sign out
            </button>
          </form>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
