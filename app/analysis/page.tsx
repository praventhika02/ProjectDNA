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

function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "emerald" | "amber" | "slate" }) {
  const styles = {
    blue: "border-indigo-300 bg-[#F2F0FF] text-indigo-700",
    emerald: "border-teal-300 bg-[#EDF7F6] text-teal-700",
    amber: "border-amber-300 bg-[#FFF7E8] text-amber-700",
    slate: "border-slate-300 bg-[#F7F8FA] text-slate-700",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

function MetricCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-[#EEF4FF] to-[#EAF3F8] p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

function SectionHeader({ title, subtitle, help }: { title: string; subtitle: string; help: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-3 rounded-xl border border-slate-300 bg-[#F7F8FA] px-4 py-3 text-sm text-indigo-800 shadow-sm">
        <span className="font-semibold">How to use: </span>{help}
      </div>
    </div>
  );
}

function EvidenceList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />{item}</p>)}
    </div>
  );
}

function ProgressBar({ value, tone = "blue" }: { value: number; tone?: "blue" | "emerald" | "amber" }) {
  const color = tone === "emerald" ? "bg-teal-600" : tone === "amber" ? "bg-amber-600" : "bg-indigo-600";
  return <div className="h-2 overflow-hidden rounded-full bg-[#EEF4FF]"><div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-[#EEF4FF] via-[#EAF3F8] to-[#EDF7F6] p-5 text-center shadow-sm">
      <div
        className="mx-auto flex h-32 w-32 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(#4F46E5 ${score * 3.6}deg, #EAF3F8 0deg)` }}
      >
        <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#F7F8FA] shadow-inner">
          <span className="text-3xl font-semibold text-slate-950">{score}%</span>
          <span className="text-xs text-slate-500">{label}</span>
        </div>
      </div>
    </div>
  );
}

