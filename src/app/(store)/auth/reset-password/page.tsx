import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { getUser } from "@/lib/auth";
import { AuthCard } from "../AuthCard";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function ResetPasswordPage() {
  // The recovery link signs the user in via /auth/confirm; without that session the link expired.
  if (!(await getUser())) redirect("/auth/login?error=link");
  return (
    <AuthCard title="Choose a new password">
      <ResetPasswordForm />
    </AuthCard>
  );
}
