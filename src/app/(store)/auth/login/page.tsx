import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/AuthForms";
import { Notice } from "@/components/ui/States";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation/auth";
import { AuthCard } from "../AuthCard";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getUser()) redirect(next);
  return (
    <AuthCard
      title="Sign in"
      description="Track orders, save addresses and check out faster."
      footer={
        <>
          New here?{" "}
          <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className="font-semibold text-navy-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {params.error === "link" ? (
        <Notice tone="error" className="mb-4">
          That link is invalid or has expired. Sign in, or request a new link.
        </Notice>
      ) : null}
      <LoginForm next={next} />
    </AuthCard>
  );
}
