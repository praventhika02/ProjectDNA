import type {
  DomainClassification,
  GapAnalysis,
  OpportunityMatch,
  PortfolioProjectRecommendation,
  ProjectComplexity,
  QualitySignal,
  SeedJob,
  SkillEvidence,
} from "@/types/project-dna";

interface GeneratorInput {
  targetJob: SeedJob;
  targetMatch: OpportunityMatch;
  gapAnalysis: GapAnalysis;
  detectedSkills: SkillEvidence[];
  qualitySignals: QualitySignal[];
  projectComplexity: ProjectComplexity;
  domainClassification: DomainClassification;
}

type RoleKind = "ai" | "data" | "frontend" | "backend" | "product";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

function roleKind(title: string): RoleKind {
  const normalized = normalize(title);
  if (normalized.includes("ai engineer")) return "ai";
  if (normalized.includes("data analyst")) return "data";
  if (normalized.includes("frontend")) return "frontend";
  if (normalized.includes("backend")) return "backend";
  return "product";
}

function hasTheme(themes: string[], pattern: RegExp): boolean {
  return themes.some((theme) => pattern.test(normalize(theme)));
}

function chooseTitle(kind: RoleKind, themes: string[], strongMatch: boolean, limitedEvidence: boolean): string {
  if (limitedEvidence) {
    if (kind === "ai") return "ML Training and Evaluation Starter Pipeline";
    if (kind === "data") return "SQL Insights Dashboard with Reproducible Analysis";
    if (kind === "frontend") return "Accessible Task Workflow App";
    if (kind === "backend") return "Validated Issue Tracker API";
    return "Role-Based Team Workflow SaaS";
  }
  if (kind === "ai") {
    if (strongMatch) return "ML Model Drift Observatory";
    if (hasTheme(themes, /machine learning|python|pytorch|tensorflow|model evaluation/)) return "ML Model Evaluation and Inference Lab";
    if (hasTheme(themes, /docker|deploy|api|cloud|monitor/)) return "Deployable ML Monitoring and Inference Service";
    return "ML Model Evaluation and Inference Lab";
  }
  if (kind === "data") {
    if (strongMatch) return "Decision Intelligence Experiment Command Center";
    if (hasTheme(themes, /sql|database|data cleaning|etl/)) return "Customer Churn Analytics Command Center";
    return "Operational Insights Dashboard with Statistical Evidence";
  }
  if (kind === "frontend") {
    if (strongMatch) return "Frontend Performance Audit Toolkit";
    if (hasTheme(themes, /test|accessib|ux/)) return "Accessible Component Quality Lab";
    return "Responsive Issue Triage Workspace";
  }
  if (kind === "backend") {
    if (hasTheme(themes, /docker|deploy|ci|test/)) return "Deployable Bug Tracker API with CI/CD Evidence";
    if (hasTheme(themes, /sql|database|data structure/)) return "Incident Tracker API with Relational Data Evidence";
    return strongMatch ? "Resilient Service Operations API" : "Validated Service Request API";
  }
  if (strongMatch) return "Usage Analytics and Experimentation Platform";
  if (hasTheme(themes, /analytic|product thinking|metric|experiment/)) return "Feature Experiment Dashboard with Usage Analytics";
  return "Role-Based Team Workflow SaaS";
}

const roleNeeds: Record<RoleKind, string[]> = {
  ai: ["model training pipeline", "model evaluation", "inference API", "experiment reproducibility", "model monitoring", "technical documentation"],
  data: ["SQL analysis", "data cleaning", "statistical analysis", "data visualization", "insight communication", "reproducible ETL"],
  frontend: ["component architecture", "responsive UX", "web accessibility", "state and error handling", "automated testing", "performance measurement"],
  backend: ["REST API design", "input validation", "relational persistence", "automated testing", "CI/CD deployment", "service observability"],
  product: ["end-to-end user flow", "frontend and API integration", "product analytics", "user authentication", "automated testing", "measurable outcomes"],
};

