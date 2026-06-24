import { seedJobs } from "@/data/seed-jobs";
import { generateEvidencePacket } from "@/lib/evidence-packet";
import { matchOpportunities } from "@/lib/opportunity-matcher";
import { generatePortfolioProject } from "@/lib/project-generator";
import type { AnalyzeSuccessResponse, DeterministicAnalysis, QualitySignal, RepoFileEvidence, SeedJob, SkillCategory, SkillEvidence } from "@/types/project-dna";

const DEMO_GENERATED_AT = "2026-06-22T12:00:00.000Z";

export type DemoScenarioId = "express-backend" | "nextjs-frontend" | "hello-world-product";

export interface DemoScenario {
  id: DemoScenarioId;
  label: string;
  description: string;
  result: AnalyzeSuccessResponse;
}

function getJob(title: string): SeedJob {
  const job = seedJobs.find((item) => item.title === title);
  if (!job) throw new Error(`Missing demo job: ${title}`);
  return job;
}

function skill(skillName: string, category: SkillCategory, confidence: number, proficiency: number, evidence: string[], sourceFiles: string[]): SkillEvidence {
  return {
    skill: skillName,
    category,
    confidence,
    proficiency,
    evidence,
    sourceFiles,
    reasoning: proficiency >= 4 ? "Evidence appears across several files or strong project structures." : "Multiple repository signals support practical usage.",
  };
}

function quality(signal: string, score: number, evidence: string, sourceFiles: string[] = []): QualitySignal {
  return { signal, score, evidence: [evidence], sourceFiles };
}

function file(path: string, language: string): RepoFileEvidence {
  return { path, language, size: 0, contentPreview: "" };
}

function createSnapshot(input: {
  repo: AnalyzeSuccessResponse["repo"];
  targetJob: SeedJob;
  analysis: DeterministicAnalysis;
  files: RepoFileEvidence[];
  totalFiles: number;
  topExtensions: Array<{ extension: string; count: number }>;
  notablePaths: string[];
}): AnalyzeSuccessResponse {
  const opportunity = matchOpportunities({
    detectedSkills: input.analysis.detectedSkills,
    qualitySignals: input.analysis.qualitySignals,
    projectComplexity: input.analysis.projectComplexity,
    domainClassification: input.analysis.domainClassification,
    targetRole: input.targetJob,
    allJobs: seedJobs,
  });
  const portfolioProject = generatePortfolioProject({
    targetJob: input.targetJob,
    targetMatch: opportunity.targetMatch,
    gapAnalysis: opportunity.gapAnalysis,
    detectedSkills: input.analysis.detectedSkills,
    qualitySignals: input.analysis.qualitySignals,
    projectComplexity: input.analysis.projectComplexity,
    domainClassification: input.analysis.domainClassification,
  });
  const evidencePacket = generateEvidencePacket({ repo: input.repo, analysis: input.analysis, opportunity, portfolioProject, targetJob: input.targetJob });
  return {
    success: true,
    analysisMode: "demo",
    generatedAt: DEMO_GENERATED_AT,
    repo: input.repo,
    readmeSummaryInput: "",
    files: input.files,
    fileTreeSummary: { totalFiles: input.totalFiles, selectedFiles: input.files.length, topExtensions: input.topExtensions, notablePaths: input.notablePaths },
    targetJob: input.targetJob,
    analysis: input.analysis,
    opportunity,
    portfolioProject,
    evidencePacket,
  };
}

const expressFiles = [
  file("index.js", "JavaScript"),
  file("lib/application.js", "JavaScript"),
  file("lib/express.js", "JavaScript"),
  file("lib/request.js", "JavaScript"),
  file("lib/response.js", "JavaScript"),
  file("test/app.js", "JavaScript"),
  file(".github/workflows/ci.yml", "YAML"),
  file("Readme.md", "Markdown"),
];

