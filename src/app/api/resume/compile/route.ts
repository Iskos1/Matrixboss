import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import { compileLatex } from '@/lib/utils/latex-utils';
import { fileExists, getFileStats, joinPath, readFile } from '@/lib/utils/file-utils';
import { PATHS, LATEX_CONFIG } from '@/lib/constants';
import { handleError, notFound, json, error as errorResponse } from '@/lib/api/responses';
import path from 'path';
import fs from 'fs';

/** Returns true if xelatex is available on this machine/server */
function isXelatexAvailable(): boolean {
  try {
    execSync('xelatex --version', { timeout: 5000, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check xelatex before doing anything else — gives a clear error on cloud servers
    if (!isXelatexAvailable()) {
      // Still read/save the .tex content so the user can download it
      const body = await request.json();
      const { latexContent, filename } = body;
      let texContent = latexContent;
      if (!texContent) {
        const templatePath = joinPath(PATHS.RESUME_TEMPLATE);
        if (fileExists(templatePath)) texContent = readFile(templatePath);
      }
      return errorResponse(
        'PDF compilation requires xelatex, which is not installed on this server.',
        503,
        JSON.stringify({
          xelatexMissing: true,
          texContent: texContent || null,
          instructions:
            'Install TeX Live locally (https://tug.org/texlive/) then run: ' +
            'xelatex -interaction=nonstopmode resume_template.tex',
        })
      );
    }

    const body = await request.json();
    const { filename, latexContent } = body;

    let texFile = filename || 'resume_template.tex';
    let workingDir: string | undefined;

    if (texFile === 'resume_template.tex' || texFile === 'src/templates/resume_template.tex') {
      texFile = PATHS.RESUME_TEMPLATE;
    } else {
      const generatedDir = joinPath('generated');
      const generatedResumesDir = joinPath('generated_resumes');
      const generatedPath = path.join(generatedDir, texFile);
      const generatedResumesPath = path.join(generatedResumesDir, texFile);
      if (fs.existsSync(generatedResumesPath)) {
        workingDir = generatedResumesDir;
      } else if (fs.existsSync(generatedPath)) {
        workingDir = generatedDir;
      }
    }

    const fullPath = workingDir ? path.join(workingDir, texFile) : joinPath(texFile);

    // If latexContent is provided, save it to the file before compiling
    if (latexContent && typeof latexContent === 'string') {
      if (!workingDir) {
        // File doesn't exist yet — default to generated_resumes
        workingDir = joinPath('generated_resumes');
        if (!fs.existsSync(workingDir)) fs.mkdirSync(workingDir, { recursive: true });
      }
      const savePath = path.join(workingDir, texFile);
      fs.writeFileSync(savePath, latexContent, 'utf-8');
    } else if (!fileExists(fullPath)) {
      return notFound('LaTeX file not found');
    }

    const result = compileLatex(texFile, {
      timeout: LATEX_CONFIG.DEFAULT_TIMEOUT,
      workingDir,
    });

    if (!result.success) {
      return errorResponse(
        'PDF generation failed',
        500,
        result.error || 'PDF file was not created. Check LaTeX syntax.'
      );
    }

    const stats = getFileStats(result.pdfPath);

    return json({
      success: true,
      filename: result.pdfFilename,
      size: stats.size,
      message: 'Resume compiled successfully',
      output: result.output,
    });
  } catch (error) {
    return handleError(error, 'Failed to compile resume');
  }
}

export async function GET() {
  try {
    const templatePath = joinPath(PATHS.RESUME_TEMPLATE);
    const pdfPath = joinPath(PATHS.RESUME_TEMPLATE_PDF);

    if (!fileExists(templatePath)) {
      return notFound('Resume template not found');
    }

    const templateContent = readFile(templatePath);
    const pdfExists = fileExists(pdfPath);
    let pdfStats = null;

    if (pdfExists) {
      pdfStats = getFileStats(pdfPath);
    }

    return json({
      template: templateContent,
      pdfExists,
      pdfSize: pdfStats?.size || 0,
      pdfModified: pdfStats?.mtime || null,
    });
  } catch (error) {
    return handleError(error, 'Failed to read template');
  }
}
