"use client";

import type { CSSProperties } from "react";
import type { AnalyzeSuccessResponse } from "@/types/project-dna";

interface FitLensProps {
  score: number;
  readiness: string;
  breakdown: AnalyzeSuccessResponse["opportunity"]["targetMatch"]["scoreBreakdown"];
  matched: AnalyzeSuccessResponse["opportunity"]["targetMatch"]["matchedSkills"];
  missingRequired: string[];
  missingPreferred: string[];
  onFixGap: (gap: string) => void;
}

export function FitLens({ score, readiness, breakdown, matched, missingRequired, missingPreferred, onFixGap }: FitLensProps) {
  const missing = [...missingRequired, ...missingPreferred];
  const rows = [
    ["Required", breakdown.requiredSkillCoverage],
    ["Preferred", breakdown.preferredSkillCoverage],
    ["Evidence", breakdown.evidenceStrength],
    ["Domain", breakdown.domainAlignment],
    ["Complexity", breakdown.complexityRelevance],
  ] as const;

  return (
    <section id="fit" className="scroll-mt-24 py-10">
      <div className="mb-4 flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Fit</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">Score breakdown</h2>
        </div>
        <p className="max-w-sm text-sm text-slate-400">Matched proof on one side. Missing signals on the other.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-2xl border border-white/15 bg-white/[0.075] p-5 text-center shadow-xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-[conic-gradient(#22D3EE_var(--score),rgba(255,255,255,0.10)_0deg)] p-1" style={{ "--score": `${score * 3.6}deg` } as CSSProperties}>
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#071126]">
              <span className="text-5xl font-semibold text-slate-50">{score}%</span>
              <span className="mt-1 text-sm capitalize text-slate-400">{readiness}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/[0.075] p-5 shadow-xl shadow-violet-950/10 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-5">
            {rows.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-3">
                <div className="mb-2 flex justify-between font-mono text-[11px] text-slate-400">
                  <span>{label}</span>
                  <span>{value}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-emerald-200">Matched</h3>
              <div className="mt-2 space-y-2">
                {matched.slice(0, 4).map((item) => (
                  <div key={`${item.jobSkill}-${item.matchedRepoSkill}`} className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-3 shadow-lg shadow-emerald-950/10">
                    <p className="text-sm font-medium text-slate-100">{item.jobSkill}</p>
                    <p className="mt-1 font-mono text-xs text-emerald-200">{item.strength}% via {item.matchedRepoSkill}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-200">Missing</h3>
              <div className="mt-2 space-y-2">
                {missing.slice(0, 4).map((gap) => (
                  <div key={gap} className="rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 shadow-lg shadow-amber-950/10">
                    <p className="text-sm text-slate-100">{gap}</p>
                    <p className="mt-1 font-mono text-[11px] text-amber-200">
                      {missingRequired.includes(gap) ? "Required" : "Preferred"}
                    </p>
                    <button type="button" onClick={() => onFixGap(gap)} className="mt-2 font-mono text-xs text-cyan-200 hover:text-cyan-100">Add to unlock</button>
                  </div>
                ))}
                {!missing.length && <p className="text-sm text-slate-400">No critical missing signals.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
