"use client";

import { CaretLeft, CaretRight, MagnifyingGlassPlus } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/utils/cn";
import type { ProductImage } from "@/types";
import { TypographicCover } from "./TypographicCover";

/** Main image, thumbnails, arrow navigation and a full-size zoom view. */
export function BookGallery({
  images,
  title,
  subtitle = null,
  author = null,
  exams = [],
}: {
  images: ProductImage[];
  title: string;
  subtitle?: string | null;
  author?: string | null;
  exams?: string[];
}) {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);

  if (images.length === 0) {
    const isTargetPolice = title.toLowerCase().includes("target police");
    if (isTargetPolice) {
      return (
        <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[var(--radius-card)] bg-navy-50/60 p-4 shadow-[var(--shadow-card)]">
          <Image
            src="/images/ecommerce/target-police-3d.jpg"
            alt={`${title} 3D Cover Mockup`}
            fill
            priority
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-contain p-2 drop-shadow-[0_12px_24px_rgb(16_33_77/0.25)]"
          />
        </div>
      );
    }
    return (
      <div className="mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-[var(--radius-card)] shadow-[var(--shadow-card)]">
        <TypographicCover product={{ title, subtitle, author, exams }} />
      </div>
    );
  }

  const current = images[index];
  const alt = current.alt || `${title} cover`;
  const go = (delta: number) => setIndex((i) => (i + delta + images.length) % images.length);

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse">
      <div className="relative flex-1">
        <button
          type="button"
          onClick={() => setZoomOpen(true)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setLens({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 });
          }}
          onMouseLeave={() => setLens(null)}
          aria-label={`Zoom image: ${alt}`}
          className="group relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-[var(--radius-card)] bg-navy-50"
        >
          <Image
            key={current.id}
            src={current.url}
            alt={alt}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 480px, 100vw"
            className="object-contain p-4 transition-transform duration-200 md:p-8"
            style={lens ? { transform: "scale(1.9)", transformOrigin: `${lens.x}% ${lens.y}%` } : undefined}
          />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm">
            <MagnifyingGlassPlus size={16} /> Zoom
          </span>
        </button>
        {images.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm hover:bg-white"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <ul className="scrollbar-none flex gap-2 overflow-x-auto md:w-20 md:flex-col md:overflow-visible" aria-label="Product images">
          {images.map((image, i) => (
            <li key={image.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "relative block h-24 w-18 overflow-hidden rounded-[var(--radius-control)] border-2 bg-navy-50 md:w-20",
                  i === index ? "border-navy-900" : "border-transparent hover:border-line",
                )}
              >
                <Image src={image.url} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog open={zoomOpen} onClose={() => setZoomOpen(false)} title={title} className="w-[min(56rem,calc(100vw-1rem))]">
        <div className="relative mx-auto aspect-[3/4] max-h-[80dvh] w-full">
          <Image src={current.url} alt={alt} fill sizes="90vw" className="object-contain" />
        </div>
        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-2">
            <button type="button" onClick={() => go(-1)} className="rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-semibold">
              Previous
            </button>
            <button type="button" onClick={() => go(1)} className="rounded-[var(--radius-control)] border border-line px-4 py-2 text-sm font-semibold">
              Next
            </button>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
