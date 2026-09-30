import type { Metadata } from "next";
import { ContentPage } from "@/components/content/ContentPage";
import { getSettings } from "@/services/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Shipping policy",
  description: "How we ship books, shipping charges and order tracking.",
  alternates: { canonical: "/shipping-policy" },
};

export default async function Page() {
  const settings = await getSettings();
  return <ContentPage title="Shipping policy" text={settings.pages.shipping_policy} />;
}
