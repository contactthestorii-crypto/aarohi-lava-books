import { SealCheck, Sparkle, Trophy } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

export function AspirantSuccessSection() {
  return (
    <section aria-labelledby="aspirants-heading" className="container-page py-12 md:py-16">
      <div className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white shadow-2xl">
        <div className="grid items-center gap-8 p-6 md:grid-cols-12 md:p-10 lg:gap-12 lg:p-12">
          {/* Left Column: Visual Aspirants Banner */}
          <div className="md:col-span-6 lg:col-span-6 perspective-1000">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/15 shadow-[0_15px_35px_rgba(0,0,0,0.5)] transition-transform duration-700 hover:-translate-y-2 hover:rotate-1 hover:shadow-[0_25px_50px_rgba(0,0,0,0.6)]">
              <Image
                src="/images/ecommerce/aspirants-success.jpg"
                alt="Focused competitive exam aspirants preparing with Aarohi Lava study materials"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-navy-950/80 p-3 backdrop-blur-md ring-1 ring-white/15 sm:bottom-4 sm:left-4 sm:right-4 group-hover:bg-navy-900/90 transition-colors duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 text-navy-950 shadow-lg">
                    <Trophy size={20} weight="fill" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-gold-400">Proven Results</p>
                    <p className="text-[11px] text-navy-200">Recommended by State Rankers & Mentors</p>
                  </div>
                </div>
                <span className="rounded-full bg-gradient-to-r from-red-600 to-red-500 px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-lg shadow-red-500/20">
                  2026 Batch
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Key Proof Points */}
          <div className="flex flex-col justify-center md:col-span-6 lg:col-span-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-bold text-gold-400 backdrop-blur-md shadow-[0_0_15px_rgba(251,191,36,0.1)]">
              <Sparkle size={16} weight="fill" className="animate-pulse" />
              <span>TESTED & TRUSTED CURRICULUM</span>
            </div>

            <h2 id="aspirants-heading" className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70">
              Built Specifically for Telangana State Exams
            </h2>

            <p className="mt-4 text-sm leading-relaxed text-navy-200 sm:text-base font-medium">
              Preparing for TSLPRB Police (SI & Constable) or TGPSC requires in-depth mastery of General Studies,
              Telangana Movement, History, and current socio-economic trends. Aarohi Lava books provide laser-focused
              clarity without fluff.
            </p>

            {/* Authentic Academic Pillars */}
            <div className="mt-8 grid grid-cols-3 gap-3 border-y border-white/10 py-5 text-center">
              <div className="group cursor-default">
                <p className="font-display text-3xl font-black text-gold-400 sm:text-4xl group-hover:text-red-400 transition-colors duration-300">360°</p>
                <p className="text-xs font-medium text-navy-300 mt-1">Topic Analysis</p>
              </div>
              <div className="border-x border-white/10 group cursor-default">
                <p className="font-display text-3xl font-black text-gold-400 sm:text-4xl group-hover:text-red-400 transition-colors duration-300">2026</p>
                <p className="text-xs font-medium text-navy-300 mt-1">Survey Updated</p>
              </div>
              <div className="group cursor-default">
                <p className="font-display text-3xl font-black text-gold-400 sm:text-4xl group-hover:text-red-400 transition-colors duration-300">100%</p>
                <p className="text-xs font-medium text-navy-300 mt-1">Official Syllabus</p>
              </div>
            </div>

            {/* Curriculum Highlights Box */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs leading-relaxed text-navy-100 backdrop-blur-md transition-all duration-300 hover:bg-white/10 hover:border-white/20">
              <p className="font-bold text-gold-400 text-sm">Official Exam Syllabus Alignment:</p>
              <p className="mt-2 text-navy-200">
                Structured systematically covering Telangana History, Movement & State Formation, Indian Polity,
                Socio-Economic Survey 2026, State Budgets, and topic-wise previous question bank analysis.
              </p>
              <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-navy-300">
                <span>Aarohi Lava Publications • Hyderabad</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                  <SealCheck size={14} weight="fill" /> Authentic Print Edition
                </span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <ButtonLink
                href="/books"
                size="lg"
                className="bg-gradient-to-r from-red-600 to-red-500 text-white font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:-translate-y-1 transition-all duration-300 rounded-xl"
              >
                Browse Recommended Books
              </ButtonLink>
              <ButtonLink
                href="#faq"
                size="lg"
                variant="inverse"
                className="border-white/20 hover:bg-white/10 font-bold uppercase tracking-wider rounded-xl transition-all duration-300 hover:-translate-y-1"
              >
                Read Aspirant FAQs
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
