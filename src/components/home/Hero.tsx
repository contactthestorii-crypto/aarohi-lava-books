"use client";

import {
  ArrowRight,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Package,
  ShoppingCart,
  Star,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import type { ShowcaseBook } from "@/lib/content/showcase";

interface SlideData {
  id: string;
  badge: string;
  badgeColor: string;
  titleLine1: string;
  titleLine2: string;
  titleGradient: string;
  subtitle: string;
  pricePaise: number;
  mrpPaise: number;
  discountBadge: string;
  highlights: string[];
  primaryBtnText: string;
  primaryBtnHref: string;
  secondaryBtnText?: string;
  secondaryBtnHref?: string;
  imageSrc: string;
  imageAlt: string;
  imageRatio: string;
  editionBadge: string;
  ratingText: string;
  bgGlowColor: string;
}

const SLIDES: SlideData[] = [
  // Slide 1: Dual Edition Flagship Showcase
  {
    id: "dual-edition",
    badge: "TSLPRB & TGPSC • OFFICIAL 2026 EDITION",
    badgeColor: "border-gold-400/40 bg-gold-400/10 text-gold-400",
    titleLine1: "PREPARE SMARTER.",
    titleLine2: "SCORE BETTER.",
    titleGradient: "from-gold-300 via-gold-400 to-amber-500",
    subtitle:
      "The definitive 360° General Studies preparation guide with 10 years of solved question papers for Telangana Sub-Inspector (Prelims & Mains).",
    pricePaise: 80900,
    mrpPaise: 89900,
    discountBadge: "10% OFF Special Launch",
    highlights: [
      "Prelims & Mains Solved Papers",
      "2026 Budget & Survey Included",
      "Topic-wise 360° Explanations",
      "Fast Direct Delivery Across TS",
    ],
    primaryBtnText: "ORDER ENGLISH EDITION",
    primaryBtnHref: "/books/target-police-general-studies-tslprb-tgpsc",
    secondaryBtnText: "ORDER TELUGU EDITION",
    secondaryBtnHref: "/books/target-police-general-studies-telugu",
    imageSrc: "/images/books/dual-books-3d-mockup.jpg",
    imageAlt: "Target Police 360 General Studies - English and Telugu Editions 3D Mockup",
    imageRatio: "aspect-[1200/896]",
    editionBadge: "English & Telugu Medium",
    ratingText: "4.9 / 5.0 Rating • Aspirants' #1 Choice",
    bgGlowColor: "bg-amber-500/15",
  },
  // Slide 2: English Medium Spotlight
  {
    id: "english-edition",
    badge: "ENGLISH MEDIUM • COMPREHENSIVE 360° GS",
    badgeColor: "border-blue-400/40 bg-blue-500/10 text-blue-300",
    titleLine1: "CRACK TSLPRB SI.",
    titleLine2: "COMPLETE 360° GS.",
    titleGradient: "from-blue-200 via-blue-400 to-cyan-300",
    subtitle:
      "All Telangana Sub-Inspector previous papers with in-depth general studies analysis. Includes Central & State Budgets 2026-27, Socio-Economic Survey, and Current Affairs.",
    pricePaise: 80900,
    mrpPaise: 89900,
    discountBadge: "10% OFF Launch Offer",
    highlights: [
      "Topic-wise PYQs (2012-2024)",
      "High-Yield Concept Clarity",
      "Socio-Economic Survey 2026",
      "Direct Publisher Dispatch",
    ],
    primaryBtnText: "ORDER ENGLISH EDITION",
    primaryBtnHref: "/books/target-police-general-studies-tslprb-tgpsc",
    secondaryBtnText: "VIEW TELUGU EDITION",
    secondaryBtnHref: "/books/target-police-general-studies-telugu",
    imageSrc: "/images/books/target-police-3d-english.jpg",
    imageAlt: "Target Police 360 General Studies - English Edition 3D Mockup",
    imageRatio: "aspect-[682/1024]",
    editionBadge: "English Medium • 2026 Data",
    ratingText: "4.9 / 5.0 Rating • English Medium",
    bgGlowColor: "bg-blue-600/15",
  },
  // Slide 3: Telugu Medium Spotlight
  {
    id: "telugu-edition",
    badge: "తెలుగు మీడియం • ప్రత్యేక ముద్రణ 2026",
    badgeColor: "border-red-400/40 bg-red-500/10 text-red-300",
    titleLine1: "లక్ష్యం పోలీస్ ఉద్యోగం.",
    titleLine2: "360° జనరల్ స్టడీస్.",
    titleGradient: "from-red-200 via-amber-300 to-gold-400",
    subtitle:
      "తెలంగాణ సబ్-ఇన్‌స్పెక్టర్ గత పరీక్షా పత్రాలు (ప్రిలిమ్స్ & మెయిన్స్) 360° సమగ్ర వివరణతో. తెలంగాణ చరిత్ర, ఉద్యమం, సామాజిక సర్వే 2026 మరియు రాష్ట్ర బడ్జెట్ అంశాలతో.",
    pricePaise: 80900,
    mrpPaise: 89900,
    discountBadge: "10% ప్రత్యేక రాయితీ",
    highlights: [
      "ప్రిలిమ్స్ & మెయిన్స్ సాల్వ్డ్ పేపర్స్",
      "టాపిక్-వైజ్ 360° సమగ్ర వివరణలు",
      "2026-27 రాష్ట్ర, కేంద్ర బడ్జెట్",
      "తెలంగాణ వ్యాప్తంగా వేగవంతమైన డెలివరీ",
    ],
    primaryBtnText: "ఆర్డర్ చేయండి - TELUGU EDITION",
    primaryBtnHref: "/books/target-police-general-studies-telugu",
    secondaryBtnText: "VIEW ENGLISH EDITION",
    secondaryBtnHref: "/books/target-police-general-studies-tslprb-tgpsc",
    imageSrc: "/images/books/target-police-telugu.jpg",
    imageAlt: "Target Police 360 General Studies - Telugu Edition Cover",
    imageRatio: "aspect-[682/1024]",
    editionBadge: "తెలుగు మీడియం • 2026 డేటా",
    ratingText: "4.9 / 5.0 Rating • తెలుగు మీడియం",
    bgGlowColor: "bg-red-600/15",
  },
];

export function Hero({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
  book?: ShowcaseBook;
  linkable?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-play interval (6 seconds)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  const slide = SLIDES[current];

  return (
    <section
      aria-label="Hero Banner Carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-[#02040a] text-white min-h-[82vh] lg:min-h-[88vh] xl:min-h-[92vh] flex flex-col justify-between border-b border-white/10 select-none"
    >
      {/* 1. Full-Screen Cinematic Ambient Lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        {/* Dynamic Slide Ambient Spotlight */}
        <div
          className={`absolute -top-32 right-1/4 h-[44rem] w-[44rem] rounded-full ${slide.bgGlowColor} blur-[150px] transition-colors duration-1000`}
        />
        {/* Left Side Glow */}
        <div className="absolute top-1/4 -left-32 h-[36rem] w-[36rem] rounded-full bg-red-600/[0.10] blur-[150px]" />
        {/* Bottom Stage Lighting */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent" />
        {/* Micro-dot Luxury Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70" />
      </div>

      {/* 2. Main Full-Screen Content Canvas */}
      <div className="container-page relative z-10 w-full flex-1 flex items-center py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-14 w-full">
          
          {/* LEFT SIDE: Typography, Offers & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left transition-all duration-500">
            
            {/* Animated Eyebrow Badge */}
            <div
              className={`inline-flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest backdrop-blur-xl shadow-lg transition-all duration-500 ${slide.badgeColor}`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
              </span>
              <span>{slide.badge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 font-display-condensed text-5xl sm:text-6xl lg:text-[4.5rem] font-black uppercase tracking-tight text-white leading-[1.0] drop-shadow-xl">
              {slide.titleLine1}
              <br />
              <span
                className={`text-transparent bg-clip-text bg-gradient-to-r ${slide.titleGradient}`}
              >
                {slide.titleLine2}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              {slide.subtitle}
            </p>

            {/* Studio Launch Price Card */}
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:px-5 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-black text-gold-400 tracking-tight">₹809</span>
                <span className="text-base text-slate-500 line-through">₹899</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                {slide.discountBadge}
              </span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline-block">
                • In Stock • Direct Publisher Dispatch
              </span>
            </div>

            {/* 4 Feature Checklist Points */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-200 w-full max-w-lg">
              {slide.highlights.map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                  <span className="font-medium">{item}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              <ButtonLink
                href={slide.primaryBtnHref}
                size="lg"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black uppercase tracking-wider shadow-[0_0_30px_rgba(220,38,38,0.45)] hover:shadow-[0_0_40px_rgba(220,38,38,0.65)] hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl"
              >
                <ShoppingCart size={18} weight="bold" className="mr-1 inline" /> {slide.primaryBtnText}
              </ButtonLink>

              {slide.secondaryBtnText && slide.secondaryBtnHref ? (
                <ButtonLink
                  href={slide.secondaryBtnHref}
                  size="lg"
                  variant="inverse"
                  icon={<ArrowRight size={18} weight="bold" />}
                  className="bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/20 font-black uppercase tracking-wider backdrop-blur-xl hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl shadow-lg hover:border-gold-400/50"
                >
                  {slide.secondaryBtnText}
                </ButtonLink>
              ) : null}

              <Link
                href="/track-order"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <Package size={16} weight="bold" />
                <span>Track Order</span>
              </Link>
            </div>

          </div>

          {/* RIGHT SIDE: 3D Product Showcase */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md sm:max-w-lg">
              
              {/* Floating Rating Badge */}
              <div className="absolute -top-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-[#0a1124]/90 border border-gold-400/40 px-3.5 py-1 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="flex text-gold-400">
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                </div>
                <span className="text-xs font-bold text-slate-100">{slide.ratingText}</span>
              </div>

              {/* 3D Showcase Card */}
              <Link
                href={slide.primaryBtnHref}
                className="group relative block w-full rounded-2xl overflow-hidden shadow-[0_35px_80px_rgba(0,0,0,0.95)] ring-1 ring-white/10 transition-all duration-500 hover:-translate-y-2 bg-[#040816]"
              >
                <div className={`relative w-full ${slide.imageRatio} max-h-[520px]`}>
                  <Image
                    src={slide.imageSrc}
                    alt={slide.imageAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 45vw, 90vw"
                    className="object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                  />
                  
                  {/* Floating Edition Tag */}
                  <span className="absolute bottom-3 left-3 rounded-md bg-[#02040a]/90 border border-gold-400/40 px-2.5 py-1 text-xs font-black uppercase text-gold-400 shadow-md backdrop-blur-md">
                    {slide.editionBadge}
                  </span>
                </div>
              </Link>

              {/* Direct Edition Navigation Links */}
              <div className="mt-4 grid grid-cols-2 gap-3 w-full">
                <Link
                  href="/books/target-police-general-studies-tslprb-tgpsc"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-gold-400/30 bg-white/[0.04] py-2 px-3 text-xs font-bold text-slate-200 hover:text-gold-400 hover:border-gold-400/60 hover:bg-white/[0.08] transition-all"
                >
                  <span>English Edition</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>

                <Link
                  href="/books/target-police-general-studies-telugu"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-white/[0.04] py-2 px-3 text-xs font-bold text-slate-200 hover:text-red-400 hover:border-red-500/60 hover:bg-white/[0.08] transition-all"
                >
                  <span>తెలుగు Edition</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3. Slider Navigation Controls & Indicator Dots */}
      <div className="relative z-20 w-full border-t border-white/[0.08] bg-black/50 py-3.5 backdrop-blur-xl">
        <div className="container-page flex items-center justify-between">
          
          {/* Trust Guarantees on Left */}
          <div className="hidden sm:flex items-center gap-6 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>In Stock • Ships in 24 Hours</span>
            </span>
            <span className="text-white/20">|</span>
            <span>Telangana SI (Prelims &amp; Mains) Solved Papers</span>
          </div>

          {/* Indicator Pills Center */}
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === current
                    ? "w-8 h-2.5 bg-gradient-to-r from-gold-400 to-amber-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                    : "w-2.5 h-2.5 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          {/* Left / Right Arrow Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/[0.05] text-white hover:bg-white/20 hover:border-gold-400/50 transition-all active:scale-95"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="flex size-9 items-center justify-center rounded-xl border border-white/20 bg-white/[0.05] text-white hover:bg-white/20 hover:border-gold-400/50 transition-all active:scale-95"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </div>

        </div>
      </div>

    </section>
  );
}
