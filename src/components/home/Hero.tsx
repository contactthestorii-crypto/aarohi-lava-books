import { ArrowRight, CheckCircle, Package, ShieldCheck, ShoppingCart, Star } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { ShowcaseBook } from "@/lib/content/showcase";

export function Hero({
  title,
  subtitle,
}: {
  title?: string;
  subtitle?: string;
  book?: ShowcaseBook;
  linkable?: boolean;
}) {
  return (
    <section className="relative w-full overflow-hidden bg-[#02040a] text-white border-b border-white/10">
      
      {/* 1. Deep Obsidian Studio Lighting & Spotlights */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        {/* Warm Golden Overhead Spotlight Centered on Books */}
        <div className="absolute -top-32 right-1/4 h-[44rem] w-[44rem] rounded-full bg-amber-400/[0.14] blur-[140px]" />
        {/* Subtle Crimson Accent on Left Side */}
        <div className="absolute top-1/4 -left-32 h-[36rem] w-[36rem] rounded-full bg-red-600/[0.12] blur-[150px]" />
        {/* Bottom Ambient Glow */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 h-[30rem] w-[60rem] rounded-full bg-blue-600/[0.08] blur-[160px]" />
        
        {/* Dark Reflective Studio Floor Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Micro-dot Luxury Studio Texture */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-70" />
      </div>

      {/* 2. Main Studio Showcase Canvas */}
      <div className="container-page relative z-10 w-full py-12 sm:py-16 lg:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-14">
          
          {/* LEFT SIDE: Bold Vector Typography & Instant Buy Actions */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold-400/40 bg-gold-400/[0.08] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-gold-400 shadow-[0_0_25px_rgba(250,204,21,0.2)] backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500" />
              </span>
              <span>TSLPRB &amp; TGPSC • OFFICIAL 2026 EDITION</span>
            </div>

            {/* Headline */}
            <h1 className="mt-5 font-display-condensed text-5xl sm:text-6xl lg:text-[4.5rem] font-black uppercase tracking-tight text-white leading-[1.0] drop-shadow-lg">
              PREPARE SMARTER.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-amber-500">
                SCORE BETTER.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              {subtitle || "The definitive 360° General Studies preparation guide with 10 years solved question papers for Telangana Sub-Inspector (Prelims & Mains)."}
            </p>

            {/* Studio Launch Price Card */}
            <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 sm:px-5 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-black text-gold-400 tracking-tight">₹809</span>
                <span className="text-base text-slate-500 line-through">₹899</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                10% OFF Special Launch
              </span>
              <span className="text-xs text-slate-300 font-medium">
                • Available in English &amp; Telugu
              </span>
            </div>

            {/* 4 Feature Checklist Points */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-200 w-full max-w-lg">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                <span className="font-medium">Prelims &amp; Mains Solved Papers</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                <span className="font-medium">2026 Budget &amp; Survey Included</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                <span className="font-medium">Topic-wise 360° Explanations</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                <span className="font-medium">Fast Direct Delivery Across TS</span>
              </div>
            </div>

            {/* Buy Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              <ButtonLink
                href="/books/target-police-general-studies-tslprb-tgpsc"
                size="lg"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black uppercase tracking-wider shadow-[0_0_30px_rgba(220,38,38,0.45)] hover:shadow-[0_0_40px_rgba(220,38,38,0.65)] hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl"
              >
                <ShoppingCart size={18} weight="bold" className="mr-1 inline" /> ORDER ENGLISH EDITION
              </ButtonLink>

              <ButtonLink
                href="/books/target-police-general-studies-telugu"
                size="lg"
                variant="inverse"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/20 font-black uppercase tracking-wider backdrop-blur-xl hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl shadow-lg hover:border-gold-400/50"
              >
                <ShoppingCart size={18} weight="bold" className="mr-1 inline" /> ORDER TELUGU EDITION
              </ButtonLink>

              <Link
                href="/track-order"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <Package size={16} weight="bold" />
                <span>Track Order</span>
              </Link>
            </div>

          </div>

          {/* RIGHT SIDE: The Matching 3D Dual-Book Studio Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-lg">
              
              {/* Floating Rating Badge */}
              <div className="absolute -top-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-[#0a1124]/90 border border-gold-400/40 px-3.5 py-1 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="flex text-gold-400">
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                </div>
                <span className="text-xs font-bold text-slate-100">4.9 / 5.0 Rating</span>
              </div>

              {/* 3D Dual-Book Mockup Card */}
              <div className="relative w-full aspect-[1200/896] rounded-2xl overflow-hidden shadow-[0_35px_80px_rgba(0,0,0,0.95)] ring-1 ring-white/10 group transition-all duration-500 hover:-translate-y-2">
                
                {/* Photorealistic 3D Render Image */}
                <Image
                  src="/images/books/dual-books-3d-mockup.jpg"
                  alt="Target Police 360° Explanation of General Studies - English and Telugu Editions 3D Mockup"
                  fill
                  priority
                  sizes="(min-width: 1024px) 42vw, 90vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />

                {/* Interactive Hotspot 1: English Book (Left Side of Image) */}
                <Link
                  href="/books/target-police-general-studies-tslprb-tgpsc"
                  aria-label="Order English Edition"
                  title="Click to view English Edition"
                  className="absolute rounded-xl transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-gold-400/70 hover:bg-gold-400/5 focus:outline-none"
                  style={{
                    left: "8%",
                    top: "8%",
                    width: "42%",
                    height: "82%",
                  }}
                >
                  <span className="sr-only">View English Edition</span>
                  <div className="absolute top-3 left-3 rounded-md bg-[#02040a]/85 border border-gold-400/40 px-2 py-0.5 text-[10px] font-black uppercase text-gold-400 shadow-md">
                    English
                  </div>
                </Link>

                {/* Interactive Hotspot 2: Telugu Book (Right Side of Image) */}
                <Link
                  href="/books/target-police-general-studies-telugu"
                  aria-label="Order Telugu Edition"
                  title="Click to view Telugu Edition"
                  className="absolute rounded-xl transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-red-500/70 hover:bg-red-500/5 focus:outline-none"
                  style={{
                    left: "50%",
                    top: "8%",
                    width: "42%",
                    height: "82%",
                  }}
                >
                  <span className="sr-only">View Telugu Edition</span>
                  <div className="absolute top-3 left-3 rounded-md bg-[#02040a]/85 border border-red-500/40 px-2 py-0.5 text-[10px] font-black uppercase text-red-400 shadow-md">
                    తెలుగు Medium
                  </div>
                </Link>

              </div>

              {/* Action Buttons Below Dual-Book Mockup */}
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

              {/* In-Stock Dispatch Note */}
              <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium text-slate-300">In Stock • Dispatches in 24 Hours directly from publisher</span>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 3. Bottom Minimal Trust Strip */}
      <div className="border-t border-white/[0.06] bg-black/40 py-4 backdrop-blur-md">
        <div className="container-page">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs sm:text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} weight="fill" className="text-emerald-400 shrink-0" />
              <span>Direct from Publisher</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
              <span>100% Genuine 2026 Print</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
              <span>TSLPRB &amp; TGPSC Solved Papers</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Package size={18} weight="fill" className="text-blue-400 shrink-0" />
              <span>Fast Courier Across Telangana</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
