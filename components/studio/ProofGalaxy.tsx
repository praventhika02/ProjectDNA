"use client";

import type { SkillEvidence } from "@/types/project-dna";

interface ProofGalaxyProps {
  skills: SkillEvidence[];
  selectedSkill: SkillEvidence | null;
  onSelectSkill: (skill: SkillEvidence) => void;
}

const categoryTone: Record<string, string> = {
  language: "border-indigo-300/40 bg-indigo-300/10 text-indigo-100",
  frontend: "border-violet-300/40 bg-violet-300/10 text-violet-100",
  framework: "border-violet-300/40 bg-violet-300/10 text-violet-100",
  backend: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  database: "border-sky-300/40 bg-sky-300/10 text-sky-100",
  ai_ml: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  data: "border-blue-300/40 bg-blue-300/10 text-blue-100",
  testing: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  devops: "border-slate-300/30 bg-white/[0.06] text-slate-100",
  product: "border-violet-300/40 bg-violet-300/10 text-violet-100",
  other: "border-slate-300/30 bg-white/[0.06] text-slate-100",
};

export function ProofGalaxy({ skills, selectedSkill, onSelectSkill }: ProofGalaxyProps) {
  const topSkills = [...skills].sort((a, b) => b.confidence - a.confidence || b.proficiency - a.proficiency).slice(0, 8);
  const activeSkill = selectedSkill ?? topSkills[0] ?? null;

  return (
    <section id="proof" className="scroll-mt-24 py-10">
      <SectionTitle eyebrow="Proof" title="Detected skills" subtitle="Repo-derived signals with source evidence." />
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-white/15 bg-white/[0.075] p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="grid gap-3 sm:grid-cols-2">
            {topSkills.map((skill) => {
              const id = `${skill.category}-${skill.skill}`;
              const active = activeSkill ? `${activeSkill.category}-${activeSkill.skill}` === id : false;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectSkill(skill)}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                    active ? "border-cyan-300/60 bg-cyan-300/15 shadow-[0_0_26px_rgba(34,211,238,0.20)]" : "border-white/10 bg-white/[0.055] hover:border-cyan-300/25 hover:bg-white/[0.085]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-50">{skill.skill}</p>
                      <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 font-mono text-[11px] ${categoryTone[skill.category] ?? categoryTone.other}`}>
                        {skill.category}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-cyan-200">{skill.confidence}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${skill.confidence}%` }} />
                  </div>
                  <p className="mt-2 font-mono text-xs text-slate-400">Proficiency {skill.proficiency}/5</p>
                </button>
              );
            })}
            {!topSkills.length && <p className="text-sm text-slate-400">No skill signals found.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/[0.075] p-5 shadow-xl shadow-violet-950/20 backdrop-blur-xl">
          {activeSkill ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Skill evidence</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-50">{activeSkill.skill}</h3>
                </div>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-mono text-xs text-cyan-100">{activeSkill.confidence}%</span>
              </div>
              <p className="mt-4 rounded-2xl border border-white/10 bg-[#081126]/75 p-4 text-sm leading-6 text-slate-300 shadow-inner shadow-cyan-950/20">
                {activeSkill.reasoning}
              </p>
              <div className="mt-4 space-y-2">
                {activeSkill.evidence.slice(0, 3).map((line) => (
                  <p key={line} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-sm text-slate-200">{line}</p>
                ))}
              </div>
              <div className="mt-5">
                <p className="font-mono text-xs uppercase tracking-wide text-slate-500">Source files</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeSkill.sourceFiles.slice(0, 6).map((file) => (
                    <span key={file} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-slate-300">{file}</span>
                  ))}
                  {!activeSkill.sourceFiles.length && <span className="text-sm text-slate-500">No file path attached.</span>}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No evidence to inspect.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50">{title}</h2>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}
