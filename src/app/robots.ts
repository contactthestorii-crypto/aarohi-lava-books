import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production" || !process.env.VERCEL_ENV;
  return {
    rules: isProduction
      ? [
          {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin", "/account", "/checkout", "/cart", "/order-success", "/auth", "/api", "/search"],
          },
        ]
      : // Preview deployments must not be indexed.
        [{ userAgent: "*", disallow: "/" }],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
