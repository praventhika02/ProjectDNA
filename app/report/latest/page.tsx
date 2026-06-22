"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { AnalyzeSuccessResponse } from "@/types/project-dna";

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

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0d0d16]/85 p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EvidenceList({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? <div className="space-y-2">{items.map((item) => <div key={item} className="flex gap-3 text-sm leading-6 text-slate-400"><span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />{item}</div>)}</div> : <p className="text-sm text-slate-600">{empty}</p>;
}

export default function LatestReportPage() {
  const [report, setReport] = useState<AnalyzeSuccessResponse | null | undefined>(undefined);
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
      setReport(parsed?.success === true && parsed.evidencePacket ? parsed : null);
    } catch {
      setReport(null);
    }
  }, []);

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

  if (report === undefined) {
    return <main className="flex min-h-screen items-center justify-center bg-[#05050a] text-sm text-slate-500">Loading evidence packet...</main>;
  }

  if (!report) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05050a] px-6 text-center text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(109,40,217,0.25),transparent_42%)]" />
        <div className="relative max-w-lg rounded-3xl border border-white/10 bg-white/[0.035] p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">ProjectDNA Evidence Packet</p>
          <h1 className="mt-5 text-3xl font-semibold">No report found.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-400">Run an analysis first, then choose View Evidence Report to save it in this browser.</p>
          <Link href="/" className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-100">Back to Analyzer</Link>
        </div>
      </main>
    );
  }

  const { repo, analysis, opportunity, portfolioProject, evidencePacket, fileTreeSummary, targetJob } = report;
  const target = opportunity.targetMatch;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-5%,rgba(109,40,217,0.27),transparent_35%),radial-gradient(circle_at_95%_30%,rgba(8,145,178,0.1),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_60%)]" />

      <header className="relative z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="text-sm font-semibold tracking-wide text-white">ProjectDNA</Link>
          <div className="flex items-center gap-2"><Link href="/" className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/5">Back to Analyzer</Link><button type="button" onClick={copySummary} className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100">{copied ? "Summary copied" : "Copy Summary"}</button></div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-16">
        <div className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-3"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">ProjectDNA Evidence Packet</p><span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${report.analysisMode === "demo" ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300" : "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"}`}>{report.analysisMode === "demo" ? "Demo snapshot" : "Live GitHub analysis"}</span></div>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-white sm:text-6xl">{evidencePacket.headline}</h1>
          <p className="mt-5 text-sm font-medium text-slate-300">Replacing social capital with demonstrated potential.</p>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-400">{evidencePacket.summary}</p>
        </div>

        {analysis.confidence < 40 && <div className="mt-8 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4 text-sm text-amber-200">Low evidence confidence - this repo may not contain enough public work to assess readiness.</div>}
        {copyError && <div role="alert" className="mt-4 text-sm text-rose-400">{copyError}</div>}

        <section className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[#0b0b12] p-6"><p className="text-xs text-slate-500">Repository</p><a href={repo.url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-lg font-semibold text-white hover:text-violet-200">{repo.fullName}</a><p className="mt-1 text-xs text-slate-600">{repo.language ?? "Mixed language"} / {repo.stars.toLocaleString()} stars</p></div>
            <div className="bg-[#0b0b12] p-6"><p className="text-xs text-slate-500">Public files</p><p className="mt-2 text-2xl font-semibold text-white">{fileTreeSummary.totalFiles}</p><p className="mt-1 text-xs text-slate-600">{fileTreeSummary.selectedFiles} evidence files inspected</p></div>
            <div className="bg-[#0b0b12] p-6"><p className="text-xs text-slate-500">Target opportunity</p><p className="mt-2 text-lg font-semibold text-white">{targetJob.title}</p><p className="mt-1 text-xs text-slate-600">{targetJob.company}</p></div>
            <div className="bg-[#0b0b12] p-6"><p className="text-xs text-slate-500">Opportunity match</p><p className="mt-2 text-3xl font-semibold text-violet-300">{target.matchScore}%</p><p className="mt-1 text-xs capitalize text-slate-500">{target.readinessLevel} readiness / {target.evidenceStrength}% evidence strength</p></div>
          </div>
        </section>

        <div className="mt-6 grid gap-6">
          <Section eyebrow="Recruiter Summary" title="A concise evidence-led introduction"><blockquote className="border-l-2 border-violet-400 pl-5 text-lg font-medium leading-8 text-slate-200">&ldquo;{evidencePacket.recruiterPitch}&rdquo;</blockquote></Section>

          <Section eyebrow="Skill Evidence" title="What the public repository supports">
            {analysis.detectedSkills.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{analysis.detectedSkills.slice(0, 5).map((skill) => <div key={skill.skill} className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"><div className="flex items-center justify-between gap-2"><p className="font-medium text-white">{skill.skill}</p><span className="text-xs text-cyan-300">{skill.confidence}%</span></div><div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${skill.confidence}%` }} /></div><p className="mt-3 text-xs leading-5 text-slate-500">{skill.evidence[0]}</p></div>)}</div> : <p className="text-sm text-slate-500">No defensible skill evidence was found in the available public material.</p>}
          </Section>

          <Section eyebrow="Opportunity Fit" title={`${target.title} / ${target.matchScore}% match`}>
            <p className="mb-6 text-sm leading-6 text-slate-400">{evidencePacket.opportunityFit}</p>
            {target.matchedSkills.length ? <div className="grid gap-3 md:grid-cols-2">{target.matchedSkills.map((match) => <div key={`${match.jobSkill}-${match.matchedRepoSkill}`} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex justify-between gap-3"><p className="text-sm text-white">{match.jobSkill} <span className="text-slate-600">via</span> <span className="text-cyan-300">{match.matchedRepoSkill}</span></p><span className="text-xs text-slate-500">{match.strength}%</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{match.evidence[0]}</p></div>)}</div> : <p className="text-sm text-slate-600">No target requirements have supporting repository evidence yet.</p>}
          </Section>

          <Section eyebrow="Gap Narrative" title="What the current evidence does not yet show">
            <p className="text-sm leading-6 text-slate-400">{evidencePacket.gapNarrative}</p>
            <div className="mt-6 grid gap-6 md:grid-cols-2"><div><h3 className="text-sm font-semibold text-rose-300">Critical gaps</h3><div className="mt-3"><EvidenceList items={opportunity.gapAnalysis.criticalGaps} empty="No critical required gaps detected." /></div></div><div><h3 className="text-sm font-semibold text-amber-300">Improvement areas</h3><div className="mt-3"><EvidenceList items={opportunity.gapAnalysis.improvementAreas} empty="No immediate quality improvements identified." /></div></div></div>
          </Section>

          <Section eyebrow="Recommended Next Build" title={portfolioProject.title}>
            <p className="text-sm leading-6 text-slate-400">{portfolioProject.whyThisProject}</p>
            <div className="mt-6 grid gap-7 md:grid-cols-2"><div><h3 className="text-sm font-semibold text-violet-300">Skills to prove</h3><div className="mt-3 flex flex-wrap gap-2">{portfolioProject.skillsToProve.map((skill) => <span key={skill} className="rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5 text-xs text-violet-200">{skill}</span>)}</div></div><div><h3 className="text-sm font-semibold text-emerald-300">Success criteria</h3><div className="mt-3"><EvidenceList items={portfolioProject.successCriteria} empty="No criteria generated." /></div></div></div>
            <div className="mt-7 rounded-xl border border-fuchsia-400/15 bg-fuchsia-400/[0.04] p-4 text-sm leading-6 text-fuchsia-100">{portfolioProject.portfolioPitch}</div>
          </Section>

          <Section eyebrow="Credibility Notes" title="How to interpret this packet"><EvidenceList items={evidencePacket.credibilityNotes} empty="No credibility notes available." /></Section>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8"><p className="text-xs text-slate-600">Stored locally in this browser. Refreshing this page keeps the latest saved report.</p><div className="flex gap-2"><Link href="/" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">Back to Analyzer</Link><button type="button" onClick={copySummary} className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-100">{copied ? "Summary copied" : "Copy Summary"}</button></div></div>
      </div>
    </main>
  );
}