function featureFor(theme: string, kind: RoleKind): string {
  const value = normalize(theme);
  if (/test|jest|pytest|playwright|cypress/.test(value)) return "Automated unit and integration test suite covering core success and failure paths";
  if (/docker/.test(value)) return "Containerized local environment with one-command application and dependency startup";
  if (/deploy|ci cd|github actions|cloud/.test(value)) return "Automated CI pipeline that tests every push and deploys a working preview";
  if (/documentation|communication|readme|git/.test(value)) return "Evidence-focused README with setup, architecture decisions, screenshots, and a change narrative";
  if (/error|validation|data structure/.test(value)) return "Validation and structured error states for invalid, missing, and conflicting inputs";
  if (/sql|database|persistence/.test(value)) return "Relational data model with documented SQL queries, migrations, and realistic seed data";
  if (/rest|api|backend|inference/.test(value)) return kind === "ai" ? "Versioned inference API with validated requests and traceable prediction responses" : "Versioned REST endpoints for create, read, update, workflow, and reporting operations";
  if (/machine learning|model training|python|pytorch|tensorflow/.test(value)) return "Reproducible training pipeline that separates data preparation, training, and saved model artifacts";
  if (/model evaluation|statistics|experiment/.test(value)) return kind === "ai" ? "Evaluation report comparing baseline and candidate models with precision, recall, F1, and a confusion matrix" : "Statistical comparison view that explains confidence, assumptions, and decision impact";
  if (/monitor|observability/.test(value)) return kind === "ai" ? "Model monitoring view for prediction confidence, drift indicators, and failure samples" : "Operational health view with request latency, error rate, and structured logs";
  if (/etl|data cleaning|pipeline/.test(value)) return "Repeatable ingestion and cleaning pipeline with explicit validation and rejected-record reporting";
  if (/visualization|dashboard|chart|insight/.test(value)) return "Interactive insight dashboard with filters, trend views, and drill-down explanations";
  if (/react|next|component|frontend/.test(value)) return "Reusable component system with typed states for loading, empty, success, and failure scenarios";
  if (/responsive|css|tailwind/.test(value)) return "Responsive interface verified across mobile, tablet, and desktop layouts";
  if (/accessib|ux|user flow/.test(value)) return "Keyboard-accessible end-to-end user flow with clear focus, labels, feedback, and recovery states";
  if (/state/.test(value)) return "Predictable client state flow with persisted filters and explicit asynchronous states";
  if (/performance/.test(value)) return "Performance audit workflow that records baseline and optimized Core Web Vitals";
  if (/authentication|auth/.test(value)) return "Role-based authentication flow with protected actions and clearly documented permissions";
  if (/analytics|metric|measurable outcome/.test(value)) return "Product event instrumentation with an outcomes dashboard for adoption and completion metrics";
  if (/product thinking/.test(value)) return "Documented problem hypothesis, user journey, prioritization rationale, and post-build learning review";
  return `Documented implementation milestone that creates verifiable evidence for ${theme}`;
}

function requirementFor(theme: string, kind: RoleKind): string {
  const value = normalize(theme);
  if (/test/.test(value)) return "Use an automated test runner and keep core logic separate enough to test without the UI";
  if (/docker/.test(value)) return "Provide a Dockerfile and reproducible local environment configuration";
  if (/deploy|ci cd|github actions|cloud/.test(value)) return "Add a GitHub Actions workflow that runs checks on every push and deploy the application on a free tier";
  if (/documentation|communication|readme|git/.test(value)) return "Document setup, architecture, tradeoffs, evidence screenshots, and verification steps in the README";
  if (/sql|database|persistence/.test(value)) return "Use a relational schema with migrations, constraints, indexes, and at least five meaningful queries";
  if (/rest|api|backend|inference/.test(value)) return "Implement typed or schema-validated API contracts with consistent success and error responses";
  if (/machine learning|model training|python|pytorch|tensorflow/.test(value)) return "Keep data preparation, model training, evaluation, and inference in separate reproducible modules";
  if (/model evaluation|statistics|experiment/.test(value)) return "Record baseline and final metrics with a short explanation of metric selection and limitations";
  if (/etl|data cleaning|pipeline/.test(value)) return "Include a versioned sample dataset and deterministic data validation pipeline";
  if (/visualization|dashboard|chart|insight/.test(value)) return "Build at least three accessible visualizations tied to documented decisions";
  if (/react|next|component|frontend|state|responsive|accessib|ux/.test(value)) return "Use reusable typed components and cover loading, empty, error, and responsive states";
  if (/performance/.test(value)) return "Capture repeatable Lighthouse or Web Vitals measurements before and after optimization";
  if (/authentication|auth/.test(value)) return "Enforce authorization server-side and document the role permission matrix";
  if (/analytics|metric|product thinking|measurable/.test(value)) return "Define tracked events and connect each metric to a documented product hypothesis";
  if (/error|validation|data structure/.test(value)) return "Validate inputs at system boundaries and test malformed and conflicting requests";
  return `Include an inspectable implementation and verification note for ${theme} in the ${kind} project`;
}