const expressAnalysis: DeterministicAnalysis = {
  detectedSkills: [
    skill("JavaScript", "language", 88, 4, ["GitHub identifies JavaScript as the repository's primary language", "Found 155 .js files in the analyzable tree"], ["index.js", "lib/application.js", "lib/express.js"]),
    skill("Express", "backend", 84, 4, ["lib/express.js contains Express implementation patterns", "Found Express-related paths under lib/"], ["lib/express.js", "lib/application.js"]),
    skill("Node.js", "backend", 76, 3, ["Public README mentions Node.js", "index.js uses Node.js module patterns"], ["Readme.md", "index.js"]),
    skill("REST API", "backend", 79, 3, ["Route and HTTP handling structures appear in selected Express source files"], ["lib/application.js", "lib/request.js", "lib/response.js"]),
    skill("Unit testing", "testing", 82, 4, ["Found test-related paths and executable test structures"], ["test/app.js"]),
    skill("GitHub Actions", "devops", 74, 3, ["Found GitHub Actions workflow paths"], [".github/workflows/ci.yml"]),
    skill("CI/CD", "devops", 72, 3, ["Found CI workflow configuration under .github/workflows"], [".github/workflows/ci.yml"]),
    skill("README documentation", "product", 68, 3, ["README contains structured public project documentation"], ["Readme.md"]),
  ],
  qualitySignals: [
    quality("Documentation quality", 82, "README includes structured usage and setup guidance", ["Readme.md"]),
    quality("Project structure", 91, "Repository contains 213 files across organized lib, test, and workflow paths", ["lib/application.js", "test/app.js"]),
    quality("Error handling", 56, "Selected source includes explicit error propagation and response handling", ["lib/application.js", "lib/response.js"]),
    quality("API design", 88, "HTTP application and request/response abstractions are visible across selected source", ["lib/application.js", "lib/request.js"]),
    quality("Testing evidence", 92, "Test paths and testing structures are present", ["test/app.js"]),
    quality("Deployment readiness", 45, "CI workflow evidence exists, but containerized deployment evidence is limited", [".github/workflows/ci.yml"]),
  ],
  projectComplexity: { level: "advanced", score: 76, reasons: ["8 evidence files selected from 213 repository files", "Backend, testing, and DevOps signals span multiple project areas"] },
  domainClassification: { primaryDomain: "Backend", secondaryDomains: ["Product Engineering"], reasons: ["Strongest evidence cluster: Express, Node.js, REST API", "Backend signals score higher than other detected domains"] },
  confidence: 86,
};

const nextFiles = [
  file("packages/next/src/server/next-server.ts", "TypeScript"),
  file("packages/next/src/client/index.tsx", "TypeScript React"),
  file("packages/next/package.json", "JSON"),
  file("test/e2e/app-dir/app/index.test.ts", "TypeScript"),
  file(".github/workflows/build_and_test.yml", "YAML"),
  file("crates/next-api/src/app.rs", "Rust"),
  file("examples/hello-world/app/page.tsx", "TypeScript React"),
  file("readme.md", "Markdown"),
];

const nextAnalysis: DeterministicAnalysis = {
  detectedSkills: [
    skill("TypeScript", "language", 89, 4, ["Found 4,602 .ts files in the analyzable tree", "Selected TypeScript source spans server and client paths"], ["packages/next/src/server/next-server.ts", "packages/next/src/client/index.tsx"]),
    skill("React", "framework", 82, 4, ["Detected React dependency and component implementation paths"], ["packages/next/package.json", "examples/hello-world/app/page.tsx"]),
    skill("Next.js", "framework", 87, 4, ["README mentions Next.js", "App Router and Next.js server paths appear across the repository"], ["readme.md", "packages/next/src/server/next-server.ts"]),
    skill("JavaScript", "language", 78, 3, ["GitHub identifies JavaScript as the snapshot's primary repository language"], ["packages/next/package.json"]),
    skill("HTML", "frontend", 67, 2, ["Selected component files contain semantic interface structures"], ["examples/hello-world/app/page.tsx"]),
    skill("CSS", "frontend", 65, 2, ["Frontend examples include styling evidence"], ["examples/hello-world/app/page.tsx"]),
    skill("Jest", "testing", 83, 4, ["Test dependencies and test paths are present"], ["packages/next/package.json", "test/e2e/app-dir/app/index.test.ts"]),
    skill("GitHub Actions", "devops", 79, 3, ["Found build and test workflow configuration"], [".github/workflows/build_and_test.yml"]),
    skill("Rust", "language", 76, 3, ["Found 996 .rs files in the analyzable tree"], ["crates/next-api/src/app.rs"]),
    skill("README documentation", "product", 66, 3, ["README contains public project and setup documentation"], ["readme.md"]),
  ],
  qualitySignals: [
    quality("Documentation quality", 80, "README includes project orientation and setup guidance", ["readme.md"]),
    quality("Project structure", 98, "Large repository has organized packages, tests, examples, workflows, and Rust crates", ["packages/next/src/server/next-server.ts", "crates/next-api/src/app.rs"]),
    quality("Error handling", 55, "Some explicit error paths appear, but only selected snippets were inspected", ["packages/next/src/server/next-server.ts"]),
    quality("API design", 52, "Server structures are present, but this frontend-role snapshot has limited API evidence", ["packages/next/src/server/next-server.ts"]),
    quality("Testing evidence", 96, "Extensive test paths and automated test workflow evidence are present", ["test/e2e/app-dir/app/index.test.ts", ".github/workflows/build_and_test.yml"]),
    quality("Deployment readiness", 91, "Build and test automation is present in GitHub Actions", [".github/workflows/build_and_test.yml"]),
  ],
  projectComplexity: { level: "intermediate", score: 68, reasons: ["8 representative evidence files selected from a very large recursive tree", "Frontend, testing, DevOps, and systems-language signals are present"] },
  domainClassification: { primaryDomain: "Frontend", secondaryDomains: ["Product Engineering"], reasons: ["Strongest evidence cluster: React, Next.js, TypeScript", "Frontend signals score higher than other detected domains"] },
  confidence: 88,
};

