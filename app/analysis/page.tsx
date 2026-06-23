"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FitLens } from "@/components/studio/FitLens";
import { ProofMap } from "@/components/studio/ProofMap";
import { RecruiterPacket } from "@/components/studio/RecruiterPacket";
import { ScoreBridge } from "@/components/studio/ScoreBridge";
import { UnlockSimulator } from "@/components/studio/UnlockSimulator";
import { simulateOpportunityGrowth } from "@/lib/opportunity-simulator";
import type { AnalyzeSuccessResponse, SkillEvidence } from "@/types/project-dna";

const REPORT_STORAGE_KEY = "projectdna_latest_report";

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard copy failed");
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#060B1A_0%,#101B3D_48%,#102A43_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-12 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      {children}
    </main>
  );
}

function EmptyState() {
  return (
    <Shell>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-slate-50">No analysis found</h1>
          <p className="mt-3 text-sm text-slate-400">Scan a repo first to open ProjectDNA Studio.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white">Scan repo</Link>
        </div>
      </div>
    </Shell>
  );
}

function CommandBar({ report }: { report: AnalyzeSuccessResponse }) {
  const target = report.opportunity.targetMatch;
  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#071126]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="text-sm font-semibold text-slate-50">ProjectDNA Studio</Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{report.repo.fullName}</Badge>
          <Badge>{target.title}</Badge>
          <Badge tone="score">{target.matchScore}%</Badge>
          <Link href="/report/latest" className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/[0.10]">View report</Link>
        </div>
      </div>
    </header>
  );
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "score" }) {
  return <span className={`rounded-full border px-3 py-1.5 font-mono text-xs ${tone === "score" ? "border-yellow-300/30 bg-yellow-300/10 text-yellow-200" : "border-white/10 bg-white/[0.06] text-slate-300"}`}>{children}</span>;
}

function Hero({
  report,
  potentialScore,
  unlockCount,
  onUnlock,
  onCopy,
  copied,
}: {
  report: AnalyzeSuccessResponse;
  potentialScore: number;
  unlockCount: number;
  onUnlock: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const target = report.opportunity.targetMatch;
  const criticalGaps = report.opportunity.gapAnalysis.criticalGaps.length;
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">Opportunity unlocked</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
            {report.repo.name} is {target.matchScore}% ready for {target.title}.
          </h1>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Skills found" value={report.analysis.detectedSkills.length} />
            <Metric label="Matched" value={target.matchedSkills.length} />
            <Metric label="Gaps" value={criticalGaps} />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={onUnlock} className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white hover:from-cyan-300 hover:to-violet-400">Jump to unlock plan</button>
            <button type="button" onClick={onCopy} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.10]">{copied ? "Copied" : "Copy recruiter summary"}</button>
          </div>
        </div>
        <ScoreBridge currentScore={target.matchScore} potentialScore={potentialScore} label={`${unlockCount} unlock actions`} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="font-mono text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

export default function AnalysisPage() {
  const [report, setReport] = useState<AnalyzeSuccessResponse | null | undefined>(undefined);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [activeImprovementActions, setActiveImprovementActions] = useState<Set<string> | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REPORT_STORAGE_KEY);
      setReport(stored ? JSON.parse(stored) as AnalyzeSuccessResponse : null);
    } catch {
      setReport(null);
    }
  }, []);

  const target = report?.opportunity.targetMatch;
  const simulator = useMemo(() => {
    if (!report || !target) return null;
    return simulateOpportunityGrowth({
      currentMatch: target,
      missingRequiredSkills: target.missingRequiredSkills,
      missingPreferredSkills: target.missingPreferredSkills,
      qualitySignals: report.analysis.qualitySignals,
      portfolioProject: report.portfolioProject,
    });
  }, [report, target]);

  const selectedSkill = useMemo(() => {
    if (!report) return null;
    const skills = [...report.analysis.detectedSkills].sort((a, b) => b.confidence - a.confidence || b.proficiency - a.proficiency);
    return skills.find((skill) => `${skill.category}-${skill.skill}` === selectedSkillId) ?? skills[0] ?? null;
  }, [report, selectedSkillId]);

  useEffect(() => {
    setActiveImprovementActions(null);
    setSelectedSkillId("");
  }, [report?.generatedAt]);

  if (report === undefined) return <Shell><div className="relative z-10 flex min-h-screen items-center justify-center text-sm text-slate-400">Loading studio...</div></Shell>;
  if (!report?.success || !target || !simulator) return <EmptyState />;

  const missing = [...target.missingRequiredSkills, ...target.missingPreferredSkills];
  const activeActions = activeImprovementActions ?? new Set(simulator.improvements.map((improvement) => improvement.action));
  const activeUnlockable = simulator.improvements.filter((improvement) => activeActions.has(improvement.action)).reduce((sum, improvement) => sum + improvement.scoreGain, 0);
  const projectedScore = Math.min(95, simulator.currentScore + activeUnlockable);

  function selectSkill(skill: SkillEvidence) {
    setSelectedSkillId(`${skill.category}-${skill.skill}`);
  }

  function toggleAction(action: string) {
    setActiveImprovementActions((current) => {
      if (!simulator) return current ?? new Set<string>();
      const next = new Set(current ?? simulator.improvements.map((improvement) => improvement.action));
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  function jumpTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function copySummary() {
    if (!report || !target) return;
    const text = `${report.evidencePacket.recruiterPitch}\nMatch score: ${target.matchScore}% (${target.readinessLevel} readiness)\n${report.portfolioProject.portfolioPitch}`;
    try {
      await copyText(text);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError("Clipboard access was blocked.");
    }
  }

  return (
    <Shell>
      <CommandBar report={report} />
      <div className="relative z-10 mx-auto max-w-7xl space-y-8 px-6 pb-10 pt-28">
        <Hero report={report} potentialScore={projectedScore} unlockCount={simulator.improvements.length} onUnlock={() => jumpTo("unlock")} onCopy={copySummary} copied={copied} />
        <nav className="sticky top-20 z-20 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#071126]/70 p-2 backdrop-blur-xl">
          {[
            ["proof", "Proof found"],
            ["fit", "Fit score"],
            ["unlock", "Unlock plan"],
            ["packet", "Recruiter packet"],
          ].map(([id, label]) => <button key={id} type="button" onClick={() => jumpTo(id)} className="shrink-0 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.10]">{label}</button>)}
        </nav>
        {report.analysis.confidence < 40 && <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-200">Low confidence: limited public evidence found.</div>}
        <ProofMap skills={report.analysis.detectedSkills} selectedSkill={selectedSkill} onSelectSkill={selectSkill} />
        <FitLens score={target.matchScore} readiness={target.readinessLevel} breakdown={target.scoreBreakdown} matched={target.matchedSkills} missing={missing} onFixGap={() => jumpTo("unlock")} />
        <UnlockSimulator currentScore={simulator.currentScore} projectedScore={projectedScore} improvements={simulator.improvements} activeActions={activeActions} onToggleAction={toggleAction} project={report.portfolioProject} />
        <RecruiterPacket pitch={report.evidencePacket.recruiterPitch} proofPoints={report.evidencePacket.proofPoints} gaps={missing} copied={copied} copyError={copyError} onCopy={copySummary} />
      </div>
    </Shell>
  );
}
