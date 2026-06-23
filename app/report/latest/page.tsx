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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-300 bg-[#F7F8FA] p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <div className="space-y-2">
      {items.map((item) => <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-600" />{item}</p>)}
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-xl border border-slate-300 bg-gradient-to-br from-[#EEF4FF] to-[#EAF3F8] p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </div>
  );
}

export default function LatestReportPage() {
  const [report, setReport] = useState<AnalyzeSuccessResponse | null | undefined>(undefined);
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
    return <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#EEF4FF,#F4F7FB,#EDF7F6)] text-sm text-slate-500">Loading report...</main>;
  }

  if (!report?.success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#EEF4FF,#F4F7FB,#EDF7F6)] px-6 text-center">
        <div className="max-w-md rounded-2xl border border-slate-300 bg-[#EAF3F8] p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">No report found</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">Run an analysis first, then open the formal report from the workspace.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Run analysis</Link>
        </div>
      </main>
    );
  }

  const { repo, analysis, opportunity, portfolioProject, evidencePacket, fileTreeSummary, targetJob } = report;
  const target = opportunity.targetMatch;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#EEF4FF_0%,#F4F7FB_52%,#EDF7F6_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>
      <header className="relative z-10 border-b border-slate-300 bg-[#EAF3F8]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-indigo-700">ProjectDNA</Link>
          <div className="flex items-center gap-2">
            <Link href="/analysis" className="rounded-xl border border-slate-300 bg-[#EEF4FF] px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-[#EAF3F8]">Workspace</Link>
            <button type="button" onClick={copySummary} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700">{copied ? "Copied" : "Copy Summary"}</button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-[1.75rem] border border-slate-300 bg-gradient-to-r from-[#EEF4FF] via-[#EAF3F8] to-[#EDF7F6] p-6 shadow-xl shadow-slate-200/60">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wide text-cyan-700">Evidence Packet</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{evidencePacket.headline}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{evidencePacket.summary}</p>
            </div>
            <span className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${report.analysisMode === "demo" ? "border-indigo-300 bg-[#F2F0FF] text-indigo-700" : "border-teal-300 bg-[#EDF7F6] text-teal-700"}`}>{report.analysisMode === "demo" ? "Demo snapshot" : "Live GitHub analysis"}</span>
          </div>
        </div>

        {analysis.confidence < 40 && <div className="mt-4 rounded-xl border border-amber-300 bg-[#FFF7E8] px-4 py-3 text-sm text-amber-800">Low confidence: this repo may not contain enough public evidence for a strong assessment.</div>}
        {copyError && <div role="alert" className="mt-4 text-sm text-red-700">{copyError}</div>}

        <div className="mt-5 grid gap-4 md:grid-cols-4">
          <Stat label="Repository" value={repo.fullName} detail={repo.language ?? "Mixed language"} />
          <Stat label="Target role" value={targetJob.title} detail={targetJob.company} />
          <Stat label="Match score" value={`${target.matchScore}%`} detail={`${target.readinessLevel} readiness`} />
          <Stat label="Files reviewed" value={fileTreeSummary.selectedFiles} detail={`${fileTreeSummary.totalFiles} total files`} />
        </div>

        <div className="mt-5 grid gap-5">
          <Section title="Recruiter Summary">
            <div className="rounded-2xl border border-slate-300 bg-[#EAF3F8] p-4"><blockquote className="border-l-2 border-cyan-600 pl-4 text-sm leading-6 text-slate-700">{evidencePacket.recruiterPitch}</blockquote></div>
          </Section>

          <Section title="Skill Evidence">
            {analysis.detectedSkills.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">{analysis.detectedSkills.slice(0, 5).map((skill) => <div key={skill.skill} className="rounded-xl border border-slate-300 bg-[#EEF4FF] p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-950">{skill.skill}</p><span className="font-mono text-xs text-indigo-700">{skill.confidence}%</span></div><p className="mt-2 text-xs leading-5 text-slate-600">{skill.evidence[0]}</p></div>)}</div> : <p className="text-sm text-slate-500">No defensible skill evidence was found.</p>}
          </Section>

          <Section title="Opportunity Fit">
            {target.matchedSkills.length ? <div className="grid gap-3 md:grid-cols-2">{target.matchedSkills.map((match) => <div key={`${match.jobSkill}-${match.matchedRepoSkill}`} className="rounded-xl border border-slate-300 bg-[#EAF3F8] p-3 shadow-sm"><div className="flex justify-between gap-3"><p className="text-sm text-slate-900">{match.jobSkill} <span className="text-slate-500">via</span> <span className="font-medium text-indigo-700">{match.matchedRepoSkill}</span></p><span className="font-mono text-xs text-slate-500">{match.strength}%</span></div><p className="mt-2 text-xs leading-5 text-slate-600">{match.evidence[0]}</p></div>)}</div> : <p className="text-sm text-slate-500">No target requirements have supporting repository evidence yet.</p>}
          </Section>

          <Section title="Gaps and Improvements">
            <div className="grid gap-5 md:grid-cols-2">
              <div><h3 className="text-sm font-semibold text-slate-950">Critical gaps</h3><div className="mt-3"><List items={opportunity.gapAnalysis.criticalGaps} empty="No critical gaps detected." /></div></div>
              <div><h3 className="text-sm font-semibold text-slate-950">Improvement areas</h3><div className="mt-3"><List items={opportunity.gapAnalysis.improvementAreas} empty="No immediate improvements identified." /></div></div>
            </div>
          </Section>

          <Section title="Recommended Next Build">
            <p className="text-sm leading-6 text-slate-600">{portfolioProject.whyThisProject}</p>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div><h3 className="text-sm font-semibold text-slate-950">Skills to prove</h3><div className="mt-3 flex flex-wrap gap-2">{portfolioProject.skillsToProve.map((skill) => <span key={skill} className="rounded-full border border-slate-300 bg-[#EEF4FF] px-3 py-1 text-xs text-indigo-700">{skill}</span>)}</div></div>
              <div><h3 className="text-sm font-semibold text-slate-950">Success criteria</h3><div className="mt-3"><List items={portfolioProject.successCriteria} empty="No criteria generated." /></div></div>
            </div>
          </Section>

          <Section title="Credibility Notes">
            <List items={evidencePacket.credibilityNotes} empty="No credibility notes available." />
          </Section>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 pt-5">
          <p className="text-xs text-slate-500">Stored locally in this browser.</p>
          <div className="flex gap-2">
            <Link href="/analysis" className="rounded-xl border border-slate-300 bg-[#EEF4FF] px-4 py-2 text-sm text-slate-700 hover:bg-[#EAF3F8]">Workspace</Link>
            <button type="button" onClick={copySummary} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">{copied ? "Copied" : "Copy Summary"}</button>
          </div>
        </div>
      </div>
    </main>
  );
}
