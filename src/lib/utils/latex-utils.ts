import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getProjectRoot, fileExists, joinPath, readFile, getFileStats } from './file-utils';

export interface LatexCompileResult {
  success: boolean;
  pdfPath: string;
  pdfFilename: string;
  size?: number;
  output?: string;
  error?: string;
}

export interface GeneratedFiles {
  texFile: string;
  pdfFile: string | null;
  coverLetterTex?: string;
  coverLetterPdf?: string | null;
  analysisFile?: string;
}

/**
 * Compile a LaTeX file to PDF using xelatex
 */
export function compileLatex(
  texFile: string,
  options: {
    timeout?: number;
    workingDir?: string;
  } = {}
): LatexCompileResult {
  const workDir = options.workingDir || getProjectRoot();
  const timeout = options.timeout || 30000;
  
  // Resolve tex file path
  let texPath = texFile;
  if (!texFile.includes('/') && !texFile.includes('\\')) {
    // If it's just a filename, check if it's in templates directory
    if (texFile === 'resume_template.tex' || texFile === 'src/templates/resume_template.tex') {
      texPath = 'src/templates/resume_template.tex';
    }
  }
  
  // If workingDir is specified, we assume texFile is relative to it or absolute
  // If no workingDir, we check relative to project root
  
  const fullTexPath = options.workingDir ? joinPath(options.workingDir, texPath) : joinPath(texPath);
  
  if (!fileExists(fullTexPath)) {
    return {
      success: false,
      pdfPath: '',
      pdfFilename: '',
      error: `LaTeX file not found: ${fullTexPath}`,
    };
  }

  try {
    // Compile with xelatex
    // Use -output-directory so the PDF (and aux files) go into the same folder
    // as the .tex source file, regardless of the current working directory.
    const texDir = texPath.includes('/') || texPath.includes('\\')
      ? path.dirname(texPath)
      : '.';

    const outputDirFlag = texDir !== '.' ? `-output-directory="${texDir}"` : '';
    const command = `cd "${workDir}" && xelatex -interaction=nonstopmode ${outputDirFlag} "${texPath}"`;
    
    const result = execSync(command, {
      encoding: 'utf-8',
      timeout,
    });

    // Check if PDF was generated – it lands in texDir (same dir as the .tex)
    const pdfFile = texPath.replace('.tex', '.pdf');
    const pdfPath = options.workingDir ? joinPath(options.workingDir, pdfFile) : joinPath(pdfFile);

    if (!fileExists(pdfPath)) {
      return {
        success: false,
        pdfPath: '',
        pdfFilename: pdfFile,
        error: 'PDF file was not created. Check LaTeX syntax.',
        output: result.substring(0, 500),
      };
    }

    // Get file stats
    const stats = getFileStats(pdfPath);

    return {
      success: true,
      pdfPath,
      pdfFilename: pdfFile,
      size: stats.size,
      output: result.substring(0, 500),
    };
  } catch (execError: any) {
    return {
      success: false,
      pdfPath: '',
      pdfFilename: texPath.replace('.tex', '.pdf'),
      error: execError.message,
      output: execError.stdout || execError.stderr,
    };
  }
}

/**
 * Find generated resume files in the project root
 */
export function findGeneratedResumeFiles(prefix: string = 'tailored_resume_'): GeneratedFiles | null {
  const projectRoot = getProjectRoot();
  const files = fs.readdirSync(projectRoot);
  
  // Find the latest tex file matching the prefix
  const texFiles = files
    .filter((f: string) => f.startsWith(prefix) && f.endsWith('.tex'))
    .sort()
    .reverse();
  
  if (texFiles.length === 0) {
    return null;
  }
  
  const latestTexFile = texFiles[0];
  const pdfFile = latestTexFile.replace('.tex', '.pdf');
  const pdfExists = fileExists(joinPath(pdfFile));
  
  // Check for cover letter
  const coverLetterTex = latestTexFile.replace('tailored_resume_', 'tailored_cover_letter_');
  const coverLetterPdf = coverLetterTex.replace('.tex', '.pdf');
  const coverLetterExists = fileExists(joinPath(coverLetterTex));
  const coverLetterPdfExists = fileExists(joinPath(coverLetterPdf));
  
  // Check for analysis file
  const analysisFile = latestTexFile.replace('.tex', '_analysis.json');
  const analysisExists = fileExists(joinPath(analysisFile));
  
  return {
    texFile: latestTexFile,
    pdfFile: pdfExists ? pdfFile : null,
    coverLetterTex: coverLetterExists ? coverLetterTex : undefined,
    coverLetterPdf: coverLetterPdfExists ? coverLetterPdf : undefined,
    analysisFile: analysisExists ? analysisFile : undefined,
  };
}

/**
 * Read analysis file if it exists
 */
export function readAnalysisFile(analysisFile: string): any | null {
  try {
    if (fileExists(joinPath(analysisFile))) {
      return readFile(joinPath(analysisFile));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clean up LaTeX build artifacts (.aux, .log, .out files)
 */
export function cleanupLatexArtifacts(baseFilename: string, workingDir?: string): void {
  const artifacts = ['.aux', '.log', '.out'];
  
  artifacts.forEach(ext => {
    // If workingDir is provided, use it. Otherwise use project root via joinPath default behavior (if baseFilename is relative)
    // Actually joinPath joins with projectRoot if path is relative. 
    // If workingDir is provided, we should join with workingDir.
    
    let artifactPath: string;
    if (workingDir) {
        // We need to import path or use joinPath carefully. 
        // joinPath uses getProjectRoot() internally if we don't handle it.
        // Let's assume joinPath joins arguments. The implementation of joinPath is in file-utils.
        // Assuming file-utils joinPath joins arguments relative to root.
        // Let's just use path.join if we have workingDir, but we don't have path imported here.
        // Let's rely on the previous pattern: 
        artifactPath = joinPath(workingDir, `${baseFilename}${ext}`);
    } else {
        artifactPath = joinPath(`${baseFilename}${ext}`);
    }

    if (fileExists(artifactPath)) {
      try {
        fs.unlinkSync(artifactPath);
      } catch (error) {
        console.warn(`Failed to delete artifact ${artifactPath}:`, error);
      }
    }
  });
}
