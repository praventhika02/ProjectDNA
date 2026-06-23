import type {
  DeterministicAnalysis,
  GapAnalysis,
  OpportunityImprovement,
  OpportunityMatch,
  OpportunitySimulation,
  PortfolioProjectRecommendation,
  ProjectComplexity,
  QualitySignal,
  RecruiterView,
  SeedJob,
  SkillEvidence,
  TalentOverlookedMeter,
} from "@/types/project-dna";

interface OpportunitySimulationInput {
  currentMatch: OpportunityMatch;
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
  qualitySignals: QualitySignal[];
  portfolioProject: PortfolioProjectRecommendation;
}

interface OpportunityGapInput {
  detectedSkills: SkillEvidence[];
  currentMatch: OpportunityMatch;
  qualitySignals: QualitySignal[];
  projectComplexity: ProjectComplexity;
}

interface RecruiterViewInput {
  analysis: DeterministicAnalysis;
  targetMatch: OpportunityMatch;
  gapAnalysis: GapAnalysis;
  portfolioProject: PortfolioProjectRecommendation;
  targetJob: SeedJob;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#]+/g, " ").trim();
}

function includesAny(value: string, patterns: RegExp[]): boolean {
  const normalized = normalize(value);
  return patterns.some((pattern) => pattern.test(normalized));
}

function qualityScore(qualitySignals: QualitySignal[], name: RegExp): number {
  return qualitySignals.find((signal) => name.test(normalize(signal.signal)))?.score ?? 0;
}

function skillGain(skill: string, required: boolean): number {
  if (includesAny(skill, [/docker/])) return required ? 12 : 8;
  if (includesAny(skill, [/test|jest|pytest|playwright|cypress|automated/])) return required ? 10 : 8;
  if (includesAny(skill, [/ci cd|github actions|deploy|cloud|vercel|render/])) return required ? 9 : 7;
  if (includesAny(skill, [/sql|postgres|mysql|database|mongo|prisma|supabase/])) return required ? 10 : 7;
  if (includesAny(skill, [/machine learning|ml|model|pytorch|tensorflow|scikit/])) return required ? 12 : 8;
  if (includesAny(skill, [/react|next|frontend|accessib|ux|tailwind/])) return required ? 9 : 6;
  if (includesAny(skill, [/api|rest|node|express|backend/])) return required ? 9 : 6;
  if (includesAny(skill, [/analytics|visualization|dashboard|statistics|etl/])) return required ? 9 : 6;
  if (includesAny(skill, [/documentation|communication|readme|git/])) return required ? 6 : 4;
  return required ? 7 : 4;
}

function improvementForGap(skill: string, required: boolean): OpportunityImprovement {
  return {
    action: `Add public evidence for ${skill}`,
    scoreGain: skillGain(skill, required),
    category: required ? "required_skill" : "preferred_skill",
  };
}

