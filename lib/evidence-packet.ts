import type {
  AnalyzeSuccessResponse,
  DeterministicAnalysis,
  EvidencePacket,
  OpportunityAnalysis,
  PortfolioProjectRecommendation,
  SeedJob,
} from "@/types/project-dna";

interface EvidencePacketInput {
  repo: AnalyzeSuccessResponse["repo"];
  analysis: DeterministicAnalysis;
  opportunity: OpportunityAnalysis;
  portfolioProject: PortfolioProjectRecommendation;
  targetJob: SeedJob;
}

function joinList(items: string[], fallback: string): string {
  if (!items.length) return fallback;
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

export function generateEvidencePacket(input: EvidencePacketInput): EvidencePacket {
  const { repo, analysis, opportunity, portfolioProject, targetJob } = input;
  const target = opportunity.targetMatch;
  const topSkills = analysis.detectedSkills.slice(0, 5);
  const skillNames = topSkills.map((skill) => skill.skill);
  const lowConfidence = analysis.confidence < 40;
  const evidenceHighlights = [...new Set(topSkills.flatMap((skill) => skill.evidence.slice(0, 2)))].slice(0, 6);
  const criticalGaps = opportunity.gapAnalysis.criticalGaps;
  const improvementAreas = opportunity.gapAnalysis.improvementAreas.slice(0, 2);

  const confidenceContext = lowConfidence
    ? "Evidence confidence is low, so this packet should be treated as a limited view of the public work available."
    : `The deterministic analysis has ${analysis.confidence}% evidence confidence based on the public material inspected.`;
  const summary = `Public GitHub evidence from ${repo.fullName} shows ${skillNames.length ? joinList(skillNames.slice(0, 3), "limited identifiable skill evidence") : "limited identifiable skill evidence"}. Repo-derived evidence suggests a ${target.matchScore}% match for ${targetJob.title} with ${target.readinessLevel} readiness. ${confidenceContext}`;
  const recruiterPitch = skillNames.length
    ? `Public GitHub evidence shows practical ${joinList(skillNames.slice(0, 3), "project")} signals in ${repo.fullName}. Against the seeded ${targetJob.title} requirements, the repository reaches a ${target.matchScore}% deterministic match with ${target.evidenceStrength}% matched-evidence strength.`
    : `The public repository ${repo.fullName} currently provides too little inspectable evidence for a confident ${targetJob.title} readiness assessment. The result is a ${target.matchScore}% deterministic match and should be read as an evidence gap, not a judgment of capability.`;
  const opportunityFit = `Repo-derived evidence suggests ${target.readinessLevel} readiness for ${targetJob.title}. ${target.explanation}`;
  const gapNarrative = criticalGaps.length
    ? `The clearest required-skill gaps are ${joinList(criticalGaps.slice(0, 4), "none identified")}. ${improvementAreas.join(" ")}`
    : `No critical required-skill gaps were detected in the available evidence. ${improvementAreas.join(" ") || "The next priority is deeper, measurable differentiation."}`;
  const recommendedNextBuild = `${portfolioProject.title}: ${portfolioProject.whyThisProject}`;

  const strongestSkill = topSkills[0];
  const proofPoints = [
    { label: "Target opportunity", value: `${target.matchScore}% ${target.readinessLevel}`, evidence: target.explanation },
    { label: "Evidence confidence", value: `${analysis.confidence}%`, evidence: lowConfidence ? "The available public repository content is too limited for a confident assessment." : `${analysis.detectedSkills.length} skills were supported by public repository signals.` },
    { label: "Primary domain", value: analysis.domainClassification.primaryDomain, evidence: analysis.domainClassification.reasons[0] ?? "Domain is derived from the strongest detected skill categories." },
    { label: "Project complexity", value: `${analysis.projectComplexity.level} / ${analysis.projectComplexity.score}`, evidence: analysis.projectComplexity.reasons[0] ?? "Complexity is calculated from public repository structure and evidence breadth." },
    ...(strongestSkill ? [{ label: "Strongest skill signal", value: `${strongestSkill.skill} / ${strongestSkill.confidence}%`, evidence: strongestSkill.evidence[0] }] : []),
  ];

  const credibilityNotes = [
    "This packet is based only on public GitHub metadata, README content, file paths, manifests, and selected code snippets.",
    "Skill, match, and complexity scores are produced by deterministic local rules rather than an AI model or recruiter review.",
    "A missing signal means evidence was not found in the inspected public material; it does not prove the student lacks that capability.",
    "Repository evidence supports the statements shown here, but ProjectDNA does not independently verify authorship or production outcomes.",
    ...(lowConfidence ? ["Low evidence confidence: this repository may not contain enough public work to assess readiness reliably."] : []),
  ];

  return {
    headline: `${repo.fullName}: Evidence for ${targetJob.title}`,
    summary,
    recruiterPitch,
    evidenceHighlights,
    opportunityFit,
    gapNarrative,
    recommendedNextBuild,
    proofPoints,
    credibilityNotes,
  };
}
