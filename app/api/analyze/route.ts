import { NextResponse } from "next/server";
import { findSeedJob, seedJobs } from "@/data/seed-jobs";
import {
  fetchReadme,
  fetchRepoMetadata,
  fetchRepoTree,
  fetchSelectedFiles,
  getExtension,
  isRelevantFile,
  parseGitHubUrl,
  selectRelevantFiles,
} from "@/lib/github";
import type { AnalyzeErrorResponse, AnalyzeSuccessResponse } from "@/types/project-dna";
import { extractSkills } from "@/lib/skill-extractor";
import { matchOpportunities } from "@/lib/opportunity-matcher";
import { generatePortfolioProject } from "@/lib/project-generator";
import { generateEvidencePacket } from "@/lib/evidence-packet";

export const runtime = "nodejs";

interface AnalyzeRequestBody {
  repoUrl?: unknown;
  targetRole?: unknown;
}

export async function POST(request: Request) {
  try {
    let body: AnalyzeRequestBody;
    try {
      body = (await request.json()) as AnalyzeRequestBody;
    } catch {
      return NextResponse.json<AnalyzeErrorResponse>({ success: false, error: "Request body must be valid JSON." }, { status: 400 });
    }

    if (typeof body.repoUrl !== "string" || !body.repoUrl.toLowerCase().includes("github.com")) {
      return NextResponse.json<AnalyzeErrorResponse>({ success: false, error: "Please enter a valid public GitHub repository URL." }, { status: 400 });
    }
    if (typeof body.targetRole !== "string") {
      return NextResponse.json<AnalyzeErrorResponse>({ success: false, error: "Select a valid target role." }, { status: 400 });
    }

    const targetJob = findSeedJob(body.targetRole);
    if (!targetJob) {
      return NextResponse.json<AnalyzeErrorResponse>({ success: false, error: "The selected target role is not available." }, { status: 400 });
    }

    const { owner, repo } = parseGitHubUrl(body.repoUrl);
    const metadata = await fetchRepoMetadata(owner, repo);
    const [readme, treeResponse] = await Promise.all([
      fetchReadme(owner, repo),
      fetchRepoTree(owner, repo, metadata.default_branch),
    ]);

    const blobs = treeResponse.tree.filter((item) => item.type === "blob");
    const selectedTreeFiles = selectRelevantFiles(blobs);
    const files = await fetchSelectedFiles(owner, repo, metadata.default_branch, selectedTreeFiles.map((file) => file.path));

    const extensionCounts = new Map<string, number>();
    for (const file of blobs.filter(isRelevantFile)) {
      const extension = getExtension(file.path);
      if (extension !== "[none]") extensionCounts.set(extension, (extensionCounts.get(extension) ?? 0) + 1);
    }
    const topExtensions = [...extensionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([extension, count]) => ({ extension, count }));

    const blobPaths = blobs.map((file) => file.path);
    const configPaths = blobPaths.filter((path) => /^\.github\/workflows\/|(^|\/)(package\.json|requirements\.txt|pyproject\.toml|dockerfile[^/]*|vercel\.json)$/i.test(path)).slice(0, 30);
    const testPaths = blobPaths.filter((path) => /(^|\/)(tests?|__tests__|specs?)(\/|\.)|\.(test|spec)\.[jt]sx?$/i.test(path)).slice(0, 30);
    const sourcePaths = blobPaths.filter((path) => /(^|\/)(src|lib|server|app|pages|api|routes?|components?)(\/|$)/i.test(path)).slice(0, 60);
    const notablePaths = [...new Set([...configPaths, ...testPaths, ...sourcePaths])].slice(0, 120);

    const repoData = {
      owner,
      name: metadata.name,
      fullName: metadata.full_name,
      description: metadata.description,
      stars: metadata.stargazers_count,
      forks: metadata.forks_count,
      language: metadata.language,
      defaultBranch: metadata.default_branch,
      url: metadata.html_url,
    };
    const fileTreeSummary = { totalFiles: blobs.length, selectedFiles: files.length, topExtensions, notablePaths };
    const analysis = extractSkills({ repo: repoData, readmeSummaryInput: readme, files, fileTreeSummary });
    const opportunity = matchOpportunities({
      detectedSkills: analysis.detectedSkills,
      qualitySignals: analysis.qualitySignals,
      projectComplexity: analysis.projectComplexity,
      domainClassification: analysis.domainClassification,
      targetRole: targetJob,
      allJobs: seedJobs,
    });
    const portfolioProject = generatePortfolioProject({
      targetJob,
      targetMatch: opportunity.targetMatch,
      gapAnalysis: opportunity.gapAnalysis,
      detectedSkills: analysis.detectedSkills,
      qualitySignals: analysis.qualitySignals,
      projectComplexity: analysis.projectComplexity,
      domainClassification: analysis.domainClassification,
    });
    const evidencePacket = generateEvidencePacket({ repo: repoData, analysis, opportunity, portfolioProject, targetJob });

    const response: AnalyzeSuccessResponse = {
      success: true,
      analysisMode: "live",
      generatedAt: new Date().toISOString(),
      repo: repoData,
      readmeSummaryInput: readme,
      files,
      fileTreeSummary,
      targetJob,
      analysis,
      opportunity,
      portfolioProject,
      evidencePacket,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not analyze this repository.";
    const status = message.includes("not found") ? 404 : message.includes("rate limit") ? 429 : 400;
    const publicMessage = status === 429
      ? "GitHub rate limit reached. Try Demo Snapshot or wait before retrying live analysis."
      : status === 404
        ? "Repository not found or not public."
        : message;
    return NextResponse.json<AnalyzeErrorResponse>({ success: false, error: publicMessage }, { status });
  }
}
