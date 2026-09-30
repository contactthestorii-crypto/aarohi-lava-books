import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/AuthForms";
import { getUser } from "@/lib/auth";
import { safeNext } from "@/lib/validation/auth";
import { AuthCard } from "../AuthCard";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  if (await getUser()) redirect(next);
  return (
    <AuthCard
      title="Create your account"
      description="You can also check out as a guest. An account keeps all your orders in one place."
      footer={
        <>
          Already have an account?{" "}
          <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="font-semibold text-navy-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthCard>
  );
}
