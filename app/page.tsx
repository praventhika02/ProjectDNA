"use client";

import { FormEvent, ReactNode, useState } from "react";

const roles = [
  "AI Engineer Intern",
  "Data Analyst Intern",
  "Frontend Developer Intern",
  "Backend Developer Intern",
  "Product Engineer Intern",
] as const;

type MockResult = {
  title: string;
  eyebrow: string;
  content: string;
  accent: string;
};

const sampleResults: MockResult[] = [
  {
    title: "Skill Evidence",
    eyebrow: "3 signals found",
    content: "TypeScript architecture, component design, and practical API integration backed by repository evidence.",
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    title: "Opportunity Match",
    eyebrow: "Strong foundation",
    content: "Your project demonstrates several core capabilities expected for this role, with room to deepen production readiness.",
    accent: "from-cyan-400 to-blue-500",
  },
  {
    title: "Missing Gaps",
    eyebrow: "2 growth areas",
    content: "Add automated testing and measurable performance outcomes to make your evidence more convincing.",
    accent: "from-amber-300 to-orange-500",
  },
  {
    title: "Recommended Portfolio Project",
    eyebrow: "Build next",
    content: "Create a production-style analytics workspace with tested data pipelines, role-based views, and documented tradeoffs.",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    title: "Shareable Evidence Packet",
    eyebrow: "Ready to generate",
    content: "A concise, recruiter-friendly summary connecting your implementation choices to real role requirements.",
    accent: "from-pink-400 to-rose-500",
  },
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

function ResultCard({ result }: { result?: MockResult }) {
  return (
    <article className="group relative min-h-52 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d16]/80 p-6 transition duration-300 hover:border-white/20">
      {result ? (
        <>
          <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${result.accent}`} />
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{result.eyebrow}</p>
          <h3 className="mt-4 text-lg font-semibold text-white">{result.title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{result.content}</p>
        </>
      ) : (
        <>
          <div className="h-2 w-16 rounded-full bg-white/10" />
          <div className="mt-7 h-5 w-3/5 rounded bg-white/10" />
          <div className="mt-5 space-y-3">
            <div className="h-3 rounded bg-white/[0.055]" />
            <div className="h-3 w-5/6 rounded bg-white/[0.055]" />
            <div className="h-3 w-2/3 rounded bg-white/[0.055]" />
          </div>
          <p className="absolute bottom-5 text-xs text-slate-600">Awaiting analysis</p>
        </>
      )}
    </article>
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
  const [repoUrl, setRepoUrl] = useState("");
  const [selectedRole, setSelectedRole] = useState<(typeof roles)[number]>(roles[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mockResult, setMockResult] = useState<MockResult[] | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMockResult(null);

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(repoUrl.trim());
    } catch {
      setError("Enter a valid public GitHub repository URL.");
      return;
    }

    if (parsedUrl.hostname !== "github.com" && !parsedUrl.hostname.endsWith(".github.com")) {
      setError("The repository URL must be hosted on github.com.");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMockResult(sampleResults);
    setIsLoading(false);
  }

  const emptyCardTitles = [
    "Skill Evidence",
    "Opportunity Match",
    "Missing Gaps",
    "Recommended Portfolio Project",
    "Shareable Evidence Packet",
  ];

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
          <p className="px-2 pb-1 pt-3 text-xs text-slate-600">Public repositories only. No login required. Analysis is mocked in this prototype.</p>
        </form>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Your evidence layer</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">See capability, not connections.</h2></div>
          {mockResult && <span className="hidden text-xs text-slate-500 sm:block">Mock analysis for {selectedRole}</span>}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(mockResult ?? emptyCardTitles).map((item, index) => {
            const result = typeof item === "string" ? undefined : item;
            return <div key={typeof item === "string" ? item : item.title} className={index === 3 ? "lg:col-span-2" : ""}><ResultCard result={result} /></div>;
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mb-10 max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">How it works</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">From commits to credible signals.</h2></div>
        <div className="flex flex-col gap-4 md:flex-row">
          <FlowStep number="01" title="GitHub" text="Paste the public repository that best represents what you can build." />
          <FlowStep number="02" title="Evidence" text="Turn implementation choices and project structure into clear skill signals." />
          <FlowStep number="03" title="Opportunity" text="Connect those signals to a target role, expose gaps, and choose what to build next." />
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

      <footer className="relative z-10 border-t border-white/10 px-6 py-8"><div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-slate-600"><span className="flex items-center gap-2 text-slate-400"><Mark className="h-4 w-4" /> ProjectDNA</span><span>Built for Theme B5</span></div></footer>
    </main>
  );
}