function criteriaFor(kind: RoleKind, themes: string[]): string[] {
  const common: string[] = [
    "All core workflows include a recorded happy-path and failure-path demonstration",
    "Evidence matrix links every addressed gap to a file, test, metric, or screenshot",
  ];
  if (hasTheme(themes, /test/)) common.push("At least 8 automated tests pass locally and in CI");
  if (hasTheme(themes, /deploy|ci cd|github actions|cloud/)) common.push("CI checks run on every push and the public demo is reachable from the README");
  if (hasTheme(themes, /documentation|communication|readme|git/)) common.push("README includes setup steps, an architecture diagram, tradeoffs, and evidence screenshots");
  if (hasTheme(themes, /sql|database/)) common.push("Database includes at least 3 related tables, migrations, seed data, and 5 documented queries");
  if (kind === "ai") common.push("Evaluation compares at least 2 model approaches using precision, recall, F1, and a confusion matrix", "Inference endpoint returns a prediction, confidence, model version, and validation errors");
  if (kind === "data") common.push("Dashboard contains at least 3 decision-relevant charts and 5 reusable SQL queries", "Insight report states at least 3 findings with quantified supporting evidence");
  if (kind === "frontend") common.push("Core user flow passes keyboard navigation and achieves at least 90 accessibility in Lighthouse", "At least 5 reusable components demonstrate loading, empty, error, and success states");
  if (kind === "backend") common.push("API exposes at least 5 validated endpoints with consistent error contracts", "Load test documents latency and error behavior for at least 100 concurrent requests");
  if (kind === "product") common.push("At least 5 product events feed a working outcomes dashboard", "Two user roles complete a documented end-to-end workflow with enforced permissions");
  return unique(common).slice(0, 6);
}

