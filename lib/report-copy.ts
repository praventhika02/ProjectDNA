import type { AnalyzeSuccessResponse } from "@/types/project-dna";

export interface ReadablePacket {
  headline: string;
  verdict: string;
  recruiterPitch: string;
  proofBullets: string[];
  riskBullets: string[];
  nextMove: string;
  differentiator: string;
  copyText: string;
}

function list(items: string[], fallback: string, max = 3): string {
  const selected = items.filter(Boolean).slice(0, max);
  if (!selected.length) return fallback;
  if (selected.length === 1) return selected[0];
  return `${selected.slice(0, -1).join(", ")} and ${selected.at(-1)}`;
}

function readinessLabel(score: number): string {
  if (score >= 80) return "Strong role signal";
  if (score >= 60) return "Promising role signal";
  if (score >= 35) return "Emerging signal";
  return "Early evidence";
}

export function buildReadablePacket(report: AnalyzeSuccessResponse): ReadablePacket {
  const target = report.opportunity.targetMatch;
  const topSkills = report.analysis.detectedSkills
    .slice()
    .sort((a, b) => b.confidence - a.confidence || b.proficiency - a.proficiency)
    .slice(0, 3);
  const topSkillNames = topSkills.map((skill) => skill.skill);
  const missing = [...target.missingRequiredSkills, ...target.missingPreferredSkills].slice(0, 3);
  const matched = target.matchedSkills.slice(0, 3);
  const strongestEvidence = report.opportunity.gapAnalysis.strongestEvidence.slice(0, 2);
  const scoreLabel = readinessLabel(target.matchScore);
  const skillText = list(topSkillNames, "inspectable engineering evidence");
  const missingText = list(missing, "more measurable public proof");

  const headline = `${report.repo.name} → ${report.targetJob.title}`;
  const verdict = `${scoreLabel}: ${target.matchScore}% match with visible ${skillText} evidence.`;
  const recruiterPitch = `${report.repo.fullName} shows ${skillText}. ProjectDNA maps that repo evidence to ${matched.length}/${report.targetJob.requiredSkills.length} core role requirements, with the next build focused on ${missingText}.`;
  const nextMove = `${report.portfolioProject.title}: build this to add ${missingText}.`;
  const differentiator = "ProjectDNA is not a resume summary. It shows what the repo proves, what is missing, and the next artifact to build.";

  const proofBullets = [
    topSkillNames.length ? `Strongest signals: ${skillText}.` : "Limited public skill signals found.",
    matched.length ? `Matched requirements: ${list(matched.map((item) => item.jobSkill), "none found")}.` : "No clear requirement matches found.",
    strongestEvidence[0] ?? `${report.analysis.detectedSkills.length} skills were detected from public repo signals.`,
  ].slice(0, 3);

  const riskBullets = missing.length
    ? missing.map((gap) => `Missing public proof: ${gap}.`)
    : ["No major required-skill gap found; next step is differentiation."];

  const copyText = [
    verdict,
    `Proof: ${proofBullets.join(" ")}`,
    `Gap: ${riskBullets[0]}`,
    `Next build: ${nextMove}`,
  ].join("\n");

  return {
    headline,
    verdict,
    recruiterPitch,
    proofBullets,
    riskBullets: riskBullets.slice(0, 3),
    nextMove,
    differentiator,
    copyText,
  };
}
