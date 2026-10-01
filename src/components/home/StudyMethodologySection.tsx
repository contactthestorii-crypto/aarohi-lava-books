import { Brain } from "@phosphor-icons/react/ssr";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

const STEPS = [
  {
    step: "01",
    title: "Weightage & Pattern Analysis",
    subtitle: "Identify High-Yield Scoring Areas",
    description:
      "Break down past 10 years of TSLPRB & TGPSC marks distribution so you spend maximum time on high-frequency question topics.",
  },
  {
    step: "02",
    title: "360° Conceptual Clarity",
    subtitle: "Master Facts Linked with Context",
    description:
      "Every previous question is dissected in 360° with background history, relevant constitutional articles, and 2026 economic data.",
  },
  {
    step: "03",
    title: "Diagrams, Maps & Mind Maps",
    subtitle: "Accelerate Revision Efficiency",
    description:
      "Telangana geography, dynasties, movement timelines, and budget figures compressed into structured visual mind maps for fast recall.",
  },
  {
    step: "04",
    title: "Targeted Mock Practice",
    subtitle: "Eliminate Negative Marking",
    description:
      "Chapter-wise probable practice questions simulate real examination difficulty, building speed and precision under timed conditions.",
  },
];

export function StudyMethodologySection() {
  return (
    <section aria-labelledby="methodology-heading" className="container-page py-12 md:py-16">
      <div className="overflow-hidden rounded-3xl border border-navy-800 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 p-6 text-white shadow-2xl md:p-10 lg:p-12">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400/20 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-gold-400 ring-1 ring-gold-400/30">
              <Brain size={14} weight="fill" /> The 360° Learning Framework
            </span>
            <h2
              id="methodology-heading"
              className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white md:text-3xl lg:text-4xl"
            >
              How This Guide Accelerates Your Rank
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-navy-200 sm:text-base">
              A scientific, step-by-step preparation methodology crafted specifically to help state competitive exam
              aspirants score consistently higher.
            </p>
          </div>

          <ButtonLink
            href="/books"
            size="md"
            className="shrink-0 bg-red-600 text-white hover:bg-red-700"
          >
            Start Preparing Now
          </ButtonLink>
        </div>

        <div className="mt-10 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left: 4 Step Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xs transition-all duration-200 hover:-translate-y-1 hover:border-gold-400/40 hover:bg-white/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-display-condensed text-2xl font-black text-gold-400">{s.step}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-navy-300">Phase {s.step}</span>
                  </div>
                  <h3 className="mt-2 font-display text-base font-bold text-white group-hover:text-gold-300">
                    {s.title}
                  </h3>
                  <p className="text-xs font-semibold text-red-400">{s.subtitle}</p>
                  <p className="mt-2 text-xs leading-relaxed text-navy-200">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Infographic visual asset */}
          <div className="relative mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none perspective-1000">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/15 bg-white p-2 shadow-2xl transition-transform duration-700 hover:-translate-y-2 hover:rotate-1 hover:shadow-[0_20px_50px_rgba(255,255,255,0.1)]">
              <Image
                src="/images/ecommerce/study-methodology.jpg"
                alt="Structured 4-step exam preparation strategy infographic"
                fill
                sizes="(min-width: 1024px) 35vw, 90vw"
                className="rounded-xl object-contain transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
