"use client";

interface ScoreBridgeProps {
  currentScore: number;
  potentialScore: number;
  label?: string;
}

export function ScoreBridge({ currentScore, potentialScore, label = "unlock potential" }: ScoreBridgeProps) {
  const gain = Math.max(0, potentialScore - currentScore);
  const bridgeWidth = Math.max(8, Math.min(100, potentialScore));

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
      <div className="grid gap-5 md:grid-cols-[150px_1fr_150px] md:items-center">
        <ScoreOrb label="Current" score={currentScore} tone="cyan" />
        <div>
          <div className="mb-3 flex items-center justify-between font-mono text-xs text-slate-400">
            <span>{label}</span>
            <span className="text-cyan-200">+{gain}</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-white/[0.08] ring-1 ring-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400 shadow-[0_0_24px_rgba(34,211,238,0.45)] transition-all duration-500"
              style={{ width: `${bridgeWidth}%` }}
            />
          </div>
        </div>
        <ScoreOrb label="Potential" score={potentialScore} tone="emerald" />
      </div>
    </div>
  );
}

function ScoreOrb({ label, score, tone }: { label: string; score: number; tone: "cyan" | "emerald" }) {
  const color = tone === "cyan" ? "#22D3EE" : "#34D399";
  return (
    <div className="mx-auto text-center">
      <div
        className="flex h-32 w-32 items-center justify-center rounded-full p-1 shadow-[0_0_32px_rgba(34,211,238,0.18)]"
        style={{ background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.10) 0deg)` }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#0B1226]">
          <span className="text-3xl font-semibold text-slate-50">{score}%</span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
        </div>
      </div>
    </div>
  );
}
