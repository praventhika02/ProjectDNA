"use client";

import type { FormEvent } from "react";

interface DemoTile {
  id: string;
  label: string;
  description: string;
  score: string;
}

interface ScanStudioProps {
  repoUrl: string;
  selectedRole: string;
  roles: readonly string[];
  isLoading: boolean;
  error: string;
  loadingLabel: string;
  progress: number;
  demos: DemoTile[];
  onRepoUrlChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDemo: (index: number) => void;
}

export function ScanStudio({ repoUrl, selectedRole, roles, isLoading, error, loadingLabel, progress, demos, onRepoUrlChange, onRoleChange, onSubmit, onDemo }: ScanStudioProps) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-[#081126]/80 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <span className="font-mono text-xs text-slate-400">Scan Studio</span>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-slate-400">GitHub repo</span>
          <input value={repoUrl} onChange={(event) => onRepoUrlChange(event.target.value)} disabled={isLoading} type="url" placeholder="https://github.com/you/project" className="h-12 rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-sm text-slate-50 outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20" />
        </label>
        <label className="grid gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-slate-400">Target role</span>
          <select value={selectedRole} onChange={(event) => onRoleChange(event.target.value)} disabled={isLoading} className="h-12 rounded-2xl border border-white/10 bg-white/[0.08] px-4 text-sm text-slate-50 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20">
            {roles.map((role) => <option key={role}>{role}</option>)}
          </select>
        </label>
        <button disabled={isLoading} className="mt-1 h-12 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-sm font-semibold text-white shadow-lg shadow-cyan-950/40 hover:from-cyan-300 hover:to-violet-400 disabled:cursor-wait disabled:opacity-60">
          {isLoading ? "Scanning..." : "Scan my ProjectDNA"}
        </button>
      </form>
      <p className="mt-3 font-mono text-xs text-slate-500">Live scan uses public GitHub data.</p>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {isLoading && (
        <div className="mt-4">
          <div className="mb-2 flex justify-between font-mono text-xs text-slate-400"><span>{loadingLabel}</span><span>{progress}%</span></div>
          <div className="h-2 rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      )}
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {demos.map((demo, index) => (
          <button key={demo.id} type="button" disabled={isLoading} onClick={() => onDemo(index)} className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-left hover:bg-white/[0.09] disabled:opacity-60">
            <span className="block text-sm font-semibold text-slate-100">{demo.label}</span>
            <span className="mt-1 block font-mono text-xs text-cyan-200">{demo.score}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
