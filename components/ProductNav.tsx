"use client";

export type ProductStepId = "overview" | "skills" | "fit" | "gaps" | "build" | "lab" | "packet";

export interface ProductStep {
  id: ProductStepId;
  label: string;
  shortLabel: string;
  subtitle: string;
  icon: string;
}

export const productSteps: ProductStep[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview", subtitle: "Snapshot", icon: "01" },
  { id: "skills", label: "Skill DNA", shortLabel: "Skill DNA", subtitle: "Evidence", icon: "02" },
  { id: "fit", label: "Fit Score", shortLabel: "Fit Score", subtitle: "Match", icon: "03" },
  { id: "gaps", label: "Gap Map", shortLabel: "Gap Map", subtitle: "Bridge", icon: "04" },
  { id: "build", label: "Build Plan", shortLabel: "Build", subtitle: "Next Project", icon: "05" },
  { id: "lab", label: "Opportunity Lab", shortLabel: "Lab", subtitle: "Simulator", icon: "06" },
  { id: "packet", label: "Packet", shortLabel: "Packet", subtitle: "Recruiter View", icon: "07" },
];

interface ProductNavProps {
  activeStep: ProductStepId;
  onStepChange: (step: ProductStepId) => void;
}

function CheckMark() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ProductNav({ activeStep, onStepChange }: ProductNavProps) {
  const activeIndex = Math.max(0, productSteps.findIndex((step) => step.id === activeStep));
  const active = productSteps[activeIndex];

  return (
    <>
      <div className="lg:hidden">
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Current stage</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{active.label}</h2>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">{active.subtitle}</span>
        </div>
        <nav className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2" aria-label="ProjectDNA analysis steps">
          {productSteps.map((step, index) => {
            const isActive = step.id === activeStep;
            const isComplete = index < activeIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? "border-violet-300/40 bg-violet-400/20 text-white shadow-[0_0_24px_rgba(139,92,246,0.2)]"
                    : isComplete
                      ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200"
                      : "border-white/10 bg-white/[0.04] text-slate-400"
                }`}
              >
                {isComplete ? "✓" : step.icon} · {step.shortLabel}
              </button>
            );
          })}
        </nav>
      </div>

      <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#080812]/80 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(139,92,246,0.18),transparent_32%),radial-gradient(circle_at_100%_60%,rgba(34,211,238,0.09),transparent_34%)]" />
        <div className="relative">
          <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-300">ProjectDNA OS</p>
            <p className="mt-2 text-sm leading-5 text-slate-400">GitHub evidence transformed into opportunity readiness.</p>
          </div>
          <nav className="space-y-2" aria-label="ProjectDNA analysis steps">
            {productSteps.map((step, index) => {
              const isActive = step.id === activeStep;
              const isComplete = index < activeIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onStepChange(step.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    isActive
                      ? "border-violet-300/35 bg-violet-400/15 text-white shadow-[0_0_28px_rgba(139,92,246,0.16)]"
                      : "border-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.045] hover:text-slate-200"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold ${
                    isActive
                      ? "border-white/20 bg-white text-slate-950"
                      : isComplete
                        ? "border-emerald-400/20 bg-emerald-400/[0.1] text-emerald-300"
                        : "border-white/10 bg-white/[0.04] text-slate-500 group-hover:text-slate-200"
                  }`}>
                    {isComplete ? <CheckMark /> : step.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{step.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{step.subtitle}</span>
                  </span>
                  {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
