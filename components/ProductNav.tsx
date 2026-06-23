"use client";

export type ProductStepId = "overview" | "skills" | "fit" | "gaps" | "build" | "lab" | "packet";

export interface ProductStep {
  id: ProductStepId;
  label: string;
  shortLabel: string;
  icon: string;
}

export const productSteps: ProductStep[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview", icon: "1" },
  { id: "skills", label: "Skill DNA", shortLabel: "Skill DNA", icon: "2" },
  { id: "fit", label: "Fit Score", shortLabel: "Fit Score", icon: "3" },
  { id: "gaps", label: "Gap Map", shortLabel: "Gap Map", icon: "4" },
  { id: "build", label: "Build Plan", shortLabel: "Build Plan", icon: "5" },
  { id: "lab", label: "Lab", shortLabel: "Lab", icon: "6" },
  { id: "packet", label: "Packet", shortLabel: "Packet", icon: "7" },
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">Current step</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{active.label}</h2>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">{active.icon}/7</span>
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
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition ${
                  isActive
                    ? "border-blue-400/40 bg-blue-500/15 text-white"
                    : isComplete
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                      : "border-slate-800 bg-slate-950 text-slate-400"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {isComplete ? <CheckMark /> : step.icon}
                  <span aria-hidden="true">-</span>
                  {step.shortLabel}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <aside className="sticky top-6 hidden max-h-[calc(100vh-3rem)] overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]/90 p-3 shadow-xl shadow-black/20 backdrop-blur-xl lg:block">
        <div className="relative">
          <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-300">Analysis flow</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Review each step in order.</p>
          </div>
          <nav className="space-y-1.5" aria-label="ProjectDNA analysis steps">
            {productSteps.map((step, index) => {
              const isActive = step.id === activeStep;
              const isComplete = index < activeIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onStepChange(step.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    isActive
                      ? "border-blue-400/40 bg-blue-500/15 text-white"
                      : "border-transparent text-slate-500 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-200"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold ${
                    isActive
                      ? "border-blue-300/30 bg-blue-400 text-slate-950"
                      : isComplete
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border-slate-800 bg-slate-950 text-slate-500 group-hover:text-slate-200"
                  }`}>
                    {isComplete ? <CheckMark /> : step.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{step.label}</span>
                  </span>
                  {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-300" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
