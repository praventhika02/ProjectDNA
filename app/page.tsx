"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ScanStudio } from "@/components/studio/ScanStudio";
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

function saveAndOpenAnalysis(result: AnalyzeSuccessResponse, router: ReturnType<typeof useRouter>, setError: (message: string) => void) {
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(result));
    router.push("/analysis");
  } catch {
    setError("Could not save the analysis in this browser.");
  }
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
      setError("Enter a valid public GitHub repo URL.");
      return;
    }

    if (parsedUrl.hostname !== "github.com" && !parsedUrl.hostname.endsWith(".github.com")) {
      setError("Enter a valid public GitHub repo URL.");
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
          ? "GitHub rate limit reached. Try a demo snapshot."
          : response.status === 404
            ? "Repository not found or not public."
            : fallback;
        throw new Error(message);
      }
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

  const demos = demoScenarios.map((scenario) => ({
    id: scenario.id,
    label: scenario.label.replace(" Demo", ""),
    description: scenario.description,
    score: `${scenario.result.opportunity.targetMatch.matchScore}%`,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#050816_0%,#0B1026_42%,#102A43_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:36px_36px]" />
      <div className="pointer-events-none absolute -left-36 top-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-10 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-slate-50 shadow-lg shadow-cyan-950/20 backdrop-blur-xl">ProjectDNA Studio</span>
        <a href="#scan" className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/15">Scan repo</a>
      </header>

      <section id="scan" className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:min-h-[calc(100vh-92px)] lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-10">
        <div>
          <p className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-cyan-100">Evidence-first career engine</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-slate-50 md:text-7xl">
            Your GitHub already tells a story.
          </h1>
          <p className="mt-4 bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
            ProjectDNA turns it into opportunity evidence.
          </p>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Scan a public repo, see your role fit, and get a build mission to close the gap.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Live GitHub scan", "No paid AI API", "Role-fit scoring"].map((chip) => (
              <span key={chip} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 font-mono text-xs text-slate-300">{chip}</span>
            ))}
          </div>
        </div>

        <ScanStudio
          repoUrl={repoUrl}
          selectedRole={selectedRole}
          roles={roles}
          isLoading={isLoading}
          error={error}
          loadingLabel={loadingStages[loadingStage]}
          progress={Math.round(((loadingStage + 1) / loadingStages.length) * 100)}
          demos={demos}
          onRepoUrlChange={setRepoUrl}
          onRoleChange={(role) => setSelectedRole(role as (typeof roles)[number])}
          onSubmit={handleSubmit}
          onDemo={loadDemoSnapshot}
        />
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-14">
        <h2 className="mb-4 text-xl font-semibold text-slate-50">From repo to opportunity</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <PipelineCard step="01" title="Reveal proof" text="Find repo-derived skill signals." />
          <PipelineCard step="02" title="Score fit" text="Compare against role requirements." />
          <PipelineCard step="03" title="Unlock role" text="Build the missing evidence." />
        </div>
      </section>
    </main>
  );
}

function PipelineCard({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.065] p-5 shadow-xl shadow-cyan-950/10 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.09]">
      <span className="font-mono text-xs text-cyan-200">{step}</span>
      <h3 className="mt-3 text-xl font-semibold text-slate-50">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}
