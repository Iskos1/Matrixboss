/**
 * GitHub Contents API helpers — commit files directly to the repo from the browser.
 * Used on GitHub Pages (static deployment) where there is no backend.
 */

const GITHUB_REPO = "Iskos1/Matrixboss";
const GITHUB_BRANCH = "main";
const API_BASE = "https://api.github.com";

/** Encode a string to base64, safely handling Unicode */
function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/** Get the current SHA of a file (required for updates). Returns undefined if the file doesn't exist yet. */
async function getFileSha(token: string, path: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `${API_BASE}/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" } }
    );
    if (res.ok) {
      const data = await res.json();
      return data.sha as string;
    }
  } catch { /* file doesn't exist or network error */ }
  return undefined;
}

/** Commit a single file to the repo via the GitHub Contents API */
async function commitFile(
  token: string,
  path: string,
  base64Content: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const sha = await getFileSha(token, path);
  const body: Record<string, string> = { message, content: base64Content, branch: GITHUB_BRANCH };
  if (sha) body.sha = sha;

  const res = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as any).message || `HTTP ${res.status}`;
    if (res.status === 401) return { success: false, error: "Invalid token — make sure it has 'Contents: Read & Write' permission." };
    if (res.status === 403) return { success: false, error: "Permission denied — token may not have write access to this repo." };
    return { success: false, error: msg };
  }

  return { success: true };
}

/**
 * Commit a profile image file to public/profile.{ext} and return the public path.
 * The file object is read as a data URL, then the raw base64 is extracted.
 */
export async function commitProfileImage(
  token: string,
  file: File
): Promise<{ success: boolean; avatarPath?: string; error?: string }> {
  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1];
  const repoPath = `public/profile.${ext}`;

  const base64DataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Strip "data:image/...;base64," prefix
  const rawBase64 = base64DataUrl.split(",")[1];

  // Remove any old profile images with other extensions
  for (const oldExt of ["jpg", "png", "webp", "gif"]) {
    if (oldExt === ext) continue;
    const oldPath = `public/profile.${oldExt}`;
    const oldSha = await getFileSha(token, oldPath);
    if (oldSha) {
      await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${oldPath}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Remove old profile photo", sha: oldSha, branch: GITHUB_BRANCH }),
      }).catch(() => {});
    }
  }

  const result = await commitFile(token, repoPath, rawBase64, "Update profile photo");
  if (!result.success) return result;

  return { success: true, avatarPath: `/profile.${ext}` };
}

/**
 * Commit an updated portfolio.json to src/data/portfolio.json.
 */
export async function commitPortfolioJson(
  token: string,
  data: object
): Promise<{ success: boolean; error?: string }> {
  const path = "src/data/portfolio.json";
  const content = toBase64(JSON.stringify(data, null, 2));
  return commitFile(token, path, content, "Update portfolio data");
}

/** Basic validation that a string looks like a GitHub PAT */
export function isValidGitHubToken(token: string): boolean {
  return token.startsWith("ghp_") || token.startsWith("github_pat_");
}