const helloAnalysis: DeterministicAnalysis = {
  detectedSkills: [],
  qualitySignals: [
    quality("Documentation quality", 5, "Only minimal public documentation is available"),
    quality("Project structure", 5, "The snapshot contains too few files to assess project organization"),
    quality("Error handling", 0, "No explicit error-handling pattern was found in selected snippets"),
    quality("API design", 0, "No API route structure was found in selected evidence"),
    quality("Testing evidence", 0, "No test files or test dependencies were found in available evidence"),
    quality("Deployment readiness", 0, "No deployment configuration or guidance was found"),
  ],
  projectComplexity: { level: "starter", score: 0, reasons: ["No evidence files could be selected from the minimal public tree", "Few architecture signals were available"] },
  domainClassification: { primaryDomain: "Unknown", secondaryDomains: [], reasons: ["Available evidence is not strong enough to assign a product domain"] },
  confidence: 17,
};

export const demoScenarios: DemoScenario[] = [
  {
    id: "express-backend",
    label: "Express Backend Demo",
    description: "Strong backend framework, API, testing, and CI evidence.",
    result: createSnapshot({
      repo: { owner: "expressjs", name: "express", fullName: "expressjs/express", description: "Fast, unopinionated, minimalist web framework for Node.js", stars: 67500, forks: 20000, language: "JavaScript", defaultBranch: "master", url: "https://github.com/expressjs/express" },
      targetJob: getJob("Backend Developer Intern"), analysis: expressAnalysis, files: expressFiles, totalFiles: 213,
      topExtensions: [{ extension: ".js", count: 155 }, { extension: ".md", count: 18 }, { extension: ".yml", count: 9 }],
      notablePaths: expressFiles.map((item) => item.path),
    }),
  },
  {
    id: "nextjs-frontend",
    label: "Next.js Frontend Demo",
    description: "High-confidence framework, TypeScript, testing, and workflow evidence.",
    result: createSnapshot({
      repo: { owner: "vercel", name: "next.js", fullName: "vercel/next.js", description: "The React framework for the web", stars: 135000, forks: 29000, language: "JavaScript", defaultBranch: "canary", url: "https://github.com/vercel/next.js" },
      targetJob: getJob("Frontend Developer Intern"), analysis: nextAnalysis, files: nextFiles, totalFiles: 42000,
      topExtensions: [{ extension: ".ts", count: 4602 }, { extension: ".tsx", count: 2480 }, { extension: ".js", count: 1800 }, { extension: ".rs", count: 996 }],
      notablePaths: nextFiles.map((item) => item.path),
    }),
  },
  {
    id: "hello-world-product",
    label: "Hello World Low-Evidence Demo",
    description: "Shows the honest low-confidence state for a minimal repository.",
    result: createSnapshot({
      repo: { owner: "octocat", name: "Hello-World", fullName: "octocat/Hello-World", description: "A minimal example repository", stars: 3200, forks: 2800, language: null, defaultBranch: "master", url: "https://github.com/octocat/Hello-World" },
      targetJob: getJob("Product Engineer Intern"), analysis: helloAnalysis, files: [], totalFiles: 1,
      topExtensions: [{ extension: ".md", count: 1 }], notablePaths: [],
    }),
  },
];
