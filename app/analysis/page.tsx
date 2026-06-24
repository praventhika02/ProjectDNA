"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildReadablePacket } from "@/lib/report-copy";
import { simulateOpportunityGrowth } from "@/lib/opportunity-simulator";
import type { AnalyzeSuccessResponse, OpportunityImprovement, SkillEvidence } from "@/types/project-dna";

const REPORT_STORAGE_KEY = "projectdna_latest_report";

const steps = [
  { id: "proven", label: "Proven", question: "What have I already proven?", cta: "See recruiter view" },
  { id: "perception", label: "Perception", question: "How do recruiters see me?", cta: "Show opportunity gap" },
  { id: "gap", label: "Gap", question: "Why am I being overlooked?", cta: "Find fastest route" },
  { id: "route", label: "Route", question: "What should I build next?", cta: "Simulate recruiter" },
  { id: "decision", label: "Decision", question: "Would a recruiter interview me?", cta: "Interview ready" },
  { id: "ready", label: "Ready", question: "How do I become interview ready?", cta: "View report" },
] as const;

type StepId = (typeof steps)[number]["id"];

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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#060B1A_0%,#0A1631_48%,#112240_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(79,209,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(124,108,255,0.045)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      {children}
    </main>
  );
}

export default function AnalysisPage() {
  const [report, setReport] = useState<AnalyzeSuccessResponse | null | undefined>(undefined);
  const [activeStep, setActiveStep] = useState<StepId>("proven");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [activeActions, setActiveActions] = useState<Set<string> | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(REPORT_STORAGE_KEY);
      setReport(stored ? (JSON.parse(stored) as AnalyzeSuccessResponse) : null);
    } catch {
      setReport(null);
    }
  }, []);

  useEffect(() => {
    setActiveStep("proven");
    setSelectedSkillId("");
    setActiveActions(null);
  }, [report?.generatedAt]);

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

  const topSkills = useMemo(() => {
    if (!report) return [];
    return [...report.analysis.detectedSkills]
      .sort((a, b) => b.confidence - a.confidence || b.proficiency - a.proficiency)
      .slice(0, 6);
  }, [report]);

  if (report === undefined) {
    return (
      <Shell>
        <div className="relative z-10 flex min-h-screen items-center justify-center text-sm text-slate-400">Loading Mission Control...</div>
      </Shell>
    );
  }

  if (!report?.success || !target || !simulator) {
    return (
      <Shell>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
          <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-8 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold text-slate-50">No mission loaded</h1>
            <p className="mt-3 text-sm text-slate-400">Scan a repo first.</p>
            <Link href="/" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white">Start scan</Link>
          </div>
        </div>
      </Shell>
    );
  }

  const selectedSkill = topSkills.find((skill) => skillId(skill) === selectedSkillId) ?? topSkills[0] ?? null;
  const missingSignals = [...target.missingRequiredSkills, ...target.missingPreferredSkills];
  const defaultActions = simulator.improvements.map((action) => action.action);
  const selectedActions = activeActions ?? new Set(defaultActions);
  const unlockedPoints = simulator.improvements.filter((action) => selectedActions.has(action.action)).reduce((sum, action) => sum + action.scoreGain, 0);
  const projectedScore = Math.min(95, simulator.currentScore + unlockedPoints);
  const actualCapability = calculateActualCapability(report);
  const visibleCapability = target.matchScore;
  const opportunityGap = Math.max(0, actualCapability - visibleCapability);
  const stepIndex = steps.findIndex((step) => step.id === activeStep);
  const currentStep = steps[stepIndex];
  const packet = buildReadablePacket(report);

  function nextStep() {
    if (activeStep === "ready") return;
    setActiveStep(steps[Math.min(stepIndex + 1, steps.length - 1)].id);
  }

  function previousStep() {
    setActiveStep(steps[Math.max(stepIndex - 1, 0)].id);
  }

  function toggleAction(action: string) {
    setActiveActions((current) => {
      const next = new Set(current ?? defaultActions);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  async function copySummary() {
    try {
      await copyText(packet.copyText);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError("Clipboard access was blocked.");
    }
  }

  return (
    <Shell>
      <header className="relative z-20 border-b border-white/10 bg-[#071126]/80 shadow-lg shadow-cyan-950/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-50">ProjectDNA Mission Control</Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{report.repo.fullName}</Badge>
            <Badge>{target.title}</Badge>
            <Badge tone="score">{target.matchScore}% visible</Badge>
            <Link href="/report/latest" className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.10]">Report</Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <Stepper activeStep={activeStep} onSelect={setActiveStep} />

        <section className="mt-6 rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl md:p-8">
          <QuestionHeader step={currentStep.label} question={currentStep.question} />

          {activeStep === "proven" && (
            <ProvenCapability report={report} skills={topSkills} selectedSkill={selectedSkill} onSelectSkill={(skill) => setSelectedSkillId(skillId(skill))} />
          )}
          {activeStep === "perception" && (
            <RecruiterPerception report={report} visibleCapability={visibleCapability} projectedScore={projectedScore} />
          )}
          {activeStep === "gap" && (
            <OpportunityGap actualCapability={actualCapability} visibleCapability={visibleCapability} gap={opportunityGap} missingSignals={missingSignals} />
          )}
          {activeStep === "route" && (
            <FastestRoute report={report} currentScore={visibleCapability} projectedScore={projectedScore} unlockedPoints={unlockedPoints} improvements={simulator.improvements} selectedActions={selectedActions} onToggleAction={toggleAction} />
          )}
          {activeStep === "decision" && (
            <RecruiterDecision report={report} packet={packet} missingSignals={missingSignals} projectedScore={projectedScore} />
          )}
          {activeStep === "ready" && (
            <InterviewReady report={report} visibleCapability={visibleCapability} projectedScore={projectedScore} opportunityGap={opportunityGap} packet={packet} copied={copied} copyError={copyError} onCopy={copySummary} />
          )}
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={previousStep} disabled={stepIndex === 0} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-40">
            Previous
          </button>
          {activeStep === "ready" ? (
            <Link href="/report/latest" className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5">
              View report
            </Link>
          ) : (
            <button type="button" onClick={nextStep} className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5">
              {currentStep.cta}
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Stepper({ activeStep, onSelect }: { activeStep: StepId; onSelect: (step: StepId) => void }) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  return (
    <nav className="rounded-3xl border border-white/10 bg-[#071126]/70 p-2 shadow-xl shadow-cyan-950/20 backdrop-blur-xl">
      <div className="grid gap-2 md:grid-cols-6">
        {steps.map((step, index) => {
          const active = step.id === activeStep;
          const complete = index < activeIndex;
          return (
            <button key={step.id} type="button" onClick={() => onSelect(step.id)} className={`rounded-2xl border px-3 py-3 text-left transition ${active ? "border-cyan-300/45 bg-cyan-300/12 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]" : "border-white/10 bg-white/[0.045] text-slate-400 hover:bg-white/[0.08]"}`}>
              <span className="font-mono text-xs">{complete ? "done" : `0${index + 1}`}</span>
              <span className="mt-1 block text-sm font-semibold">{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function QuestionHeader({ step, question }: { step: string; question: string }) {
  return (
    <div className="mb-7">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">{step}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">{question}</h1>
    </div>
  );
}

function ProvenCapability({ report, skills, selectedSkill, onSelectSkill }: { report: AnalyzeSuccessResponse; skills: SkillEvidence[]; selectedSkill: SkillEvidence | null; onSelectSkill: (skill: SkillEvidence) => void }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-100">You have demonstrated</p>
        <div className="mt-4 grid gap-3">
          {skills.slice(0, 4).map((skill) => (
            <button key={skillId(skill)} type="button" onClick={() => onSelectSkill(skill)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selectedSkill && skillId(selectedSkill) === skillId(skill) ? "border-cyan-300/55 bg-cyan-300/12" : "border-white/10 bg-white/[0.05]"}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-semibold text-slate-50">{skill.skill}</span>
                <span className="font-mono text-xs text-cyan-200">{skill.confidence}%</span>
              </div>
              <p className="mt-1 font-mono text-xs text-slate-400">{skill.category}</p>
            </button>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-300">Evidence found across {report.fileTreeSummary.selectedFiles} selected files.</p>
      </div>
      <EvidenceInspector skill={selectedSkill} />
    </div>
  );
}

function RecruiterPerception({ report, visibleCapability, projectedScore }: { report: AnalyzeSuccessResponse; visibleCapability: number; projectedScore: number }) {
  const target = report.opportunity.targetMatch;
  const alternatives = report.opportunity.alternativeMatches.slice(0, 2);
  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-cyan-100">Current readiness</p>
        <p className="mt-3 text-8xl font-semibold text-slate-50">{visibleCapability}%</p>
        <p className="mt-2 text-lg capitalize text-slate-300">{target.readinessLevel} signal</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Recruiter would likely see</p>
        <div className="mt-4 space-y-3">
          <RoleSignal title={target.title} score={target.matchScore} primary />
          {alternatives.map((match) => <RoleSignal key={match.jobId} title={match.title} score={match.matchScore} />)}
        </div>
        <p className="mt-5 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4 text-sm text-slate-200">
          If the recommended build is completed, visible readiness can move toward {projectedScore}%.
        </p>
      </div>
    </div>
  );
}

function OpportunityGap({ actualCapability, visibleCapability, gap, missingSignals }: { actualCapability: number; visibleCapability: number; gap: number; missingSignals: string[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-100">Opportunity gap</p>
        <div className="mt-5 space-y-5">
          <CapabilityBar label="Actual capability" value={actualCapability} tone="emerald" />
          <CapabilityBar label="Visible capability" value={visibleCapability} tone="cyan" />
        </div>
        <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5">
          <p className="text-sm text-amber-100">Gap</p>
          <p className="mt-1 text-6xl font-semibold text-slate-50">{gap}</p>
          <p className="mt-2 text-sm text-slate-300">points of capability not yet visible enough to recruiters.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">To reach interview level</p>
        <div className="mt-4 space-y-3">
          {missingSignals.slice(0, 3).map((gapItem, index) => (
            <p key={gapItem} className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-slate-200">
              {index + 1}. {gapItem}
            </p>
          ))}
          {!missingSignals.length && <p className="text-sm text-slate-400">No major missing signal found.</p>}
        </div>
      </div>
    </div>
  );
}

function FastestRoute({ report, currentScore, projectedScore, unlockedPoints, improvements, selectedActions, onToggleAction }: { report: AnalyzeSuccessResponse; currentScore: number; projectedScore: number; unlockedPoints: number; improvements: OpportunityImprovement[]; selectedActions: Set<string>; onToggleAction: (action: string) => void }) {
  const project = report.portfolioProject;
  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[170px_1fr_170px] lg:items-center">
        <ScoreTile label="Current" score={currentScore} tone="cyan" />
        <div>
          <div className="mb-3 flex justify-between font-mono text-xs text-slate-400">
            <span>Opportunity unlocked</span>
            <span className="text-cyan-200">+{unlockedPoints}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-[#071126]/80 ring-1 ring-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400 transition-all duration-500" style={{ width: `${Math.max(6, projectedScore)}%` }} />
          </div>
        </div>
        <ScoreTile label="Projected" score={projectedScore} tone="emerald" />
      </div>
      <div className="rounded-2xl border border-violet-300/20 bg-violet-300/10 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-100">Fastest route to interview</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-50">{project.title}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip>{project.estimatedTime}</Chip>
          <Chip>{project.difficulty}</Chip>
          <Chip>{project.skillsToProve.slice(0, 3).join(" + ")}</Chip>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {improvements.slice(0, 6).map((item) => {
          const active = selectedActions.has(item.action);
          return (
            <button key={item.action} type="button" onClick={() => onToggleAction(item.action)} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${active ? "border-cyan-300/45 bg-cyan-300/12 shadow-[0_0_28px_rgba(34,211,238,0.22)]" : "border-white/10 bg-white/[0.05] hover:bg-white/[0.085]"}`}>
              <span className="block text-sm font-medium text-slate-100">{item.action}</span>
              <span className="mt-2 block font-mono text-xs text-cyan-200">+{item.scoreGain}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RecruiterDecision({ report, packet, missingSignals, projectedScore }: { report: AnalyzeSuccessResponse; packet: ReturnType<typeof buildReadablePacket>; missingSignals: string[]; projectedScore: number }) {
  const target = report.opportunity.targetMatch;
  const decision = projectedScore >= 75 ? "YES" : target.matchScore >= 55 ? "MAYBE" : "NOT YET";
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wide text-emerald-100">Would I interview this candidate?</p>
        <p className="mt-4 text-7xl font-semibold text-slate-50">{decision}</p>
        <p className="mt-3 text-sm text-slate-300">after the recommended evidence build.</p>
      </div>
      <div className="grid gap-4">
        <SignalColumn title="Reason" tone="matched" items={packet.proofBullets.slice(0, 2)} />
        <SignalColumn title="Concern" tone="missing" items={missingSignals.slice(0, 2).map((gap) => `No clear public proof for ${gap}.`)} />
      </div>
    </div>
  );
}

function InterviewReady({ report, visibleCapability, projectedScore, opportunityGap, packet, copied, copyError, onCopy }: { report: AnalyzeSuccessResponse; visibleCapability: number; projectedScore: number; opportunityGap: number; packet: ReturnType<typeof buildReadablePacket>; copied: boolean; copyError: string; onCopy: () => void }) {
  const gapClosed = Math.max(0, projectedScore - visibleCapability);
  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-100">Interview ready path</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Metric label="Now" value={`${visibleCapability}%`} />
          <Metric label="Projected" value={`${projectedScore}%`} />
          <Metric label="Gap closed" value={`+${gapClosed}`} />
        </div>
        <p className="mt-5 text-sm text-slate-300">Opportunity gap to close: {opportunityGap} points.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Recommended next step</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-50">{report.portfolioProject.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{packet.nextMove}</p>
        {copyError && <p className="mt-3 text-sm text-red-300">{copyError}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onCopy} className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white">{copied ? "Copied" : "Copy recruiter summary"}</button>
          <Link href="/report/latest" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.10]">View full report</Link>
        </div>
      </div>
    </div>
  );
}

function EvidenceInspector({ skill }: { skill: SkillEvidence | null }) {
  if (!skill) return <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 text-sm text-slate-400">No evidence to inspect.</div>;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#071126]/65 p-5 shadow-inner shadow-cyan-950/20">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Evidence found</p>
      <h2 className="mt-2 text-3xl font-semibold text-slate-50">{skill.skill}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{skill.reasoning}</p>
      <div className="mt-4 space-y-2">
        {skill.evidence.slice(0, 2).map((line) => (
          <p key={line} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-sm text-slate-200">{line}</p>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {skill.sourceFiles.slice(0, 5).map((file) => (
          <span key={file} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-slate-300">{file}</span>
        ))}
      </div>
    </div>
  );
}

function CapabilityBar({ label, value, tone }: { label: string; value: number; tone: "emerald" | "cyan" }) {
  const color = tone === "emerald" ? "from-emerald-400 to-cyan-300" : "from-cyan-400 to-violet-500";
  return (
    <div>
      <div className="mb-2 flex justify-between font-mono text-xs text-slate-300">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-5 rounded-full bg-white/[0.08]">
        <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function RoleSignal({ title, score, primary = false }: { title: string; score: number; primary?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${primary ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/10 bg-white/[0.05]"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-100">{title}</span>
        <span className="font-mono text-sm text-cyan-200">{score}%</span>
      </div>
    </div>
  );
}

function ScoreTile({ label, score, tone }: { label: string; score: number; tone: "cyan" | "emerald" }) {
  const toneClass = tone === "cyan" ? "from-cyan-300/20 to-violet-400/10" : "from-emerald-300/20 to-cyan-400/10";
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${toneClass} p-5 text-center shadow-lg shadow-cyan-950/10`}>
      <p className="font-mono text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-2 text-5xl font-semibold text-slate-50">{score}%</p>
    </div>
  );
}

function SignalColumn({ title, items, tone }: { title: string; items: string[]; tone: "matched" | "missing" }) {
  const toneClass = tone === "matched" ? "border-emerald-300/20 bg-emerald-300/10" : "border-amber-300/20 bg-amber-300/10";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item) => <p key={item} className={`rounded-xl border p-3 text-sm text-slate-300 ${toneClass}`}>{item}</p>) : <p className="text-sm text-slate-400">None found.</p>}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-lg shadow-cyan-950/10">
      <p className="font-mono text-xs text-slate-400">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-xs text-slate-300">{children}</span>;
}

function Badge({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "score" }) {
  return (
    <span className={`rounded-full border px-3 py-1.5 font-mono text-xs ${tone === "score" ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.06] text-slate-300"}`}>
      {children}
    </span>
  );
}

function calculateActualCapability(report: AnalyzeSuccessResponse): number {
  const qualityAverage = report.analysis.qualitySignals.length
    ? report.analysis.qualitySignals.reduce((sum, signal) => sum + signal.score, 0) / report.analysis.qualitySignals.length
    : 45;
  const skillStrength = Math.min(100, report.analysis.detectedSkills.length * 9);
  return Math.round(
    report.opportunity.targetMatch.evidenceStrength * 0.3
    + report.analysis.confidence * 0.25
    + report.analysis.projectComplexity.score * 0.2
    + qualityAverage * 0.15
    + skillStrength * 0.1
  );
}

function skillId(skill: SkillEvidence) {
  return `${skill.category}-${skill.skill}`;
}
