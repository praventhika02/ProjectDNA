"use client";

import type { OpportunityImprovement, PortfolioProjectRecommendation } from "@/types/project-dna";
import { ScoreBridge } from "./ScoreBridge";

interface UnlockSimulatorProps {
  currentScore: number;
  projectedScore: number;
  improvements: OpportunityImprovement[];
  activeActions: Set<string>;
  onToggleAction: (action: string) => void;
  project: PortfolioProjectRecommendation;
}

export function UnlockSimulator({ currentScore, projectedScore, improvements, activeActions, onToggleAction, project }: UnlockSimulatorProps) {
  const unlocked = Math.max(0, projectedScore - currentScore);

  return (
    <section id="unlock" className="scroll-mt-24">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Unlock actions</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">Simulate the next move.</h2>
        </div>
        <span className="w-fit rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 font-mono text-xs text-cyan-100">+{unlocked} unlocked</span>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
        <ScoreBridge currentScore={currentScore} potentialScore={projectedScore} label="selected unlocks" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {improvements.slice(0, 6).map((item) => {
            const active = activeActions.has(item.action);
            return (
              <button
                key={item.action}
                type="button"
                onClick={() => onToggleAction(item.action)}
                className={`rounded-2xl border p-4 text-left transition ${active ? "border-cyan-300/40 bg-cyan-300/10 shadow-[0_0_26px_rgba(34,211,238,0.20)]" : "border-white/10 bg-white/[0.05] hover:bg-white/[0.08]"}`}
              >
                <span className="block text-sm font-medium text-slate-100">{item.action}</span>
                <span className="mt-2 block font-mono text-xs text-cyan-200">+{item.scoreGain}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-200">Build mission</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-50">{project.title}</h3>
          </div>
          <div className="flex gap-2">
            <Chip>{project.difficulty}</Chip>
            <Chip>{project.estimatedTime}</Chip>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <MiniList title="Features" items={project.features.slice(0, 3)} />
          <MiniList title="Success" items={project.successCriteria.slice(0, 3)} />
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Skills proven</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.skillsToProve.slice(0, 6).map((skill) => <Chip key={skill}>{skill}</Chip>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-100">{title}</h4>
      <div className="mt-3 space-y-2">
        {items.map((item) => <p key={item} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm text-slate-300">{item}</p>)}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-xs text-slate-300">{children}</span>;
}
