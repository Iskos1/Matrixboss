import fs from 'fs';
import path from 'path';

/**
 * Get the project root directory
 */
export function getProjectRoot(): string {
  return process.cwd();
}

/**
 * Join paths relative to project root, or absolute if first segment is absolute
 */
export function joinPath(...segments: string[]): string {
  if (segments.length > 0 && path.isAbsolute(segments[0])) {
    return path.join(...segments);
  }
  return path.join(getProjectRoot(), ...segments);
}

/**
 * Check if a file exists
 */
export function fileExists(filePath: string): boolean {
  const fullPath = path.isAbsolute(filePath) ? filePath : joinPath(filePath);
  return fs.existsSync(fullPath);
}

/**
 * Read a file as text
 */
export function readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
  const fullPath = path.isAbsolute(filePath) ? filePath : joinPath(filePath);
  if (!fileExists(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, encoding);
}

/**
 * Read a file as JSON
 */
export function readJsonFile<T = any>(filePath: string): T {
  const content = readFile(filePath);
  return JSON.parse(content);
}

/**
 * Write a file
 */
export function writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): void {
  const fullPath = path.isAbsolute(filePath) ? filePath : joinPath(filePath);
  const dir = path.dirname(fullPath);
  
  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, encoding);
}

/**
 * Write a JSON file with formatting
 */
export function writeJsonFile(filePath: string, data: any, indent: number = 2): void {
  writeFile(filePath, JSON.stringify(data, null, indent));
}

/**
 * Get file stats
 */
export function getFileStats(filePath: string): fs.Stats {
  const fullPath = path.isAbsolute(filePath) ? filePath : joinPath(filePath);
  if (!fileExists(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fs.statSync(fullPath);
}

/**
 * Read directory contents
 */
export function readDirectory(dirPath: string): string[] {
  const fullPath = path.isAbsolute(dirPath) ? dirPath : joinPath(dirPath);
  if (!fileExists(fullPath)) {
    throw new Error(`Directory not found: ${fullPath}`);
  }
  return fs.readdirSync(fullPath);
}
