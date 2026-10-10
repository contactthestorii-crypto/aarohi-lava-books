import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  ShieldCheck,
  Truck,
} from "@phosphor-icons/react/ssr";
import Image from "next/image";
import Link from "next/link";
import { BuyButtons } from "@/components/ecommerce/BuyButtons";
import type { Product } from "@/types";

interface DualBookShowcaseProps {
  englishProduct: Product;
  teluguProduct: Product;
}

export function DualBookShowcase({
  englishProduct,
  teluguProduct,
}: DualBookShowcaseProps) {
  const books = [
    {
      product: englishProduct,
      mediumBadge: "English Medium",
      mediumColor: "border-blue-500/30 bg-blue-50 text-blue-800",
      imageSrc: "/images/books/target-police-3d-english.jpg",
      imageAlt: "Target Police 360 General Studies English Medium 3D Cover",
      title: "Target Police: 360° Explanation of General Studies (English Medium)",
      subtitle: "Telangana Sub-Inspector & Competitive Exams Previous Question Papers",
      highlights: [
        "All Telangana SI Prelims & Mains previous papers (2012–2024)",
        "360° conceptual clarity with topic-wise chapter segregation",
        "Includes Central & State Budgets 2026–27 and Socio-Economic Survey",
        "Author: Swathylava Neralla (MSc, MA) • Aarohi Lava Publications",
      ],
      specs: "560 Pages • 2026 Print • Paperback",
      buttonColor: "bg-navy-900 hover:bg-navy-800",
    },
    {
      product: teluguProduct,
      mediumBadge: "తెలుగు మీడియం (Telugu Medium)",
      mediumColor: "border-red-500/30 bg-red-50 text-red-800",
      imageSrc: "/images/books/target-police-telugu.jpg",
      imageAlt: "Target Police 360 General Studies Telugu Medium Official Cover",
      title: "లక్ష్యం పోలీస్: 360° జనరల్ స్టడీస్ సమగ్ర వివరణ (తెలుగు మీడియం)",
      subtitle: "తెలంగాణ సబ్-ఇన్‌స్పెక్టర్ మరియు పోటీ పరీక్షల గత ప్రశ్నా పత్రాలు",
      highlights: [
        "తెలంగాణ ఎస్సై ప్రిలిమ్స్ మరియు మెయిన్స్ అన్ని గత ప్రశ్నా పత్రాలు",
        "టాపిక్-వైజ్ 360° విశ్లేషణ మరియు సమగ్ర భావనాత్మక వివరణలు",
        "2026–27 రాష్ట్ర మరియు కేంద్ర బడ్జెట్, తెలంగాణ సోషియో-ఎకనామిక్ సర్వే",
        "రచయిత: స్వాతిలావ నేరళ్ల (MSc, MA) • ఆరోహి లావా పబ్లికేషన్స్",
      ],
      specs: "560 పేజీలు • 2026 ముద్రణ • పేపర్‌బ్యాక్",
      buttonColor: "bg-navy-900 hover:bg-navy-800",
    },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {books.map((b) => {
        const { product } = b;
        const pricePaise = product.pricePaise ?? 79900;
        const mrpPaise = product.mrpPaise ?? 89900;

        return (
          <div
            key={product.id}
            className="flex flex-col justify-between overflow-hidden rounded-3xl border border-line/90 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-navy-400"
          >
            {/* Top Bar with Badges */}
            <div className="border-b border-line/60 bg-navy-50/60 px-6 py-4 flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${b.mediumColor}`}
              >
                {b.mediumBadge}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                <ShieldCheck size={16} weight="fill" className="text-emerald-700" />
                Official 2026 Print
              </span>
            </div>

            {/* Main Book Content Section */}
            <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-6">
              {/* Book Cover Thumbnail */}
              <div className="relative mx-auto sm:mx-0 w-44 shrink-0 aspect-[682/1024] rounded-xl overflow-hidden border border-line bg-navy-50 shadow-md transition-transform duration-300 hover:scale-105">
                <Image
                  src={b.imageSrc}
                  alt={b.imageAlt}
                  fill
                  sizes="(min-width: 640px) 176px, 160px"
                  className="object-contain p-1"
                />
              </div>

              {/* Book Details */}
              <div className="flex flex-col justify-between flex-1">
                <div>
                  {/* Exams Supported */}
                  <div className="flex flex-wrap gap-1 text-[11px] font-bold text-navy-800 uppercase tracking-wide">
                    <span>UPSC</span>
                    <span>•</span>
                    <span>TGPSC</span>
                    <span>•</span>
                    <span>TSLPRB</span>
                    <span>•</span>
                    <span>APPSC</span>
                  </div>

                  <h3 className="mt-2 font-display text-xl sm:text-2xl font-bold leading-tight text-ink">
                    <Link
                      href={`/books/${product.slug}`}
                      className="hover:text-navy-700 transition-colors"
                    >
                      {b.title}
                    </Link>
                  </h3>

                  <p className="mt-1 text-xs sm:text-sm text-muted font-normal">
                    {b.subtitle}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-navy-700 bg-navy-50 px-2.5 py-1 rounded-md w-fit">
                    <BookOpen size={14} weight="bold" />
                    <span>{b.specs}</span>
                  </div>
                </div>

                {/* Highlights List */}
                <ul className="mt-4 space-y-2 text-xs text-slate-700">
                  {b.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle
                        size={15}
                        weight="fill"
                        className="text-emerald-700 shrink-0 mt-0.5"
                      />
                      <span className="leading-tight">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pricing and Action Footer */}
            <div className="border-t border-line/80 bg-slate-50/70 p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-black text-ink tracking-tight">
                      ₹{Math.round(pricePaise / 100)}
                    </span>
                    <span className="text-sm text-slate-400 line-through">
                      ₹{Math.round(mrpPaise / 100)}
                    </span>
                    <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      Save ₹{Math.round((mrpPaise - pricePaise) / 100)} (11% Off)
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                    <Truck size={14} className="text-navy-700" />
                    Dispatches from Hyderabad in 24-48 Hours
                  </p>
                </div>

                <Link
                  href={`/books/${product.slug}`}
                  className="text-xs font-semibold text-navy-800 hover:text-navy-950 flex items-center gap-1 hover:underline"
                >
                  View Details & Contents
                  <ArrowRight size={14} weight="bold" />
                </Link>
              </div>

              {/* Add to Cart & Buy Now Buttons */}
              <BuyButtons
                productId={product.id}
                size="md"
                layout="row"
                className="w-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
