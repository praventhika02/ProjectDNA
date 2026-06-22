"use client";

import { FormEvent, ReactNode, useState } from "react";
import type { AnalyzeResponse, AnalyzeSuccessResponse, OpportunityMatch, SkillEvidence } from "@/types/project-dna";
import { useRouter } from "next/navigation";
import { demoScenarios } from "@/data/demo-results";

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

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="relative flex-1 rounded-2xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-sm transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.055]">
      <span className="mb-8 flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-xs font-semibold text-violet-200">{number}</span>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

function ResultCard({ title }: { title: string }) {
  return (
    <article className="group relative min-h-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d16]/80 p-6 transition duration-300 hover:border-white/20">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500/50 via-cyan-400/30 to-transparent" />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">Coming next</p>
      <h3 className="mt-4 text-lg font-semibold text-slate-300">{title}</h3>
      <div className="mt-6 space-y-3">
        <div className="h-3 rounded bg-white/[0.055]" />
        <div className="h-3 w-5/6 rounded bg-white/[0.055]" />
        <div className="h-3 w-2/3 rounded bg-white/[0.055]" />
      </div>
      <p className="absolute bottom-5 text-xs text-slate-600">Generation not yet enabled</p>
    </article>
  );
}

function SkillCard({ skill }: { skill: SkillEvidence }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#0d0d16]/90 p-5 transition hover:border-violet-400/25">
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
      <ul className="mt-4 space-y-2">
        {skill.evidence.slice(0, 2).map((line) => <li key={line} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />{line}</li>)}
      </ul>
    </article>
  );
}

function AlternativeMatchCard({ match }: { match: OpportunityMatch }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-white">{match.title}</p><p className="mt-1 text-xs text-slate-600">{match.company}</p></div><span className="text-lg font-semibold text-violet-300">{match.matchScore}%</span></div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${match.matchScore}%` }} /></div>
      <p className="mt-3 text-xs capitalize text-slate-500">{match.readinessLevel} readiness / {match.matchedSkills.length} matched requirements</p>
    </div>
  );
}

