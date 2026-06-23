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

function StepCard({ number, title, text }: { number: string; title: string; text: string }) {
  const tones = ["bg-[#EEF4FF] border-slate-300", "bg-[#EAF3F8] border-slate-300", "bg-[#EDF7F6] border-slate-300", "bg-[#F2F0FF] border-slate-300", "bg-[#F7F8FA] border-slate-300"];
  const tone = tones[number.charCodeAt(0) % tones.length];
  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone}`}>
      <span className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 font-mono text-xs font-semibold text-white">{number}</span>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
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
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#EEF4FF_0%,#F4F7FB_52%,#EDF7F6_100%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:36px_36px]" />
      </div>
      <header className="relative z-10 border-b border-slate-300 bg-[#EAF3F8]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#" className="text-sm font-semibold tracking-tight text-indigo-700">ProjectDNA</a>
          <a href="#analyze" className="rounded-lg border border-slate-300 bg-[#EEF4FF] px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm hover:bg-[#F2F0FF]">Analyze GitHub</a>
        </div>
      </header>

      <section id="analyze" className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
        <div>
          <p className="w-fit rounded-full border border-slate-300 bg-[#EEF4FF]/90 px-3 py-1 font-mono text-sm font-semibold text-indigo-700 shadow-sm">ProjectDNA</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Turn GitHub work into opportunity evidence.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Analyze a public repo, understand your role fit, and get a project plan to close the gap.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["GitHub API", "deterministic scoring", "no paid AI API", "evidence report"].map((chip) => <span key={chip} className="rounded-full border border-slate-300 bg-[#F7F8FA]/90 px-3 py-1.5 font-mono text-xs font-medium text-slate-700 shadow-sm">{chip}</span>)}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-300 bg-[#EDF7F6]/85 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Why it matters</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Students often have real work hidden inside repos. ProjectDNA makes that work easier to inspect, compare, and improve.</p>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-300 bg-gradient-to-br from-[#EAF3F8]/95 via-[#EDF7F6]/95 to-[#EEF4FF]/95 p-5 shadow-xl shadow-slate-200/60 backdrop-blur">
          <div className="mb-4 rounded-2xl border border-slate-300 bg-[#F7F8FA] p-4">
            <p className="font-mono text-xs font-semibold uppercase tracking-wide text-cyan-700">Command center</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Run ProjectDNA</p>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600" htmlFor="repo-url">Repo input</label>
              <input id="repo-url" type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/you/project" className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-[#F7F8FA] px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" disabled={isLoading} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600" htmlFor="target-role">Target role</label>
              <select id="target-role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as (typeof roles)[number])} className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-[#F7F8FA] px-3 text-sm text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" disabled={isLoading}>
                {roles.map((role) => <option key={role}>{role}</option>)}
              </select>
            </div>
            <button type="submit" disabled={isLoading} className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-wait disabled:bg-slate-300">
              {isLoading ? "Analyzing..." : "Analyze Project DNA"}
              {!isLoading && <ArrowIcon />}
            </button>
          </form>
          {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
          {isLoading && (
            <div className="mt-4" aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-cyan-700">{loadingStages[loadingStage]}</span><span className="text-slate-500">{loadingStage + 1}/{loadingStages.length}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-[#EEF4FF]"><div className="h-full rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }} /></div>
            </div>
          )}

          <div className="mt-5 border-t border-slate-300 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Demo snapshots</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {demoScenarios.map((scenario, index) => (
                <button key={scenario.id} type="button" disabled={isLoading} onClick={() => loadDemoSnapshot(index)} aria-label={`Load ${scenario.label}`} className="rounded-xl border border-slate-300 bg-gradient-to-br from-[#EEF4FF] to-[#EAF3F8] p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60">
                  <span className="block text-sm font-semibold text-slate-900">{scenario.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600">{scenario.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-12">
        <div className="grid gap-4 lg:grid-cols-4">
          <StepCard number="1" title="Fetch repo" text="Read public metadata, README, file tree, and selected snippets." />
          <StepCard number="2" title="Detect skill evidence" text="Find languages, frameworks, quality signals, and domain evidence." />
          <StepCard number="3" title="Match role" text="Compare repo evidence to the selected seeded role requirements." />
          <StepCard number="4" title="Generate build plan" text="Turn gaps into a concrete next project and recruiter summary." />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          <StepCard number="A" title="Proof from actual work" text="Signals come from public repo content, not invented claims." />
          <StepCard number="B" title="Gap-based project plan" text="The recommendation targets missing role evidence." />
          <StepCard number="C" title="Recruiter-ready summary" text="Copy a concise evidence-led story or open the formal report." />
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-300 bg-[#EAF3F8]/85 px-6 py-6 backdrop-blur">
        <div className="mx-auto max-w-7xl text-xs leading-5 text-slate-500">ProjectDNA analyses public repository evidence only. It does not guarantee employment outcomes and should be used as a capability signal, not a final hiring decision.</div>
      </footer>
    </main>
  );
}
