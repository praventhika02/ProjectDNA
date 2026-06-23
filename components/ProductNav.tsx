"use client";

export type ProductStepId = "overview" | "skills" | "fit" | "gaps" | "build" | "lab" | "packet";

export interface ProductStep {
  id: ProductStepId;
  label: string;
  icon: string;
}

export const productSteps: ProductStep[] = [
  { id: "overview", label: "Overview", icon: "1" },
  { id: "skills", label: "Skill DNA", icon: "2" },
  { id: "fit", label: "Fit Score", icon: "3" },
  { id: "gaps", label: "Gap Map", icon: "4" },
  { id: "build", label: "Build Plan", icon: "5" },
  { id: "lab", label: "Lab", icon: "6" },
  { id: "packet", label: "Packet", icon: "7" },
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
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">{active.label}</p>
          <span className="rounded-full border border-slate-300 bg-[#EAF3F8] px-2.5 py-1 font-mono text-xs text-indigo-700 shadow-sm">{active.icon}/7</span>
        </div>
        <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2" aria-label="ProjectDNA analysis steps">
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
                    ? "border-indigo-300 bg-[#F2F0FF] text-indigo-800 shadow-sm"
                    : isComplete
                      ? "border-teal-300 bg-[#EDF7F6] text-teal-700"
                      : "border-slate-300 bg-[#F7F8FA] text-slate-600 hover:bg-[#EAF3F8]"
                }`}
              >
                <span className="inline-flex items-center gap-1.5">{isComplete ? <CheckMark /> : step.icon} {step.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <aside className="sticky top-4 hidden rounded-2xl border border-slate-300 bg-[#EAF3F8]/90 p-3 shadow-sm backdrop-blur lg:block">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">Analysis steps</p>
        <nav className="space-y-1" aria-label="ProjectDNA analysis steps">
          {productSteps.map((step, index) => {
            const isActive = step.id === activeStep;
            const isComplete = index < activeIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                  isActive
                    ? "border-indigo-300 bg-[#F2F0FF] text-indigo-800 shadow-sm"
                    : "border-transparent bg-[#F7F8FA]/70 text-slate-600 hover:bg-[#EAF3F8]"
                }`}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete ? "bg-[#EDF7F6] text-teal-700" : isActive ? "bg-indigo-600 text-white" : "bg-[#EEF4FF] text-cyan-700"
                }`}>
                  {isComplete ? <CheckMark /> : step.icon}
                </span>
                <span className="font-medium">{step.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
