export interface SeedJob {
  id: string;
  title: string;
  company: string;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  keywords: string[];
}

export interface RepoFileEvidence {
  path: string;
  language: string;
  size: number;
  contentPreview: string;
}

export type SkillCategory = "language" | "framework" | "database" | "ai_ml" | "testing" | "devops" | "frontend" | "backend" | "data" | "product" | "other";

export interface SkillEvidence {
  skill: string;
  category: SkillCategory;
  proficiency: number;
  confidence: number;
  evidence: string[];
  sourceFiles: string[];
  reasoning: string;
}

export interface QualitySignal {
  signal: string;
  score: number;
  evidence: string[];
  sourceFiles: string[];
}

export interface ProjectComplexity {
  level: "starter" | "intermediate" | "advanced";
  score: number;
  reasons: string[];
}

export interface DomainClassification {
  primaryDomain: "AI/ML" | "Data Analytics" | "Frontend" | "Backend" | "Full Stack" | "Product Engineering" | "Unknown";
  secondaryDomains: string[];
  reasons: string[];
}

export interface DeterministicAnalysis {
  detectedSkills: SkillEvidence[];
  qualitySignals: QualitySignal[];
  projectComplexity: ProjectComplexity;
  domainClassification: DomainClassification;
  confidence: number;
}

export interface MatchedSkill {
  jobSkill: string;
  matchedRepoSkill: string;
  strength: number;
  evidence: string[];
  sourceFiles: string[];
}

export interface OpportunityMatch {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  readinessLevel: "low" | "emerging" | "strong" | "high";
  matchedSkills: MatchedSkill[];
  missingRequiredSkills: string[];
  missingPreferredSkills: string[];
  evidenceStrength: number;
  explanation: string;
}

export interface GapAnalysis {
  strongestEvidence: string[];
  criticalGaps: string[];
  improvementAreas: string[];
  nextBestRole: string;
  overallAdvice: string;
}

export interface OpportunityAnalysis {
  targetMatch: OpportunityMatch;
  alternativeMatches: OpportunityMatch[];
  gapAnalysis: GapAnalysis;
}

export interface PortfolioProjectRecommendation {
  title: string;
  summary: string;
  whyThisProject: string;
  targetRole: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  skillsToProve: string[];
  gapsAddressed: string[];
  features: string[];
  technicalRequirements: string[];
  deliverables: string[];
  successCriteria: string[];
  stretchGoals: string[];
  portfolioPitch: string;
}

export interface EvidencePacketProofPoint {
  label: string;
  value: string;
  evidence: string;
}

export interface EvidencePacket {
  headline: string;
  summary: string;
  recruiterPitch: string;
  evidenceHighlights: string[];
  opportunityFit: string;
  gapNarrative: string;
  recommendedNextBuild: string;
  proofPoints: EvidencePacketProofPoint[];
  credibilityNotes: string[];
}

export interface AnalyzeSuccessResponse {
  success: true;
  analysisMode: "live" | "demo";
  generatedAt: string;
  repo: {
    owner: string;
    name: string;
    fullName: string;
    description: string | null;
    stars: number;
    forks: number;
    language: string | null;
    defaultBranch: string;
    url: string;
  };
  readmeSummaryInput: string;
  files: RepoFileEvidence[];
  fileTreeSummary: {
    totalFiles: number;
    selectedFiles: number;
    topExtensions: Array<{ extension: string; count: number }>;
    notablePaths: string[];
  };
  targetJob: SeedJob;
  analysis: DeterministicAnalysis;
  opportunity: OpportunityAnalysis;
  portfolioProject: PortfolioProjectRecommendation;
  evidencePacket: EvidencePacket;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;
