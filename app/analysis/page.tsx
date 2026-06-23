"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProductNav, type ProductStepId } from "@/components/ProductNav";
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
    violet: "border-violet-400/25 bg-violet-400/10 text-violet-200",
    cyan: "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-200",
    emerald: "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200",
    amber: "border-amber-400/20 bg-amber-400/[0.07] text-amber-200",
    rose: "border-rose-400/20 bg-rose-400/[0.07] text-rose-200",
  };
  return <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_-10%,rgba(109,40,217,0.32),transparent_38%),radial-gradient(circle_at_95%_30%,rgba(8,145,178,0.14),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.016)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.016)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-600">{detail}</p>}
    </div>
  );
}

function SectionHeader({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">{title}</h2>
      {text && <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{text}</p>}
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

export default function AnalysisPage() {
  const [report, setReport] = useState<AnalyzeSuccessResponse | null | undefined>(undefined);
  const [activeStep, setActiveStep] = useState<ProductStepId>("overview");
  const [skillFilter, setSkillFilter] = useState<"all" | SkillCategory>("all");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
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

  return (
    <Shell>
      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="text-sm font-semibold tracking-wide text-white">ProjectDNA</Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={report.analysisMode === "demo" ? "cyan" : "emerald"}>{report.analysisMode === "demo" ? "Demo snapshot" : "Live GitHub analysis"}</Badge>
            <Link href="/report/latest" className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/5">View full report</Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-10 lg:px-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">GitHub → Skill DNA → Opportunity Fit → Build Plan → Evidence Packet</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.035em] text-white sm:text-6xl">Interactive ProjectDNA workspace</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">Move through the evidence journey one step at a time. Nothing here is inferred from social proof; it is based on public repository signals and seeded role requirements.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={target.readinessLevel === "high" ? "emerald" : target.readinessLevel === "strong" ? "cyan" : target.readinessLevel === "emerging" ? "amber" : "rose"}>{target.readinessLevel} readiness</Badge>
            <Badge>{target.matchScore}% match</Badge>
          </div>
        </div>

        <ProductNav activeStep={activeStep} onStepChange={setActiveStep} />

        <div className="mt-8">
          {activeStep === "overview" && (
            <section>
              <SectionHeader eyebrow="Overview" title={`${repo.fullName} for ${targetJob.title}`} text={target.explanation} />
              {analysis.confidence < 40 && <div className="mb-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4 text-sm text-amber-200">Low confidence: ProjectDNA only found limited public evidence in this repository.</div>}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Repository" value={repo.fullName} detail={repo.language ?? "Mixed language"} />
                <MetricCard label="Target role" value={target.title} detail={target.company} />
                <MetricCard label="Match score" value={`${target.matchScore}%`} detail={`${target.readinessLevel} readiness`} />
                <MetricCard label="Confidence" value={`${analysis.confidence}%`} detail={analysis.domainClassification.primaryDomain} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <MetricCard label="Evidence files selected" value={fileTreeSummary.selectedFiles} detail={`${fileTreeSummary.totalFiles.toLocaleString()} public files scanned`} />
                <MetricCard label="Top extensions" value={fileTreeSummary.topExtensions.slice(0, 3).map((item) => item.extension).join(" / ") || "None"} />
                <MetricCard label="Project complexity" value={analysis.projectComplexity.level} detail={`${analysis.projectComplexity.score}/100`} />
              </div>
              <div className="mt-6"><Timeline report={report} /></div>
            </section>
          )}

          {activeStep === "skills" && (
            <section>
              <SectionHeader eyebrow="Skill DNA" title="Repo-derived capability signals" text="Filter by category, then open a skill to inspect the evidence lines and source files that support it." />
              <SkillRadar skills={analysis.detectedSkills} />
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
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="rounded-3xl border border-white/10 bg-[#0d0d16]/85 p-6">
                  <h3 className="text-lg font-semibold text-white">Matched requirements</h3>
                  <div className="mt-5 space-y-3">
                    {target.matchedSkills.length ? target.matchedSkills.map((match) => (
                      <div key={`${match.jobSkill}-${match.matchedRepoSkill}`} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-200">{match.jobSkill} <span className="text-slate-600">matched by</span> <span className="text-cyan-300">{match.matchedRepoSkill}</span></p><span className="text-xs text-slate-500">{match.strength}% strength</span></div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{match.evidence[0]}</p>
                      </div>
                    )) : <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No target requirements have defensible repository evidence yet.</p>}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="rounded-3xl border border-violet-400/20 bg-violet-400/[0.04] p-6">
                    <p className="text-xs text-slate-500">Calculated match</p>
                    <p className="mt-2 text-6xl font-semibold tracking-tight text-white">{target.matchScore}<span className="text-xl text-slate-500">%</span></p>
                    <p className="mt-3 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium capitalize text-violet-200">{target.readinessLevel} readiness</p>
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
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.035] p-6">
                  <h3 className="text-lg font-semibold text-emerald-200">Current Proof</h3>
                  <div className="mt-4"><EvidenceList items={opportunity.gapAnalysis.strongestEvidence} empty="No matched evidence available yet." tone="emerald" /></div>
                </div>
                <div className="rounded-3xl border border-rose-400/20 bg-rose-400/[0.035] p-6">
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
                  </div>
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

          {activeStep === "packet" && (
            <section>
              <SectionHeader eyebrow="Evidence Packet" title={evidencePacket.headline} text={evidencePacket.summary} />
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
    </Shell>
  );
}
