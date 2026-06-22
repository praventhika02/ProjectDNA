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
  };
  targetJob: SeedJob;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
}

export type AnalyzeResponse = AnalyzeSuccessResponse | AnalyzeErrorResponse;
