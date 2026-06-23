"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductNav, type ProductStepId } from "@/components/ProductNav";
import { calculateOpportunityGap, generateRecruiterView, simulateOpportunityGrowth } from "@/lib/opportunity-simulator";
import type { AnalyzeSuccessResponse, SkillCategory, SkillEvidence } from "@/types/project-dna";

const REPORT_STORAGE_KEY = "projectdna_latest_report";

const skillFilters: Array<"all" | SkillCategory> = ["all", "language", "frontend", "backend", "ai_ml", "data", "testing", "devops"];

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

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m5 12 4 4L19 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Badge({ children, tone = "violet" }: { children: React.ReactNode; tone?: "violet" | "cyan" | "emerald" | "amber" | "rose" }) {
  const styles = {
    violet: "border-blue-400/20 bg-blue-500/10 text-blue-200",
    cyan: "border-blue-400/20 bg-blue-500/10 text-blue-200",
    emerald: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    amber: "border-amber-400/20 bg-amber-500/10 text-amber-200",
    rose: "border-rose-400/20 bg-rose-500/10 text-rose-200",
  };
  return <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050814] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(37,99,235,0.16),transparent_34%)]" />
      {children}
    </main>
  );
}

function EmptyState() {
  return (
    <Shell>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/[0.035] p-10 shadow-2xl shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">ProjectDNA Analysis</p>
          <h1 className="mt-5 text-3xl font-semibold text-white">No analysis found.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">Run ProjectDNA first. The interactive workspace loads from the latest saved browser report.</p>
          <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">Back to homepage <ArrowIcon /></Link>
        </div>
      </div>
    </Shell>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-600">{detail}</p>}
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      {text && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{text}</p>}
    </div>
  );
}

function StepHelp({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-xl border border-blue-400/15 bg-blue-500/[0.06] px-4 py-3 text-sm leading-6 text-blue-100">
      <span className="font-semibold text-blue-200">How to use this: </span>{children}
    </div>
  );
}

