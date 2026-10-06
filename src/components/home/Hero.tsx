import { ArrowRight, CheckCircle, Package, ShieldCheck, ShoppingCart, Sparkle, Star } from "@phosphor-icons/react/ssr";
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
      
      {/* 1. Obsidian Dark Studio Lighting & Spotlights */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
        {/* Overhead Gold Spotlight on Books (Right Side) */}
        <div className="absolute -top-32 right-1/4 h-[42rem] w-[42rem] rounded-full bg-amber-400/[0.12] blur-[140px]" />
        {/* Subtle Crimson Accent Spotlight (Left Side) */}
        <div className="absolute top-1/4 -left-32 h-[36rem] w-[36rem] rounded-full bg-red-600/[0.12] blur-[150px]" />
        {/* Deep Studio Ambient Glow */}
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 h-[30rem] w-[60rem] rounded-full bg-blue-600/[0.08] blur-[160px]" />
        
        {/* Dark Reflective Studio Floor Gradient */}
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black via-black/60 to-transparent" />
        
        {/* Micro-dot Luxury Grid Texture */}
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

          {/* RIGHT SIDE: The 3D Books Spotlight Showcase (100% Focused & Pristine) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-md sm:max-w-lg py-4">
              
              {/* Floating Rating Badge */}
              <div className="absolute -top-4 right-2 sm:right-6 z-30 flex items-center gap-1.5 rounded-full bg-[#0a1124]/90 border border-gold-400/40 px-3.5 py-1 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="flex text-gold-400">
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                </div>
                <span className="text-xs font-bold text-slate-100">4.9 / 5.0 Rating</span>
              </div>

              {/* Books Grid */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 items-end">
                
                {/* 1. English Edition (Authentic 3D Mockup with Spine) */}
                <Link
                  href="/books/target-police-general-studies-tslprb-tgpsc"
                  className="group relative flex flex-col items-center cursor-pointer transition-all duration-500 hover:-translate-y-4"
                >
                  {/* Book Card with Deep Studio Shadow */}
                  <div className="relative w-full aspect-[682/1024] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.95)] ring-1 ring-white/10 group-hover:ring-gold-400/60 group-hover:shadow-[0_35px_80px_rgba(217,119,6,0.35)] transition-all bg-[#040816]">
                    <Image
                      src="/images/books/target-police-3d-english.jpg"
                      alt="Target Police 360° Explanation of General Studies - English Medium"
                      fill
                      priority
                      sizes="(min-width: 1024px) 25vw, 45vw"
                      className="object-contain p-0.5 transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Badge */}
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-[#02040a]/90 border border-gold-400/40 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-gold-400 shadow-md backdrop-blur-md">
                      English
                    </span>
                  </div>

                  {/* Floor Reflection Effect */}
                  <div className="w-[85%] h-6 bg-gradient-to-b from-amber-500/10 to-transparent blur-md -mt-2 rounded-full pointer-events-none" />

                  {/* Title & View CTA */}
                  <div className="mt-2 text-center">
                    <p className="text-xs sm:text-sm font-extrabold uppercase text-white tracking-wider group-hover:text-gold-400 transition-colors">
                      ENGLISH MEDIUM
                    </p>
                    <span className="text-[11px] sm:text-xs text-gold-400 font-bold inline-flex items-center gap-1 group-hover:underline mt-0.5">
                      View details <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </Link>

                {/* 2. Telugu Edition (Authentic High-Res Cover with Realistic 3D Paperback Styling) */}
                <Link
                  href="/books/target-police-general-studies-telugu"
                  className="group relative flex flex-col items-center cursor-pointer transition-all duration-500 hover:-translate-y-4"
                >
                  {/* Book Card with Deep Studio Shadow */}
                  <div className="relative w-full aspect-[682/1024] rounded-2xl overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.95)] ring-1 ring-white/10 group-hover:ring-red-500/60 group-hover:shadow-[0_35px_80px_rgba(220,38,38,0.35)] transition-all bg-[#040816]">
                    <Image
                      src="/images/books/target-police-telugu.jpg"
                      alt="Target Police 360° Explanation of General Studies - Telugu Medium"
                      fill
                      priority
                      sizes="(min-width: 1024px) 25vw, 45vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Realistic 3D Spine Depth on Left Edge */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/70 via-black/25 to-transparent z-10" />

                    {/* Badge */}
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-[#02040a]/90 border border-red-500/40 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-red-400 shadow-md backdrop-blur-md">
                      తెలుగు Medium
                    </span>
                  </div>

                  {/* Floor Reflection Effect */}
                  <div className="w-[85%] h-6 bg-gradient-to-b from-red-500/10 to-transparent blur-md -mt-2 rounded-full pointer-events-none" />

                  {/* Title & View CTA */}
                  <div className="mt-2 text-center">
                    <p className="text-xs sm:text-sm font-extrabold uppercase text-white tracking-wider group-hover:text-red-400 transition-colors">
                      TELUGU MEDIUM
                    </p>
                    <span className="text-[11px] sm:text-xs text-gold-400 font-bold inline-flex items-center gap-1 group-hover:underline mt-0.5">
                      View details <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </Link>

              </div>

              {/* In-Stock Dispatch Callout */}
              <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
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
            <div className="flex items-center gap-2">
              <Package size={18} weight="fill" className="text-blue-400 shrink-0" />
              <span>Fast Courier Across Telangana</span>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
