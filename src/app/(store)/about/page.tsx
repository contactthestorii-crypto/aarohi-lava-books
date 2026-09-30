import type { Metadata } from "next";
import { ContentPage } from "@/components/content/ContentPage";
import { getSettings } from "@/services/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About us",
  description: "Aarohi Lava Publications publishes exam preparation books for TSLPRB, TGPSC and other Telangana competitive exams.",
  alternates: { canonical: "/about" },
};

export default async function Page() {
  const settings = await getSettings();
  return <ContentPage title="About us" text={settings.pages.about} />;
}
