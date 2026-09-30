import type { Metadata } from "next";
import { ContentPage } from "@/components/content/ContentPage";
import { getSettings } from "@/services/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Returns and refunds",
  description: "Cancellations, damaged or wrong books, and refunds.",
  alternates: { canonical: "/returns" },
};

export default async function Page() {
  const settings = await getSettings();
  return <ContentPage title="Returns and refunds" text={settings.pages.returns_policy} />;
}
