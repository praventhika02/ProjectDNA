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

export interface AnalyzeSuccessResponse {
  success: true;
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
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;
