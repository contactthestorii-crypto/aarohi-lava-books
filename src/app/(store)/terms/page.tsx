import type { Metadata } from "next";
import { ContentPage } from "@/components/content/ContentPage";
import { getSettings } from "@/services/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Terms for using this website and buying books.",
  alternates: { canonical: "/terms" },
};

export default async function Page() {
  const settings = await getSettings();
  return <ContentPage title="Terms and conditions" text={settings.pages.terms} />;
}
