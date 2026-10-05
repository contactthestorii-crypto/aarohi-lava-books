import { ArrowRight, Package } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import type { ShowcaseBook } from "@/lib/content/showcase";

export function Hero({ title, subtitle, book, linkable }: { title: string; subtitle: string; book: ShowcaseBook; linkable: boolean }) {
  return (
    <section className="relative overflow-hidden bg-navy-950 text-white min-h-[90vh] flex items-center justify-start perspective-1000">
      
      {/* Full Width Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/ecommerce/new-hero-banner.jpg"
          alt="Target Police 360° General Studies Banner"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-105 transition-transform duration-[10s] hover:scale-110"
        />
        {/* Gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-navy-950/30" />
      </div>

      <div className="container-page relative z-10 w-full pt-20 pb-16">
        
        {/* 3D Floating Glassmorphic Content Card */}
        <div className="max-w-2xl transform-gpu transition-all duration-700 hover:rotate-y-2 hover:-rotate-x-2 hover:-translate-y-2">
          <div className="p-8 sm:p-10 rounded-[2.5rem] border border-white/20 bg-white/5 backdrop-blur-md shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/20 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-gold-400 mb-6 shadow-lg shadow-gold-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
              </span>
              2026 Edition Available
            </div>

            <h1 className="font-display-condensed text-5xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gold-200 drop-shadow-sm">
              {title}
            </h1>
            
            <p className="mt-6 text-lg font-medium leading-relaxed text-white/90 sm:text-xl drop-shadow-md">
              {subtitle}
            </p>
            
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink 
                href="/books" 
                size="lg" 
                icon={<ArrowRight size={20} weight="bold" />} 
                className="flex-row-reverse bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:-translate-y-1 transition-all rounded-xl font-black uppercase tracking-wider"
              >
                Order Now
              </ButtonLink>
              
              <ButtonLink 
                href="/track-order" 
                size="lg" 
                variant="inverse" 
                icon={<Package size={20} weight="bold" />}
                className="border-white/30 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl font-bold uppercase tracking-wider hover:-translate-y-1 transition-all"
              >
                Track Order
              </ButtonLink>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
