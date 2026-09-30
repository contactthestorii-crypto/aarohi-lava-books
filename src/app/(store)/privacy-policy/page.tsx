import type { Metadata } from "next";
import { ContentPage } from "@/components/content/ContentPage";
import { getSettings } from "@/services/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Aarohi Lava Publications collects and uses your information.",
  alternates: { canonical: "/privacy-policy" },
};

export default async function Page() {
  const settings = await getSettings();
  return <ContentPage title="Privacy policy" text={settings.pages.privacy_policy} />;
}
