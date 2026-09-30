import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk } from "next/font/google";
import { TestModeBanner } from "@/components/layout/TestModeBanner";
import { ToastProvider } from "@/components/ui/Toast";
import { siteUrl } from "@/lib/config";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Aarohi Lava Publications | Books for TSLPRB, TGPSC and competitive exams",
    template: "%s | Aarohi Lava Publications",
  },
  description:
    "Buy exam-focused books and previous question papers for TSLPRB, TGPSC and other competitive exams directly from Aarohi Lava Publications.",
  applicationName: "Aarohi Lava Publications",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Aarohi Lava Publications",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#10214d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${archivo.variable} ${hanken.variable}`}>
      <body className="min-h-dvh bg-white antialiased">
        <TestModeBanner />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
