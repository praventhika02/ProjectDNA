import type {
  DomainClassification,
  GapAnalysis,
  MatchedSkill,
  OpportunityAnalysis,
  OpportunityMatch,
  ProjectComplexity,
  QualitySignal,
  SeedJob,
  SkillEvidence,
} from "@/types/project-dna";

interface MatcherInput {
  detectedSkills: SkillEvidence[];
  qualitySignals: QualitySignal[];
  projectComplexity: ProjectComplexity;
  domainClassification: DomainClassification;
  targetRole: SeedJob;
  allJobs: SeedJob[];
}

interface CandidateMatch {
  skill: SkillEvidence;
  quality: number;
}

const aliases: Record<string, string[]> = {
  javascript: ["javascript", "js"],
  typescript: ["typescript", "ts"],
  react: ["react", "reactjs"],
  nextjs: ["next", "nextjs"],
  nodejs: ["node", "nodejs"],
  "rest api": ["rest", "rest api", "rest apis", "restful api", "api routes"],
  "machine learning": ["machine learning", "ml", "artificial intelligence", "ai"],
  postgresql: ["postgresql", "postgres"],
  "ci cd": ["ci cd", "github actions", "deployment", "devops"],
  testing: ["testing", "unit testing", "automated testing", "jest", "pytest", "playwright", "cypress"],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/\.js\b/g, "js").replace(/[^a-z0-9+#]+/g, " ").trim().replace(/\s+/g, " ");
}

function canonical(value: string): string {
  const normalized = normalize(value);
  for (const [key, values] of Object.entries(aliases)) {
    if (values.includes(normalized)) return key;
  }
  return normalized;
}

function splitRequirement(requirement: string): string[] {
  return requirement.split(/\s+or\s+|,\s*(?:or\s+)?/i).map((part) => part.trim()).filter(Boolean);
}

function specialMatch(requirement: string, skill: SkillEvidence): number {
  const req = normalize(requirement);
  const repoSkill = canonical(skill.skill);
  if (req === "one backend language") {
    return skill.category === "language" && ["javascript", "typescript", "python", "java", "c#", "go", "rust"].includes(repoSkill) ? 0.9 : 0;
  }
  if (req === "machine learning fundamentals") return skill.category === "ai_ml" ? 0.8 : 0;
  if (req === "automated testing" || req === "testing") return skill.category === "testing" ? 0.9 : 0;
  if (req === "api integration") return skill.category === "backend" && ["rest api", "api routes", "express", "fastapi", "flask"].includes(repoSkill) ? 0.8 : 0;
  if (req === "rest apis" && ["express", "fastapi", "flask"].includes(repoSkill)) return 0.75;
  if (req === "cloud fundamentals" && skill.category === "devops") return 0.65;
  if (req === "web accessibility" && skill.skill === "UX flow") return 0.6;
  if (req === "product thinking" && skill.category === "product") return 0.7;
  if (req === "analytics instrumentation" && skill.skill === "Analytics") return 0.9;
  if (req === "clear communication" && skill.skill === "README documentation") return 0.5;
  return 0;
}

function matchQuality(requirement: string, skill: SkillEvidence): number {
  const candidates = splitRequirement(requirement);
  let best = specialMatch(requirement, skill);
  for (const candidate of candidates) {
    const required = canonical(candidate);
    const detected = canonical(skill.skill);
    if (required === detected) best = Math.max(best, 1);
    else if (required.length >= 4 && detected.length >= 4 && (required.includes(detected) || detected.includes(required))) best = Math.max(best, 0.8);
    best = Math.max(best, specialMatch(candidate, skill));
  }
  return best;
}

function findBestMatch(requirement: string, skills: SkillEvidence[]): CandidateMatch | null {
  let best: CandidateMatch | null = null;
  for (const skill of skills) {
    const quality = matchQuality(requirement, skill);
    if (!best || quality > best.quality || (quality === best.quality && skill.confidence > best.skill.confidence)) best = { skill, quality };
  }
  return best && best.quality >= 0.5 ? best : null;
}

function evidenceScore(match: CandidateMatch): number {
  const base = match.skill.confidence * 0.62 + match.skill.proficiency * 20 * 0.38;
  const breadth = Math.min(match.skill.evidence.length - 1, 3) * 2 + Math.min(match.skill.sourceFiles.length, 4) * 1.5;
  return Math.min(100, Math.round((base + Math.max(0, breadth)) * match.quality));
}

function matchRequirements(requirements: string[], skills: SkillEvidence[]) {
  const matched: MatchedSkill[] = [];
  const missing: string[] = [];
  const coverage: number[] = [];
  for (const requirement of requirements) {
    const candidate = findBestMatch(requirement, skills);
    if (!candidate) {
      missing.push(requirement);
      coverage.push(0);
      continue;
    }
    coverage.push(candidate.quality * 100);
    matched.push({
      jobSkill: requirement,
      matchedRepoSkill: candidate.skill.skill,
      strength: evidenceScore(candidate),
      evidence: candidate.skill.evidence,
      sourceFiles: candidate.skill.sourceFiles,
    });
  }
  return { matched, missing, coverage: coverage.length ? coverage.reduce((sum, score) => sum + score, 0) / coverage.length : 0 };
}

function expectedDomains(job: SeedJob): DomainClassification["primaryDomain"][] {
  const roleSignals = normalize(`${job.title} ${job.keywords.join(" ")}`);
  if (roleSignals.includes("ai engineer") || roleSignals.includes("machine learning")) return ["AI/ML"];
  if (roleSignals.includes("data analyst") || roleSignals.includes("visualization insights")) return ["Data Analytics"];
  if (roleSignals.includes("frontend")) return ["Frontend"];
  if (roleSignals.includes("backend")) return ["Backend"];
  if (roleSignals.includes("product engineer") || roleSignals.includes("full stack")) return ["Product Engineering", "Full Stack"];
  return [];
}

function domainScore(job: SeedJob, domain: DomainClassification): number {
  const expected = expectedDomains(job);
  if (expected.includes(domain.primaryDomain)) return 100;
  if (domain.secondaryDomains.some((item) => expected.includes(item as DomainClassification["primaryDomain"]))) return 75;
  if (domain.primaryDomain === "Full Stack" && expected.some((item) => item === "Frontend" || item === "Backend" || item === "Product Engineering")) return 85;
  if (expected.includes("Product Engineering") && ["Frontend", "Backend"].includes(domain.primaryDomain)) return 65;
  if (domain.primaryDomain === "Unknown") return 10;
  return 20;
}

function complexityScore(complexity: ProjectComplexity): number {
  if (complexity.level === "advanced") return 100;
  if (complexity.level === "intermediate") return 75;
  return Math.max(40, Math.round(40 + complexity.score * 0.5));
}

function readiness(score: number): OpportunityMatch["readinessLevel"] {
  if (score >= 75) return "high";
  if (score >= 55) return "strong";
  if (score >= 35) return "emerging";
  return "low";
}

function scoreJob(job: SeedJob, input: MatcherInput): OpportunityMatch {
  const required = matchRequirements(job.requiredSkills, input.detectedSkills);
  const preferred = matchRequirements(job.preferredSkills, input.detectedSkills);
  const allMatched = [...required.matched, ...preferred.matched];
  const uniqueMatches = [...new Map(allMatched.map((match) => [`${match.jobSkill}:${match.matchedRepoSkill}`, match])).values()];
  const evidenceStrength = uniqueMatches.length ? Math.round(uniqueMatches.reduce((sum, match) => sum + match.strength, 0) / uniqueMatches.length) : 0;
  const alignment = domainScore(job, input.domainClassification);
  const complexity = complexityScore(input.projectComplexity);
  const matchScore = Math.round(required.coverage * 0.45 + preferred.coverage * 0.2 + evidenceStrength * 0.2 + alignment * 0.1 + complexity * 0.05);
  const explanation = `${Math.round(required.coverage)}% required-skill coverage and ${Math.round(preferred.coverage)}% preferred-skill coverage, supported by ${evidenceStrength}% evidence strength. Domain alignment is ${alignment}%.`;
  return {
    jobId: job.id,
    title: job.title,
    company: job.company,
    matchScore,
    readinessLevel: readiness(matchScore),
    matchedSkills: uniqueMatches.sort((a, b) => b.strength - a.strength),
    missingRequiredSkills: required.missing,
    missingPreferredSkills: preferred.missing,
    evidenceStrength,
    explanation,
  };
}

function buildGapAnalysis(target: OpportunityMatch, alternatives: OpportunityMatch[], input: MatcherInput): GapAnalysis {
  const strongestEvidence = [...new Set(target.matchedSkills.flatMap((skill) => skill.evidence.slice(0, 2)))].slice(0, 5);
  const criticalGaps = target.missingRequiredSkills.slice(0, 5);
  const improvementAreas = input.qualitySignals
    .filter((signal) => signal.score < 60)
    .sort((a, b) => a.score - b.score)
    .map((signal) => `${signal.signal} is weak (${signal.score}/100): ${signal.evidence[0]}`)
    .slice(0, 4);
  if (input.projectComplexity.level === "starter") improvementAreas.push(`Project complexity is starter-level (${input.projectComplexity.score}/100); broader implementation evidence would improve readiness.`);
  if (!improvementAreas.length) improvementAreas.push("Maintain the current evidence quality and make implementation outcomes more measurable.");

  const bestAlternative = alternatives[0];
  const selectedStillBest = target.readinessLevel === "strong" || target.readinessLevel === "high";
  const nextBestRole = selectedStillBest ? `${target.title} remains the best fit based on current evidence.` : bestAlternative?.title ?? target.title;
  const topSkills = target.matchedSkills.slice(0, 2).map((match) => match.matchedRepoSkill);
  const gapText = criticalGaps.slice(0, 2).join(" and ");
  const overallAdvice = topSkills.length
    ? `Your repository shows ${input.domainClassification.primaryDomain.toLowerCase()} evidence through ${topSkills.join(" and ")}, but the ${target.title} role still needs clearer evidence of ${gapText || "its remaining preferred capabilities"}.`
    : `The available repository evidence does not yet demonstrate the core requirements for ${target.title}. Start by adding a project that clearly shows ${gapText || target.missingPreferredSkills.slice(0, 2).join(" and ") || "the role's required skills"}.`;
  return { strongestEvidence, criticalGaps, improvementAreas: improvementAreas.slice(0, 5), nextBestRole, overallAdvice };
}

export function matchOpportunities(input: MatcherInput): OpportunityAnalysis {
  const targetMatch = scoreJob(input.targetRole, input);
  const alternativeMatches = input.allJobs
    .filter((job) => job.id !== input.targetRole.id)
    .map((job) => scoreJob(job, input))
    .sort((a, b) => b.matchScore - a.matchScore || a.title.localeCompare(b.title));
  return { targetMatch, alternativeMatches, gapAnalysis: buildGapAnalysis(targetMatch, alternativeMatches, input) };
}
