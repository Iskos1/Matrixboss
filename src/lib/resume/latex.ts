import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getProjectRoot, fileExists, joinPath, getFileStats } from '@/lib/storage/file-utils';

export interface LatexCompileResult {
  success: boolean;
  pdfPath: string;
  pdfFilename: string;
  size?: number;
  output?: string;
  error?: string;
}

export function compileLatex(
  texFile: string,
  options: { timeout?: number; workingDir?: string } = {}
): LatexCompileResult {
  const workDir = options.workingDir || getProjectRoot();
  const timeout = options.timeout || 30000;

  let texPath = texFile;
  if (texFile === 'resume_template.tex' || texFile === 'src/templates/resume_template.tex') {
    texPath = 'src/templates/resume_template.tex';
  }

  const fullTexPath = options.workingDir ? joinPath(options.workingDir, texPath) : joinPath(texPath);

  if (!fileExists(fullTexPath)) {
    return { success: false, pdfPath: '', pdfFilename: '', error: `LaTeX file not found: ${fullTexPath}` };
  }

  const pdfFile = texPath.replace('.tex', '.pdf');
  const pdfPath = options.workingDir ? joinPath(options.workingDir, pdfFile) : joinPath(pdfFile);

  try {
    const texDir = texPath.includes('/') || texPath.includes('\\') ? path.dirname(texPath) : '.';
    const outputDirFlag = texDir !== '.' ? `-output-directory="${texDir}"` : '';
    const output = execSync(
      `cd "${workDir}" && xelatex -interaction=nonstopmode ${outputDirFlag} "${texPath}"`,
      { encoding: 'utf-8', timeout }
    );

    if (!fileExists(pdfPath)) {
      return { success: false, pdfPath: '', pdfFilename: pdfFile, error: 'PDF file was not created. Check LaTeX syntax.', output: output.substring(0, 500) };
    }

    return { success: true, pdfPath, pdfFilename: pdfFile, size: getFileStats(pdfPath).size, output: output.substring(0, 500) };
  } catch (execError: any) {
    if (fileExists(pdfPath)) {
      return { success: true, pdfPath, pdfFilename: pdfFile, size: getFileStats(pdfPath).size, output: execError.stdout || execError.stderr || execError.message };
    }
    return { success: false, pdfPath: '', pdfFilename: pdfFile, error: execError.message, output: execError.stdout || execError.stderr };
  }
}

export function cleanupLatexArtifacts(baseFilename: string, workingDir?: string): void {
  for (const ext of ['.aux', '.log', '.out']) {
    const p = workingDir ? joinPath(workingDir, `${baseFilename}${ext}`) : joinPath(`${baseFilename}${ext}`);
    if (fileExists(p)) {
      try { fs.unlinkSync(p); } catch (e) { console.warn(`Failed to delete ${p}:`, e); }
    }
  }
}
