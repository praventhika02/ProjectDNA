import type {
  AnalyzeSuccessResponse,
  DeterministicAnalysis,
  DomainClassification,
  ProjectComplexity,
  QualitySignal,
  RepoFileEvidence,
  SkillCategory,
  SkillEvidence,
} from "@/types/project-dna";

type ExtractorInput = Pick<AnalyzeSuccessResponse, "repo" | "readmeSummaryInput" | "files" | "fileTreeSummary">;

interface SkillRule {
  skill: string;
  category: SkillCategory;
  dependencies?: string[];
  readme?: RegExp;
  code?: RegExp;
  paths?: RegExp;
}

interface AccumulatedSkill {
  skill: string;
  category: SkillCategory;
  strength: number;
  evidence: string[];
  sourceFiles: Set<string>;
}

const skillRules: SkillRule[] = [
  { skill: "React", category: "framework", dependencies: ["react", "react-dom"], readme: /\breact(?:\.js)?\b/i, code: /(?:from\s+["']react["']|require\(["']react["']\)|React\.(?:use|create|Component))/i, paths: /(^|\/)components?\//i },
  { skill: "Next.js", category: "framework", dependencies: ["next"], readme: /\bnext\.?js\b/i, code: /(?:from\s+["']next\/|next\/(?:server|navigation|headers|image)|NextResponse|NextRequest)/i, paths: /(?:^|\/)next\.config\.|(?:^|\/)app\/(?:api\/|page\.)/i },
  { skill: "Tailwind CSS", category: "frontend", dependencies: ["tailwindcss", "@tailwindcss/postcss"], readme: /\btailwind(?:\s*css)?\b/i, code: /(?:@tailwind\s+(?:base|components|utilities)|className=["'`][^"'`]*(?:flex|grid|bg-|text-|p-|m-))/i, paths: /tailwind\.config\./i },
  { skill: "HTML", category: "frontend", readme: /\bhtml5?\b/i, code: /<(?:html|main|section|form|article|nav)(?:\s|>)/i, paths: /\.html?$/i },
  { skill: "CSS", category: "frontend", readme: /\bcss3?\b/i, code: /(?:@media\s*\(|(?:display|background|font-family|grid-template)\s*:)/i, paths: /\.css$/i },
  { skill: "Node.js", category: "backend", dependencies: ["@types/node", "nodemon"], readme: /\bnode\.?js\b/i, code: /(?:node:fs|node:path|process\.env|module\.exports|require\(["'](?:fs|path|http)["']\))/i },
  { skill: "Express", category: "backend", dependencies: ["express"], readme: /\bexpress(?:\.js)?\b/i, code: /(?:from\s+["']express["']|require\(["']express["']\)|express\.(?:Router|json)|createApplication|\brouter\.(?:get|post|put|patch|delete)\s*\()/i, paths: /(^|\/)lib\/(?:express|application|router)(?:\/|\.)/i },
  { skill: "FastAPI", category: "backend", dependencies: ["fastapi"], readme: /\bfastapi\b/i, code: /(?:from\s+fastapi\s+import|FastAPI\s*\(|APIRouter\s*\()/i },
  { skill: "Flask", category: "backend", dependencies: ["flask"], readme: /\bflask\b/i, code: /(?:from\s+flask\s+import|Flask\s*\(__name__\)|@app\.route)/i },
  { skill: "REST API", category: "backend", readme: /\b(?:rest(?:ful)?\s+api|api endpoint)\b/i, code: /(?:NextResponse\.json|Response\.json|\brouter\.(?:get|post|put|patch|delete)\s*\(|@app\.(?:get|post|put|patch|delete)\s*\(|fetch\s*\([^)]*\/api\/)/i, paths: /(^|\/)(api|routes?)\//i },
  { skill: "API Routes", category: "backend", readme: /\bapi routes?\b/i, code: /export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE)\b/i, paths: /(^|\/)app\/api\/.+route\.[jt]s$/i },
  { skill: "scikit-learn", category: "ai_ml", dependencies: ["scikit-learn", "sklearn"], readme: /\b(?:scikit-learn|sklearn)\b/i, code: /(?:from|import)\s+sklearn\b/i },
  { skill: "TensorFlow", category: "ai_ml", dependencies: ["tensorflow"], readme: /\btensorflow\b/i, code: /(?:import\s+tensorflow|from\s+tensorflow|tf\.keras)/i },
  { skill: "PyTorch", category: "ai_ml", dependencies: ["torch", "pytorch"], readme: /\bpytorch\b/i, code: /(?:import\s+torch|from\s+torch\b|torch\.nn)/i },
  { skill: "pandas", category: "data", dependencies: ["pandas"], readme: /\bpandas\b/i, code: /(?:import\s+pandas|from\s+pandas|pd\.(?:DataFrame|read_csv|read_sql))/i },
  { skill: "NumPy", category: "ai_ml", dependencies: ["numpy"], readme: /\bnumpy\b/i, code: /(?:import\s+numpy|from\s+numpy|np\.(?:array|zeros|mean|ndarray))/i },
  { skill: "OpenCV", category: "ai_ml", dependencies: ["opencv-python", "opencv"], readme: /\bopencv\b/i, code: /(?:import\s+cv2|from\s+cv2)/i },
  { skill: "transformers", category: "ai_ml", dependencies: ["transformers", "@huggingface/transformers"], readme: /\b(?:hugging\s*face|transformers)\b/i, code: /(?:from\s+transformers\s+import|pipeline\s*\(|AutoModel|AutoTokenizer)/i },
  { skill: "MLflow", category: "ai_ml", dependencies: ["mlflow"], readme: /\bmlflow\b/i, code: /(?:import\s+mlflow|mlflow\.(?:log_|start_run))/i },
  { skill: "Data visualization", category: "data", dependencies: ["matplotlib", "seaborn", "plotly", "recharts", "chart.js", "d3"], readme: /\b(?:data visualization|visuali[sz](?:e|ation)|dashboard charts?)\b/i, code: /(?:matplotlib|seaborn|plotly|recharts|chart\.js|d3\.select)/i },
  { skill: "ETL", category: "data", readme: /\b(?:etl|extract[, ]+transform[, ]+load|data pipeline)\b/i, code: /(?:read_csv|read_sql|to_sql|transform_data|load_data|extract_data)/i, paths: /(^|\/)(etl|pipelines?)\//i },
  { skill: "Jupyter Notebook", category: "data", readme: /\bjupyter|notebook\b/i, paths: /\.ipynb$/i },
  { skill: "PostgreSQL", category: "database", dependencies: ["pg", "postgres", "psycopg2", "psycopg", "@neondatabase/serverless"], readme: /\bpostgres(?:ql)?\b/i, code: /(?:postgres(?:ql)?:\/\/|from\s+["']pg["']|psycopg)/i },
  { skill: "MySQL", category: "database", dependencies: ["mysql", "mysql2", "pymysql"], readme: /\bmysql\b/i, code: /(?:mysql:\/\/|from\s+["']mysql2?["']|import\s+pymysql)/i },
  { skill: "MongoDB", category: "database", dependencies: ["mongodb", "mongoose"], readme: /\bmongodb|mongoose\b/i, code: /(?:mongodb(?:\+srv)?:\/\/|mongoose\.connect|MongoClient)/i },
  { skill: "Supabase", category: "database", dependencies: ["@supabase/supabase-js"], readme: /\bsupabase\b/i, code: /(?:createClient\s*\(|from\s+["']@supabase\/supabase-js["'])/i },
  { skill: "Prisma", category: "database", dependencies: ["prisma", "@prisma/client"], readme: /\bprisma\b/i, code: /(?:PrismaClient|@prisma\/client)/i, paths: /(^|\/)prisma\/schema\.prisma$/i },
  { skill: "Jest", category: "testing", dependencies: ["jest", "ts-jest", "@types/jest"], readme: /\bjest\b/i, code: /(?:describe|it|test)\s*\(["'`][\s\S]+expect\s*\(/i, paths: /(?:^|\/)(?:__tests__|tests?)\/.+\.[jt]sx?$/i },
  { skill: "Pytest", category: "testing", dependencies: ["pytest"], readme: /\bpytest\b/i, code: /(?:import\s+pytest|@pytest\.|def\s+test_)/i, paths: /(?:^|\/)test_.+\.py$|_test\.py$/i },
  { skill: "Playwright", category: "testing", dependencies: ["@playwright/test", "playwright"], readme: /\bplaywright\b/i, code: /(?:@playwright\/test|page\.(?:goto|click|locator)\s*\()/i, paths: /playwright\.config\./i },
  { skill: "Cypress", category: "testing", dependencies: ["cypress"], readme: /\bcypress\b/i, code: /\bcy\.(?:visit|get|contains|intercept)\s*\(/i, paths: /(^|\/)cypress\//i },
  { skill: "Unit testing", category: "testing", readme: /\bunit tests?|test suite\b/i, code: /(?:describe|it|test)\s*\(["'`][\s\S]+expect\s*\(/i, paths: /(^|\/)(?:__tests__|tests?|specs?)(\/|\.)/i },
  { skill: "Docker", category: "devops", dependencies: ["dockerode"], readme: /\bdocker(?:file| compose)?\b/i, code: /\bFROM\s+[\w./:-]+|docker\s+(?:build|compose|run)/i, paths: /(^|\/)dockerfile|docker-compose\.ya?ml$/i },
  { skill: "GitHub Actions", category: "devops", readme: /\bgithub actions?\b/i, code: /(?:^|\n)\s*(?:jobs|runs-on|uses):/i, paths: /^\.github\/workflows\/.+\.ya?ml$/i },
  { skill: "CI/CD", category: "devops", readme: /\bci\/?cd|continuous (?:integration|deployment)\b/i, code: /(?:^|\n)\s*(?:jobs|runs-on):/i, paths: /^\.github\/workflows\/|(?:^|\/)(?:\.gitlab-ci\.yml|jenkinsfile)$/i },
  { skill: "Vercel", category: "devops", dependencies: ["vercel", "@vercel/node"], readme: /\bvercel\b/i, paths: /(^|\/)vercel\.json$/i },
  { skill: "Deployment", category: "devops", readme: /\bdeploy(?:ment|ed|ing)?\b/i, paths: /(^|\/)(?:dockerfile|vercel\.json)|^\.github\/workflows\//i },
  { skill: "UX flow", category: "product", readme: /\b(?:user flow|user experience|\bux\b|user journey)\b/i, code: /(?:aria-label|aria-describedby|role=["'](?:dialog|alert)|onboarding)/i },
  { skill: "User authentication", category: "product", dependencies: ["next-auth", "@auth/core", "passport", "jsonwebtoken"], readme: /\b(?:authentication|sign[ -]?in|log[ -]?in|oauth)\b/i, code: /(?:NextAuth|authOptions|passport\.|jwt\.(?:sign|verify)|getServerSession)/i, paths: /(^|\/)(auth|login|sign-in)(\/|\.)/i },
  { skill: "Dashboard", category: "product", readme: /\bdashboard\b/i, code: /(?:Dashboard|chartData|metrics|analytics)/i, paths: /(^|\/)dashboard(\/|\.)/i },
  { skill: "Analytics", category: "product", dependencies: ["@vercel/analytics", "posthog-js", "mixpanel-browser"], readme: /\b(?:product analytics|event tracking|instrumentation)\b/i, code: /(?:track\s*\(|analytics\.(?:track|identify)|posthog\.(?:capture|identify))/i },
];

const languageExtensions: Array<{ skill: string; extension: string; repoLanguage?: string }> = [
  { skill: "TypeScript", extension: ".ts", repoLanguage: "TypeScript" },
  { skill: "TypeScript", extension: ".tsx" },
  { skill: "JavaScript", extension: ".js", repoLanguage: "JavaScript" },
  { skill: "JavaScript", extension: ".jsx" },
  { skill: "Python", extension: ".py", repoLanguage: "Python" },
  { skill: "SQL", extension: ".sql" },
  { skill: "Java", extension: ".java", repoLanguage: "Java" },
  { skill: "C#", extension: ".cs", repoLanguage: "C#" },
  { skill: "Go", extension: ".go", repoLanguage: "Go" },
  { skill: "Rust", extension: ".rs", repoLanguage: "Rust" },
];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function confidenceCap(strength: number, evidenceCount: number): number {
  if (strength >= 24 && evidenceCount >= 4) return 94;
  if (strength >= 16 && evidenceCount >= 3) return 89;
  if (strength >= 10 && evidenceCount >= 2) return 82;
  if (strength >= 5) return 72;
  return 58;
}

function addSignal(map: Map<string, AccumulatedSkill>, skill: string, category: SkillCategory, strength: number, evidence: string, sourceFiles: string[] = []) {
  const current = map.get(skill) ?? { skill, category, strength: 0, evidence: [], sourceFiles: new Set<string>() };
  current.strength += strength;
  if (!current.evidence.includes(evidence)) current.evidence.push(evidence);
  sourceFiles.forEach((path) => current.sourceFiles.add(path));
  map.set(skill, current);
}

function parseDependencies(files: RepoFileEvidence[]): Map<string, string> {
  const dependencies = new Map<string, string>();
  const knownPackages = [...new Set(skillRules.flatMap((rule) => rule.dependencies ?? []))];
  for (const file of files) {
    const filename = file.path.split("/").pop()?.toLowerCase();
    if (filename === "package.json") {
      try {
        const manifest = JSON.parse(file.contentPreview) as Record<string, unknown>;
        for (const section of ["dependencies", "devDependencies", "peerDependencies"]) {
          const entries = manifest[section];
          if (entries && typeof entries === "object") Object.keys(entries).forEach((name) => dependencies.set(name.toLowerCase(), file.path));
        }
      } catch {
        // A 4,000 character preview can truncate unusually large manifests.
      }
      knownPackages.forEach((name) => {
        const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`["']${escaped}["']\\s*:`, "i").test(file.contentPreview)) dependencies.set(name.toLowerCase(), file.path);
      });
    }
    if (filename === "requirements.txt") {
      file.contentPreview.split(/\r?\n/).forEach((line) => {
        const name = line.trim().split(/[<>=!~;\s\[]/)[0]?.toLowerCase();
        if (name && !name.startsWith("#")) dependencies.set(name, file.path);
      });
    }
    if (filename === "pyproject.toml") {
      knownPackages.forEach((name) => {
        if (new RegExp(`(?:^|["'\\s])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:["'\\s=<>~]|$)`, "im").test(file.contentPreview)) dependencies.set(name.toLowerCase(), file.path);
      });
    }
  }
  return dependencies;
}

function readmeQuality(readme: string): { score: number; evidence: string[] } {
  if (!readme.trim()) return { score: 0, evidence: ["No public README content was available"] };
  const headings = (readme.match(/^#{1,4}\s+.+$/gm) ?? []).length;
  const codeBlocks = Math.floor((readme.match(/```/g) ?? []).length / 2);
  const setup = /\b(?:install|installation|getting started|setup|quickstart)\b/i.test(readme);
  const usage = /\b(?:usage|example|demo|run locally)\b/i.test(readme);
  const score = clamp(Math.min(readme.length / 80, 45) + Math.min(headings * 5, 25) + Math.min(codeBlocks * 5, 15) + (setup ? 8 : 0) + (usage ? 7 : 0));
  const evidence = [`README provides ${readme.length.toLocaleString()} characters and ${headings} structured heading${headings === 1 ? "" : "s"}`];
  if (setup) evidence.push("README includes setup or installation guidance");
  if (usage || codeBlocks) evidence.push(`README includes ${codeBlocks || "documented"} usage example${codeBlocks === 1 ? "" : "s"}`);
  return { score, evidence };
}

function buildQualitySignals(input: ExtractorInput, skills: SkillEvidence[], dependencies: Map<string, string>): QualitySignal[] {
  const { files, readmeSummaryInput: readme, fileTreeSummary } = input;
  const readmePath = files.find((file) => /(^|\/)readme(?:\.[^/]+)?$/i.test(file.path))?.path;
  const docs = readmeQuality(readme);
  const paths = [...new Set([...fileTreeSummary.notablePaths, ...files.map((file) => file.path)])];
  const directories = new Set(paths.map((path) => path.split("/").slice(0, -1).join("/")).filter(Boolean));
  const sourceRoots = paths.filter((path) => /(^|\/)(src|app|pages|components|api|routes)(\/|$)/i.test(path));
  const structureScore = clamp(10 + Math.min(fileTreeSummary.totalFiles / 4, 35) + Math.min(directories.size * 4, 30) + Math.min(sourceRoots.length * 2, 25));

  const matchingFiles = (pattern: RegExp) => files.filter((file) => pattern.test(file.contentPreview));
  const errorFiles = matchingFiles(/(?:try\s*\{|catch\s*\(|throw\s+new\s+\w*Error|\.status\s*\(4\d\d\)|NextResponse\.json[^\n]+status)/i);
  const validationFiles = matchingFiles(/(?:validate|schema\.(?:parse|safeParse)|typeof\s+\w+\s*!==|if\s*\([^)]*(?:missing|required|invalid))/i);
  const errorScore = clamp(errorFiles.length * 18 + validationFiles.length * 10);

  const apiFiles = files.filter((file) => /(^|\/)(api|routes?)\/|route\.[jt]s$/i.test(file.path) || /(?:router\.(?:get|post|put|patch|delete)|NextResponse\.json|@app\.(?:get|post|put|delete))/i.test(file.contentPreview));
  const apiMethods = new Set(apiFiles.flatMap((file) => file.contentPreview.match(/\b(?:GET|POST|PUT|PATCH|DELETE)\b|\.(?:get|post|put|patch|delete)\s*\(/gi) ?? []));
  const apiScore = clamp(apiFiles.length * 18 + apiMethods.size * 7);

  const testPaths = paths.filter((path) => /(^|\/)(?:__tests__|tests?|specs?)(\/|\.)|\.(?:test|spec)\.[jt]sx?$|test_.+\.py$/i.test(path));
  const testDependencies = [...dependencies.keys()].filter((name) => ["jest", "pytest", "cypress", "playwright", "@playwright/test", "vitest"].includes(name));
  const testScore = clamp(testPaths.length * 10 + testDependencies.length * 24 + (files.some((file) => /(?:describe|it|test)\s*\(/.test(file.contentPreview)) ? 18 : 0));

  const deploymentPaths = paths.filter((path) => /(^|\/)(?:dockerfile[^/]*|vercel\.json)|^\.github\/workflows\//i.test(path));
  const deploymentMentioned = /\bdeploy(?:ment|ed|ing)?\b|\bvercel\b|\bdocker\b/i.test(readme);
  const deploymentScore = clamp(deploymentPaths.length * 18 + (deploymentMentioned ? 15 : 0));

  const signals: QualitySignal[] = [
    { signal: "Documentation quality", score: docs.score, evidence: docs.evidence, sourceFiles: readmePath ? [readmePath] : [] },
    { signal: "Project structure", score: structureScore, evidence: [`Repository contains ${fileTreeSummary.totalFiles} files across at least ${directories.size} observed directories`, sourceRoots.length ? `Detected ${sourceRoots.length} source-oriented paths` : "No conventional source directory was observed"], sourceFiles: sourceRoots.slice(0, 5) },
    { signal: "Error handling", score: errorScore, evidence: errorFiles.length ? [`Found explicit error handling in ${errorFiles.length} selected file${errorFiles.length === 1 ? "" : "s"}`, ...(validationFiles.length ? [`Found validation signals in ${validationFiles.length} selected file${validationFiles.length === 1 ? "" : "s"}`] : [])] : ["No explicit error-handling pattern was found in selected snippets"], sourceFiles: [...new Set([...errorFiles, ...validationFiles].map((file) => file.path))].slice(0, 5) },
    { signal: "API design", score: apiScore, evidence: apiFiles.length ? [`Detected API structures in ${apiFiles.length} selected file${apiFiles.length === 1 ? "" : "s"}`, `Observed ${apiMethods.size} distinct HTTP method signal${apiMethods.size === 1 ? "" : "s"}`] : ["No API route structure was found in selected evidence"], sourceFiles: apiFiles.map((file) => file.path).slice(0, 5) },
    { signal: "Testing evidence", score: testScore, evidence: testPaths.length || testDependencies.length ? [`Found ${testPaths.length} test-related path${testPaths.length === 1 ? "" : "s"}`, ...(testDependencies.length ? [`Detected test dependencies: ${testDependencies.join(", ")}`] : [])] : ["No test files or test dependencies were found in available evidence"], sourceFiles: [...new Set([...testPaths, ...testDependencies.map((name) => dependencies.get(name)).filter((path): path is string => Boolean(path))])].slice(0, 5) },
    { signal: "Deployment readiness", score: deploymentScore, evidence: deploymentPaths.length || deploymentMentioned ? [...(deploymentPaths.length ? [`Found ${deploymentPaths.length} deployment or workflow path${deploymentPaths.length === 1 ? "" : "s"}`] : []), ...(deploymentMentioned ? ["README includes deployment-related guidance"] : [])] : ["No deployment configuration or guidance was found"], sourceFiles: deploymentPaths.slice(0, 5) },
  ];

  const pipelineSkills = skills.filter((skill) => skill.category === "ai_ml" || skill.category === "data");
  if (pipelineSkills.length) {
    const pipelineFiles = files.filter((file) => /(?:fit\s*\(|predict\s*\(|read_csv|read_sql|transform|pipeline|DataFrame|torch\.|tensorflow)/i.test(file.contentPreview));
    signals.push({ signal: "Data/AI pipeline evidence", score: clamp(pipelineSkills.length * 12 + pipelineFiles.length * 15), evidence: [`Detected ${pipelineSkills.length} data or AI skill signal${pipelineSkills.length === 1 ? "" : "s"}`, pipelineFiles.length ? `Found pipeline operations in ${pipelineFiles.length} selected file${pipelineFiles.length === 1 ? "" : "s"}` : "No pipeline operation was visible in selected snippets"], sourceFiles: pipelineFiles.map((file) => file.path).slice(0, 5) });
  }
  return signals;
}

function classifyDomain(skills: SkillEvidence[]): DomainClassification {
  const scores = { "AI/ML": 0, "Data Analytics": 0, Frontend: 0, Backend: 0, "Product Engineering": 0 };
  for (const skill of skills) {
    const weight = Math.max(1, skill.proficiency - 1);
    if (skill.category === "ai_ml") scores["AI/ML"] += weight * 3;
    if (skill.category === "data" || skill.skill === "SQL") scores["Data Analytics"] += weight * 3;
    if (skill.category === "frontend" || ["React", "Next.js"].includes(skill.skill)) scores.Frontend += weight * 2;
    if (skill.category === "backend" || skill.category === "database") scores.Backend += weight * 2;
    if (skill.category === "product") scores["Product Engineering"] += weight * 2;
  }

  const hasDatabase = skills.some((skill) => skill.category === "database");
  const fullStack = scores.Frontend >= 6 && scores.Backend >= 6 && hasDatabase;
  if (fullStack) {
    return { primaryDomain: "Full Stack", secondaryDomains: ["Frontend", "Backend"], reasons: ["Repository has substantial frontend and backend evidence", "Database integration evidence supports an end-to-end application classification"] };
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [primary, primaryScore] = ranked[0];
  if (primaryScore < 3) return { primaryDomain: "Unknown", secondaryDomains: [], reasons: ["Available evidence is not strong enough to assign a product domain"] };
  const secondaryDomains = ranked.slice(1).filter(([, score]) => score >= Math.max(3, primaryScore * 0.45)).map(([domain]) => domain);
  const strongest = skills.filter((skill) => {
    if (primary === "AI/ML") return skill.category === "ai_ml";
    if (primary === "Data Analytics") return skill.category === "data" || skill.skill === "SQL";
    if (primary === "Frontend") return skill.category === "frontend" || ["React", "Next.js"].includes(skill.skill);
    if (primary === "Backend") return skill.category === "backend" || skill.category === "database";
    return skill.category === "product";
  }).slice(0, 3).map((skill) => skill.skill);
  return { primaryDomain: primary as DomainClassification["primaryDomain"], secondaryDomains, reasons: [`Strongest evidence cluster: ${strongest.join(", ")}`, `${primary} signals scored higher than other detected domains`] };
}

function scoreComplexity(input: ExtractorInput, skills: SkillEvidence[], qualitySignals: QualitySignal[], dependencyCount: number): ProjectComplexity {
  const categories = new Set(skills.map((skill) => skill.category));
  const capabilityCategories = ["backend", "database", "testing", "devops", "data", "ai_ml"].filter((category) => categories.has(category as SkillCategory));
  const docs = qualitySignals.find((signal) => signal.signal === "Documentation quality")?.score ?? 0;
  const score = clamp(
    Math.min(input.fileTreeSummary.selectedFiles * 2, 16) +
    Math.min(input.fileTreeSummary.totalFiles / 8, 15) +
    Math.min(categories.size * 3, 18) +
    Math.min(dependencyCount, 14) +
    Math.min(capabilityCategories.length * 5, 25) +
    Math.min(docs * 0.12, 12),
  );
  const level = score < 40 ? "starter" : score < 75 ? "intermediate" : "advanced";
  const reasons = [
    `${input.fileTreeSummary.selectedFiles} evidence files selected from ${input.fileTreeSummary.totalFiles} repository files`,
    `${categories.size} skill categories and ${dependencyCount} recognized dependencies detected`,
    capabilityCategories.length ? `Architecture signals span ${capabilityCategories.join(", ")}` : "Few cross-cutting architecture signals were detected",
    `README quality contributes ${Math.round(docs * 0.12)} complexity points`,
  ];
  return { level, score, reasons };
}

export function extractSkills(input: ExtractorInput): DeterministicAnalysis {
  const skills = new Map<string, AccumulatedSkill>();
  const dependencies = parseDependencies(input.files);
  const allPaths = [...new Set([...input.fileTreeSummary.notablePaths, ...input.files.map((file) => file.path)])];
  const readmePath = input.files.find((file) => /(^|\/)readme(?:\.[^/]+)?$/i.test(file.path))?.path;
  const extensionCounts = new Map(input.fileTreeSummary.topExtensions.map((item) => [item.extension, item.count]));

  for (const language of languageExtensions) {
    if (language.repoLanguage && input.repo.language?.toLowerCase() === language.repoLanguage.toLowerCase()) {
      addSignal(skills, language.skill, "language", 4, `GitHub identifies ${language.repoLanguage} as the repository's primary language`);
    }
    const exactCount = extensionCounts.get(language.extension);
    const selectedPaths = input.files.filter((file) => file.path.toLowerCase().endsWith(language.extension)).map((file) => file.path);
    if (exactCount) addSignal(skills, language.skill, "language", Math.min(10, 2 + Math.log10(exactCount + 1) * 2), `Found ${exactCount} ${language.extension} file${exactCount === 1 ? "" : "s"} in the analyzable tree`, selectedPaths.slice(0, 5));
    else if (selectedPaths.length) addSignal(skills, language.skill, "language", 2 + selectedPaths.length, `Selected ${selectedPaths.length} ${language.extension} evidence file${selectedPaths.length === 1 ? "" : "s"}`, selectedPaths.slice(0, 5));
  }

  for (const rule of skillRules) {
    const matchedDependencies = (rule.dependencies ?? []).filter((name) => dependencies.has(name.toLowerCase()));
    matchedDependencies.forEach((name) => addSignal(skills, rule.skill, rule.category, 5, `Detected dependency ${name} in ${dependencies.get(name.toLowerCase())}`, [dependencies.get(name.toLowerCase()) as string]));

    if (rule.readme?.test(input.readmeSummaryInput)) addSignal(skills, rule.skill, rule.category, 1, `README mentions ${rule.skill}`, readmePath ? [readmePath] : []);

    const pathMatches = allPaths.filter((path) => rule.paths?.test(path)).slice(0, 5);
    if (pathMatches.length) addSignal(skills, rule.skill, rule.category, Math.min(5, 1 + pathMatches.length), `Found ${pathMatches.length} ${rule.skill}-related path${pathMatches.length === 1 ? "" : "s"}`, pathMatches);

    const codeMatches = input.files.filter((file) => rule.code?.test(file.contentPreview)).slice(0, 5);
    if (codeMatches.length) addSignal(skills, rule.skill, rule.category, Math.min(8, codeMatches.length * 3), `${codeMatches[0].path} contains ${rule.skill} implementation patterns`, codeMatches.map((file) => file.path));
  }

  if (input.readmeSummaryInput.length >= 300) {
    addSignal(skills, "README documentation", "product", Math.min(6, 2 + input.readmeSummaryInput.length / 1_500), `README contains ${input.readmeSummaryInput.length.toLocaleString()} characters of public project documentation`, readmePath ? [readmePath] : []);
  }

  const detectedSkills: SkillEvidence[] = [...skills.values()]
    .map((item) => {
      const sourceFiles = [...item.sourceFiles];
      const proficiency = item.strength >= 24 && sourceFiles.length >= 5 ? 5 : item.strength >= 16 && sourceFiles.length >= 3 ? 4 : item.strength >= 9 ? 3 : item.strength >= 5 ? 2 : 1;
      const rawConfidence = 22 + item.strength * 3.1 + Math.min(item.evidence.length, 4) * 3 + Math.min(sourceFiles.length, 5) * 2;
      const confidence = Math.min(confidenceCap(item.strength, item.evidence.length), clamp(rawConfidence));
      const reasoning = proficiency <= 1 ? "A weak public mention was found; implementation evidence is limited." : proficiency === 2 ? "A dependency, primary-language signal, or isolated implementation path supports this skill." : proficiency === 3 ? "Multiple independent repository signals support practical usage." : proficiency === 4 ? "Evidence appears across several files or strong project structures." : "Repeated implementation plus broad project structure indicates advanced usage.";
      return { skill: item.skill, category: item.category, proficiency, confidence, evidence: item.evidence.slice(0, 4), sourceFiles: sourceFiles.slice(0, 6), reasoning };
    })
    .filter((skill) => skill.confidence >= 28)
    .sort((a, b) => b.confidence - a.confidence || b.proficiency - a.proficiency || a.skill.localeCompare(b.skill));

  const qualitySignals = buildQualitySignals(input, detectedSkills, dependencies);
  const projectComplexity = scoreComplexity(input, detectedSkills, qualitySignals, dependencies.size);
  const domainClassification = classifyDomain(detectedSkills);
  const strongSkills = detectedSkills.filter((skill) => skill.confidence >= 55).length;
  const confidence = clamp(12 + Math.min(input.files.length * 5, 35) + Math.min(strongSkills * 3, 24) + (input.readmeSummaryInput.length >= 500 ? 12 : input.readmeSummaryInput.length ? 5 : 0) + Math.min(input.fileTreeSummary.totalFiles / 20, 12));

  return { detectedSkills, qualitySignals, projectComplexity, domainClassification, confidence };
}