function Timeline({ report }: { report: AnalyzeSuccessResponse }) {
  const stages = [
    ["Repository Ingested", `${report.fileTreeSummary.totalFiles.toLocaleString()} files`],
    ["Skills Extracted", `${report.analysis.detectedSkills.length}`],
    ["Opportunity Matched", `${report.opportunity.targetMatch.matchScore}%`],
    ["Gaps Identified", `${report.opportunity.gapAnalysis.criticalGaps.length}`],
    ["Build Plan Generated", report.portfolioProject.difficulty],
    ["Evidence Packet Ready", report.evidencePacket.proofPoints.length ? `${report.evidencePacket.proofPoints.length} proof points` : "ready"],
  ];

  return (
    <div className="rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.06] to-violet-500/[0.04] p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">ProjectDNA Timeline</p>
      <div className="mt-6 grid gap-3 lg:grid-cols-6">
        {stages.map(([stage, metric], index) => (
          <div key={stage} className="relative rounded-2xl border border-white/10 bg-black/20 p-4">
            {index < stages.length - 1 && <div className="absolute left-1/2 top-full hidden h-3 w-px bg-cyan-400/25 lg:left-full lg:top-1/2 lg:block lg:h-px lg:w-3" />}
            <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><CheckIcon /></span>
            <p className="text-sm font-medium text-white">{stage}</p>
            <p className="mt-1 text-xs capitalize text-slate-500">{metric}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillRadar({ skills }: { skills: SkillEvidence[] }) {
  const categories: SkillCategory[] = ["language", "frontend", "backend", "ai_ml", "data", "testing", "devops", "product"];
  const scores = categories.map((category) => {
    const categorySkills = skills.filter((skill) => skill.category === category || (category === "frontend" && skill.category === "framework"));
    const score = categorySkills.length ? Math.round(categorySkills.reduce((sum, skill) => sum + skill.confidence, 0) / categorySkills.length) : 0;
    return { category, score };
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Skill heatmap</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {scores.map(({ category, score }) => (
          <div key={category} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium capitalize text-slate-300">{category.replace("_", " / ")}</span>
              <span className="text-xs text-slate-500">{score}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400 transition-all duration-500" style={{ width: `${score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillCard({ skill, expanded, onToggle }: { skill: SkillEvidence; expanded: boolean; onToggle: () => void }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0d0d16]/90 p-5 transition hover:border-violet-400/25">
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-300">{skill.category.replace("_", " / ")}</p>
            <h4 className="mt-2 text-base font-semibold text-white">{skill.skill}</h4>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">{skill.confidence}%</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-slate-500">Proficiency</span>
          <div className="flex gap-1" aria-label={`${skill.proficiency} out of 5`}>
            {[1, 2, 3, 4, 5].map((level) => <span key={level} className={`h-1.5 w-5 rounded-full ${level <= skill.proficiency ? "bg-gradient-to-r from-violet-400 to-cyan-400" : "bg-white/10"}`} />)}
          </div>
          <span className="text-xs font-medium text-slate-300">{skill.proficiency}/5</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">{skill.sourceFiles.length} source file{skill.sourceFiles.length === 1 ? "" : "s"} linked</p>
      </button>
      <div className="mt-4 space-y-2">
        {skill.evidence.slice(0, expanded ? undefined : 1).map((line) => <p key={line} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />{line}</p>)}
      </div>
      {expanded && (
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-black/20 p-4">
          <p className="text-xs font-semibold text-slate-300">Source files</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {skill.sourceFiles.length ? skill.sourceFiles.map((file) => <span key={file} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] text-slate-400">{file}</span>) : <span className="text-xs text-slate-600">No specific source file available.</span>}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">{skill.reasoning}</p>
        </div>
      )}
    </article>
  );
}

function ScoreRow({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-300">{label}</p>
        <span className="text-xs text-slate-500">{value}% / {weight}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RadialScore({ score, label }: { score: number; label: string }) {
  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center rounded-full" style={{ background: `conic-gradient(rgb(34 211 238) ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}>
      <div className="absolute inset-3 rounded-full bg-[#090914]" />
      <div className="relative text-center">
        <p className="text-6xl font-semibold tracking-tight text-white">{score}<span className="text-2xl text-slate-500">%</span></p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{label}</p>
      </div>
    </div>
  );
}

function SkillDnaMap({ skills }: { skills: SkillEvidence[] }) {
  const topSkills = skills.slice(0, 14);
  if (!topSkills.length) {
    return <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No skill clusters can be drawn until public evidence is available.</div>;
  }
  return (
    <div className="overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/[0.05] to-violet-500/[0.04] p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Skill DNA Map</p>
          <p className="mt-2 text-sm text-slate-500">Cluster size reflects confidence. Color reflects skill category.</p>
        </div>
      </div>
      <div className="flex min-h-72 flex-wrap items-center justify-center gap-4 rounded-3xl border border-white/10 bg-black/20 p-6">
        {topSkills.map((skill, index) => {
          const size = 72 + Math.round(skill.confidence / 5);
          const tone = skill.category === "backend" ? "from-cyan-400/25 to-blue-500/10 border-cyan-300/25"
            : skill.category === "frontend" || skill.category === "framework" ? "from-violet-400/25 to-fuchsia-500/10 border-violet-300/25"
              : skill.category === "testing" ? "from-emerald-400/25 to-cyan-500/10 border-emerald-300/25"
                : skill.category === "devops" ? "from-amber-400/25 to-orange-500/10 border-amber-300/25"
                  : "from-slate-300/15 to-white/5 border-white/15";
          return (
            <div key={`${skill.skill}-${index}`} className={`flex shrink-0 items-center justify-center rounded-full border bg-gradient-to-br p-3 text-center shadow-[0_0_32px_rgba(34,211,238,0.08)] transition hover:-translate-y-1 ${tone}`} style={{ width: size, height: size }}>
              <div>
                <p className="text-xs font-semibold text-white">{skill.skill}</p>
                <p className="mt-1 text-[10px] text-slate-400">{skill.confidence}%</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EvidenceList({ items, empty, tone = "cyan" }: { items: string[]; empty: string; tone?: "cyan" | "rose" | "amber" | "emerald" }) {
  const color = tone === "rose" ? "bg-rose-400" : tone === "amber" ? "bg-amber-400" : tone === "emerald" ? "bg-emerald-400" : "bg-cyan-400";
  return items.length ? (
    <div className="space-y-2">
      {items.map((item) => <p key={item} className="flex gap-3 text-sm leading-6 text-slate-400"><span className={`mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full ${color}`} />{item}</p>)}
    </div>
  ) : <p className="text-sm text-slate-600">{empty}</p>;
}

function ChecklistGroup({ title, items, checked, onToggle, tone }: { title: string; items: string[]; checked: Set<string>; onToggle: (item: string) => void; tone: "fuchsia" | "cyan" | "emerald" }) {
  const heading = tone === "fuchsia" ? "text-fuchsia-300" : tone === "cyan" ? "text-cyan-300" : "text-emerald-300";
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <h3 className={`text-sm font-semibold ${heading}`}>{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-sm leading-5 text-slate-300 transition hover:bg-white/[0.05]">
            <input type="checkbox" checked={checked.has(item)} onChange={() => onToggle(item)} className="mt-1 h-4 w-4 rounded border-white/20 bg-black text-violet-500 accent-violet-500" />
            <span className={checked.has(item) ? "text-slate-500 line-through" : ""}>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SimulatorStep({ action, scoreGain, category, selected, onToggle }: { action: string; scoreGain: number; category: string; selected: boolean; onToggle: () => void }) {
  const tone = category === "portfolio_project" ? "text-fuchsia-300" : category === "quality" ? "text-cyan-300" : "text-emerald-300";
  return (
    <button type="button" onClick={onToggle} className={`w-full rounded-2xl border p-4 text-left transition hover:border-cyan-400/25 hover:bg-white/[0.04] ${selected ? "border-cyan-400/20 bg-cyan-400/[0.045]" : "border-white/10 bg-black/20 opacity-65"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${tone}`}>{category.replace("_", " ")}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{action}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold ${selected ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200" : "border-white/10 bg-white/[0.04] text-slate-500"}`}>+{scoreGain}</span>
      </div>
    </button>
  );
}

function GaugeMeter({ value, label }: { value: number; label: string }) {
  const rotation = Math.max(-90, Math.min(90, -90 + value * 1.8));
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
      <div className="relative mx-auto h-36 max-w-xs overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-72 rounded-full border-[18px] border-white/10" />
        <div className="absolute inset-x-0 bottom-0 h-72 rounded-full border-[18px] border-transparent border-l-amber-400 border-r-cyan-400 border-t-emerald-400" />
        <div className="absolute bottom-0 left-1/2 h-28 w-1 origin-bottom rounded-full bg-white shadow-[0_0_22px_rgba(255,255,255,0.5)] transition-transform duration-700" style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }} />
        <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-white" />
      </div>
      <div className="mt-4 text-center">
        <p className="text-4xl font-semibold text-white">{value}</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{label}</p>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  const [report, setReport] = useState<AnalyzeSuccessResponse | null | undefined>(undefined);
  const [activeStep, setActiveStep] = useState<ProductStepId>("overview");
  const [skillFilter, setSkillFilter] = useState<"all" | SkillCategory>("all");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [recruiterMode, setRecruiterMode] = useState<"student" | "recruiter">("student");
  const [activeImprovementActions, setActiveImprovementActions] = useState<Set<string> | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REPORT_STORAGE_KEY);
      if (!stored) {
        setReport(null);
        return;
      }
      const parsed = JSON.parse(stored) as AnalyzeSuccessResponse;
      setReport(parsed?.success === true && parsed.opportunity && parsed.portfolioProject ? parsed : null);
    } catch {
      setReport(null);
    }
  }, []);

  const checklistKey = report ? `projectdna_build_plan_checks:${report.repo.fullName}:${report.targetJob.id}:${report.generatedAt}` : "";
  const checklistItems = useMemo(() => report ? [...report.portfolioProject.features, ...report.portfolioProject.technicalRequirements, ...report.portfolioProject.successCriteria] : [], [report]);

  useEffect(() => {
    if (!checklistKey) return;
    try {
      const stored = localStorage.getItem(checklistKey);
      setCheckedItems(new Set(stored ? JSON.parse(stored) as string[] : []));
    } catch {
      setCheckedItems(new Set());
    }
  }, [checklistKey]);

  useEffect(() => {
    setActiveImprovementActions(null);
  }, [report?.generatedAt]);

  function toggleChecklist(item: string) {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      if (checklistKey) localStorage.setItem(checklistKey, JSON.stringify([...next]));
      return next;
    });
  }

  async function copySummary() {
    if (!report) return;
    const text = `${report.evidencePacket.recruiterPitch}\nMatch score: ${report.opportunity.targetMatch.matchScore}% (${report.opportunity.targetMatch.readinessLevel} readiness)\n${report.portfolioProject.portfolioPitch}`;
    try {
      await copyText(text);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError("Clipboard access was blocked by this browser.");
    }
  }

  if (report === undefined) return <Shell><main className="relative z-10 flex min-h-screen items-center justify-center text-sm text-slate-500">Loading ProjectDNA analysis...</main></Shell>;
  if (!report) return <EmptyState />;

  const { repo, analysis, opportunity, portfolioProject, evidencePacket, fileTreeSummary, targetJob } = report;
  const target = opportunity.targetMatch;
  const filteredSkills = skillFilter === "all" ? analysis.detectedSkills : analysis.detectedSkills.filter((skill) => skill.category === skillFilter || (skillFilter === "frontend" && skill.category === "framework"));
  const checkedCount = checklistItems.filter((item) => checkedItems.has(item)).length;
  const progress = checklistItems.length ? Math.round((checkedCount / checklistItems.length) * 100) : 0;
  const simulator = simulateOpportunityGrowth({
    currentMatch: target,
    missingRequiredSkills: target.missingRequiredSkills,
    missingPreferredSkills: target.missingPreferredSkills,
    qualitySignals: analysis.qualitySignals,
    portfolioProject,
  });
  const overlookedMeter = calculateOpportunityGap({
    detectedSkills: analysis.detectedSkills,
    currentMatch: target,
    qualitySignals: analysis.qualitySignals,
    projectComplexity: analysis.projectComplexity,
  });
  const recruiterView = generateRecruiterView({
    analysis,
    targetMatch: target,
    gapAnalysis: opportunity.gapAnalysis,
    portfolioProject,
    targetJob,
  });
  const activeActions = activeImprovementActions ?? new Set(simulator.improvements.map((improvement) => improvement.action));
  const activeUnlockable = simulator.improvements.filter((improvement) => activeActions.has(improvement.action)).reduce((sum, improvement) => sum + improvement.scoreGain, 0);
  const dynamicProjectedScore = Math.min(95, simulator.currentScore + activeUnlockable);
  const unlockable = dynamicProjectedScore - simulator.currentScore;

  function toggleImprovement(action: string) {
    setActiveImprovementActions((current) => {
      const next = new Set(current ?? simulator.improvements.map((improvement) => improvement.action));
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  return (
    <Shell>
      <header className="relative z-30 border-b border-slate-800 bg-[#050814]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[92rem] flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-wide text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-xs text-blue-200">DNA</span>
            ProjectDNA
          </Link>
          <div className="grid gap-2 text-xs sm:grid-cols-[minmax(160px,1fr)_minmax(180px,1fr)_auto_auto] sm:items-center">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2"><span className="text-slate-600">Repo</span><span className="ml-2 font-medium text-slate-200">{repo.fullName}</span></div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2"><span className="text-slate-600">Role</span><span className="ml-2 font-medium text-slate-200">{target.title}</span></div>
            <Badge tone={report.analysisMode === "demo" ? "cyan" : "emerald"}>{report.analysisMode === "demo" ? "Demo snapshot" : "Live GitHub analysis"}</Badge>
            <Link href="/report/latest" className="rounded-xl bg-white px-4 py-2 text-center text-xs font-semibold text-slate-950 transition hover:bg-cyan-100">View Report</Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-[88rem] px-6 pb-20 pt-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-6 lg:px-8">
        <ProductNav activeStep={activeStep} onStepChange={setActiveStep} />

        <div className="min-w-0">
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1220]/80 p-5 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Analysis workspace</p>
                <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">Opportunity readiness review</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Review the repo-derived evidence, role fit, gaps, next build, and shareable packet.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[520px]">
                <MetricCard label="Match" value={`${target.matchScore}%`} detail={target.readinessLevel} />
                <MetricCard label="Potential" value={`${dynamicProjectedScore}%`} detail={`+${unlockable} unlock`} />
                <MetricCard label="Gap" value={`${overlookedMeter.opportunityGap > 0 ? "+" : ""}${overlookedMeter.opportunityGap}`} detail={overlookedMeter.classification} />
                <MetricCard label="Confidence" value={`${analysis.confidence}%`} detail={analysis.domainClassification.primaryDomain} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0b1220]/80 p-5 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-6">
          {activeStep === "overview" && (
            <section>
              <SectionHeader eyebrow="Opportunity Readiness Snapshot" title={`${repo.fullName} for ${targetJob.title}`} text="A fast executive view of what the public repository proves, where visibility is missing, and what ProjectDNA generated next." />
              <StepHelp>Start here to understand your current match, potential match, and overall readiness.</StepHelp>
              {analysis.confidence < 40 && <div className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4 text-sm text-amber-200">Low confidence: ProjectDNA only found limited public evidence in this repository.</div>}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs text-slate-500">Current match</p><p className="mt-2 text-3xl font-semibold text-white">{target.matchScore}%</p><p className="mt-1 text-xs capitalize text-blue-200">{target.readinessLevel} readiness</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs text-slate-500">Potential match</p><p className="mt-2 text-3xl font-semibold text-white">{dynamicProjectedScore}%</p><p className="mt-1 text-xs text-emerald-200">+{unlockable} points</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs text-slate-500">Opportunity gap</p><p className="mt-2 text-3xl font-semibold text-white">{overlookedMeter.opportunityGap > 0 ? "+" : ""}{overlookedMeter.opportunityGap}</p><p className="mt-1 text-xs text-blue-200">{overlookedMeter.classification}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-xs text-slate-500">Confidence</p><p className="mt-2 text-3xl font-semibold text-white">{analysis.confidence}%</p><p className="mt-1 text-xs text-slate-500">{analysis.domainClassification.primaryDomain}</p></div>
              </div>
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Evidence flow</p><h3 className="mt-1 text-xl font-semibold text-white">From repo signals to a packet</h3></div>
                  <p className="text-xs text-slate-500">Repository signals become a recruiter-ready packet.</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-5">
                  {[
                    ["GitHub Evidence", `${fileTreeSummary.selectedFiles} files selected`],
                    ["Skill DNA", `${analysis.detectedSkills.length} skills found`],
                    ["Fit Score", `${target.matchScore}% match`],
                    ["Build Plan", portfolioProject.difficulty],
                    ["Evidence Packet", "Ready"],
                  ].map(([label, metric], index) => (
                    <div key={label} className="relative rounded-xl border border-slate-800 bg-[#0b1220] p-3">
                      {index < 4 && <div className="absolute left-full top-1/2 hidden h-px w-3 bg-slate-700 lg:block" />}
                      <p className="text-sm font-semibold text-white">{label}</p>
                      <p className="mt-2 text-xs text-slate-500">{metric}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <MetricCard label="Repository" value={repo.fullName} detail={repo.language ?? "Mixed language"} />
                <MetricCard label="Top extensions" value={fileTreeSummary.topExtensions.slice(0, 3).map((item) => item.extension).join(" / ") || "None"} />
                <MetricCard label="Project complexity" value={analysis.projectComplexity.level} detail={`${analysis.projectComplexity.score}/100`} />
              </div>
              <div className="mt-6"><Timeline report={report} /></div>
            </section>
          )}

          {activeStep === "skills" && (
            <section>
              <SectionHeader eyebrow="Skill DNA" title="Repo-derived capability signals" text="Filter by category, then open a skill to inspect the evidence lines and source files that support it." />
              <StepHelp>Review the skills ProjectDNA found from your public repo. Expand a skill to see evidence and source files.</StepHelp>
              <SkillDnaMap skills={analysis.detectedSkills} />
              <div className="mt-6"><SkillRadar skills={analysis.detectedSkills} /></div>
              <div className="mt-6 flex flex-wrap gap-2">
                {skillFilters.map((filter) => <button key={filter} type="button" onClick={() => setSkillFilter(filter)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${skillFilter === filter ? "border-violet-400/35 bg-violet-400/15 text-white" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>{filter.replace("_", " / ")}</button>)}
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {filteredSkills.length ? filteredSkills.map((skill) => <SkillCard key={`${skill.category}-${skill.skill}`} skill={skill} expanded={expandedSkill === `${skill.category}-${skill.skill}`} onToggle={() => setExpandedSkill(expandedSkill === `${skill.category}-${skill.skill}` ? null : `${skill.category}-${skill.skill}`)} />) : <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500 md:col-span-2 lg:col-span-3">No defensible skills were detected for this filter.</div>}
              </div>
            </section>
          )}

          {activeStep === "fit" && (
            <section>
              <SectionHeader eyebrow="Opportunity Fit" title={`${target.matchScore}% match for ${target.title}`} text="The score is calculated from seeded role requirements, detected repo skills, evidence strength, domain alignment, and project complexity." />
              <StepHelp>See why your repo matches or misses the selected role. Focus on low scoring breakdown areas.</StepHelp>
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="rounded-3xl border border-white/10 bg-[#0d0d16]/85 p-6">
                  <h3 className="text-lg font-semibold text-white">Matched requirement table</h3>
                  <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                    <div className="grid grid-cols-[1fr_1fr_90px] gap-px bg-white/10 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      <div className="bg-[#0d0d16] p-3">Requirement</div>
                      <div className="bg-[#0d0d16] p-3">Repo evidence</div>
                      <div className="bg-[#0d0d16] p-3 text-right">Strength</div>
                    </div>
                    {target.matchedSkills.length ? target.matchedSkills.map((match) => (
                      <div key={`${match.jobSkill}-${match.matchedRepoSkill}`} className="grid grid-cols-[1fr_1fr_90px] gap-px border-t border-white/10 bg-white/10">
                        <div className="bg-[#0d0d16] p-4 text-sm text-slate-200">{match.jobSkill}</div>
                        <div className="bg-[#0d0d16] p-4"><p className="text-sm text-cyan-300">{match.matchedRepoSkill}</p><p className="mt-1 text-xs leading-5 text-slate-500">{match.evidence[0]}</p></div>
                        <div className="bg-[#0d0d16] p-4 text-right text-sm font-semibold text-white">{match.strength}%</div>
                      </div>
                    )) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No target requirements have defensible repository evidence yet.</p>}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.04] p-6">
                    <RadialScore score={target.matchScore} label="Calculated match" />
                    <p className="mt-5 text-center"><span className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium capitalize text-violet-200">{target.readinessLevel} readiness</span></p>
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                    <h3 className="text-sm font-semibold text-white">Score breakdown</h3>
                    <div className="mt-5 space-y-5">
                      <ScoreRow label="Required skill coverage" value={target.scoreBreakdown.requiredSkillCoverage} weight="45%" />
                      <ScoreRow label="Preferred skill coverage" value={target.scoreBreakdown.preferredSkillCoverage} weight="20%" />
                      <ScoreRow label="Evidence strength" value={target.scoreBreakdown.evidenceStrength} weight="20%" />
                      <ScoreRow label="Domain alignment" value={target.scoreBreakdown.domainAlignment} weight="10%" />
                      <ScoreRow label="Complexity relevance" value={target.scoreBreakdown.complexityRelevance} weight="5%" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                <h3 className="text-sm font-semibold text-white">Alternative role matches</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {opportunity.alternativeMatches.map((match) => <div key={match.jobId} className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white">{match.title}</p><p className="mt-1 text-xs text-slate-600">{match.company}</p></div><span className="text-lg font-semibold text-violet-300">{match.matchScore}%</span></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${match.matchScore}%` }} /></div><p className="mt-3 text-xs capitalize text-slate-500">{match.readinessLevel} readiness</p></div>)}
                </div>
              </div>
            </section>
          )}

          {activeStep === "gaps" && (
            <section>
              <SectionHeader eyebrow="Gap Map" title="The bridge from current proof to target opportunity" text={opportunity.gapAnalysis.overallAdvice} />
              <StepHelp>Use this bridge to understand what evidence you already have, what is missing, and what to build next.</StepHelp>
              <div className="mb-6 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.045] p-5 text-sm leading-6 text-rose-100">This is where social capital usually fills the gap.</div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.045] p-5 text-sm leading-6 text-emerald-100">ProjectDNA replaces that with a buildable evidence path.</div>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="relative rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.035] p-6">
                  <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-emerald-400/50 to-rose-400/50 lg:block" />
                  <h3 className="text-lg font-semibold text-emerald-200">Current Proof</h3>
                  <div className="mt-4"><EvidenceList items={opportunity.gapAnalysis.strongestEvidence} empty="No matched evidence available yet." tone="emerald" /></div>
                </div>
                <div className="relative rounded-3xl border border-rose-400/20 bg-rose-400/[0.035] p-6">
                  <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-rose-400/50 to-cyan-400/50 lg:block" />
                  <h3 className="text-lg font-semibold text-rose-200">Missing Signals</h3>
                  <div className="mt-4"><EvidenceList items={opportunity.gapAnalysis.criticalGaps} empty="No critical required gaps detected." tone="rose" /></div>
                </div>
                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.035] p-6">
                  <h3 className="text-lg font-semibold text-cyan-200">Next Build</h3>
                  <p className="mt-4 text-xl font-semibold text-white">{portfolioProject.title}</p>
                  <div className="mt-4 flex flex-wrap gap-2">{portfolioProject.skillsToProve.slice(0, 6).map((skill) => <Badge key={skill} tone="cyan">{skill}</Badge>)}</div>
                </div>
              </div>
              <div className="mt-6 rounded-3xl border border-amber-400/15 bg-amber-400/[0.035] p-6">
                <h3 className="text-sm font-semibold text-amber-300">Improvement areas</h3>
                <div className="mt-4"><EvidenceList items={opportunity.gapAnalysis.improvementAreas} empty="No immediate quality improvements identified." tone="amber" /></div>
                <div className="mt-6 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3 text-sm text-cyan-100"><span className="mr-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">Next best role</span>{opportunity.gapAnalysis.nextBestRole}</div>
              </div>
            </section>
          )}

          {activeStep === "build" && (
            <section>
              <SectionHeader eyebrow="Build Plan" title={portfolioProject.title} text={portfolioProject.summary} />
              <StepHelp>Treat this as your next portfolio mission. Tick items as you complete them.</StepHelp>
              <div className="relative overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-[#0c0912] p-6 shadow-[0_0_80px_rgba(168,85,247,0.1)] sm:p-8">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_10%_10%,rgba(192,38,211,0.13),transparent_38%)]" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap gap-2"><Badge tone="violet">{portfolioProject.difficulty}</Badge><Badge tone="cyan">{portfolioProject.estimatedTime}</Badge><Badge>{portfolioProject.targetRole}</Badge></div>
                    <p className="mt-6 text-sm leading-6 text-slate-300">{portfolioProject.whyThisProject}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-5 lg:w-80">
                    <div className="flex items-end justify-between"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-300">Evidence-building progress</p><p className="text-2xl font-semibold text-white">{progress}%</p></div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${progress}%` }} /></div>
                    <p className="mt-2 text-xs text-slate-500">{checkedCount}/{checklistItems.length} checklist items complete locally</p>
                    {progress === 100 && <p className="mt-3 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-center text-xs font-semibold text-emerald-200">Mission complete</p>}
                  </div>
                </div>
                <div className="relative mt-7 rounded-2xl border border-violet-400/20 bg-violet-400/[0.055] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">What this proves</p>
                  <div className="mt-4 flex flex-wrap gap-2">{portfolioProject.skillsToProve.map((skill) => <Badge key={skill} tone="violet">{skill}</Badge>)}</div>
                </div>
                <div className="relative mt-8 grid gap-5 lg:grid-cols-3">
                  <ChecklistGroup title="Features" items={portfolioProject.features} checked={checkedItems} onToggle={toggleChecklist} tone="fuchsia" />
                  <ChecklistGroup title="Technical requirements" items={portfolioProject.technicalRequirements} checked={checkedItems} onToggle={toggleChecklist} tone="cyan" />
                  <ChecklistGroup title="Success criteria" items={portfolioProject.successCriteria} checked={checkedItems} onToggle={toggleChecklist} tone="emerald" />
                </div>
                <div className="relative mt-8 grid gap-6 lg:grid-cols-2">
                  <div><h3 className="text-sm font-semibold text-violet-300">Deliverables</h3><div className="mt-3"><EvidenceList items={portfolioProject.deliverables} empty="No deliverables generated." /></div></div>
                  <div><h3 className="text-sm font-semibold text-amber-300">Stretch goals</h3><div className="mt-3"><EvidenceList items={portfolioProject.stretchGoals} empty="No stretch goals generated." tone="amber" /></div></div>
                </div>
                <blockquote className="relative mt-8 rounded-2xl border border-white/10 bg-black/25 p-5 text-lg font-medium leading-8 text-white">&ldquo;{portfolioProject.portfolioPitch}&rdquo;</blockquote>
              </div>
            </section>
          )}

          {activeStep === "lab" && (
            <section>
              <SectionHeader eyebrow="Opportunity Lab" title="Simulate the next opportunity unlock" text="This lab turns the current ProjectDNA analysis into a forward-looking simulator: what improves, what remains hidden, and how a recruiter might read the evidence." />
              <StepHelp>Toggle improvements to simulate how your match score can increase after adding missing evidence.</StepHelp>
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <MetricCard label="Current Match" value={`${simulator.currentScore}%`} detail={target.readinessLevel} />
                <MetricCard label="Potential Match" value={`${dynamicProjectedScore}%`} detail={dynamicProjectedScore >= 75 ? "Strong Potential" : "Evidence still developing"} />
                <MetricCard label="Opportunity Gap" value={`${overlookedMeter.opportunityGap > 0 ? "+" : ""}${overlookedMeter.opportunityGap}`} detail={overlookedMeter.classification} />
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0c1118] to-[#0c0a14]">
                  <div className="border-b border-white/10 p-6 sm:p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Opportunity Simulator</p>
                        <h3 className="mt-3 text-2xl font-semibold text-white">Current to potential readiness</h3>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Projected gains come from missing skills, weak evidence signals, and the recommended portfolio project. Scores are capped at 95.</p>
                      </div>
                      <Badge tone={dynamicProjectedScore >= 75 ? "emerald" : dynamicProjectedScore >= 55 ? "cyan" : "amber"}>{dynamicProjectedScore >= 75 ? "Strong Potential" : "Growth Path"}</Badge>
                    </div>
                    <div className="mt-7 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                        <p className="text-xs text-slate-500">Current</p>
                        <p className="mt-2 text-5xl font-semibold text-white">{simulator.currentScore}%</p>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-violet-500 transition-all duration-700" style={{ width: `${simulator.currentScore}%` }} /></div>
                      </div>
                      <div className="hidden text-cyan-300 sm:block"><ArrowIcon /></div>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.045] p-5">
                        <p className="text-xs text-slate-500">Potential</p>
                        <p className="mt-2 text-5xl font-semibold text-white">{dynamicProjectedScore}%</p>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-700" style={{ width: `${dynamicProjectedScore}%` }} /></div>
                      </div>
                    </div>
                    <div className="mt-5 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-4 py-3 text-sm text-emerald-100">Unlocked <span className="font-semibold">+{unlockable} points</span> from selected improvements.</div>
                  </div>
                  <div className="grid gap-3 p-6 sm:p-8">
                    {simulator.improvements.map((improvement) => <SimulatorStep key={`${improvement.category}-${improvement.action}`} action={improvement.action} scoreGain={improvement.scoreGain} category={improvement.category} selected={activeActions.has(improvement.action)} onToggle={() => toggleImprovement(improvement.action)} />)}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.035] p-6 sm:p-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Talent Overlooked Meter</p>
                        <h3 className="mt-3 text-2xl font-semibold text-white">{overlookedMeter.classification}</h3>
                      </div>
                      <Badge tone={overlookedMeter.classification === "Highly Overlooked" ? "rose" : overlookedMeter.classification === "Undervalued" ? "amber" : overlookedMeter.classification === "Well Represented" ? "cyan" : "emerald"}>{overlookedMeter.classification}</Badge>
                    </div>
                    <div className="mt-6"><GaugeMeter value={Math.max(0, Math.min(100, overlookedMeter.opportunityGap + 50))} label="Visibility gap" /></div>
                    <p className="mt-5 text-sm leading-6 text-slate-400">{overlookedMeter.explanation}</p>
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-500">Capability</p><p className="mt-2 text-2xl font-semibold text-white">{overlookedMeter.capabilityScore}</p></div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs text-slate-500">Visibility</p><p className="mt-2 text-2xl font-semibold text-white">{overlookedMeter.visibilityScore}</p></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-300">Recruiter Mode</p>
                    <h3 className="mt-3 text-2xl font-semibold text-white">Switch perspective</h3>
                  </div>
                  <div className="flex rounded-xl border border-white/10 bg-black/25 p-1">
                    <button type="button" onClick={() => setRecruiterMode("student")} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${recruiterMode === "student" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}>Student View</button>
                    <button type="button" onClick={() => setRecruiterMode("recruiter")} className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${recruiterMode === "recruiter" ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"}`}>Recruiter View</button>
                  </div>
                </div>

                {recruiterMode === "student" ? (
                  <div className="mt-7 grid gap-5 lg:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><h4 className="text-sm font-semibold text-cyan-300">Skills</h4><div className="mt-3 flex flex-wrap gap-2">{analysis.detectedSkills.slice(0, 6).map((skill) => <Badge key={skill.skill} tone="cyan">{skill.skill}</Badge>)}</div></div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><h4 className="text-sm font-semibold text-rose-300">Gaps</h4><div className="mt-3"><EvidenceList items={target.missingRequiredSkills.slice(0, 4)} empty="No required gaps detected." tone="rose" /></div></div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><h4 className="text-sm font-semibold text-fuchsia-300">Project</h4><p className="mt-3 text-sm leading-6 text-slate-300">{portfolioProject.title}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><h4 className="text-sm font-semibold text-emerald-300">Path</h4><p className="mt-3 text-sm leading-6 text-slate-300">Close the top gaps, publish the build plan, then use the evidence packet as your recruiter-facing story.</p></div>
                  </div>
                ) : (
                  <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1fr]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><h4 className="text-sm font-semibold text-white">Capability Summary</h4><p className="mt-3 text-sm leading-6 text-slate-300">{recruiterView.capabilitySummary}</p><div className="mt-5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4 text-sm leading-6 text-cyan-100">{recruiterView.hiringRecommendation}</div></div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><h4 className="text-sm font-semibold text-emerald-300">Top Evidence</h4><div className="mt-3"><EvidenceList items={recruiterView.strongestEvidence} empty="No strong evidence available." tone="emerald" /></div></div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><h4 className="text-sm font-semibold text-violet-300">Interview Focus Areas</h4><div className="mt-3"><EvidenceList items={recruiterView.interviewTopics} empty="No interview topics generated." /></div></div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5"><h4 className="text-sm font-semibold text-amber-300">Risk Areas</h4><div className="mt-3"><EvidenceList items={recruiterView.riskAreas} empty="No major risk areas identified." tone="amber" /></div></div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeStep === "packet" && (
            <section>
              <SectionHeader eyebrow="Evidence Packet" title={evidencePacket.headline} text={evidencePacket.summary} />
              <StepHelp>Copy this summary or open the formal report when applying or asking for referrals.</StepHelp>
              {copyError && <p role="alert" className="mb-4 text-sm text-rose-400">{copyError}</p>}
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0c1118] to-[#0c0a14] p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Recruiter pitch</p>
                  <p className="mt-4 text-lg font-medium leading-8 text-white">{evidencePacket.recruiterPitch}</p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <button type="button" onClick={copySummary} className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">{copied ? "Summary copied" : "Copy recruiter summary"}</button>
                    <Link href="/report/latest" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10">View full report <ArrowIcon /></Link>
                    <Link href="/" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/5">Back to landing</Link>
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Proof points</p>
                  <div className="mt-5 space-y-5">
                    {evidencePacket.proofPoints.length ? evidencePacket.proofPoints.map((point) => <div key={point.label}><p className="text-xs text-slate-600">{point.label}</p><p className="mt-1 text-lg font-semibold capitalize text-white">{point.value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{point.evidence}</p></div>) : <p className="text-sm text-slate-600">No proof points were generated from this repository.</p>}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h3 className="text-sm font-semibold text-white">Opportunity fit</h3><p className="mt-3 text-sm leading-6 text-slate-400">{evidencePacket.opportunityFit}</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h3 className="text-sm font-semibold text-white">Gap narrative</h3><p className="mt-3 text-sm leading-6 text-slate-400">{evidencePacket.gapNarrative}</p></div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"><h3 className="text-sm font-semibold text-white">Credibility notes</h3><div className="mt-3"><EvidenceList items={evidencePacket.credibilityNotes} empty="No credibility notes available." /></div></div>
              </div>
            </section>
          )}
        </div>
      </div>
      </div>
    </Shell>
  );
}
