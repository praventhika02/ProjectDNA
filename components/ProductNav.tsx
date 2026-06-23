"use client";

export type ProductStepId = "overview" | "skills" | "fit" | "gaps" | "build" | "packet";

export interface ProductStep {
  id: ProductStepId;
  label: string;
  shortLabel: string;
}

export const productSteps: ProductStep[] = [
  { id: "overview", label: "Overview", shortLabel: "Overview" },
  { id: "skills", label: "Skill DNA", shortLabel: "Skill DNA" },
  { id: "fit", label: "Fit Score", shortLabel: "Fit Score" },
  { id: "gaps", label: "Gap Map", shortLabel: "Gap Map" },
  { id: "build", label: "Build Plan", shortLabel: "Build Plan" },
  { id: "packet", label: "Packet", shortLabel: "Packet" },
];

interface ProductNavProps {
  activeStep: ProductStepId;
  onStepChange: (step: ProductStepId) => void;
}

export function ProductNav({ activeStep, onStepChange }: ProductNavProps) {
  return (
    <nav className="sticky top-3 z-20 rounded-2xl border border-white/10 bg-[#080812]/90 p-2 shadow-2xl shadow-black/30 backdrop-blur-xl" aria-label="ProjectDNA analysis steps">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {productSteps.map((step, index) => {
          const isActive = step.id === activeStep;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(step.id)}
              className={`group rounded-xl px-3 py-3 text-left text-xs transition sm:text-center ${
                isActive
                  ? "border border-violet-400/35 bg-violet-400/15 text-white shadow-[0_0_24px_rgba(139,92,246,0.18)]"
                  : "border border-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200"
              }`}
            >
              <span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold sm:mx-auto sm:mb-1 sm:flex ${isActive ? "bg-white text-slate-950" : "bg-white/5 text-slate-500 group-hover:text-slate-200"}`}>
                {index + 1}
              </span>
              <span className="font-medium">{step.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
