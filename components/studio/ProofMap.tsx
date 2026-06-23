"use client";

import type { SkillEvidence } from "@/types/project-dna";

interface ProofMapProps {
  skills: SkillEvidence[];
  selectedSkill: SkillEvidence | null;
  onSelectSkill: (skill: SkillEvidence) => void;
}

const categoryTone: Record<string, string> = {
  language: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  frontend: "border-violet-300/40 bg-violet-400/10 text-violet-100",
  framework: "border-violet-300/40 bg-violet-400/10 text-violet-100",
  backend: "border-cyan-300/40 bg-cyan-300/10 text-cyan-100",
  database: "border-slate-300/25 bg-white/[0.06] text-slate-100",
  ai_ml: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  data: "border-emerald-300/40 bg-emerald-300/10 text-emerald-100",
  testing: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  devops: "border-slate-300/30 bg-white/[0.08] text-slate-100",
  product: "border-violet-300/40 bg-violet-400/10 text-violet-100",
  other: "border-slate-300/25 bg-white/[0.06] text-slate-100",
};

export function ProofMap({ skills, selectedSkill, onSelectSkill }: ProofMapProps) {
  const topSkills = [...skills].sort((a, b) => b.confidence - a.confidence || b.proficiency - a.proficiency).slice(0, 8);
  const strongest = topSkills[0];

  return (
    <section id="proof" className="scroll-mt-24">
      <SectionTitle eyebrow="Proof found" title="Your repo already has signals." />
      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.18),transparent_26%)]" />
          <div className="relative flex min-h-[360px] flex-wrap items-center justify-center gap-4">
            {topSkills.map((skill) => {
              const id = `${skill.category}-${skill.skill}`;
              const active = selectedSkill ? `${selectedSkill.category}-${selectedSkill.skill}` === id : strongest === skill;
              const size = 86 + skill.proficiency * 10;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectSkill(skill)}
                  className={`rounded-full border text-center text-sm font-semibold shadow-lg transition hover:-translate-y-1 ${categoryTone[skill.category] ?? categoryTone.other} ${active ? "ring-2 ring-cyan-300 shadow-[0_0_34px_rgba(34,211,238,0.45)]" : "shadow-black/20"}`}
                  style={{ width: size, height: size }}
                >
                  <span className="block px-2">{skill.skill}</span>
                  <span className="mt-1 block font-mono text-[10px] opacity-70">{skill.confidence}%</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-violet-950/20 backdrop-blur-xl">
          {selectedSkill ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wide text-cyan-200">Evidence inspector</p>
                  <h3 className="mt-2 text-3xl font-semibold text-slate-50">{selectedSkill.skill}</h3>
                </div>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-mono text-xs text-cyan-100">{selectedSkill.confidence}%</span>
              </div>
              <p className="mt-4 text-sm text-slate-300">This proves: {selectedSkill.reasoning}</p>
              <div className="mt-5 space-y-3">
                {selectedSkill.evidence.slice(0, 2).map((line) => (
                  <p key={line} className="rounded-2xl border border-white/10 bg-[#081126]/70 p-4 text-sm leading-6 text-slate-300">{line}</p>
                ))}
              </div>
              <div className="mt-5">
                <p className="font-mono text-xs uppercase tracking-wide text-slate-500">Files</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSkill.sourceFiles.slice(0, 5).map((file) => (
                    <span key={file} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-slate-300">{file}</span>
                  ))}
                  {!selectedSkill.sourceFiles.length && <span className="text-sm text-slate-500">No file path attached.</span>}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No skill evidence found.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">{title}</h2>
    </div>
  );
}
