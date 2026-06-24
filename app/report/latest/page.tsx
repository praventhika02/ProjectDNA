"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buildReadablePacket } from "@/lib/report-copy";
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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#050816_0%,#0B1026_42%,#102A43_100%)] text-slate-100">
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
      setReport(stored ? (JSON.parse(stored) as AnalyzeSuccessResponse) : null);
    } catch {
      setReport(null);
    }
  }, []);

  async function copySummary() {
    if (!report) return;
    try {
      await copyText(buildReadablePacket(report).copyText);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopyError("Clipboard access was blocked.");
    }
  }

  if (report === undefined) {
    return (
      <Shell>
        <div className="relative z-10 flex min-h-screen items-center justify-center text-sm text-slate-400">Loading report...</div>
      </Shell>
    );
  }

  if (!report?.success) {
    return (
      <Shell>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center">
          <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.08] p-8 shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
            <h1 className="text-2xl font-semibold text-slate-50">No report found</h1>
            <p className="mt-3 text-sm text-slate-400">Run an analysis first.</p>
            <Link href="/" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white">Scan repo</Link>
          </div>
        </div>
      </Shell>
    );
  }

  const packet = buildReadablePacket(report);
  const target = report.opportunity.targetMatch;
  const credibility = [
    "Based only on public GitHub evidence.",
    "Scores come from deterministic local rules.",
    "Missing means not visible in inspected repo data.",
  ];

  return (
    <Shell>
      <header className="relative z-10 border-b border-white/10 bg-[#071126]/80 shadow-lg shadow-cyan-950/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-slate-50">ProjectDNA Studio</Link>
          <div className="flex gap-2">
            <Link href="/analysis" className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.10]">Studio</Link>
            <button type="button" onClick={copySummary} className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-2 text-xs font-semibold text-white">{copied ? "Copied" : "Copy"}</button>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-8">
        <article className="rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Evidence packet</p>
              <h1 className="mt-3 text-4xl font-semibold text-slate-50">{packet.headline}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-7 text-cyan-100">{packet.verdict}</p>
            </div>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 font-mono text-xs text-cyan-100">{report.analysisMode}</span>
          </div>

          {copyError && <p className="mt-4 text-sm text-red-300">{copyError}</p>}

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <Stat label="Repo" value={report.repo.fullName} />
            <Stat label="Role" value={report.targetJob.title} />
            <Stat label="Match" value={`${target.matchScore}%`} />
            <Stat label="Confidence" value={`${report.analysis.confidence}%`} />
          </div>

          <section className="mt-6 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-5 shadow-inner shadow-cyan-950/20">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-100">Send this</p>
            <p className="mt-3 text-lg leading-7 text-slate-100">{packet.recruiterPitch}</p>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <Card title="Proof" items={packet.proofBullets} tone="proof" />
            <Card title="Missing" items={packet.riskBullets} tone="risk" />
            <Card title="Next build" items={[packet.nextMove]} tone="next" />
          </div>

          <section className="mt-5 rounded-2xl border border-violet-300/20 bg-violet-300/10 p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-100">Why this is different</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">{packet.differentiator}</p>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Credibility</p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {credibility.map((note) => (
                <p key={note} className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-sm text-slate-300">{note}</p>
              ))}
            </div>
          </section>
        </article>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 shadow-lg shadow-cyan-950/10">
      <p className="font-mono text-xs text-slate-400">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold text-slate-50">{value}</p>
    </div>
  );
}

function Card({ title, items, tone }: { title: string; items: string[]; tone: "proof" | "risk" | "next" }) {
  const toneClass = tone === "proof"
    ? "border-emerald-300/20 bg-emerald-300/10"
    : tone === "risk"
      ? "border-amber-300/20 bg-amber-300/10"
      : "border-violet-300/20 bg-violet-300/10";
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p key={item} className={`rounded-xl border p-3 text-sm leading-6 text-slate-300 ${toneClass}`}>{item}</p>
        ))}
      </div>
    </section>
  );
}
