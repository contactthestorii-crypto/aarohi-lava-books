import { ArrowRight, Package } from "@phosphor-icons/react/ssr";
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
    <section className="relative w-full overflow-hidden bg-navy-950 text-white border-b border-navy-800/80">
      
      {/* 100% Full Width Edge-to-Edge Banner Container */}
      <div className="relative w-full aspect-[2560/1065] overflow-hidden select-none shadow-[0_15px_35px_rgba(0,0,0,0.5)]">
        
        {/* 2.5K Ultra-Sharp Enhanced Banner Graphic */}
        <Image
          src="/images/ecommerce/hero-banner-main.png"
          alt={title || "Target Police: 360° Explanation of General Studies - Aarohi Lava Publications"}
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center pointer-events-none"
        />

        {/* Real Clickable Interactive CTA Overlays (Pixel-mapped to the 2.4:1 banner) */}
        
        {/* 1. ORDER ENGLISH EDITION Button */}
        <Link
          href="/books/target-police-general-studies-tslprb-tgpsc"
          aria-label="Order English Edition"
          title="Order English Edition"
          className="absolute rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400 hover:ring-2 hover:ring-white/90 hover:bg-white/10 active:scale-[0.98]"
          style={{
            left: "6.84%",
            top: "73.94%",
            width: "18.95%",
            height: "7.98%",
          }}
        >
          <span className="sr-only">Order English Edition</span>
        </Link>

        {/* 2. ORDER TELUGU EDITION Button */}
        <Link
          href="/books/target-police-general-studies-telugu"
          aria-label="Order Telugu Edition"
          title="Order Telugu Edition"
          className="absolute rounded-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold-400 hover:ring-2 hover:ring-white/90 hover:bg-white/10 active:scale-[0.98]"
          style={{
            left: "26.60%",
            top: "73.94%",
            width: "17.40%",
            height: "7.98%",
          }}
        >
          <span className="sr-only">Order Telugu Edition</span>
        </Link>

        {/* 3. Track Order Link */}
        <Link
          href="/track-order"
          aria-label="Track Order"
          title="Track Order"
          className="absolute rounded-md transition-all duration-200 cursor-pointer focus:outline-none hover:ring-1 hover:ring-white/60 hover:bg-white/10"
          style={{
            left: "6.84%",
            top: "83.50%",
            width: "12.00%",
            height: "6.00%",
          }}
        >
          <span className="sr-only">Track Order</span>
        </Link>

        {/* 4. English Book 3D Mockup & View Details */}
        <Link
          href="/books/target-police-general-studies-tslprb-tgpsc"
          aria-label="Target Police English Medium Details"
          title="View Target Police English Medium"
          className="absolute rounded-xl transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-gold-400/50 hover:bg-white/[0.04]"
          style={{
            left: "47.00%",
            top: "8.00%",
            width: "21.00%",
            height: "89.00%",
          }}
        >
          <span className="sr-only">View Target Police English Medium Book</span>
        </Link>

        {/* 5. Telugu Book 3D Mockup & View Details */}
        <Link
          href="/books/target-police-general-studies-telugu"
          aria-label="Target Police Telugu Medium Details"
          title="View Target Police Telugu Medium"
          className="absolute rounded-xl transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-red-400/50 hover:bg-white/[0.04]"
          style={{
            left: "69.00%",
            top: "12.00%",
            width: "21.00%",
            height: "85.00%",
          }}
        >
          <span className="sr-only">View Target Police Telugu Medium Book</span>
        </Link>

      </div>

      {/* Mobile-Only Action Bar (Ensures large, thumb-friendly tap targets on small phone screens) */}
      <div className="container-page py-4 sm:hidden">
        <div className="flex flex-col gap-2.5">
          <ButtonLink
            href="/books/target-police-general-studies-tslprb-tgpsc"
            size="lg"
            icon={<ArrowRight size={18} weight="bold" />}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-wider justify-center shadow-lg shadow-red-600/30 flex-row-reverse"
          >
            Order English Edition (₹809)
          </ButtonLink>

          <ButtonLink
            href="/books/target-police-general-studies-telugu"
            size="lg"
            variant="inverse"
            icon={<ArrowRight size={18} weight="bold" />}
            className="w-full bg-navy-800 hover:bg-navy-700 text-white border border-white/20 font-bold uppercase tracking-wider justify-center flex-row-reverse"
          >
            Order Telugu Edition (₹809)
          </ButtonLink>

          <Link
            href="/track-order"
            className="inline-flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <Package size={16} weight="bold" />
            <span>Track Order</span>
          </Link>
        </div>
      </div>

    </section>
  );
}
