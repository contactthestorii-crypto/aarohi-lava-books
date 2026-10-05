import { ArrowRight, CheckCircle, Package, Sparkle, Star } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { ShowcaseBook } from "@/lib/content/showcase";

export function Hero({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
  book: ShowcaseBook;
  linkable: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white py-12 lg:py-20 border-b border-navy-800/80">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-red-600/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[30rem] w-[30rem] rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="container-page relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          
          {/* Left Column: Headline, Highlights & CTAs */}
          <div className="lg:col-span-7 xl:col-span-6 flex flex-col items-start text-left">
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-gold-400 mb-6 shadow-sm">
              <Sparkle size={14} weight="fill" className="text-gold-400" />
              <span>TSLPRB & TGPSC • 2026 Updated Edition</span>
            </div>

            {/* Main title */}
            <h1 className="font-display-condensed text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-[1.08]">
              {title || "Target Police: 360° Explanation of General Studies"}
            </h1>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
              {subtitle || "Complete Telangana Sub-Inspector (Prelims & Mains) previous question papers with 360° topic-wise general studies analysis, Socio-Economic Survey 2026, and latest budget data."}
            </p>

            {/* Price & Offer banner */}
            <div className="mt-6 flex flex-wrap items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 sm:px-5 backdrop-blur-sm">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-gold-400">₹809</span>
                <span className="text-base text-slate-400 line-through">₹899</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                10% OFF Special Launch
              </span>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline-block">
                • Available in English & Telugu
              </span>
            </div>

            {/* Quick feature checklist */}
            <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-200">
              <li className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="shrink-0 text-gold-400" />
                <span>Prelims & Mains Solved Papers</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="shrink-0 text-gold-400" />
                <span>2026 Budget & Survey Included</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="shrink-0 text-gold-400" />
                <span>Topic-wise 360° Explanations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={18} weight="fill" className="shrink-0 text-gold-400" />
                <span>Fast Direct Delivery Across TS</span>
              </li>
            </ul>

            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <ButtonLink
                href="/books/target-police-general-studies-tslprb-tgpsc"
                size="lg"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:-translate-y-0.5 transition-all flex-row-reverse"
              >
                Order English Edition
              </ButtonLink>

              <ButtonLink
                href="/books/target-police-general-studies-telugu"
                size="lg"
                variant="inverse"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-navy-800/80 hover:bg-navy-700/80 text-white border border-white/20 font-bold uppercase tracking-wider hover:-translate-y-0.5 transition-all flex-row-reverse"
              >
                Order Telugu Edition
              </ButtonLink>

              <Link
                href="/track-order"
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Package size={18} weight="bold" />
                <span>Track Order</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Dual-Book Showcase */}
          <div className="lg:col-span-5 xl:col-span-6 flex justify-center items-center">
            <div className="relative w-full max-w-lg [perspective:1200px] py-4">
              
              {/* Rating badge above books */}
              <div className="absolute -top-3 right-4 z-20 flex items-center gap-1.5 rounded-full bg-navy-950/90 border border-gold-400/40 px-3 py-1 shadow-xl backdrop-blur-md">
                <div className="flex text-gold-400">
                  <Star size={14} weight="fill" />
                  <Star size={14} weight="fill" />
                  <Star size={14} weight="fill" />
                  <Star size={14} weight="fill" />
                  <Star size={14} weight="fill" />
                </div>
                <span className="text-xs font-bold text-slate-200">4.9 / 5.0 Rating</span>
              </div>

              {/* Two books side by side in 3D display */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 items-end">
                
                {/* Book 1: English Medium */}
                <Link
                  href="/books/target-police-general-studies-tslprb-tgpsc"
                  className="group relative flex flex-col items-center transition-all duration-500 hover:-translate-y-3"
                >
                  <div className="relative w-full aspect-[1/1.42] rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.65)] ring-1 ring-white/10 group-hover:ring-gold-400/50 group-hover:shadow-[0_25px_50px_rgba(217,119,6,0.3)] transition-all">
                    <Image
                      src="/images/books/target-police-3d-english.jpg"
                      alt="Target Police 360 General Studies - English Medium"
                      fill
                      sizes="(min-width: 1024px) 25vw, 45vw"
                      className="object-contain object-center p-1 transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    {/* Badge on cover */}
                    <span className="absolute top-2 left-2 rounded-md bg-navy-950/90 border border-white/20 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-gold-400 shadow-md">
                      English
                    </span>
                  </div>

                  {/* Title & View CTA under book */}
                  <div className="mt-3 text-center">
                    <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-gold-400 transition-colors">
                      English Medium
                    </p>
                    <span className="text-[11px] sm:text-xs text-red-400 font-semibold inline-flex items-center gap-1 group-hover:underline">
                      View details <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </Link>

                {/* Book 2: Telugu Medium */}
                <Link
                  href="/books/target-police-general-studies-telugu"
                  className="group relative flex flex-col items-center transition-all duration-500 hover:-translate-y-3"
                >
                  <div className="relative w-full aspect-[1/1.42] rounded-xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.65)] ring-1 ring-white/10 group-hover:ring-gold-400/50 group-hover:shadow-[0_25px_50px_rgba(220,38,38,0.3)] transition-all">
                    <Image
                      src="/images/books/target-police-telugu.jpg"
                      alt="Target Police 360 General Studies - Telugu Medium"
                      fill
                      sizes="(min-width: 1024px) 25vw, 45vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    {/* Badge on cover */}
                    <span className="absolute top-2 left-2 rounded-md bg-navy-950/90 border border-white/20 px-2 py-0.5 text-[10px] sm:text-xs font-black uppercase text-red-400 shadow-md">
                      తెలుగు Medium
                    </span>
                  </div>

                  {/* Title & View CTA under book */}
                  <div className="mt-3 text-center">
                    <p className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-red-400 transition-colors">
                      Telugu Medium
                    </p>
                    <span className="text-[11px] sm:text-xs text-red-400 font-semibold inline-flex items-center gap-1 group-hover:underline">
                      View details <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </Link>

              </div>

              {/* Bottom trust guarantee pill */}
              <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>In Stock • Dispatches in 24 hours directly from publisher</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
