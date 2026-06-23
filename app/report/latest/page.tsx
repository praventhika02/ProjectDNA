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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#060B1A_0%,#101B3D_48%,#102A43_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute left-0 top-20 h-96 w-96 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
      {children}
    </main>
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
    const text = `${report.evidencePacket.recruiterPitch}\nMatch score: ${report.opportunity.targetMatch.matchScore}% (${report.opportunity.targetMatch.readinessLevel})\n${report.portfolioProject.portfolioPitch}`;
    try {
      await copyText(text);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError("Clipboard access was blocked.");
    }
  }

  if (report === undefined) return <Shell><div className="relative z-10 flex min-h-screen items-center justify-center text-sm text-slate-400">Loading report...</div></Shell>;

  if (!report?.success) {
    return (
      <Shell>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
          <div className="max-w-md rounded-[2rem] border border-white/10 bg-white/[0.07] p-8 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold text-slate-50">No report found</h1>
            <p className="mt-3 text-sm text-slate-400">Run an analysis first.</p>
            <Link href="/" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white">Scan repo</Link>
          </div>
        </div>
      </Shell>
    );
  }

  const { repo, analysis, opportunity, portfolioProject, evidencePacket, fileTreeSummary, targetJob } = report;
  const target = opportunity.targetMatch;
  const gaps = [...target.missingRequiredSkills, ...target.missingPreferredSkills];

  return (
    <Shell>
      <header className="relative z-10 border-b border-white/10 bg-[#071126]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-50">ProjectDNA Studio</Link>
          <div className="flex gap-2">
            <Link href="/analysis" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.10]">Studio</Link>
            <button type="button" onClick={copySummary} className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-2 text-xs font-semibold text-white">{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Evidence memo</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-50">{evidencePacket.headline}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{evidencePacket.summary}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 font-mono text-xs text-slate-300">{report.analysisMode}</span>
          </div>

          {analysis.confidence < 40 && <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm text-amber-200">Low public evidence confidence.</p>}
          {copyError && <p className="mt-4 text-sm text-red-300">{copyError}</p>}

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Stat label="Repo" value={repo.fullName} />
            <Stat label="Role" value={targetJob.title} />
            <Stat label="Match" value={`${target.matchScore}%`} />
            <Stat label="Files" value={`${fileTreeSummary.selectedFiles}`} />
          </div>

          <Section title="Recruiter pitch">
            <blockquote className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-lg leading-7 text-slate-100">{evidencePacket.recruiterPitch}</blockquote>
          </Section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <Section title="Proof">
              <div className="space-y-2">
                {evidencePacket.proofPoints.slice(0, 3).map((point) => <Mini key={point.label} title={point.value} text={point.evidence} />)}
              </div>
            </Section>
            <Section title="Risks">
              <div className="space-y-2">
                {gaps.slice(0, 3).map((gap) => <Mini key={gap} title={gap} text="Address in the next build mission." />)}
                {!gaps.length && <p className="text-sm text-slate-400">No critical gaps detected.</p>}
              </div>
            </Section>
          </div>

          <Section title="Next build">
            <h3 className="text-xl font-semibold text-slate-50">{portfolioProject.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{portfolioProject.portfolioPitch}</p>
          </Section>
        </article>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="font-mono text-xs text-slate-400">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
      {children}
    </section>
  );
}

function Mini({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
