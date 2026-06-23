"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { demoScenarios } from "@/data/demo-results";
import type { AnalyzeResponse, AnalyzeSuccessResponse } from "@/types/project-dna";

const REPORT_STORAGE_KEY = "projectdna_latest_report";

const roles = [
  "AI Engineer Intern",
  "Data Analyst Intern",
  "Frontend Developer Intern",
  "Backend Developer Intern",
  "Product Engineer Intern",
] as const;

const loadingStages = [
  "Validating GitHub URL",
  "Fetching repository metadata",
  "Reading README and file tree",
  "Selecting evidence files",
  "Preparing ProjectDNA analysis",
];

function Mark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 21 7v10l-9 5-9-5V7l9-5Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="m8 9 4-2 4 2-4 2-4-2Zm0 4 4 2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function saveAndOpenAnalysis(result: AnalyzeSuccessResponse, router: ReturnType<typeof useRouter>, setError: (message: string) => void) {
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(result));
    router.push("/analysis");
  } catch {
    setError("Could not save the analysis in this browser. Check local storage permissions and try again.");
  }
}

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-xs font-semibold text-blue-200">{number}</span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function FeaturePill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0b1220] px-4 py-3 text-sm text-slate-300">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {children}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedRole, setSelectedRole] = useState<(typeof roles)[number]>(roles[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(repoUrl.trim());
    } catch {
      setError("Please enter a valid public GitHub repository URL.");
      return;
    }

    if (parsedUrl.hostname !== "github.com" && !parsedUrl.hostname.endsWith(".github.com")) {
      setError("Please enter a valid public GitHub repository URL.");
      return;
    }

    setIsLoading(true);
    setLoadingStage(0);
    const stageTimer = window.setInterval(() => {
      setLoadingStage((current) => Math.min(current + 1, loadingStages.length - 1));
    }, 650);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim(), targetRole: selectedRole }),
      });
      const result = (await response.json()) as AnalyzeResponse;
      if (!response.ok || !result.success) {
        const fallback = result.success ? "Could not analyze this repository." : result.error;
        const message = response.status === 403 || response.status === 429
          ? "GitHub rate limit reached. Try Demo Snapshot or wait before retrying live analysis."
          : response.status === 404
            ? "Repository not found or not public."
            : fallback;
        throw new Error(message);
      }
      setLoadingStage(loadingStages.length - 1);
      saveAndOpenAnalysis(result, router, setError);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not analyze this repository.");
    } finally {
      window.clearInterval(stageTimer);
      setIsLoading(false);
    }
  }

  function loadDemoSnapshot(index: number) {
    const scenario = demoScenarios[index];
    setError("");
    setRepoUrl(scenario.result.repo.url);
    setSelectedRole(scenario.result.targetJob.title as (typeof roles)[number]);
    saveAndOpenAnalysis(scenario.result, router, setError);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050814] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-12%,rgba(37,99,235,0.16),transparent_34%)]" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="#" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400/20 bg-blue-500/10 text-blue-200"><Mark /></span>
          ProjectDNA
        </a>
        <a href="#analyze" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">Analyze a repository</a>
      </nav>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-12 pt-14 text-center sm:pt-20 lg:px-8">
        <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-6xl lg:leading-[1.02]">
          Make public GitHub work readable as <span className="bg-gradient-to-r from-blue-200 to-emerald-200 bg-clip-text text-transparent">opportunity evidence.</span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-slate-400 sm:text-lg">
          ProjectDNA turns a repository into skill evidence, fit scoring, gap analysis, a recommended next build, and a recruiter-facing evidence packet.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a href="#analyze" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-100">Analyze GitHub <ArrowIcon /></a>
          <a href="#demos" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08]">Try a demo snapshot</a>
        </div>

        <div className="mx-auto mt-8 grid max-w-3xl gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left sm:grid-cols-4">
          {["Choose demo or paste GitHub", "Pick target role", "Analyze", "Review workspace"].map((stage, index) => (
            <div key={stage} className="text-sm text-slate-300"><span className="mr-2 text-blue-300">{index + 1}.</span>{stage}</div>
          ))}
        </div>
      </section>

      <section id="analyze" className="relative z-10 mx-auto max-w-6xl scroll-mt-6 px-6 pb-20 lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-[#0b1220]/85 p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Step 1</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Analyze live GitHub evidence</h2>
              <p className="mt-2 text-sm text-slate-500">Public repositories only. No login required. GitHub API limits apply.</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_240px_auto]">
            <label className="sr-only" htmlFor="repo-url">GitHub repository URL</label>
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-4 focus-within:border-blue-400/50">
              <svg className="h-5 w-5 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7.5l-1.7 1.7m2.2 6.3a5 5 0 0 0-7.5-.5l-3 3A5 5 0 0 0 11 21l1.7-1.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input id="repo-url" type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/you/project" className="h-14 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" disabled={isLoading} />
            </div>
            <label className="sr-only" htmlFor="target-role">Target role</label>
            <select id="target-role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as (typeof roles)[number])} className="h-14 rounded-xl border border-slate-800 bg-slate-950 px-4 text-sm text-slate-200 outline-none focus:border-blue-400/50" disabled={isLoading}>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
            <button type="submit" disabled={isLoading} className="relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100 disabled:cursor-wait disabled:text-slate-500 sm:min-w-48">
              {isLoading && <span className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />}
              <span className="relative">{isLoading ? "Reading repository..." : "Analyze Project DNA"}</span>
              {!isLoading && <ArrowIcon />}
            </button>
          </form>
          {error && <p role="alert" className="px-2 pb-1 pt-3 text-sm text-rose-400">{error}</p>}
          {isLoading && (
            <div className="px-2 pb-1 pt-4" aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-violet-300">{loadingStages[loadingStage]}</span><span className="text-slate-600">{loadingStage + 1}/{loadingStages.length}</span></div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500" style={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }} /></div>
            </div>
          )}

          <div id="demos" className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">Or choose a demo</p>
                <p className="mt-1 text-sm text-slate-500">Curated no-API scenarios for hackathon judging and rate-limit-safe demos.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {demoScenarios.map((scenario, index) => (
                  <button key={scenario.id} type="button" disabled={isLoading} onClick={() => loadDemoSnapshot(index)} aria-label={`Load ${scenario.label}`} className="group rounded-xl border border-slate-800 bg-[#0b1220] p-4 text-left transition hover:border-blue-400/30 disabled:cursor-not-allowed disabled:opacity-50">
                    <span className="text-sm font-semibold text-white group-hover:text-cyan-100">{scenario.label}</span>
                    <span className="mt-2 block text-xs leading-5 text-slate-500">{scenario.description}</span>
                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-300">Launch demo <ArrowIcon /></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-6xl gap-5 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-2xl border border-slate-800 bg-[#0b1220]/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Problem</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Opportunity access is often socially gated.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">Students may have real capability in public work, but applications still compress that work into resumes, referrals, and keywords.</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#0b1220]/80 p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">How ProjectDNA works</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <FlowStep number="01" title="Read repo evidence" text="Fetches public metadata, README, file tree, and selected snippets." />
            <FlowStep number="02" title="Extract Skill DNA" text="Finds deterministic skill and quality signals from repo content." />
            <FlowStep number="03" title="Score opportunity fit" text="Compares evidence to seeded role requirements." />
            <FlowStep number="04" title="Generate next build" text="Turns gaps into a concrete portfolio project and packet." />
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 lg:px-8">
        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 sm:grid-cols-3">
          <FeaturePill>Repo-derived evidence</FeaturePill>
          <FeaturePill>Custom scoring logic</FeaturePill>
          <FeaturePill>Recommended next build</FeaturePill>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex shrink-0 items-center gap-2 text-slate-400"><Mark className="h-4 w-4" /> ProjectDNA</span>
          <p className="max-w-3xl leading-5 sm:text-right">ProjectDNA analyses public repository evidence only. It does not guarantee employment outcomes and should be used as a capability signal, not a final hiring decision.</p>
        </div>
      </footer>
    </main>
  );
}
