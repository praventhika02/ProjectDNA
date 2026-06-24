"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildReadablePacket } from "@/lib/report-copy";
import { simulateOpportunityGrowth } from "@/lib/opportunity-simulator";
import type { AnalyzeSuccessResponse, OpportunityImprovement, SkillEvidence } from "@/types/project-dna";

const REPORT_STORAGE_KEY = "projectdna_latest_report";

const steps = [
  { id: "result", label: "Result", cta: "Reveal proof" },
  { id: "proof", label: "Proof", cta: "Check role fit" },
  { id: "fit", label: "Fit", cta: "Show unlock plan" },
  { id: "unlock", label: "Unlock", cta: "Generate packet" },
  { id: "packet", label: "Packet", cta: "View report" },
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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#050816_0%,#0B1026_44%,#102A43_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute -left-36 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-12 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
      {children}
    </main>
  );
}

function EmptyState() {
  return (
    <Shell>
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-8 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
          <h1 className="text-2xl font-semibold text-slate-50">No analysis found</h1>
          <p className="mt-3 text-sm text-slate-400">Scan a repo first.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white">
            Start scan
          </Link>
        </div>
      </div>
    </Shell>
  );
}

export default function AnalysisPage() {
  const [report, setReport] = useState<AnalyzeSuccessResponse | null | undefined>(undefined);
  const [activeStep, setActiveStep] = useState<StepId>("result");
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [activeImprovementActions, setActiveImprovementActions] = useState<Set<string> | null>(null);
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
    setSelectedSkillId("");
    setActiveImprovementActions(null);
    setActiveStep("result");
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

  const selectedSkill = topSkills.find((skill) => skillId(skill) === selectedSkillId) ?? topSkills[0] ?? null;

  if (report === undefined) {
    return (
      <Shell>
        <div className="relative z-10 flex min-h-screen items-center justify-center text-sm text-slate-400">Loading studio...</div>
      </Shell>
    );
  }

  if (!report?.success || !target || !simulator) return <EmptyState />;

  const missingSignals = [...target.missingRequiredSkills, ...target.missingPreferredSkills];
  const activeActions = activeImprovementActions ?? new Set(simulator.improvements.map((improvement) => improvement.action));
  const unlockedPoints = simulator.improvements
    .filter((improvement) => activeActions.has(improvement.action))
    .reduce((sum, improvement) => sum + improvement.scoreGain, 0);
  const projectedScore = Math.min(95, simulator.currentScore + unlockedPoints);
  const stepIndex = steps.findIndex((step) => step.id === activeStep);

  function goNext() {
    if (activeStep === "packet") return;
    setActiveStep(steps[Math.min(stepIndex + 1, steps.length - 1)].id);
  }

  function goPrevious() {
    setActiveStep(steps[Math.max(stepIndex - 1, 0)].id);
  }

  function toggleAction(action: string) {
    if (!simulator) return;
    const defaultActions = simulator.improvements.map((improvement) => improvement.action);
    setActiveImprovementActions((current) => {
      const next = new Set(current ?? defaultActions);
      if (next.has(action)) next.delete(action);
      else next.add(action);
      return next;
    });
  }

  async function copySummary() {
    if (!report || !target) return;
    const text = buildReadablePacket(report).copyText;
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
      <header className="relative z-20 border-b border-white/10 bg-[#071126]/80 shadow-lg shadow-cyan-950/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-50">ProjectDNA Studio</Link>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{report.repo.fullName}</Badge>
            <Badge>{target.title}</Badge>
            <Badge tone="score">{target.matchScore}%</Badge>
            <Link href="/report/latest" className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.10]">
              View report
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <Stepper activeStep={activeStep} onSelect={setActiveStep} />

        {report.analysis.confidence < 40 && (
          <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-200">
            Low confidence: limited public evidence found.
          </div>
        )}

        <section className="mt-6 rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl md:p-8">
          {activeStep === "result" && (
            <ResultStep report={report} projectedScore={projectedScore} unlockedPoints={unlockedPoints} unlockCount={simulator.improvements.length} />
          )}
          {activeStep === "proof" && (
            <ProofStep skills={topSkills} selectedSkill={selectedSkill} onSelectSkill={(skill) => setSelectedSkillId(skillId(skill))} />
          )}
          {activeStep === "fit" && (
            <FitStep report={report} missingSignals={missingSignals} />
          )}
          {activeStep === "unlock" && (
            <UnlockStep
              currentScore={simulator.currentScore}
              projectedScore={projectedScore}
              unlockedPoints={unlockedPoints}
              improvements={simulator.improvements}
              activeActions={activeActions}
              onToggleAction={toggleAction}
              report={report}
            />
          )}
          {activeStep === "packet" && (
            <PacketStep report={report} gaps={missingSignals} copied={copied} copyError={copyError} onCopy={copySummary} />
          )}
        </section>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrevious}
            disabled={stepIndex === 0}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <div className="flex flex-wrap gap-3">
            {activeStep !== "packet" ? (
              <button type="button" onClick={goNext} className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5">
                {steps[stepIndex].cta}
              </button>
            ) : (
              <Link href="/report/latest" className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-950/30 transition hover:-translate-y-0.5">
                View report
              </Link>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Stepper({ activeStep, onSelect }: { activeStep: StepId; onSelect: (step: StepId) => void }) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);
  return (
    <nav className="rounded-3xl border border-white/10 bg-[#071126]/70 p-2 shadow-xl shadow-cyan-950/20 backdrop-blur-xl">
      <div className="grid gap-2 sm:grid-cols-5">
        {steps.map((step, index) => {
          const active = step.id === activeStep;
          const complete = index < activeIndex;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onSelect(step.id)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                active
                  ? "border-cyan-300/45 bg-cyan-300/12 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)]"
                  : "border-white/10 bg-white/[0.045] text-slate-400 hover:bg-white/[0.08]"
              }`}
            >
              <span className="font-mono text-xs">{complete ? "✓" : `0${index + 1}`}</span>
              <span className="ml-2 text-sm font-semibold">{step.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function ResultStep({ report, projectedScore, unlockedPoints, unlockCount }: { report: AnalyzeSuccessResponse; projectedScore: number; unlockedPoints: number; unlockCount: number }) {
  const target = report.opportunity.targetMatch;
  const missing = target.missingRequiredSkills.length + target.missingPreferredSkills.length;
  return (
    <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">Result</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-50 md:text-6xl">
          Your repo is {target.matchScore}% ready for {target.title}.
        </h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Found {report.analysis.detectedSkills.length} skill signals, {target.matchedSkills.length} matched requirements, and {unlockCount} unlock actions.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Metric label="Skills found" value={report.analysis.detectedSkills.length} />
          <Metric label="Matched" value={target.matchedSkills.length} />
          <Metric label="Missing" value={missing} />
          <Metric label="Unlock points" value={`+${unlockedPoints}`} />
        </div>
      </div>
      <ScoreBridge currentScore={target.matchScore} projectedScore={projectedScore} />
    </div>
  );
}

function ProofStep({ skills, selectedSkill, onSelectSkill }: { skills: SkillEvidence[]; selectedSkill: SkillEvidence | null; onSelectSkill: (skill: SkillEvidence) => void }) {
  return (
    <div>
      <StepHeader eyebrow="Proof" title="What your repo proves" subtitle="Select a signal to inspect evidence." />
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {skills.map((skill) => {
            const active = selectedSkill ? skillId(selectedSkill) === skillId(skill) : false;
            return (
              <button
                key={skillId(skill)}
                type="button"
                onClick={() => onSelectSkill(skill)}
                className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                  active ? "border-cyan-300/55 bg-cyan-300/12 shadow-[0_0_24px_rgba(34,211,238,0.18)]" : "border-white/10 bg-white/[0.05] hover:bg-white/[0.085]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-50">{skill.skill}</p>
                    <p className="mt-1 font-mono text-xs text-slate-400">{skill.category}</p>
                  </div>
                  <span className="font-mono text-xs text-cyan-200">{skill.confidence}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/[0.08]">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${skill.confidence}%` }} />
                </div>
              </button>
            );
          })}
          {!skills.length && <p className="text-sm text-slate-400">No skills detected.</p>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#071126]/65 p-5 shadow-inner shadow-cyan-950/20">
          {selectedSkill ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Evidence inspector</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-50">{selectedSkill.skill}</h2>
                </div>
                <Badge tone="score">{selectedSkill.confidence}%</Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{selectedSkill.reasoning}</p>
              <div className="mt-4 space-y-2">
                {selectedSkill.evidence.slice(0, 2).map((line) => (
                  <p key={line} className="rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-3 text-sm text-slate-200">{line}</p>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {selectedSkill.sourceFiles.slice(0, 5).map((file) => (
                  <span key={file} className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 font-mono text-xs text-slate-300">{file}</span>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No evidence to inspect.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FitStep({ report, missingSignals }: { report: AnalyzeSuccessResponse; missingSignals: string[] }) {
  const target = report.opportunity.targetMatch;
  const rows = [
    ["Required", target.scoreBreakdown.requiredSkillCoverage],
    ["Preferred", target.scoreBreakdown.preferredSkillCoverage],
    ["Evidence", target.scoreBreakdown.evidenceStrength],
    ["Domain", target.scoreBreakdown.domainAlignment],
    ["Complexity", target.scoreBreakdown.complexityRelevance],
  ] as const;

  return (
    <div>
      <StepHeader eyebrow="Fit" title="Role fit explained" subtitle="Matched proof and missing signals." />
      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-6 text-center">
          <p className="font-mono text-xs uppercase tracking-wide text-cyan-100">Match score</p>
          <p className="mt-3 text-7xl font-semibold text-slate-50">{target.matchScore}%</p>
          <p className="mt-2 text-sm capitalize text-slate-300">{target.readinessLevel} readiness</p>
        </div>
        <div className="grid gap-3">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <div className="mb-2 flex justify-between font-mono text-xs text-slate-400">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-500" style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SignalColumn title="Matched signals" tone="matched" items={target.matchedSkills.slice(0, 4).map((item) => `${item.jobSkill}: ${item.strength}% via ${item.matchedRepoSkill}`)} />
        <SignalColumn title="Missing signals" tone="missing" items={missingSignals.slice(0, 4).map((gap) => `${gap} - Fixable in unlock plan`)} />
      </div>
    </div>
  );
}

function UnlockStep({
  currentScore,
  projectedScore,
  unlockedPoints,
  improvements,
  activeActions,
  onToggleAction,
  report,
}: {
  currentScore: number;
  projectedScore: number;
  unlockedPoints: number;
  improvements: OpportunityImprovement[];
  activeActions: Set<string>;
  onToggleAction: (action: string) => void;
  report: AnalyzeSuccessResponse;
}) {
  const project = report.portfolioProject;
  return (
    <div>
      <StepHeader eyebrow="Unlock" title="Your next build" subtitle="A concrete project to make missing proof visible." />
      <div className="grid gap-5 lg:grid-cols-[170px_1fr_170px] lg:items-center">
        <ScoreTile label="Current" score={currentScore} tone="cyan" />
        <div>
          <div className="mb-3 flex items-center justify-between font-mono text-xs text-slate-400">
            <span>Unlocked</span>
            <span className="text-cyan-200">+{unlockedPoints}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-[#071126]/80 ring-1 ring-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition-all duration-500" style={{ width: `${Math.max(6, projectedScore)}%` }} />
          </div>
        </div>
        <ScoreTile label="Projected" score={projectedScore} tone="emerald" />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {improvements.slice(0, 6).map((item) => {
          const active = activeActions.has(item.action);
          return (
            <button
              key={item.action}
              type="button"
              onClick={() => onToggleAction(item.action)}
              className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                active ? "border-cyan-300/45 bg-cyan-300/12 shadow-[0_0_28px_rgba(34,211,238,0.22)]" : "border-white/10 bg-white/[0.05] hover:bg-white/[0.085]"
              }`}
            >
              <span className="block text-sm font-medium text-slate-100">{item.action}</span>
              <span className="mt-2 block font-mono text-xs text-cyan-200">+{item.scoreGain}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-200">Recommended artifact</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-50">{project.title}</h2>
          </div>
          <div className="flex gap-2">
            <Chip>{project.difficulty}</Chip>
            <Chip>{project.estimatedTime}</Chip>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <MiniList title="Build" items={project.features.slice(0, 3)} />
          <MiniList title="Prove" items={project.successCriteria.slice(0, 3)} />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Skills proven</h3>
            <div className="mt-3 flex flex-wrap gap-2">{project.skillsToProve.slice(0, 6).map((skill) => <Chip key={skill}>{skill}</Chip>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PacketStep({ report, gaps, copied, copyError, onCopy }: { report: AnalyzeSuccessResponse; gaps: string[]; copied: boolean; copyError: string; onCopy: () => void }) {
  const packet = buildReadablePacket(report);
  return (
    <div>
      <StepHeader eyebrow="Send" title="Recruiter packet" subtitle="Short, specific, and useful." />
      {copyError && <p className="mb-3 text-sm text-red-300">{copyError}</p>}
      <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-5 shadow-inner shadow-cyan-950/20">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-100">Verdict</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-50">{packet.verdict}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{packet.recruiterPitch}</p>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <SignalColumn title="Proof" tone="matched" items={packet.proofBullets} />
        <SignalColumn title="Missing" tone="missing" items={packet.riskBullets.length ? packet.riskBullets : gaps.slice(0, 3)} />
        <SignalColumn title="Next move" tone="neutral" items={[packet.nextMove]} />
      </div>
      <div className="mt-5 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-100">Differentiator</p>
        <p className="mt-2 text-sm leading-6 text-slate-200">{packet.differentiator}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onCopy} className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5">
          {copied ? "Copied" : "Copy summary"}
        </button>
        <Link href="/report/latest" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.10]">
          View full report
        </Link>
        <Link href="/" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.10]">
          Start over
        </Link>
      </div>
    </div>
  );
}

function ScoreBridge({ currentScore, projectedScore }: { currentScore: number; projectedScore: number }) {
  const gain = Math.max(0, projectedScore - currentScore);
  return (
    <div className="rounded-2xl border border-white/10 bg-[#071126]/65 p-5 shadow-inner shadow-cyan-950/20">
      <div className="grid gap-5 sm:grid-cols-[132px_1fr_132px] sm:items-center">
        <ScoreOrb label="Current" score={currentScore} />
        <div>
          <div className="mb-3 flex justify-between font-mono text-xs text-slate-400">
            <span>Potential</span>
            <span className="text-cyan-200">+{gain}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-white/[0.08] ring-1 ring-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400 transition-all duration-500 animate-soft-pulse" style={{ width: `${Math.max(6, projectedScore)}%` }} />
          </div>
        </div>
        <ScoreOrb label="Potential" score={projectedScore} />
      </div>
    </div>
  );
}

function ScoreOrb({ label, score }: { label: string; score: number }) {
  return (
    <div className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 text-center shadow-[0_0_32px_rgba(34,211,238,0.18)]">
      <span className="text-3xl font-semibold text-slate-50">{score}%</span>
      <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  );
}

function ScoreTile({ label, score, tone }: { label: string; score: number; tone: "cyan" | "emerald" }) {
  const toneClass = tone === "cyan" ? "from-cyan-300/20 to-violet-400/10 text-cyan-100" : "from-emerald-300/20 to-cyan-400/10 text-emerald-100";
  return (
    <div className={`rounded-2xl border border-white/10 bg-gradient-to-br ${toneClass} p-5 text-center shadow-lg shadow-cyan-950/10`}>
      <p className="font-mono text-xs uppercase tracking-wide text-slate-300">{label}</p>
      <p className="mt-2 text-5xl font-semibold text-slate-50">{score}%</p>
    </div>
  );
}

function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-50 md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
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

function SignalColumn({ title, items, tone }: { title: string; items: string[]; tone: "matched" | "missing" | "neutral" }) {
  const toneClass = tone === "matched"
    ? "border-emerald-300/20 bg-emerald-300/10"
    : tone === "missing"
      ? "border-amber-300/20 bg-amber-300/10"
      : "border-violet-300/20 bg-violet-300/10";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item) => <p key={item} className={`rounded-xl border p-3 text-sm text-slate-300 ${toneClass}`}>{item}</p>) : <p className="text-sm text-slate-400">None found.</p>}
      </div>
    </div>
  );
}

function MiniList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => <p key={item} className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-sm text-slate-300">{item}</p>)}
      </div>
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

function skillId(skill: SkillEvidence) {
  return `${skill.category}-${skill.skill}`;
}
