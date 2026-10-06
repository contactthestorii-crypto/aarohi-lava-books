import { ArrowRight, CheckCircle, Package, ShoppingCart, Star } from "@phosphor-icons/react/ssr";
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
    <section className="relative w-full overflow-hidden bg-[#030712] text-white border-b border-navy-800/80">
      
      {/* 5-6s Smooth Cinematic Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes lightSweep {
          0% { transform: translateX(-150%) skewX(-25deg); opacity: 0; }
          25% { opacity: 0.5; }
          55% { transform: translateX(250%) skewX(-25deg); opacity: 0; }
          100% { transform: translateX(250%) skewX(-25deg); opacity: 0; }
        }
        @keyframes subtleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .hero-light-sweep {
          animation: lightSweep 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .hero-book-float {
          animation: subtleFloat 6s ease-in-out infinite;
        }
      `}} />

      {/* 1. Authentic High-Res Charminar Golden Hour Sunset Terrace Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <Image
          src="/images/ecommerce/charminar-hero-bg.jpg"
          alt="Target Police 360° General Studies - Hyderabad Charminar Setting"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center brightness-[0.78] contrast-[1.08]"
        />
        {/* Dark Navy-to-transparent gradient on left side for 100% readable typography */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-[#050e26]/90 to-transparent lg:from-[#030712]/98 lg:via-[#050e26]/80 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-[#030712]/50" />
      </div>

      {/* 2. Content Container (Target aspect ~2.4:1) */}
      <div className="container-page relative z-10 w-full py-10 sm:py-14 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8 xl:gap-12">
          
          {/* LEFT SIDE: Website Typography & Buttons (Identical to Reference Artwork) */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/40 bg-navy-950/85 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-gold-400 shadow-[0_0_20px_rgba(250,204,21,0.25)] backdrop-blur-md">
              <Star size={14} weight="fill" className="text-gold-400" />
              <span>TSLPRB &amp; TGPSC • 2026 UPDATED EDITION</span>
            </div>

            {/* Headline */}
            <h1 className="mt-4 font-display-condensed text-5xl sm:text-6xl lg:text-[4.25rem] font-black uppercase tracking-tight text-white leading-[1.02] drop-shadow-md">
              PREPARE SMARTER.<br />
              <span className="text-gold-400 drop-shadow-sm">
                SCORE BETTER.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-3.5 text-base sm:text-lg text-slate-200 leading-relaxed max-w-xl font-normal drop-shadow">
              Exam-focused books and previous question papers for TSLPRB, TGPSC and other competitive examinations.
            </p>

            {/* Price & Offer Box */}
            <div className="mt-5 flex flex-wrap items-center gap-3.5 rounded-2xl border border-white/15 bg-navy-950/75 p-3 sm:px-5 backdrop-blur-md shadow-2xl">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gold-400 tracking-tight">₹809</span>
                <span className="text-base text-slate-300 line-through">₹899</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 text-xs font-black uppercase tracking-wider text-emerald-300">
                10% OFF SPECIAL LAUNCH
              </span>
              <span className="text-xs text-slate-200 font-medium">
                • Available in English &amp; Telugu
              </span>
            </div>

            {/* 4 Feature Checklist Points */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-100 w-full max-w-lg">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                <span className="font-medium drop-shadow-sm">Prelims &amp; Mains Solved Papers</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                <span className="font-medium drop-shadow-sm">2026 Budget &amp; Survey Included</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                <span className="font-medium drop-shadow-sm">Topic-wise 360° Explanations</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} weight="fill" className="text-gold-400 shrink-0" />
                <span className="font-medium drop-shadow-sm">Fast Direct Delivery Across TS</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-7 flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
              <ButtonLink
                href="/books/target-police-general-studies-tslprb-tgpsc"
                size="lg"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider shadow-[0_0_25px_rgba(220,38,38,0.5)] hover:shadow-[0_0_35px_rgba(220,38,38,0.7)] hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl"
              >
                <ShoppingCart size={18} weight="bold" className="mr-1 inline" /> ORDER ENGLISH EDITION
              </ButtonLink>

              <ButtonLink
                href="/books/target-police-general-studies-telugu"
                size="lg"
                variant="inverse"
                icon={<ArrowRight size={18} weight="bold" />}
                className="bg-[#0b1733]/90 hover:bg-[#0b1733] text-white border border-white/30 font-black uppercase tracking-wider backdrop-blur-md hover:-translate-y-0.5 transition-all flex-row-reverse rounded-xl shadow-xl"
              >
                <ShoppingCart size={18} weight="bold" className="mr-1 inline" /> ORDER TELUGU EDITION
              </ButtonLink>
            </div>

            {/* Track Order */}
            <div className="mt-4">
              <Link
                href="/track-order"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                <Package size={16} weight="bold" />
                <span>Track Order</span>
              </Link>
            </div>

          </div>

          {/* RIGHT SIDE: Authentic 3D Books on the Stone Parapet */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-md sm:max-w-lg hero-book-float py-2">
              
              {/* Floating Rating Badge */}
              <div className="absolute -top-3 right-2 sm:right-6 z-30 flex items-center gap-1.5 rounded-full bg-navy-950/95 border border-gold-400/40 px-3 py-1 shadow-2xl backdrop-blur-md">
                <div className="flex text-gold-400">
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                  <Star size={13} weight="fill" />
                </div>
                <span className="text-xs font-bold text-slate-100">4.9 / 5.0 Rating</span>
              </div>

              {/* Both Authentic Books Side-by-Side */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 items-end">
                
                {/* 1. English Edition (Authentic 3D Mockup with Spine) */}
                <Link
                  href="/books/target-police-general-studies-tslprb-tgpsc"
                  className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative w-full aspect-[682/1024] rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10 group-hover:ring-gold-400/60 group-hover:shadow-[0_35px_70px_rgba(217,119,6,0.4)] transition-all bg-navy-950/40">
                    <Image
                      src="/images/books/target-police-3d-english.jpg"
                      alt="Target Police 360° Explanation of General Studies - English Medium"
                      fill
                      priority
                      sizes="(min-width: 1024px) 25vw, 45vw"
                      className="object-contain p-0.5 transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Specular Light Sweep */}
                    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                      <div className="hero-light-sweep absolute top-0 -left-[100%] w-[80%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
                    </div>
                  </div>

                  <div className="mt-3.5 text-center">
                    <p className="text-xs sm:text-sm font-extrabold uppercase text-white tracking-wider group-hover:text-gold-400 transition-colors drop-shadow">
                      ENGLISH MEDIUM
                    </p>
                    <span className="text-[11px] sm:text-xs text-gold-400 font-bold inline-flex items-center gap-1 group-hover:underline mt-0.5">
                      View details <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </Link>

                {/* 2. Telugu Edition (Authentic Paperback Cover) */}
                <Link
                  href="/books/target-police-general-studies-telugu"
                  className="group relative flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="relative w-full aspect-[682/1024] rounded-xl overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.9)] ring-1 ring-white/10 group-hover:ring-red-500/60 group-hover:shadow-[0_35px_70px_rgba(220,38,38,0.4)] transition-all bg-navy-950/60">
                    <Image
                      src="/images/books/target-police-telugu.jpg"
                      alt="Target Police 360° Explanation of General Studies - Telugu Medium"
                      fill
                      priority
                      sizes="(min-width: 1024px) 25vw, 45vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Left Spine Shadow */}
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-10" />

                    {/* Specular Light Sweep */}
                    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
                      <div className="hero-light-sweep absolute top-0 -left-[100%] w-[80%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>

                  <div className="mt-3.5 text-center">
                    <p className="text-xs sm:text-sm font-extrabold uppercase text-white tracking-wider group-hover:text-red-400 transition-colors drop-shadow">
                      TELUGU MEDIUM
                    </p>
                    <span className="text-[11px] sm:text-xs text-gold-400 font-bold inline-flex items-center gap-1 group-hover:underline mt-0.5">
                      View details <ArrowRight size={12} weight="bold" />
                    </span>
                  </div>
                </Link>

              </div>

            </div>
          </div>

        </div>
      </div>

    </section>
  );
}
