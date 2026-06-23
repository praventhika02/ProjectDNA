"use client";

import Link from "next/link";
import type { EvidencePacketProofPoint } from "@/types/project-dna";

interface RecruiterPacketProps {
  pitch: string;
  proofPoints: EvidencePacketProofPoint[];
  gaps: string[];
  copied: boolean;
  copyError: string;
  onCopy: () => void;
}

export function RecruiterPacket({ pitch, proofPoints, gaps, copied, copyError, onCopy }: RecruiterPacketProps) {
  return (
    <section id="packet" className="scroll-mt-24">
      <div className="mb-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-200">Recruiter packet</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-50 md:text-3xl">Ready-to-send proof.</h2>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        {copyError && <p className="mb-3 text-sm text-red-300">{copyError}</p>}
        <blockquote className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-lg leading-7 text-slate-100">{pitch}</blockquote>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Column title="Top proof" items={proofPoints.slice(0, 3).map((point) => `${point.value}: ${point.evidence}`)} tone="proof" />
          <Column title="Top risks" items={gaps.slice(0, 3)} tone="risk" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onCopy} className="rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-300 hover:to-violet-400">{copied ? "Copied" : "Copy summary"}</button>
          <Link href="/report/latest" className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/[0.10]">View full report</Link>
        </div>
      </div>
    </section>
  );
}

function Column({ title, items, tone }: { title: string; items: string[]; tone: "proof" | "risk" }) {
  const toneClass = tone === "proof" ? "border-emerald-300/20 bg-emerald-300/10" : "border-amber-300/20 bg-amber-300/10";
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? items.map((item) => <p key={item} className={`rounded-2xl border p-3 text-sm text-slate-300 ${toneClass}`}>{item}</p>) : <p className="text-sm text-slate-400">None found.</p>}
      </div>
    </div>
  );
}
