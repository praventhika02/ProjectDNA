import { NextResponse } from "next/server";
import { findSeedJob } from "@/data/seed-jobs";
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
      return NextResponse.json<AnalyzeErrorResponse>({ success: false, error: "Enter a valid github.com repository URL." }, { status: 400 });
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

    const response: AnalyzeSuccessResponse = {
      success: true,
      repo: {
        owner,
        name: metadata.name,
        fullName: metadata.full_name,
        description: metadata.description,
        stars: metadata.stargazers_count,
        forks: metadata.forks_count,
        language: metadata.language,
        defaultBranch: metadata.default_branch,
        url: metadata.html_url,
      },
      readmeSummaryInput: readme,
      files,
      fileTreeSummary: { totalFiles: blobs.length, selectedFiles: files.length, topExtensions },
      targetJob,
    };

    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not analyze this repository.";
    const status = message.includes("not found") ? 404 : message.includes("rate limit") ? 429 : 400;
    return NextResponse.json<AnalyzeErrorResponse>({ success: false, error: message }, { status });
  }
}
