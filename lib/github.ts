import type { RepoFileEvidence } from "@/types/project-dna";

const GITHUB_API = "https://api.github.com";
const MAX_SELECTED_FILES = 8;
const MAX_FILE_CHARS = 4_000;
const MAX_README_CHARS = 6_000;
const MAX_FETCHABLE_FILE_BYTES = 250_000;

export const preferredExtensions = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".ipynb", ".java", ".cs", ".go", ".rs", ".sql", ".md", ".json", ".yml", ".yaml", ".html", ".css", ".toml",
]);

const ignoredSegments = new Set(["node_modules", "dist", "build", ".next", "public", "coverage", "vendor", "target"]);
const ignoredFiles = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?|composer\.lock|cargo\.lock)$/i;

export interface GitHubRepoMetadata {
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  default_branch: string;
  html_url: string;
  private: boolean;
}

export interface GitHubTreeItem {
  path: string;
  type: "blob" | "tree" | "commit";
  size?: number;
  sha: string;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

interface GitHubContentResponse {
  type: string;
  size: number;
  encoding?: string;
  content?: string;
}

function githubHeaders(accept = "application/vnd.github+json"): HeadersInit {
  return {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ProjectDNA-Hackathon-MVP",
  };
}

async function githubFetch<T>(path: string, accept?: string): Promise<T> {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders(accept),
    cache: "no-store",
  });

  if (!response.ok) {
    const remaining = response.headers.get("x-ratelimit-remaining");
    if (response.status === 403 && remaining === "0") {
      throw new Error("GitHub API rate limit reached. Please wait before trying another repository.");
    }
    if (response.status === 404) {
      throw new Error("Repository not found. Check that it exists and is public.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("GitHub could not access this repository. It may be private or unavailable.");
    }
    throw new Error(`GitHub API request failed (${response.status}). Please try again.`);
  }

  return response.json() as Promise<T>;
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error("Enter a valid GitHub repository URL.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Enter a valid GitHub repository URL.");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname !== "github.com" && hostname !== "www.github.com") {
    throw new Error("The repository URL must be hosted on github.com.");
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new Error("GitHub URL must include both an owner and repository name.");
  }

  const owner = decodeURIComponent(segments[0]);
  const repo = decodeURIComponent(segments[1]).replace(/\.git$/i, "");
  const validPart = /^[A-Za-z0-9_.-]+$/;
  if (!owner || !repo || !validPart.test(owner) || !validPart.test(repo)) {
    throw new Error("GitHub URL contains an invalid owner or repository name.");
  }

  return { owner, repo };
}

export async function fetchRepoMetadata(owner: string, repo: string): Promise<GitHubRepoMetadata> {
  const metadata = await githubFetch<GitHubRepoMetadata>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  if (metadata.private) {
    throw new Error("Private repositories are not supported in this prototype.");
  }
  return metadata;
}

export async function fetchReadme(owner: string, repo: string): Promise<string> {
  try {
    const data = await githubFetch<GitHubContentResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`);
    if (data.encoding !== "base64" || !data.content) return "";
    return Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8").slice(0, MAX_README_CHARS);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Repository not found")) return "";
    throw error;
  }
}

export async function fetchRepoTree(owner: string, repo: string, defaultBranch: string): Promise<GitHubTreeResponse> {
  return githubFetch<GitHubTreeResponse>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`);
}

export function getExtension(path: string): string {
  const filename = path.split("/").pop() ?? "";
  const dotIndex = filename.lastIndexOf(".");
  return dotIndex > 0 ? filename.slice(dotIndex).toLowerCase() : "[none]";
}

export function isRelevantFile(file: GitHubTreeItem): boolean {
  if (file.type !== "blob" || !file.size || file.size > MAX_FETCHABLE_FILE_BYTES) return false;
  const lowerPath = file.path.toLowerCase();
  if (lowerPath.split("/").some((segment) => ignoredSegments.has(segment))) return false;
  if (ignoredFiles.test(lowerPath)) return false;
  const filename = lowerPath.split("/").pop() ?? "";
  const evidenceManifest = filename === "requirements.txt" || filename.startsWith("dockerfile") || filename === "makefile";
  return evidenceManifest || preferredExtensions.has(getExtension(lowerPath));
}

export function selectRelevantFiles(tree: GitHubTreeItem[]): GitHubTreeItem[] {
  const priorityNames = /(^|\/)(readme|package|tsconfig|requirements|pyproject|schema|main|index|app|page|route|dockerfile)(\.|$)/i;
  const testPath = /(^|\/)(__tests__|tests?|specs?)(\/|\.)/i;

  return tree
    .filter(isRelevantFile)
    .map((file) => {
      const depth = file.path.split("/").length - 1;
      const extension = getExtension(file.path);
      let score = 50 - Math.min(depth * 3, 15);
      if (priorityNames.test(file.path)) score += depth <= 1 ? 24 : 8;
      if (/(^|\/)(src|lib|app|server|api|routes?)(\/|$)/i.test(file.path)) score += 10;
      if (testPath.test(file.path)) score -= 4;
      if ([".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go", ".rs", ".sql"].includes(extension)) score += 8;
      if (extension === ".json" || extension === ".md") score -= 5;
      return { file, score };
    })
    .sort((a, b) => b.score - a.score || a.file.path.localeCompare(b.file.path))
    .slice(0, MAX_SELECTED_FILES)
    .map(({ file }) => file);
}

function languageFromPath(path: string): string {
  const labels: Record<string, string> = {
    ".ts": "TypeScript", ".tsx": "TypeScript React", ".js": "JavaScript", ".jsx": "JavaScript React", ".py": "Python", ".ipynb": "Jupyter Notebook", ".java": "Java", ".cs": "C#", ".go": "Go", ".rs": "Rust", ".sql": "SQL", ".md": "Markdown", ".json": "JSON", ".yml": "YAML", ".yaml": "YAML",
  };
  return labels[getExtension(path)] ?? "Text";
}

export async function fetchSelectedFiles(
  owner: string,
  repo: string,
  defaultBranch: string,
  filePaths: string[],
): Promise<RepoFileEvidence[]> {
  const uniquePaths = [...new Set(filePaths)].slice(0, MAX_SELECTED_FILES);
  const results = await Promise.all(
    uniquePaths.map(async (path): Promise<RepoFileEvidence | null> => {
      try {
        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        const data = await githubFetch<GitHubContentResponse>(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(defaultBranch)}`,
        );
        if (data.type !== "file" || data.encoding !== "base64" || !data.content) return null;
        const content = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8");
        if (content.includes("\u0000")) return null;
        return { path, language: languageFromPath(path), size: data.size, contentPreview: content.slice(0, MAX_FILE_CHARS) };
      } catch {
        return null;
      }
    }),
  );
  return results.filter((file): file is RepoFileEvidence => file !== null);
}