function SkillBubbleMap({ skills }: { skills: SkillEvidence[] }) {
  const palette = ["bg-[#EEF4FF] text-indigo-700", "bg-[#EAF3F8] text-cyan-700", "bg-[#EDF7F6] text-teal-700", "bg-[#F2F0FF] text-indigo-700", "bg-[#FFF7E8] text-amber-700"];
  return (
    <div className="mb-4 rounded-2xl border border-slate-300 bg-gradient-to-r from-[#EEF4FF] via-[#EAF3F8] to-[#EDF7F6] p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-950">Skill DNA Map</h3>
        <span className="text-xs text-slate-500">{skills.length} repo-derived signals</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {skills.slice(0, 12).map((skill, index) => (
          <span
            key={`${skill.category}-${skill.skill}-bubble`}
            className={`rounded-full px-3 py-2 text-xs font-semibold shadow-sm ${palette[index % palette.length]}`}
            style={{ transform: `scale(${0.9 + Math.min(skill.confidence, 100) / 500})` }}
          >
            {skill.skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function SkillCard({ skill, expanded, onToggle }: { skill: SkillEvidence; expanded: boolean; onToggle: () => void }) {
  const skillTones: Record<string, string> = {
    language: "bg-[#EEF4FF] border-slate-300",
    frontend: "bg-[#F2F0FF] border-slate-300",
    framework: "bg-[#F2F0FF] border-slate-300",
    backend: "bg-[#EAF3F8] border-slate-300",
    database: "bg-[#F7F8FA] border-slate-300",
    ai_ml: "bg-[#EDF7F6] border-slate-300",
    data: "bg-[#EDF7F6] border-slate-300",
    testing: "bg-[#FFF7E8] border-amber-300",
    devops: "bg-[#F7F8FA] border-slate-300",
    product: "bg-[#EAF3F8] border-slate-300",
    other: "bg-[#F7F8FA] border-slate-300",
  };
  return (
    <article className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${skillTones[skill.category] ?? skillTones.other}`}>
      <button type="button" onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-950">{skill.skill}</h3>
            <p className="mt-1 text-xs capitalize text-slate-500">{skill.category.replace("_", " / ")}</p>
          </div>
          <Badge>{skill.confidence}%</Badge>
        </div>
        <div className="mt-3">
          <ProgressBar value={skill.confidence} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex gap-1" aria-label={`${skill.proficiency} out of 5`}>
            {[1, 2, 3, 4, 5].map((level) => <span key={level} className={`h-1.5 w-5 rounded-full ${level <= skill.proficiency ? "bg-indigo-600" : "bg-slate-300"}`} />)}
          </div>
          <span className="text-xs text-slate-500">{skill.sourceFiles.length} files</span>
        </div>
      </button>
      <div className="mt-3 space-y-2">
        {skill.evidence.slice(0, expanded ? undefined : 1).map((line) => <p key={line} className="text-xs leading-5 text-slate-600">{line}</p>)}
      </div>
      {expanded && (
        <div className="mt-3 rounded-xl border border-slate-300 bg-[#F7F8FA] p-3 font-mono">
          <p className="text-xs font-semibold text-slate-700">Source files</p>
          <div className="mt-2 flex flex-wrap gap-2">{skill.sourceFiles.length ? skill.sourceFiles.map((file) => <span key={file} className="rounded-full bg-[#EEF4FF] px-2 py-1 text-xs text-slate-600 ring-1 ring-slate-300">{file}</span>) : <span className="text-xs text-slate-500">No specific source file.</span>}</div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{skill.reasoning}</p>
        </div>
      )}
    </article>
  );
}

function ChecklistGroup({ title, items, checked, onToggle }: { title: string; items: string[]; checked: Set<string>; onToggle: (item: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-[#F7F8FA] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <label key={item} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-300 bg-[#EEF4FF] p-3 text-sm leading-5 text-slate-700 hover:bg-[#EAF3F8]">
            <input type="checkbox" checked={checked.has(item)} onChange={() => onToggle(item)} className="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-500" />
            <span className={checked.has(item) ? "text-slate-400 line-through" : ""}>{item}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#EEF4FF,#F4F7FB,#EDF7F6)] px-6 text-center">
      <div className="max-w-md rounded-2xl border border-slate-300 bg-[#EAF3F8] p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">No analysis found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Run ProjectDNA first. The workspace loads from the latest saved browser report.</p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Run analysis</Link>
      </div>
    </main>
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
      setReport(stored ? JSON.parse(stored) as AnalyzeSuccessResponse : null);
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

  if (report === undefined) return <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#EEF4FF,#F4F7FB,#EDF7F6)] text-sm text-slate-500">Loading analysis...</main>;
  if (!report?.success) return <EmptyState />;

  const { repo, analysis, opportunity, portfolioProject, evidencePacket, fileTreeSummary, targetJob } = report;
  const target = opportunity.targetMatch;
  const filteredSkills = skillFilter === "all" ? analysis.detectedSkills : analysis.detectedSkills.filter((skill) => skill.category === skillFilter || (skillFilter === "frontend" && skill.category === "framework"));
  const checkedCount = checklistItems.filter((item) => checkedItems.has(item)).length;
  const progress = checklistItems.length ? Math.round((checkedCount / checklistItems.length) * 100) : 0;
  const simulator = simulateOpportunityGrowth({ currentMatch: target, missingRequiredSkills: target.missingRequiredSkills, missingPreferredSkills: target.missingPreferredSkills, qualitySignals: analysis.qualitySignals, portfolioProject });
  const overlookedMeter = calculateOpportunityGap({ detectedSkills: analysis.detectedSkills, currentMatch: target, qualitySignals: analysis.qualitySignals, projectComplexity: analysis.projectComplexity });
  const recruiterView = generateRecruiterView({ analysis, targetMatch: target, gapAnalysis: opportunity.gapAnalysis, portfolioProject, targetJob });
  const activeActions = activeImprovementActions ?? new Set(simulator.improvements.map((improvement) => improvement.action));
  const activeUnlockable = simulator.improvements.filter((improvement) => activeActions.has(improvement.action)).reduce((sum, improvement) => sum + improvement.scoreGain, 0);
  const dynamicProjectedScore = Math.min(95, simulator.currentScore + activeUnlockable);

  function toggleChecklist(item: string) {
    setCheckedItems((current) => {
      const next = new Set(current);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      if (checklistKey) localStorage.setItem(checklistKey, JSON.stringify([...next]));
      return next;
    });
  }

  function toggleImprovement(action: string) {
    setActiveImprovementActions((current) => {
      const next = new Set(current ?? simulator.improvements.map((improvement) => improvement.action));
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  async function copySummary() {
    const text = `${evidencePacket.recruiterPitch}\nMatch score: ${target.matchScore}% (${target.readinessLevel} readiness)\n${portfolioProject.portfolioPitch}`;
    try {
      await copyText(text);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError("Clipboard access was blocked by this browser.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#EEF4FF_0%,#F4F7FB_52%,#EDF7F6_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>
      <header className="relative z-10 border-b border-slate-300 bg-[#EAF3F8]/85 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-3 px-6 py-4 md:grid-cols-[1fr_auto] md:items-center">
          <Link href="/" className="text-sm font-semibold text-indigo-700">ProjectDNA</Link>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-lg border border-slate-300 bg-[#EAF3F8] px-3 py-2 shadow-sm"><span className="text-slate-500">Repo</span> <span className="font-medium text-slate-900">{repo.fullName}</span></span>
            <span className="rounded-lg border border-slate-300 bg-[#F7F8FA] px-3 py-2 shadow-sm"><span className="text-slate-500">Role</span> <span className="font-medium text-slate-900">{target.title}</span></span>
            <Badge tone={report.analysisMode === "demo" ? "blue" : "emerald"}>{report.analysisMode === "demo" ? "Demo" : "Live"}</Badge>
            <Badge tone="slate">{target.matchScore}% match</Badge>
            <Link href="/report/latest" className="rounded-lg bg-indigo-600 px-3 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700">Report</Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[220px_1fr]">
        <ProductNav activeStep={activeStep} onStepChange={setActiveStep} />
        <div className="min-w-0 rounded-[1.75rem] border border-slate-300 bg-[#EAF3F8]/85 p-5 shadow-xl shadow-slate-200/60 backdrop-blur">
          {activeStep === "overview" && (
            <section>
              <SectionHeader title="Overview" subtitle="Current readiness summary for the selected role." help="Start here to understand your current match, potential match, and overall readiness." />
              {analysis.confidence < 40 && <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Low confidence: this repo may not contain enough public evidence for a strong assessment.</div>}
              <div className="grid gap-3 md:grid-cols-4">
                <MetricCard label="Current match" value={`${target.matchScore}%`} detail={target.readinessLevel} />
                <MetricCard label="Potential match" value={`${dynamicProjectedScore}%`} detail={`+${dynamicProjectedScore - simulator.currentScore} points`} />
                <MetricCard label="Opportunity gap" value={`${overlookedMeter.opportunityGap > 0 ? "+" : ""}${overlookedMeter.opportunityGap}`} detail={overlookedMeter.classification} />
                <MetricCard label="Confidence" value={`${analysis.confidence}%`} detail={analysis.domainClassification.primaryDomain} />
              </div>
              <div className="mt-4 rounded-2xl border border-slate-300 bg-gradient-to-r from-[#EAF3F8] via-[#EEF4FF] to-[#EDF7F6] p-4">
                <h3 className="text-sm font-semibold text-slate-950">Pipeline summary</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-5">
                  {[
                    ["Files", `${fileTreeSummary.selectedFiles} selected`],
                    ["Skills", `${analysis.detectedSkills.length} found`],
                    ["Score", `${target.matchScore}%`],
                    ["Gaps", `${opportunity.gapAnalysis.criticalGaps.length}`],
                    ["Plan", portfolioProject.difficulty],
                  ].map(([label, value]) => <MetricCard key={label} label={label} value={value} />)}
                </div>
              </div>
            </section>
          )}

          {activeStep === "skills" && (
            <section>
              <SectionHeader title="Skill DNA" subtitle="Skills detected from public GitHub evidence." help="Expand a skill to see the evidence and files behind it." />
              <SkillBubbleMap skills={analysis.detectedSkills} />
              <div className="flex flex-wrap gap-2">
                {skillFilters.map((filter) => <button key={filter} type="button" onClick={() => setSkillFilter(filter)} className={`rounded-full border px-3 py-1.5 font-mono text-xs font-medium transition ${skillFilter === filter ? "border-indigo-300 bg-[#F2F0FF] text-indigo-800 shadow-sm" : "border-slate-300 bg-[#F7F8FA] text-slate-600 hover:bg-[#EAF3F8]"}`}>{filter.replace("_", " / ")}</button>)}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredSkills.length ? filteredSkills.map((skill) => <SkillCard key={`${skill.category}-${skill.skill}`} skill={skill} expanded={expandedSkill === `${skill.category}-${skill.skill}`} onToggle={() => setExpandedSkill(expandedSkill === `${skill.category}-${skill.skill}` ? null : `${skill.category}-${skill.skill}`)} />) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">No skills detected for this filter.</div>}
              </div>
            </section>
          )}

          {activeStep === "fit" && (
            <section>
              <SectionHeader title="Fit Score" subtitle="How the repo maps to the selected role." help="Focus on low scoring breakdown areas and missing requirements." />
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="overflow-hidden rounded-2xl border border-slate-300 bg-[#EAF3F8] shadow-sm">
                  <div className="grid grid-cols-[1fr_1fr_80px] bg-[#EEF4FF] px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wide text-indigo-700">
                    <span>Requirement</span><span>Repo evidence</span><span className="text-right">Strength</span>
                  </div>
                  {target.matchedSkills.length ? target.matchedSkills.map((match) => (
                    <div key={`${match.jobSkill}-${match.matchedRepoSkill}`} className="grid grid-cols-[1fr_1fr_80px] border-t border-slate-300 px-4 py-3 text-sm">
                      <span className="text-slate-700">{match.jobSkill}</span>
                      <span className="text-slate-600">{match.matchedRepoSkill}</span>
                      <span className="text-right font-medium text-slate-900">{match.strength}%</span>
                    </div>
                  )) : <p className="p-4 text-sm text-slate-500">No matched requirements yet.</p>}
                </div>
                <div className="space-y-3">
                  <ScoreCircle score={target.matchScore} label={target.readinessLevel} />
                  {[
                    ["Required", target.scoreBreakdown.requiredSkillCoverage, "45%"],
                    ["Preferred", target.scoreBreakdown.preferredSkillCoverage, "20%"],
                    ["Evidence", target.scoreBreakdown.evidenceStrength, "20%"],
                    ["Domain", target.scoreBreakdown.domainAlignment, "10%"],
                    ["Complexity", target.scoreBreakdown.complexityRelevance, "5%"],
                  ].map(([label, value, weight]) => <div key={label} className="rounded-xl border border-slate-300 bg-[#F7F8FA] p-3 shadow-sm"><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-slate-700">{label}</span><span className="font-mono text-slate-500">{value}% / {weight}</span></div><ProgressBar value={Number(value)} /></div>)}
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">{opportunity.alternativeMatches.map((match) => <MetricCard key={match.jobId} label={match.title} value={`${match.matchScore}%`} detail={match.readinessLevel} />)}</div>
            </section>
          )}

          {activeStep === "gaps" && (
            <section>
              <SectionHeader title="Gap Map" subtitle="A bridge from current proof to target opportunity." help="Compare what evidence exists, what is missing, and what to build next." />
              <div className="mb-4 rounded-xl border border-slate-300 bg-[#F7F8FA] p-4 text-sm text-slate-700">Where networks often fill missing context, ProjectDNA shows a buildable evidence path.</div>
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-teal-300 bg-[#EDF7F6] p-4"><h3 className="font-semibold text-teal-900">Current Proof</h3><div className="mt-3"><EvidenceList items={opportunity.gapAnalysis.strongestEvidence} empty="No matched evidence available." /></div></div>
                <div className="rounded-2xl border border-amber-300 bg-[#FFF7E8] p-4"><h3 className="font-semibold text-amber-900">Missing Signals</h3><div className="mt-3"><EvidenceList items={opportunity.gapAnalysis.criticalGaps} empty="No critical gaps detected." /></div></div>
                <div className="rounded-2xl border border-indigo-300 bg-[#F2F0FF] p-4"><h3 className="font-semibold text-indigo-900">Next Build</h3><p className="mt-3 text-sm font-medium text-slate-900">{portfolioProject.title}</p><div className="mt-3 flex flex-wrap gap-2">{portfolioProject.skillsToProve.slice(0, 6).map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></div>
              </div>
            </section>
          )}

          {activeStep === "build" && (
            <section>
              <SectionHeader title="Build Plan" subtitle="Recommended portfolio mission based on gaps." help="Use this as a checklist and mark items as you complete them." />
              <div className="rounded-2xl border border-slate-300 bg-gradient-to-r from-[#EEF4FF] via-[#EAF3F8] to-[#EDF7F6] p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div><h3 className="text-lg font-semibold text-slate-950">{portfolioProject.title}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{portfolioProject.whyThisProject}</p><div className="mt-3 flex flex-wrap gap-2"><Badge>{portfolioProject.difficulty}</Badge><Badge tone="slate">{portfolioProject.estimatedTime}</Badge><Badge tone="slate">{portfolioProject.targetRole}</Badge></div></div>
                  <div className="min-w-60 rounded-xl border border-teal-300 bg-[#EDF7F6] p-4 shadow-sm"><div className="mb-2 flex justify-between text-xs"><span className="font-medium text-slate-700">Evidence build progress</span><span className="font-mono">{progress}%</span></div><ProgressBar value={progress} tone={progress === 100 ? "emerald" : "blue"} />{progress === 100 && <p className="mt-2 text-xs font-medium text-teal-700">Complete</p>}</div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-300 bg-[#F7F8FA] p-4 shadow-sm"><h3 className="text-sm font-semibold text-slate-950">What this proves</h3><div className="mt-3 flex flex-wrap gap-2">{portfolioProject.skillsToProve.map((skill) => <Badge key={skill}>{skill}</Badge>)}</div></div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3"><ChecklistGroup title="Features" items={portfolioProject.features} checked={checkedItems} onToggle={toggleChecklist} /><ChecklistGroup title="Technical Requirements" items={portfolioProject.technicalRequirements} checked={checkedItems} onToggle={toggleChecklist} /><ChecklistGroup title="Success Criteria" items={portfolioProject.successCriteria} checked={checkedItems} onToggle={toggleChecklist} /></div>
            </section>
          )}

          {activeStep === "lab" && (
            <section>
              <SectionHeader title="Lab" subtitle="Simulate opportunity growth from added evidence." help="Toggle improvements to see how the projected score changes." />
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-slate-300 bg-gradient-to-br from-[#EEF4FF] via-[#EAF3F8] to-[#EDF7F6] p-4 shadow-sm">
                  <div className="grid gap-3 md:grid-cols-3"><MetricCard label="Current" value={`${simulator.currentScore}%`} /><MetricCard label="Projected" value={`${dynamicProjectedScore}%`} /><MetricCard label="Unlocked" value={`+${dynamicProjectedScore - simulator.currentScore}`} /></div>
                  <div className="mt-4 space-y-2">{simulator.improvements.map((improvement) => <button key={improvement.action} type="button" onClick={() => toggleImprovement(improvement.action)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm transition ${activeActions.has(improvement.action) ? "border-indigo-300 bg-[#F2F0FF] text-indigo-900 shadow-sm" : "border-slate-300 bg-[#F7F8FA] text-slate-600 hover:bg-[#EAF3F8]"}`}><span>{improvement.action}</span><span className="font-mono font-semibold">+{improvement.scoreGain}</span></button>)}</div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-teal-300 bg-[#EDF7F6] p-4 shadow-sm"><h3 className="font-semibold text-slate-950">Talent Overlooked Meter</h3><div className="mt-3 grid grid-cols-3 gap-3"><MetricCard label="Capability" value={overlookedMeter.capabilityScore} /><MetricCard label="Visibility" value={overlookedMeter.visibilityScore} /><MetricCard label="Gap" value={overlookedMeter.opportunityGap} /></div><div className="mt-4"><ProgressBar value={Math.min(100, Math.max(0, overlookedMeter.capabilityScore))} tone="emerald" /></div><p className="mt-3 text-sm leading-6 text-slate-600">{overlookedMeter.explanation}</p><div className="mt-3"><Badge tone={overlookedMeter.classification === "Undervalued" || overlookedMeter.classification === "Highly Overlooked" ? "amber" : "emerald"}>{overlookedMeter.classification}</Badge></div></div>
                  <div className="rounded-2xl border border-slate-300 bg-[#EAF3F8] p-4 shadow-sm"><div className="flex rounded-xl bg-[#EEF4FF] p-1"><button type="button" onClick={() => setRecruiterMode("student")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${recruiterMode === "student" ? "bg-[#F7F8FA] text-indigo-700 shadow-sm" : "text-slate-600"}`}>Student</button><button type="button" onClick={() => setRecruiterMode("recruiter")} className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${recruiterMode === "recruiter" ? "bg-[#F7F8FA] text-indigo-700 shadow-sm" : "text-slate-600"}`}>Recruiter</button></div>{recruiterMode === "student" ? <p className="mt-3 text-sm leading-6 text-slate-600">Close the top gaps, publish the build plan, then use the packet as your application summary.</p> : <div className="mt-3 space-y-3"><p className="text-sm leading-6 text-slate-600">{recruiterView.capabilitySummary}</p><EvidenceList items={recruiterView.interviewTopics} empty="No interview topics generated." /><p className="text-sm font-medium text-slate-900">{recruiterView.hiringRecommendation}</p></div>}</div>
                </div>
              </div>
            </section>
          )}

          {activeStep === "packet" && (
            <section>
              <SectionHeader title="Packet" subtitle="Recruiter-facing output from the analysis." help="Copy this summary or open the formal report when applying." />
              {copyError && <p role="alert" className="mb-3 text-sm text-red-700">{copyError}</p>}
              <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                <div className="rounded-2xl border border-slate-300 bg-[#EAF3F8] p-4 shadow-sm"><h3 className="text-sm font-semibold text-slate-950">Recruiter pitch</h3><blockquote className="mt-3 border-l-2 border-cyan-600 pl-4 text-sm leading-6 text-slate-700">{evidencePacket.recruiterPitch}</blockquote><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={copySummary} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{copied ? "Copied" : "Copy Summary"}</button><Link href="/report/latest" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-[#EEF4FF] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-[#EAF3F8]">View Formal Report <ArrowIcon /></Link><Link href="/" className="rounded-xl border border-slate-300 bg-[#F7F8FA] px-4 py-2 text-sm font-medium text-slate-700 hover:bg-[#EAF3F8]">Back to Start</Link></div></div>
                <div className="rounded-2xl border border-slate-300 bg-[#EEF4FF] p-4 shadow-sm"><h3 className="text-sm font-semibold text-slate-950">Proof points</h3><div className="mt-3 space-y-3">{evidencePacket.proofPoints.length ? evidencePacket.proofPoints.map((point) => <div key={point.label} className="rounded-xl border border-slate-300 bg-[#F7F8FA] p-3"><p className="text-xs text-slate-500">{point.label}</p><p className="text-sm font-medium text-slate-900">{point.value}</p><p className="text-xs leading-5 text-slate-600">{point.evidence}</p></div>) : <p className="text-sm text-slate-500">No proof points generated.</p>}</div></div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