function dedupeImprovements(improvements: OpportunityImprovement[]): OpportunityImprovement[] {
  const seen = new Set<string>();
  return improvements.filter((improvement) => {
    const key = normalize(improvement.action);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function simulateOpportunityGrowth(input: OpportunitySimulationInput): OpportunitySimulation {
  const evidenceLimited = input.currentMatch.matchScore < 15;
  const scale = evidenceLimited ? 0.25 : input.currentMatch.matchScore >= 75 ? 0.45 : input.currentMatch.matchScore >= 55 ? 0.8 : 0.65;
  const required = input.missingRequiredSkills.slice(0, evidenceLimited ? 1 : 4).map((skill) => improvementForGap(skill, true));
  const preferred = input.missingPreferredSkills.slice(0, evidenceLimited ? 1 : 3).map((skill) => improvementForGap(skill, false));
  const quality: OpportunityImprovement[] = [];

  const documentation = qualityScore(input.qualitySignals, /documentation/);
  const testing = qualityScore(input.qualitySignals, /testing/);
  const deployment = qualityScore(input.qualitySignals, /deployment/);
  const apiDesign = qualityScore(input.qualitySignals, /api/);

  if (documentation > 0 && documentation < 75) quality.push({ action: "Strengthen README, setup guide, screenshots, and architecture notes", scoreGain: 4, category: "quality" });
  if (testing < 60) quality.push({ action: "Add automated tests for core success and failure paths", scoreGain: 8, category: "quality" });
  if (deployment < 70) quality.push({ action: "Add deployment evidence and a reproducible CI/CD workflow", scoreGain: 6, category: "quality" });
  if (apiDesign > 0 && apiDesign < 65) quality.push({ action: "Make API contracts and error responses easier to inspect", scoreGain: 5, category: "quality" });

  const projectGain = input.currentMatch.matchScore >= 75 ? 8 : evidenceLimited ? 4 : 18;
  const projectAction = `Complete recommended project: ${input.portfolioProject.title}`;
  const improvements = dedupeImprovements([...required, ...preferred, ...quality, { action: projectAction, scoreGain: projectGain, category: "portfolio_project" }])
    .map((improvement) => ({ ...improvement, scoreGain: Math.max(1, Math.round(improvement.scoreGain * scale)) }))
    .sort((a, b) => b.scoreGain - a.scoreGain)
    .slice(0, evidenceLimited ? 5 : 8);
  const unlockable = improvements.reduce((sum, improvement) => sum + improvement.scoreGain, 0);

  return {
    currentScore: input.currentMatch.matchScore,
    projectedScore: Math.min(95, input.currentMatch.matchScore + unlockable),
    improvements,
  };
}

export function calculateOpportunityGap(input: OpportunityGapInput): TalentOverlookedMeter {
  const skillEvidenceScore = input.detectedSkills.length
    ? input.detectedSkills.reduce((sum, skill) => sum + skill.confidence * 0.65 + skill.proficiency * 7, 0) / input.detectedSkills.length
    : 0;
  const averageQuality = input.qualitySignals.length ? input.qualitySignals.reduce((sum, signal) => sum + signal.score, 0) / input.qualitySignals.length : 0;
  const evidenceBreadthBonus = Math.min(12, input.detectedSkills.length * 1.4) + (input.projectComplexity.level === "advanced" ? 4 : 0);
  const capabilityScore = clamp(skillEvidenceScore * 0.35 + input.currentMatch.evidenceStrength * 0.25 + input.projectComplexity.score * 0.2 + averageQuality * 0.2 + evidenceBreadthBonus);

  const documentation = qualityScore(input.qualitySignals, /documentation/);
  const deployment = qualityScore(input.qualitySignals, /deployment/);
  const structure = qualityScore(input.qualitySignals, /project structure/);
  const testing = qualityScore(input.qualitySignals, /testing/);
  const presentation = input.detectedSkills.some((skill) => skill.skill === "README documentation") ? 80 : documentation;
  const visibilityScore = clamp(documentation * 0.25 + deployment * 0.35 + presentation * 0.1 + structure * 0.1 + testing * 0.05);
  const rawOpportunityGap = capabilityScore < 15 && visibilityScore < 15 ? 0 : capabilityScore - visibilityScore;
  const opportunityGap = rawOpportunityGap;
  const classification: TalentOverlookedMeter["classification"] = opportunityGap > 25
    ? "Highly Overlooked"
    : opportunityGap > 10
      ? "Undervalued"
      : opportunityGap >= 0
        ? "Well Represented"
        : "Highly Visible";
  const explanation = opportunityGap > 10
    ? "Your technical evidence exceeds your current visibility. The next unlock is making proof easier for reviewers to see quickly."
    : opportunityGap >= 0
      ? "Your visibility mostly reflects your demonstrated capability, with some room to package the evidence more clearly."
      : "Your visibility already reflects or slightly exceeds the demonstrated capability in this public repository.";

  return { capabilityScore, visibilityScore, opportunityGap: Math.round(opportunityGap), classification, explanation };
}

function topicFromSkill(skill: string): string {
  if (includesAny(skill, [/api|rest|express|node|backend/])) return "API architecture";
  if (includesAny(skill, [/test|jest|pytest|playwright|cypress/])) return "Testing strategy";
  if (includesAny(skill, [/docker|deploy|ci cd|github actions/])) return "Deployment and release workflow";
  if (includesAny(skill, [/sql|database|postgres|mysql|mongo/])) return "Data modeling";
  if (includesAny(skill, [/machine learning|model|pytorch|tensorflow|scikit/])) return "Model evaluation";
  if (includesAny(skill, [/react|next|frontend|component/])) return "Frontend architecture";
  if (includesAny(skill, [/analytics|dashboard|visualization/])) return "Metrics and insight design";
  return `${skill} implementation choices`;
}

export function generateRecruiterView(input: RecruiterViewInput): RecruiterView {
  const domain = input.analysis.domainClassification.primaryDomain;
  const capabilitySummary = input.targetMatch.matchedSkills.length
    ? `${input.targetMatch.readinessLevel === "high" ? "High" : input.targetMatch.readinessLevel === "strong" ? "Strong" : "Emerging"} ${domain.toLowerCase()} evidence for ${input.targetJob.title}, supported by ${input.targetMatch.matchedSkills.length} matched role requirement${input.targetMatch.matchedSkills.length === 1 ? "" : "s"}.`
    : `Limited public evidence for ${input.targetJob.title}; current repository does not yet show the core role requirements.`;
  const strongestEvidence = input.gapAnalysis.strongestEvidence.length
    ? input.gapAnalysis.strongestEvidence.slice(0, 5)
    : input.analysis.detectedSkills.flatMap((skill) => skill.evidence.slice(0, 1)).slice(0, 3);
  const interviewTopics = [...new Set(input.targetMatch.matchedSkills.slice(0, 4).map((skill) => topicFromSkill(skill.matchedRepoSkill)))];
  for (const gap of input.gapAnalysis.criticalGaps.slice(0, 3)) {
    const topic = topicFromSkill(gap);
    if (!interviewTopics.includes(topic)) interviewTopics.push(topic);
  }
  const riskAreas = input.gapAnalysis.criticalGaps.length
    ? input.gapAnalysis.criticalGaps.slice(0, 4).map((gap) => `Missing public evidence for ${gap}`)
    : input.gapAnalysis.improvementAreas.slice(0, 4);
  if (!riskAreas.length && input.analysis.confidence < 40) riskAreas.push("Low public evidence confidence");
  const hiringRecommendation = input.targetMatch.matchScore >= 75
    ? "Proceed to technical interview; use the interview to validate depth and ownership."
    : input.targetMatch.matchScore >= 55
      ? "Proceed to focused technical screen; probe the missing signals and project ownership."
      : input.targetMatch.matchScore >= 35
        ? "Consider for early internship screen if the candidate can explain the recommended build plan."
        : "Do not advance based on this repository alone; request stronger public evidence or a targeted project.";

  return {
    capabilitySummary,
    strongestEvidence,
    interviewTopics: interviewTopics.slice(0, 5),
    riskAreas: riskAreas.slice(0, 5),
    hiringRecommendation,
  };
}
