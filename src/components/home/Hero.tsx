import { ArrowRight, CheckCircle, Package, Sparkle, Star } from "@phosphor-icons/react/ssr";
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
    <section className="relative overflow-hidden bg-gradient-to-b from-[#040816] via-[#08122a] to-[#040816] text-white py-12 sm:py-16 lg:py-24 border-b border-navy-800/80">
      
      {/* Background Lighting & Ambiance */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Warm red glow top-left */}
        <div className="absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-red-600/15 blur-[120px]" />
        {/* Golden glow behind books */}
        <div className="absolute top-1/4 right-0 h-[40rem] w-[40rem] rounded-full bg-gold-400/10 blur-[140px]" />
        {/* Soft cyan bottom accent */}
        <div className="absolute -bottom-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-blue-600/10 blur-[130px]" />
        
        {/* Subtle high-tech grid texture */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container-page relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-14">
          
          {/* Left Column: Razor-Sharp Vector Typography & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-gold-400/40 bg-gold-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-gold-400 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500" />
              </span>
              <span>TSLPRB &amp; TGPSC • 2026 UPDATED EDITION</span>
            </div>

            {/* Main Headline */}
            <h1 className="mt-5 font-display-condensed text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[1.02]">
              PREPARE SMARTER.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-gold-400 to-amber-500">
                SCORE BETTER.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              {subtitle || "Complete exam-focused coverage and previous question papers for Telangana Sub-Inspector (Prelims & Mains) with 360° General Studies analysis."}
            </p>

            {/* Pricing & Launch Offer Card */}
            <div className="mt-6 flex flex-wrap items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:px-5 backdrop-blur-md shadow-xl">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gold-400 tracking-tight">₹809</span>
                <span className="text-base text-slate-400 line-through">₹899</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                10% OFF Special Launch
              </span>
              <span className="text-xs text-slate-300 font-medium">
                • Available in English &amp; Telugu
              </span>
            </div>

            {/* Highlights Checklist */}
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

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              <ButtonLink
                href="/books/target-police-general-studies-tslprb-tgpsc"
                size="lg"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black uppercase tracking-wider shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:shadow-[0_0_35px_rgba(220,38,38,0.6)] hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl"
              >
                Order English Edition
              </ButtonLink>

              <ButtonLink
                href="/books/target-police-general-studies-telugu"
                size="lg"
                variant="inverse"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-navy-900/90 hover:bg-navy-800 text-white border border-white/20 font-black uppercase tracking-wider backdrop-blur-md hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl shadow-lg"
              >
                Order Telugu Edition
              </ButtonLink>

              <Link
                href="/track-order"
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Package size={18} weight="bold" />
                <span>Track Order</span>
              </Link>
            </div>

          </div>

          {/* Right Column: Realistic 3D Books Showcase */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-md sm:max-w-lg py-4">
              
              {/* Rating floating badge */}
              <div className="absolute -top-4 right-2 sm:right-6 z-20 flex items-center gap-1.5 rounded-full bg-navy-950/90 border border-gold-400/40 px-3.5 py-1 shadow-2xl backdrop-blur-md">
                <div className="flex text-gold-400">
                  <Star size={14} weight="fill" />
                  <Star size={14} weight="fill" />
                  <Star size={14} weight="fill" />
                  <Star size={14} weight="fill" />
                  <Star size={14} weight="fill" />
                </div>
                <span className="text-xs font-bold text-slate-200">4.9 / 5.0 Rating</span>
              </div>

              {/* Books Grid */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 items-end">
                
                {/* Book 1: English Edition (Realistic 3D Mockup) */}
                <Link
                  href="/books/target-police-general-studies-tslprb-tgpsc"
                  className="group relative flex flex-col items-center transition-all duration-500 hover:-translate-y-3"
                >
                  <div className="relative w-full aspect-[682/1024] rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group-hover:ring-gold-400/50 group-hover:shadow-[0_30px_60px_rgba(217,119,6,0.35)] transition-all bg-navy-950">
                    <Image
                      src="/images/books/target-police-3d-english.jpg"
                      alt="Target Police 360 General Studies 3D Book - English Medium"
                      fill
                      sizes="(min-width: 1024px) 25vw, 45vw"
                      className="object-contain p-1 transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-navy-950/90 border border-gold-400/40 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-gold-400 shadow-lg">
                      English
                    </span>
                  </div>

                  <div className="mt-3.5 text-center">
                    <p className="text-xs sm:text-sm font-bold text-white group-hover:text-gold-400 transition-colors">
                      English Medium
                    </p>
                    <span className="text-[11px] sm:text-xs text-red-400 font-semibold inline-flex items-center gap-1 group-hover:underline">
                      View details <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </Link>

                {/* Book 2: Telugu Edition (High-Res 3D styled cover) */}
                <Link
                  href="/books/target-police-general-studies-telugu"
                  className="group relative flex flex-col items-center transition-all duration-500 hover:-translate-y-3"
                >
                  <div className="relative w-full aspect-[682/1024] rounded-2xl overflow-hidden shadow-[0_25px_50px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group-hover:ring-red-400/50 group-hover:shadow-[0_30px_60px_rgba(220,38,38,0.35)] transition-all bg-navy-950">
                    <Image
                      src="/images/books/target-police-telugu.jpg"
                      alt="Target Police 360 General Studies Book - Telugu Medium"
                      fill
                      sizes="(min-width: 1024px) 25vw, 45vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    <span className="absolute top-2.5 left-2.5 rounded-md bg-navy-950/90 border border-red-500/40 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-red-400 shadow-lg">
                      తెలుగు Medium
                    </span>
                  </div>

                  <div className="mt-3.5 text-center">
                    <p className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                      Telugu Medium
                    </p>
                    <span className="text-[11px] sm:text-xs text-red-400 font-semibold inline-flex items-center gap-1 group-hover:underline">
                      View details <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </Link>

              </div>

              {/* In-Stock Dispatch Note */}
              <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-medium">In Stock • Dispatches in 24 Hours directly from publisher</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
