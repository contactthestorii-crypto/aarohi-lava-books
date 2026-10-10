import {
  BookOpen,
  ChartBar,
  Eye,
  Lightning,
  MapTrifold,
  Sparkle,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

const SNEAK_PEEKS = [
  {
    icon: MapTrifold,
    title: "High-Resolution Telangana Maps",
    description:
      "District-wise administrative boundaries, river basins, historic sites, and demographic distributions formatted for quick visual recall.",
    tag: "Visual Memory",
  },
  {
    icon: ChartBar,
    title: "Socio-Economic Survey 2026 Charts",
    description:
      "Official State SGDP growth numbers, sectoral allocations, per capita income comparisons, and flagship state welfare schemes.",
    tag: "Updated Facts",
  },
  {
    icon: BookOpen,
    title: "360° Previous Year Question Linkage",
    description:
      "Every question from 2012–2024 SI & Constable exams is linked with deep conceptual theory and probable 2026 exam variants.",
    tag: "PYQ Mastery",
  },
  {
    icon: Sparkle,
    title: "Tables, Matrices & Quick Revision Notes",
    description:
      "Summarized comparative tables for Indian Polity, Modern History, Science & Tech developments, and international awards.",
    tag: "Rapid Revision",
  },
];

export function InsideBookPreviewSection({ slug }: { slug: string }) {
  return (
    <section aria-labelledby="inside-preview-heading" className="container-page py-12 md:py-16">
      <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-navy-50/50 via-white to-navy-50/30 p-6 shadow-sm md:p-10 lg:p-12">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-400">
              <Eye size={14} weight="bold" /> Look Inside the Book
            </span>
            <h2
              id="inside-preview-heading"
              className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink md:text-3xl lg:text-4xl"
            >
              Engineered for Maximum Retention & Score
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              Take a look at how concepts, official surveys, district maps, and past question trends are presented inside
              the 2026 print edition.
            </p>
          </div>

          <ButtonLink
            href={`/books/${slug}`}
            size="md"
            icon={<Lightning size={16} weight="fill" />}
            className="shrink-0 bg-red-600 hover:bg-red-700"
          >
            Order Your Copy Today
          </ButtonLink>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: Realistic Open Book Preview Image */}
          <div className="relative mx-auto w-full lg:col-span-7">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line/80 bg-white p-2 shadow-xl">
              <Image
                src="/images/ecommerce/book-inside-preview.jpg"
                alt="Open book pages showing Telangana geography map, socio-economic charts, and 360 degree exam questions"
                fill
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="rounded-xl object-cover transition-transform duration-500 hover:scale-[1.02]"
              />
              <div className="absolute bottom-4 left-4 rounded-lg bg-navy-950/90 px-3 py-1 text-xs font-bold text-white shadow-md backdrop-blur-md">
                Sample Pages: General Studies & Telangana Economy
              </div>
            </div>
          </div>

          {/* Right: Detailed Feature Highlights */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {SNEAK_PEEKS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-line/80 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 ring-1 ring-line group-hover:bg-navy-900 group-hover:text-gold-400">
                      <Icon size={18} weight="duotone" />
                    </span>
                    <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-black text-navy-950">
                      {item.tag}
                    </span>
                  </div>
                  <h3 className="mt-2.5 font-display text-sm font-bold text-ink group-hover:text-navy-700">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