function ProjectList({ title, items, accent = "text-violet-300" }: { title: string; items: string[]; accent?: string }) {
  return (
    <div>
      <h4 className={`text-sm font-semibold ${accent}`}>{title}</h4>
      <div className="mt-3 space-y-2">{items.map((item) => <div key={item} className="flex gap-2.5 text-xs leading-5 text-slate-400"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-70" />{item}</div>)}</div>
    </div>
  );
}

function FeaturePill({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-slate-300">
      <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]" />
      {children}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedRole, setSelectedRole] = useState<(typeof roles)[number]>(roles[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeSuccessResponse | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const [copiedSummary, setCopiedSummary] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAnalysis(null);
    setCopiedSummary(false);

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
      setAnalysis(result);
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
    setCopiedSummary(false);
    setIsLoading(false);
    setRepoUrl(scenario.result.repo.url);
    setSelectedRole(scenario.result.targetJob.title as (typeof roles)[number]);
    setAnalysis(scenario.result);
    window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function viewEvidenceReport() {
    if (!analysis) return;
    try {
      localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(analysis));
      router.push("/report/latest");
    } catch {
      setError("Could not save the report in this browser. Check local storage permissions and try again.");
    }
  }

  async function copyRecruiterSummary() {
    if (!analysis) return;
    const text = `${analysis.evidencePacket.recruiterPitch}\nMatch score: ${analysis.opportunity.targetMatch.matchScore}% (${analysis.opportunity.targetMatch.readinessLevel} readiness)\n${analysis.portfolioProject.portfolioPitch}`;
    try {
      await copyText(text);
      setCopiedSummary(true);
      window.setTimeout(() => setCopiedSummary(false), 2500);
    } catch {
      setError("Could not copy the summary. Your browser may have blocked clipboard access.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#05050a] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-10%,rgba(109,40,217,0.32),transparent_38%),radial-gradient(circle_at_90%_35%,rgba(8,145,178,0.12),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="#" className="flex items-center gap-2 text-sm font-semibold tracking-wide text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-500/10 text-violet-300"><Mark /></span>
          ProjectDNA
        </a>
        <a href="#analyze" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white">Analyze a repository</a>
      </nav>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-16 text-center sm:pt-24 lg:px-8">
        <div className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3.5 py-2 text-xs font-medium text-violet-200">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Theme B5: Opportunity access is socially gated
        </div>
        <h1 className="text-balance text-5xl font-semibold tracking-[-0.045em] text-white sm:text-7xl lg:text-[5.25rem] lg:leading-[0.98]">
          Turn your GitHub into <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">proof of opportunity-readiness.</span>
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-slate-400 sm:text-lg">
          ProjectDNA analyses what you have actually built, extracts skill evidence, matches it to real opportunity requirements, and shows what project to build next.
        </p>
        <p className="mt-5 text-sm font-medium tracking-wide text-slate-200">Replacing social capital with demonstrated potential.</p>

        <form id="analyze" onSubmit={handleSubmit} className="mx-auto mt-12 max-w-4xl rounded-3xl border border-white/10 bg-[#0b0b13]/85 p-3 text-left shadow-glow backdrop-blur-xl sm:p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_240px_auto]">
            <label className="sr-only" htmlFor="repo-url">GitHub repository URL</label>
            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-4 focus-within:border-violet-400/50">
              <svg className="h-5 w-5 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7.5l-1.7 1.7m2.2 6.3a5 5 0 0 0-7.5-.5l-3 3A5 5 0 0 0 11 21l1.7-1.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
              <input id="repo-url" type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} placeholder="https://github.com/you/project" className="h-14 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600" disabled={isLoading} />
            </div>
            <label className="sr-only" htmlFor="target-role">Target role</label>
            <select id="target-role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value as (typeof roles)[number])} className="h-14 rounded-xl border border-white/10 bg-[#11111a] px-4 text-sm text-slate-200 outline-none focus:border-violet-400/50" disabled={isLoading}>
              {roles.map((role) => <option key={role}>{role}</option>)}
            </select>
            <button type="submit" disabled={isLoading} className="relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-violet-100 disabled:cursor-wait disabled:text-slate-500 sm:min-w-48">
              {isLoading && <span className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-violet-300/50 to-transparent" />}
              <span className="relative">{isLoading ? "Reading repository..." : "Analyze Project DNA"}</span>
              {!isLoading && <ArrowIcon />}
            </button>
          </div>
          {error && <p role="alert" className="px-2 pb-1 pt-3 text-sm text-rose-400">{error}</p>}
          {isLoading && (
            <div className="px-2 pb-1 pt-4" aria-live="polite">
              <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-violet-300">{loadingStages[loadingStage]}</span><span className="text-slate-600">{loadingStage + 1}/{loadingStages.length}</span></div>
              <div className="h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500" style={{ width: `${((loadingStage + 1) / loadingStages.length) * 100}%` }} /></div>
            </div>
          )}
          <p className="px-2 pb-1 pt-3 text-xs text-slate-600">Public repositories only. No login required. GitHub API limits apply.</p>
        </form>
        <div className="mx-auto mt-4 max-w-4xl rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.035] p-4 text-left">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Try Demo Snapshot</p><p className="mt-1 text-xs text-slate-500">Precomputed examples load instantly and do not call GitHub.</p></div><div className="flex flex-wrap gap-2">{demoScenarios.map((scenario, index) => <button key={scenario.id} type="button" disabled={isLoading} onClick={() => loadDemoSnapshot(index)} aria-label={`Load ${scenario.label}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50">{scenario.label}</button>)}</div></div>
        </div>
      </section>

      <section id="results" className="relative z-10 mx-auto max-w-7xl scroll-mt-6 px-6 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Your evidence layer</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">See capability, not connections.</h2></div>
          {analysis && <span className={`hidden rounded-full border px-3 py-1.5 text-xs font-medium sm:block ${analysis.analysisMode === "demo" ? "border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300" : "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"}`}>{analysis.analysisMode === "demo" ? "Demo snapshot" : "Live GitHub analysis"}</span>}
        </div>
        {analysis && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.035]">
            <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${analysis.analysisMode === "demo" ? "text-cyan-300" : "text-emerald-300"}`}><span className={`h-2 w-2 rounded-full ${analysis.analysisMode === "demo" ? "bg-cyan-400" : "bg-emerald-400"}`} />{analysis.analysisMode === "demo" ? <>Demo snapshot &mdash; no GitHub API used.</> : "Live GitHub analysis"}</div>
                <a href={analysis.repo.url} target="_blank" rel="noreferrer" className="text-xl font-semibold text-white transition hover:text-violet-200">{analysis.repo.fullName}</a>
                <p className="mt-2 max-w-2xl text-sm text-slate-400">Prepared as evidence for <span className="text-slate-200">{analysis.targetJob.title}</span>{analysis.repo.description ? ` / ${analysis.repo.description}` : ""}</p>
                <p className="mt-2 text-xs text-slate-600">Generated {new Date(analysis.generatedAt).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4 lg:min-w-[520px]">
                <div className="bg-[#0c1110] p-4"><p className="text-xs text-slate-500">Evidence files</p><p className="mt-1 text-lg font-semibold text-white">{analysis.fileTreeSummary.selectedFiles}</p></div>
                <div className="bg-[#0c1110] p-4"><p className="text-xs text-slate-500">Files scanned</p><p className="mt-1 text-lg font-semibold text-white">{analysis.fileTreeSummary.totalFiles}</p></div>
                <div className="bg-[#0c1110] p-4"><p className="text-xs text-slate-500">Top language</p><p className="mt-1 truncate text-sm font-semibold text-white">{analysis.repo.language ?? "Mixed"}</p></div>
                <div className="bg-[#0c1110] p-4"><p className="text-xs text-slate-500">Top extensions</p><p className="mt-1 truncate text-sm font-semibold text-white">{analysis.fileTreeSummary.topExtensions.slice(0, 3).map((item) => item.extension).join(" / ") || "None"}</p></div>
              </div>
            </div>
          </div>
        )}
        {analysis ? (
          <div className="mb-8 space-y-6">
            {analysis.analysis.confidence < 40 && <div role="status" className="rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-5 py-4 text-sm text-amber-200"><span className="font-semibold">Low confidence:</span> ProjectDNA only found limited public evidence in this repository.<span className="mt-1 block text-xs text-amber-200/70">This repo does not contain enough public evidence for a confident assessment.</span></div>}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="text-xs text-slate-500">Project complexity</p><div className="mt-3 flex items-end justify-between"><p className="text-xl font-semibold capitalize text-white">{analysis.analysis.projectComplexity.level}</p><p className="text-2xl font-semibold text-violet-300">{analysis.analysis.projectComplexity.score}<span className="text-xs text-slate-600">/100</span></p></div></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="text-xs text-slate-500">Primary domain</p><p className="mt-3 text-xl font-semibold text-white">{analysis.analysis.domainClassification.primaryDomain}</p><p className="mt-1 truncate text-xs text-slate-500">{analysis.analysis.domainClassification.secondaryDomains.join(" / ") || "No secondary domain"}</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="text-xs text-slate-500">Analysis confidence</p><div className="mt-3 flex items-end justify-between"><p className="text-sm text-slate-400">Evidence coverage</p><p className="text-2xl font-semibold text-cyan-300">{analysis.analysis.confidence}%</p></div></div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-7">
              <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Skill Evidence</p><h3 className="mt-2 text-2xl font-semibold text-white">Signals grounded in this repository</h3><p className="mt-2 text-sm text-slate-500">Every result below comes from a manifest, file path, README, language count, or selected code snippet.</p></div>
              {analysis.analysis.detectedSkills.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{analysis.analysis.detectedSkills.slice(0, 12).map((skill) => <SkillCard key={`${skill.category}-${skill.skill}`} skill={skill} />)}</div> : <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">No defensible skills were detected from the available public files. Add source code or project documentation and try again.</div>}
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#0d0d16]/80 p-5 sm:p-7">
              <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Code quality signals</p><h3 className="mt-2 text-xl font-semibold text-white">What the public evidence supports</h3></div>
              <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
                {analysis.analysis.qualitySignals.map((signal) => <div key={signal.signal}><div className="mb-2 flex items-center justify-between gap-4"><p className="text-sm font-medium text-slate-300">{signal.signal}</p><span className="text-xs text-slate-500">{signal.score}/100</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" style={{ width: `${signal.score}%` }} /></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">{signal.evidence[0]}</p></div>)}
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-violet-400/20 bg-[#0d0d16]/90">
              <div className="grid lg:grid-cols-[1fr_240px]">
                <div className="p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Opportunity Match</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">{analysis.opportunity.targetMatch.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{analysis.opportunity.targetMatch.company}</p>
                  <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-400">{analysis.opportunity.targetMatch.explanation}</p>
                </div>
                <div className="border-t border-white/10 bg-gradient-to-br from-violet-500/10 to-cyan-500/5 p-6 lg:border-l lg:border-t-0">
                  <p className="text-xs text-slate-500">Calculated match</p><p className="mt-2 text-5xl font-semibold tracking-tight text-white">{analysis.opportunity.targetMatch.matchScore}<span className="text-lg text-slate-500">%</span></p>
                  <p className="mt-3 inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium capitalize text-violet-200">{analysis.opportunity.targetMatch.readinessLevel} readiness</p>
                  <p className="mt-5 text-xs text-slate-500">Evidence strength <span className="float-right text-slate-300">{analysis.opportunity.targetMatch.evidenceStrength}%</span></p>
                </div>
              </div>
              <div className="border-t border-white/10 p-6 sm:p-8">
                <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Matched skills</h4>
                    {analysis.opportunity.targetMatch.matchedSkills.length ? <div className="mt-4 space-y-3">{analysis.opportunity.targetMatch.matchedSkills.map((match) => <div key={`${match.jobSkill}-${match.matchedRepoSkill}`} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-slate-200">{match.jobSkill} <span className="text-slate-600">matched by</span> <span className="text-cyan-300">{match.matchedRepoSkill}</span></p><span className="text-xs text-slate-500">{match.strength}% strength</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{match.evidence[0]}</p></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No role requirements have defensible repository evidence yet.</p>}
                  </div>
                  <div className="space-y-6">
                    <div><h4 className="text-sm font-semibold text-white">Missing required skills</h4><div className="mt-3 flex flex-wrap gap-2">{analysis.opportunity.targetMatch.missingRequiredSkills.length ? analysis.opportunity.targetMatch.missingRequiredSkills.map((skill) => <span key={skill} className="rounded-full border border-rose-400/20 bg-rose-400/[0.07] px-3 py-1.5 text-xs text-rose-200">{skill}</span>) : <span className="text-xs text-emerald-300">No required skill gaps detected</span>}</div></div>
                    <div><h4 className="text-sm font-semibold text-white">Missing preferred skills</h4><div className="mt-3 flex flex-wrap gap-2">{analysis.opportunity.targetMatch.missingPreferredSkills.length ? analysis.opportunity.targetMatch.missingPreferredSkills.map((skill) => <span key={skill} className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1.5 text-xs text-amber-200">{skill}</span>) : <span className="text-xs text-emerald-300">No preferred skill gaps detected</span>}</div></div>
                  </div>
                </div>
              </div>
              <div className="border-t border-white/10 p-6 sm:p-8"><h4 className="text-sm font-semibold text-white">Alternative role matches</h4><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{analysis.opportunity.alternativeMatches.map((match) => <AlternativeMatchCard key={match.jobId} match={match} />)}</div></div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
              <div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Gap Analysis</p><h3 className="mt-2 text-2xl font-semibold text-white">What would make the evidence stronger</h3><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">{analysis.opportunity.gapAnalysis.overallAdvice}</p></div>
              <div className="grid gap-6 lg:grid-cols-3">
                <div><h4 className="text-sm font-semibold text-emerald-300">Strongest evidence</h4><div className="mt-3 space-y-2">{analysis.opportunity.gapAnalysis.strongestEvidence.length ? analysis.opportunity.gapAnalysis.strongestEvidence.map((item) => <p key={item} className="text-xs leading-5 text-slate-400">{item}</p>) : <p className="text-xs text-slate-600">No matched evidence available.</p>}</div></div>
                <div><h4 className="text-sm font-semibold text-rose-300">Critical gaps</h4><div className="mt-3 space-y-2">{analysis.opportunity.gapAnalysis.criticalGaps.length ? analysis.opportunity.gapAnalysis.criticalGaps.map((item) => <p key={item} className="text-xs leading-5 text-slate-400">{item}</p>) : <p className="text-xs text-emerald-300">No critical required gaps detected.</p>}</div></div>
                <div><h4 className="text-sm font-semibold text-amber-300">Improvement areas</h4><div className="mt-3 space-y-2">{analysis.opportunity.gapAnalysis.improvementAreas.map((item) => <p key={item} className="text-xs leading-5 text-slate-400">{item}</p>)}</div></div>
              </div>
              <div className="mt-7 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-4 py-3 text-sm text-cyan-100"><span className="mr-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">Next best role</span>{analysis.opportunity.gapAnalysis.nextBestRole}</div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-fuchsia-400/25 bg-[#0c0912] shadow-[0_0_80px_rgba(168,85,247,0.1)]">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_10%_10%,rgba(192,38,211,0.13),transparent_38%)]" />
              <div className="relative border-b border-white/10 p-6 sm:p-9">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-300">Recommended Portfolio Project</p>
                    <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{analysis.portfolioProject.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-400">{analysis.portfolioProject.summary}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-56 lg:justify-end"><span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-1.5 text-xs font-medium capitalize text-fuchsia-200">{analysis.portfolioProject.difficulty}</span><span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-3 py-1.5 text-xs font-medium text-cyan-200">{analysis.portfolioProject.estimatedTime}</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">{analysis.portfolioProject.targetRole}</span></div>
                </div>
                <div className="mt-7 rounded-2xl border border-white/10 bg-black/25 p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">Why this project</p><p className="mt-3 text-sm leading-6 text-slate-300">{analysis.portfolioProject.whyThisProject}</p></div>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div><p className="text-xs font-semibold text-white">Skills to prove</p><div className="mt-3 flex flex-wrap gap-2">{analysis.portfolioProject.skillsToProve.map((skill) => <span key={skill} className="rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5 text-xs text-violet-200">{skill}</span>)}</div></div>
                  <div><p className="text-xs font-semibold text-white">Gaps addressed</p><div className="mt-3 flex flex-wrap gap-2">{analysis.portfolioProject.gapsAddressed.map((gap) => <span key={gap} className="rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-3 py-1.5 text-xs text-amber-100">{gap}</span>)}</div></div>
                </div>
              </div>
              <div className="relative grid gap-8 border-b border-white/10 p-6 sm:p-9 lg:grid-cols-2">
                <ProjectList title="Core features" items={analysis.portfolioProject.features} accent="text-fuchsia-300" />
                <ProjectList title="Technical requirements" items={analysis.portfolioProject.technicalRequirements} accent="text-cyan-300" />
              </div>
              <div className="relative grid gap-8 border-b border-white/10 p-6 sm:p-9 lg:grid-cols-3">
                <ProjectList title="Deliverables" items={analysis.portfolioProject.deliverables} accent="text-violet-300" />
                <ProjectList title="Success criteria" items={analysis.portfolioProject.successCriteria} accent="text-emerald-300" />
                <ProjectList title="Stretch goals" items={analysis.portfolioProject.stretchGoals} accent="text-amber-300" />
              </div>
              <div className="relative p-6 sm:p-9"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Portfolio pitch</p><blockquote className="mt-3 max-w-4xl text-lg font-medium leading-8 text-white">&ldquo;{analysis.portfolioProject.portfolioPitch}&rdquo;</blockquote></div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-[#0c1118] to-[#0c0a14]">
              <div className="grid lg:grid-cols-[1fr_320px]">
                <div className="p-6 sm:p-9">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Shareable Evidence Packet</p>
                  <h3 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">{analysis.evidencePacket.headline}</h3>
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">{analysis.evidencePacket.summary}</p>
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">Recruiter summary</p><p className="mt-3 text-sm leading-6 text-slate-200">{analysis.evidencePacket.recruiterPitch}</p></div>
                  <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={viewEvidenceReport} className="flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100">View Evidence Report <ArrowIcon /></button><button type="button" onClick={copyRecruiterSummary} className="h-11 rounded-xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10">{copiedSummary ? "Summary copied" : "Copy Recruiter Summary"}</button></div>
                  <p className="mt-3 text-xs text-slate-600">The full report is saved only in this browser.</p>
                </div>
                <div className="border-t border-white/10 bg-white/[0.025] p-6 lg:border-l lg:border-t-0 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Proof at a glance</p>
                  <div className="mt-5 space-y-5">{analysis.evidencePacket.proofPoints.slice(0, 4).map((point) => <div key={point.label}><p className="text-xs text-slate-600">{point.label}</p><p className="mt-1 text-lg font-semibold capitalize text-white">{point.value}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{point.evidence}</p></div>)}</div>
                </div>
              </div>
            </div>
          </div>
        ) : <div className="mb-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{["Skill Evidence", "Opportunity Match", "Missing Gaps", "Recommended Portfolio Project", "Shareable Evidence Packet"].map((title) => <ResultCard key={title} title={title} />)}</div>}
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mb-10 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">How it works</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">A deterministic evidence pipeline, not a chatbot.</h2><p className="mt-4 text-sm leading-6 text-slate-500">Every result travels through inspectable local rules, from public repository input to an evidence packet.</p></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <FlowStep number="01" title="GitHub ingestion" text="Reads public metadata, README, file tree, and bounded code snippets." />
          <FlowStep number="02" title="Skill extraction" text="Detects skills from languages, dependencies, paths, and implementation patterns." />
          <FlowStep number="03" title="Opportunity scoring" text="Applies a custom weighted formula against seeded role requirements." />
          <FlowStep number="04" title="Gap-driven build" text="Turns missing evidence and weak quality signals into a concrete next project." />
          <FlowStep number="05" title="Evidence packet" text="Packages repository signals, honest limitations, and next steps for sharing." />
        </div>
        <div className="mt-6 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-r from-violet-500/[0.08] to-cyan-500/[0.04] p-6 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[260px_1fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">Transparent scoring</p><h3 className="mt-3 text-2xl font-semibold text-white">Match Score</h3><p className="mt-2 text-sm text-slate-500">Five weighted signals. No hidden model.</p></div><div className="grid gap-3 sm:grid-cols-5">{[["45%", "Required skill coverage"], ["20%", "Preferred skill coverage"], ["20%", "Evidence strength"], ["10%", "Domain alignment"], ["5%", "Complexity relevance"]].map(([weight, label]) => <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xl font-semibold text-cyan-300">{weight}</p><p className="mt-2 text-xs leading-5 text-slate-400">{label}</p></div>)}</div></div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-white/10 p-8 md:border-b-0 md:border-r lg:p-12"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Before</p><p className="mt-5 max-w-md text-2xl font-medium leading-snug text-slate-400">Cold applications rely on resumes and referrals.</p></div>
            <div className="relative p-8 lg:p-12"><div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-cyan-500/5" /><div className="relative"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">After</p><p className="mt-5 max-w-md text-2xl font-medium leading-snug text-white">ProjectDNA shows verified evidence from actual work.</p></div></div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Built for fairer access</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Potential should be legible without an introduction.</h2>
        <div className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-3"><FeaturePill>Not a resume builder</FeaturePill><FeaturePill>Not a chatbot</FeaturePill><FeaturePill>Evidence-first opportunity access</FeaturePill></div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span className="flex shrink-0 items-center gap-2 text-slate-400"><Mark className="h-4 w-4" /> ProjectDNA</span><p className="max-w-3xl leading-5 sm:text-right">ProjectDNA analyses public repository evidence only. It does not guarantee employment outcomes and should be used as a capability signal, not a final hiring decision.</p></div></footer>
    </main>
  );
}
