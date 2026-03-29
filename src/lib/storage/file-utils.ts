import fs from 'fs';
import path from 'path';

export function getProjectRoot(): string { return process.cwd(); }

/**
 * Returns the writable root for generated files.
 * On Vercel serverless, /var/task is read-only — only /tmp is writable.
 * Locally, the project root is writable so we use that.
 */
export function getWritableRoot(): string {
  return process.env.VERCEL ? '/tmp' : getProjectRoot();
}

export function joinPath(...segments: string[]): string {
  if (segments.length > 0 && path.isAbsolute(segments[0])) return path.join(...segments);
  return path.join(getProjectRoot(), ...segments);
}

export function fileExists(filePath: string): boolean {
  return fs.existsSync(path.isAbsolute(filePath) ? filePath : joinPath(filePath));
}

export function readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
  const fullPath = path.isAbsolute(filePath) ? filePath : joinPath(filePath);
  if (!fileExists(fullPath)) throw new Error(`File not found: ${fullPath}`);
  return fs.readFileSync(fullPath, encoding);
}

export function readJsonFile<T = any>(filePath: string): T {
  return JSON.parse(readFile(filePath));
}

export function writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): void {
  const fullPath = path.isAbsolute(filePath) ? filePath : joinPath(filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content, encoding);
}

export function writeJsonFile(filePath: string, data: any, indent = 2): void {
  writeFile(filePath, JSON.stringify(data, null, indent));
}

export function getFileStats(filePath: string): fs.Stats {
  const fullPath = path.isAbsolute(filePath) ? filePath : joinPath(filePath);
  if (!fileExists(fullPath)) throw new Error(`File not found: ${fullPath}`);
  return fs.statSync(fullPath);
}

export function readDirectory(dirPath: string): string[] {
  const fullPath = path.isAbsolute(dirPath) ? dirPath : joinPath(dirPath);
  if (!fileExists(fullPath)) throw new Error(`Directory not found: ${fullPath}`);
  return fs.readdirSync(fullPath);
}

/**
 * Resolve the on-disk path for a generated resume/cover letter file.
 * On Vercel, runtime-generated files live under /tmp — check there first.
 * Falls back to the local project-root paths for development.
 */
export function resolveGeneratedPath(filename: string): string {
  if (process.env.VERCEL) {
    const inTmpResumes = path.join('/tmp', 'generated_resumes', filename);
    if (fs.existsSync(inTmpResumes)) return inTmpResumes;
    const inTmpGenerated = path.join('/tmp', 'generated', filename);
    if (fs.existsSync(inTmpGenerated)) return inTmpGenerated;
  }
  const inResumes = joinPath('generated_resumes', filename);
  if (fileExists(inResumes)) return inResumes;
  const inGenerated = joinPath('generated', filename);
  if (fileExists(inGenerated)) return inGenerated;
  return joinPath(filename);
}

/**
 * Resolve working directory for a generated file (for xelatex -output-directory).
 * On Vercel writes go under /tmp; locally they go under the project root.
 * Creates the directory if it doesn't exist yet.
 */
export function resolveGeneratedDir(filename: string): string {
  const root = getWritableRoot();
  const resumesDir = path.join(root, 'generated_resumes');
  const generatedDir = path.join(root, 'generated');
  if (fs.existsSync(path.join(resumesDir, filename))) return resumesDir;
  if (fs.existsSync(path.join(generatedDir, filename))) return generatedDir;
  if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });
  return resumesDir;
}
