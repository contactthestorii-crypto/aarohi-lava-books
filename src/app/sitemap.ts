import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";
import { getAllProductSlugs, getCategories } from "@/services/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getAllProductSlugs(), getCategories().catch(() => [])]);
  const now = new Date();
  const staticPages = ["", "/books", "/about", "/contact", "/faq", "/track-order", "/shipping-policy", "/returns", "/privacy-policy", "/terms"];
  return [
    ...staticPages.map((path) => ({
      url: `${siteUrl}${path}`,
      lastModified: now,
      changeFrequency: path === "" || path === "/books" ? ("daily" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/books" ? 0.9 : 0.4,
    })),
    ...categories.map((category) => ({
      url: `${siteUrl}/categories/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${siteUrl}/books/${product.slug}`,
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
