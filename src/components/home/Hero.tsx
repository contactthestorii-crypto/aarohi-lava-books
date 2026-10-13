"use client";

import {
  ArrowRight,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Package,
  ShieldCheck,
  ShoppingCart,
  Sparkle,
  Star,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import type { ShowcaseBook } from "@/lib/content/showcase";

interface SlideData {
  id: string;
  tabLabel: string;
  badge: string;
  badgeColor: string;
  titleLine1: string;
  titleLine2: string;
  titleGradient: string;
  subtitle: string;
  authorInfo: string;
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
  editionBadge: string;
  ratingScore: string;
  ratingText: string;
  glowColor: string;
}

const SLIDES: SlideData[] = [
  // Slide 1: Dual Flagship Edition
  {
    id: "dual-edition",
    tabLabel: "Dual Editions (Both Books)",
    badge: "TSLPRB • TGPSC • UPSC • APPSC • OFFICIAL 2026 RELEASE",
    badgeColor: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    titleLine1: "PREPARE SMARTER.",
    titleLine2: "SCORE HIGHER.",
    titleGradient: "from-amber-200 via-amber-400 to-yellow-500",
    subtitle:
      "The definitive 360° General Studies guide with 6 years of official solved papers (2016–2023) for Telangana Police SI, Groups and State Civil Services.",
    authorInfo: "Author: Swathylava Neralla (M.Sc, M.A) • 624 Pages Solved Papers",
    pricePaise: 79900,
    mrpPaise: 89900,
    discountBadge: "Special Price: ₹799 (MRP ₹899)",
    highlights: [
      "TSLPRB SI Prelims & Mains Solved Papers (2016–2023)",
      "Central & State Budgets 2026–27 & Socio-Economic Survey",
      "Topic-Wise 360° Conceptual Analysis & PYQ Trends",
      "Fast Direct Dispatch from Hyderabad Across TS & AP",
    ],
    primaryBtnText: "ORDER ENGLISH EDITION",
    primaryBtnHref: "/books/target-police-general-studies-tslprb-tgpsc",
    secondaryBtnText: "ORDER TELUGU EDITION",
    secondaryBtnHref: "/books/target-police-general-studies-telugu",
    imageSrc: "/images/books/dual-books-3d-mockup.jpg",
    imageAlt: "Target Police 360 General Studies - English and Telugu Editions 3D Mockup",
    editionBadge: "English & Telugu Medium",
    ratingScore: "5.0",
    ratingText: "5.0 / 5.0 Rating • Aspirants' First Choice",
    glowColor: "from-amber-500/20 via-orange-500/10 to-transparent",
  },
  // Slide 2: English Medium Spotlight
  {
    id: "english-edition",
    tabLabel: "English Medium",
    badge: "ENGLISH MEDIUM • COMPREHENSIVE 360° GS",
    badgeColor: "border-blue-400/40 bg-blue-500/10 text-blue-300",
    titleLine1: "TARGET POLICE 2026.",
    titleLine2: "COMPLETE 360° GS.",
    titleGradient: "from-sky-200 via-blue-400 to-indigo-300",
    subtitle:
      "Complete General Studies previous question papers with exam-oriented 360° explanations. Updated with 2026 state socio-economic surveys, budgets, and awards.",
    authorInfo: "Author: Swathylava Neralla (M.Sc, M.A) • Aarohi Lava Publications",
    pricePaise: 79900,
    mrpPaise: 89900,
    discountBadge: "Special Price: ₹799 (11% Off)",
    highlights: [
      "700+ Official SI Questions Solved with Detailed Notes",
      "11 Core Subject Modules from History to Science & Tech",
      "Socio-Economic Outlook 2026 & Latest State Budgets",
      "Paperback Edition • 624 Pages • 2026 Revised Print",
    ],
    primaryBtnText: "ORDER ENGLISH EDITION",
    primaryBtnHref: "/books/target-police-general-studies-tslprb-tgpsc",
    secondaryBtnText: "VIEW TELUGU EDITION",
    secondaryBtnHref: "/books/target-police-general-studies-telugu",
    imageSrc: "/images/books/target-police-3d-english.jpg",
    imageAlt: "Target Police 360 General Studies - English Edition 3D Mockup",
    editionBadge: "English Medium • 2026 Print",
    ratingScore: "5.0",
    ratingText: "5.0 / 5.0 Rating • English Medium",
    glowColor: "from-blue-600/20 via-sky-500/10 to-transparent",
  },
  // Slide 3: Telugu Medium Spotlight
  {
    id: "telugu-edition",
    tabLabel: "తెలుగు మీడియం (Telugu)",
    badge: "తెలుగు మీడియం • ప్రత్యేక ముద్రణ 2026",
    badgeColor: "border-red-400/40 bg-red-500/10 text-red-300",
    titleLine1: "టార్గెట్ పోలీస్ 2026.",
    titleLine2: "360° జనరల్ స్టడీస్.",
    titleGradient: "from-amber-200 via-rose-300 to-amber-400",
    subtitle:
      "తెలంగాణ సబ్-ఇన్స్పెక్టర్ ప్రిలిమ్స్ మరియు మెయిన్స్ (2016–2023) అన్ని గత ప్రశ్నా పత్రాలు 360° సమగ్ర వివరణలతో. తెలంగాణ చరిత్ర, ఉద్యమం, మరియు సామాజిక ఆర్థిక సర్వే 2026 అంశాలతో.",
    authorInfo: "రచయిత్రి: స్వాతిలావ నేరళ్ల (M.Sc, M.A) • ఆరోహి లావా పబ్లికేషన్స్",
    pricePaise: 79900,
    mrpPaise: 89900,
    discountBadge: "ప్రత్యేక ధర: ₹799 (MRP ₹899)",
    highlights: [
      "ఎస్సై ప్రిలిమ్స్ & మెయిన్స్ సాల్వ్డ్ పేపర్లు (2016–2023)",
      "టాపిక్-వైజ్ 360° విశ్లేషణ మరియు 700+ పరీక్ష ప్రశ్నల సాధన",
      "2026–27 రాష్ట్ర & కేంద్ర బడ్జెట్, సోషియో-ఎకనామిక్ సర్వే 2026",
      "తెలంగాణ & AP వ్యాప్తంగా 24 గంటల్లో డిస్పాచ్",
    ],
    primaryBtnText: "ఆర్డర్ చేయండి - TELUGU EDITION",
    primaryBtnHref: "/books/target-police-general-studies-telugu",
    secondaryBtnText: "VIEW ENGLISH EDITION",
    secondaryBtnHref: "/books/target-police-general-studies-tslprb-tgpsc",
    imageSrc: "/images/books/target-police-3d-telugu.jpg",
    imageAlt: "Target Police 360 General Studies - Telugu Edition 3D Mockup",
    editionBadge: "తెలుగు మీడియం • 2026 ముద్రణ",
    ratingScore: "5.0",
    ratingText: "5.0 / 5.0 Rating • తెలుగు మీడియం",
    glowColor: "from-rose-600/20 via-amber-500/10 to-transparent",
  },
];

export function Hero(_props: {
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Auto-play timer (7 seconds)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 7000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section
      aria-label="Hero Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-gradient-to-b from-[#050B17] via-[#091224] to-[#040813] text-white border-b border-white/10 select-none"
    >
      {/* Background Studio Lighting Atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Dynamic ambient spotlight */}
        <div
          className={`absolute -top-40 right-1/4 h-[48rem] w-[48rem] rounded-full bg-gradient-to-br ${SLIDES[current].glowColor} blur-[140px] transition-all duration-1000 ease-out`}
        />
        {/* Secondary soft rim light */}
        <div className="absolute top-1/3 -left-20 h-[36rem] w-[36rem] rounded-full bg-red-700/[0.08] blur-[140px]" />
        {/* Floor pedestal light */}
        <div className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#020409] via-[#020409]/60 to-transparent" />
        {/* Luxury geometric stardust mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,#000_65%,transparent_100%)] opacity-80" />
      </div>

      {/* Main Container */}
      <div className="container-page relative z-10 w-full pt-8 sm:pt-10 lg:pt-12 pb-10 sm:pb-14">
        
        {/* Interactive Edition Navigation Tabs */}
        <div className="mb-8 flex items-center justify-start sm:justify-center overflow-x-auto scrollbar-none py-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] p-1.5 backdrop-blur-2xl shadow-xl">
            {SLIDES.map((s, idx) => {
              const isActive = idx === current;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className={`relative flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? "bg-white text-navy-950 shadow-md scale-[1.02]"
                      : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {isActive ? (
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  ) : null}
                  <span>{s.tabLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Grid: Text on Left, Fixed-Stage 3D Book on Right */}
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-14 min-h-[500px] sm:min-h-[540px]">
          
          {/* LEFT COLUMN: Slide Content */}
          <div className="lg:col-span-7 relative min-h-[440px] flex flex-col justify-center">
            {SLIDES.map((s, idx) => {
              const isActive = idx === current;
              return (
                <div
                  key={s.id}
                  aria-hidden={!isActive}
                  className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isActive
                      ? "opacity-100 translate-x-0 relative z-10 pointer-events-auto"
                      : "opacity-0 -translate-x-6 absolute inset-0 z-0 pointer-events-none"
                  }`}
                >
                  {/* Eyebrow Badge */}
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-xl shadow-sm ${s.badgeColor}`}
                  >
                    <Sparkle size={14} weight="fill" className="text-current" />
                    <span>{s.badge}</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="mt-4 font-display-condensed text-4xl sm:text-5xl lg:text-[4rem] font-black uppercase tracking-tight text-white leading-[1.05]">
                    {s.titleLine1}
                    <br />
                    <span
                      className={`text-transparent bg-clip-text bg-gradient-to-r ${s.titleGradient}`}
                    >
                      {s.titleLine2}
                    </span>
                  </h1>

                  {/* Author Credential */}
                  <p className="mt-2 text-xs sm:text-sm font-semibold tracking-wide text-amber-300/90">
                    {s.authorInfo}
                  </p>

                  {/* Subtitle */}
                  <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-normal">
                    {s.subtitle}
                  </p>

                  {/* Price & Offer Card */}
                  <div className="mt-5 flex flex-wrap items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 px-4 sm:px-5 backdrop-blur-xl shadow-lg w-fit">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-amber-400 tracking-tight">
                        ₹{Math.round(s.pricePaise / 100)}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        ₹{Math.round(s.mrpPaise / 100)}
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                      {s.discountBadge}
                    </span>
                    <span className="text-xs text-slate-300 font-medium hidden sm:inline-block">
                      • In Stock • 2026 Print
                    </span>
                  </div>

                  {/* Highlights Checklist */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-200 max-w-xl">
                    {s.highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2">
                        <CheckCircle size={16} weight="fill" className="text-amber-400 shrink-0" />
                        <span className="font-medium leading-tight">{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Action Buttons */}
                  <div className="mt-7 flex flex-wrap items-center gap-3.5">
                    <ButtonLink
                      href={s.primaryBtnHref}
                      size="lg"
                      icon={<ArrowRight size={18} weight="bold" />}
                      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black uppercase tracking-wider shadow-[0_4px_25px_rgba(220,38,38,0.45)] hover:shadow-[0_6px_35px_rgba(220,38,38,0.65)] hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl"
                    >
                      <ShoppingCart size={18} weight="bold" className="mr-1 inline" /> {s.primaryBtnText}
                    </ButtonLink>

                    {s.secondaryBtnText && s.secondaryBtnHref ? (
                      <ButtonLink
                        href={s.secondaryBtnHref}
                        size="lg"
                        variant="inverse"
                        icon={<ArrowRight size={18} weight="bold" />}
                        className="bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/20 font-bold uppercase tracking-wider backdrop-blur-xl hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl hover:border-amber-400/50"
                      >
                        {s.secondaryBtnText}
                      </ButtonLink>
                    ) : null}

                    <Link
                      href="/track-order"
                      className="inline-flex items-center gap-1.5 px-2 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                      <Package size={15} weight="bold" />
                      <span>Track Order</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: 3D Book Showcase Stage with Stable Crossfade */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md sm:max-w-lg">
              
              {/* Floating Social Proof Badge */}
              <div className="absolute -top-3 right-4 z-30 flex items-center gap-1.5 rounded-full bg-[#070e20]/95 border border-amber-400/40 px-3 py-1 shadow-xl backdrop-blur-xl">
                <div className="flex text-amber-400">
                  <Star size={12} weight="fill" />
                  <Star size={12} weight="fill" />
                  <Star size={12} weight="fill" />
                  <Star size={12} weight="fill" />
                  <Star size={12} weight="fill" />
                </div>
                <span className="text-xs font-bold text-slate-100">
                  {SLIDES[current].ratingText}
                </span>
              </div>

              {/* Fixed-Height 3D Showcase Stage */}
              <div className="relative h-[420px] sm:h-[480px] lg:h-[520px] w-full flex items-center justify-center p-4">
                
                {/* Stage Floor Glow & Realistic Shadow */}
                <div className="pointer-events-none absolute bottom-4 inset-x-8 h-10 rounded-full bg-black/80 blur-xl" />
                <div className="pointer-events-none absolute bottom-2 inset-x-16 h-6 rounded-full bg-black/95 blur-md" />

                {/* Cross-Fading Book Renders */}
                {SLIDES.map((s, idx) => {
                  const isActive = idx === current;
                  return (
                    <div
                      key={s.id}
                      aria-hidden={!isActive}
                      className={`absolute inset-0 flex items-center justify-center p-3 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                        isActive
                          ? "opacity-100 scale-100 z-20 pointer-events-auto"
                          : "opacity-0 scale-95 z-0 pointer-events-none"
                      }`}
                    >
                      <Link
                        href={s.primaryBtnHref}
                        className="group relative block w-full h-full flex items-center justify-center"
                      >
                        <div className="relative w-full h-full max-h-[480px] transition-transform duration-500 group-hover:scale-105">
                          <Image
                            src={s.imageSrc}
                            alt={s.imageAlt}
                            fill
                            priority
                            sizes="(min-width: 1024px) 40vw, 85vw"
                            className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]"
                          />
                        </div>

                        {/* Floating Edition Tag */}
                        <span className="absolute bottom-3 left-4 rounded-md bg-[#02040a]/90 border border-amber-400/40 px-2.5 py-1 text-xs font-bold uppercase text-amber-300 shadow-lg backdrop-blur-md">
                          {s.editionBadge}
                        </span>
                      </Link>
                    </div>
                  );
                })}
              </div>

              {/* Direct Edition Quick Access Switcher */}
              <div className="mt-2 grid grid-cols-2 gap-3 w-full">
                <Link
                  href="/books/target-police-general-studies-tslprb-tgpsc"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-400/30 bg-white/[0.04] py-2 px-3 text-xs font-bold text-slate-200 hover:text-blue-300 hover:border-blue-400/60 hover:bg-white/[0.08] transition-all"
                >
                  <span>English Edition</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>

                <Link
                  href="/books/target-police-general-studies-telugu"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-white/[0.04] py-2 px-3 text-xs font-bold text-slate-200 hover:text-red-300 hover:border-red-500/60 hover:bg-white/[0.08] transition-all"
                >
                  <span>తెలుగు Edition</span>
                  <ArrowRight size={12} weight="bold" />
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Bottom Status Bar with Indicators & Controls */}
      <div className="relative z-20 w-full border-t border-white/[0.08] bg-black/60 py-3 backdrop-blur-xl">
        <div className="container-page flex items-center justify-between">
          
          {/* Trust Highlights on Left */}
          <div className="hidden sm:flex items-center gap-5 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={16} weight="fill" className="text-emerald-400" />
              <span>Official Publisher • In Stock</span>
            </span>
            <span className="text-white/20">•</span>
            <span>UPSC • TGPSC • TSLPRB • APPSC 2026 Solved Papers</span>
          </div>

          {/* Center Indicator Dots */}
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            {SLIDES.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  idx === current
                    ? "w-8 h-2 bg-gradient-to-r from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(250,204,21,0.5)]"
                    : "w-2 h-2 bg-white/30 hover:bg-white/60"
                }`}
              />
            ))}
          </div>

          {/* Left / Right Arrow Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous slide"
              className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-white hover:bg-white/20 hover:border-amber-400/50 transition-all active:scale-95"
            >
              <CaretLeft size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next slide"
              className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-white hover:bg-white/20 hover:border-amber-400/50 transition-all active:scale-95"
            >
              <CaretRight size={16} weight="bold" />
            </button>
          </div>

        </div>
      </div>

    </section>
  );
}