export function generatePortfolioProject(input: GeneratorInput): PortfolioProjectRecommendation {
  const kind = roleKind(input.targetJob.title);
  const weakSignals = input.qualitySignals.filter((signal) => signal.score < 60).sort((a, b) => a.score - b.score).map((signal) => signal.signal);
  const actualGaps = unique([...input.gapAnalysis.criticalGaps, ...input.targetMatch.missingRequiredSkills, ...input.targetMatch.missingPreferredSkills, ...weakSignals]);
  const limitedEvidence = input.detectedSkills.length < 2 || input.targetMatch.evidenceStrength < 30;
  const strongMatch = input.targetMatch.matchScore > 70;
  const differentiation = strongMatch && actualGaps.length < 3;
  const themes = [...actualGaps.slice(0, 7)];
  for (const need of roleNeeds[kind]) {
    if (themes.length >= 7) break;
    if (!themes.some((theme) => normalize(theme).includes(normalize(need)) || normalize(need).includes(normalize(theme)))) themes.push(`evidence depth: ${differentiation ? "advanced " : ""}${need}`);
  }

  const difficulty: PortfolioProjectRecommendation["difficulty"] = input.targetMatch.matchScore > 70 ? "advanced" : input.targetMatch.matchScore >= 35 ? "intermediate" : limitedEvidence ? "beginner" : "intermediate";
  const estimatedTime = difficulty === "advanced" ? "35-50 hours" : difficulty === "intermediate" ? "20-30 hours" : "12-16 hours";
  const title = chooseTitle(kind, themes, strongMatch, limitedEvidence);
  const features = unique(themes.map((theme) => featureFor(theme, kind)));
  for (const need of roleNeeds[kind]) {
    if (features.length >= 5) break;
    const theme = `evidence depth: ${need}`;
    if (!themes.includes(theme)) themes.push(theme);
    const feature = featureFor(theme, kind);
    if (!features.includes(feature)) features.push(feature);
  }
  const technicalRequirements = unique(themes.map((theme) => requirementFor(theme, kind)));
  for (const need of roleNeeds[kind]) {
    if (technicalRequirements.length >= 5) break;
    const requirement = requirementFor(`evidence depth: ${need}`, kind);
    if (!technicalRequirements.includes(requirement)) technicalRequirements.push(requirement);
  }
  const supplementalThemes = themes
    .filter((theme) => theme.startsWith("evidence depth:"))
    .map((theme) => `Differentiation: ${theme.replace(/^evidence depth:\s*(advanced\s*)?/i, "")}`);
  const gapsAddressed = unique([...actualGaps.slice(0, 7), ...supplementalThemes]).slice(0, 10);
  const proofSkillsFromWeakness = weakSignals.map((signal) => signal.replace(/ quality$/i, "").replace(/ evidence$/i, ""));
  const skillsToProve = unique([...input.targetMatch.missingRequiredSkills, ...input.targetMatch.missingPreferredSkills, ...proofSkillsFromWeakness, ...input.targetJob.requiredSkills]).slice(0, 8);
  const lowEvidenceReason = "Because your current repo has limited public evidence, this project is designed to create clearer proof.";
  const whyThisProject = limitedEvidence
    ? `${lowEvidenceReason} It packages the foundational requirements for ${input.targetJob.title} into one inspectable build.`
    : differentiation
      ? `You already match this role strongly. Build this project to stand out from similar applicants through measurable outcomes, production polish, and deeper ${kind === "product" ? "product" : kind} evidence.`
      : `Your ${input.domainClassification.primaryDomain} repository is currently ${input.projectComplexity.level}-level, while the role still lacks clear evidence for ${actualGaps.slice(0, 3).join(", ") || "several preferred capabilities"}. This project closes those gaps in one coherent system.`;
  const summary = `Build a ${difficulty} ${kind === "ai" ? "machine-learning" : kind === "data" ? "analytics" : kind} project that turns ${gapsAddressed.slice(0, 3).join(", ")} into public, verifiable implementation evidence.`;
  const deliverables = [
    "Public source repository with meaningful commit history and issue-based milestones",
    "Evidence-focused README with setup, architecture, decisions, screenshots, and limitations",
    "Working demo or reproducible local environment with seeded sample data",
    `Short evidence report mapping ${input.targetJob.title} requirements to files, tests, and measurable outcomes`,
  ];
  const stretchGoals: Record<RoleKind, string[]> = {
    ai: ["Add drift detection against a second dataset", "Compare batch and real-time inference performance", "Publish a lightweight model card with ethical limitations"],
    data: ["Add scheduled dataset refresh and anomaly alerts", "Create a second stakeholder-specific dashboard view", "Add a documented A/B test analysis"],
    frontend: ["Add visual regression testing", "Measure bundle size and interaction latency in CI", "Ship an offline or optimistic-update mode"],
    backend: ["Add rate limiting and idempotency keys", "Publish an OpenAPI contract and generated client", "Add tracing across database and API operations"],
    product: ["Add an experiment assignment flow", "Create a cohort retention view", "Document a usability test and resulting iteration"],
  };
  const portfolioPitch = `Built ${title} to prove ${skillsToProve.slice(0, 3).join(", ")} for ${input.targetJob.title} readiness${kind === "backend" ? " beyond basic CRUD" : " through measurable, repository-backed evidence"}.`;

  return {
    title,
    summary,
    whyThisProject,
    targetRole: input.targetJob.title,
    difficulty,
    estimatedTime,
    skillsToProve,
    gapsAddressed,
    features: features.slice(0, 7),
    technicalRequirements: technicalRequirements.slice(0, 8),
    deliverables,
    successCriteria: criteriaFor(kind, themes),
    stretchGoals: stretchGoals[kind],
    portfolioPitch,
  };
}
