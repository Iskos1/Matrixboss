import { NextRequest } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import { compileLatex } from '@/lib/resume/latex';
import { fileExists, getFileStats, joinPath, readFile, resolveGeneratedDir } from '@/lib/storage/file-utils';
import { PATHS, LATEX_CONFIG } from '@/lib/config/constants';
import { handleError, notFound, json, error as errorResponse } from '@/lib/http/responses';

function isXelatexAvailable(): boolean {
  try { execSync('xelatex --version', { timeout: 5000, stdio: 'ignore' }); return true; }
  catch { return false; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, latexContent } = body;

    if (!isXelatexAvailable()) {
      const texContent = latexContent || (fileExists(joinPath(PATHS.RESUME_TEMPLATE)) ? readFile(joinPath(PATHS.RESUME_TEMPLATE)) : null);
      return errorResponse('PDF compilation requires xelatex, which is not installed on this server.', 503,
        JSON.stringify({ xelatexMissing: true, texContent, instructions: 'Install TeX Live (https://tug.org/texlive/) then run: xelatex -interaction=nonstopmode resume_template.tex' })
      );
    }

    let texFile = filename || 'resume_template.tex';
    let workingDir: string | undefined;

    if (texFile === 'resume_template.tex' || texFile === 'src/templates/resume_template.tex') {
      texFile = PATHS.RESUME_TEMPLATE;
    } else {
      workingDir = resolveGeneratedDir(texFile);
      if (latexContent && typeof latexContent === 'string') {
        fs.writeFileSync(`${workingDir}/${texFile}`, latexContent, 'utf-8');
      } else if (!fileExists(`${workingDir}/${texFile}`)) {
        return notFound('LaTeX file not found');
      }
    }

    const result = compileLatex(texFile, { timeout: LATEX_CONFIG.DEFAULT_TIMEOUT, workingDir });

    if (!result.success) {
      return errorResponse('PDF generation failed', 500, result.error || 'PDF file was not created. Check LaTeX syntax.');
    }

    return json({ success: true, filename: result.pdfFilename, size: getFileStats(result.pdfPath).size, message: 'Resume compiled successfully', output: result.output });
  } catch (error) {
    return handleError(error, 'Failed to compile resume');
  }
}

export async function GET() {
  try {
    const templatePath = joinPath(PATHS.RESUME_TEMPLATE);
    if (!fileExists(templatePath)) return notFound('Resume template not found');

    const pdfPath = joinPath(PATHS.RESUME_TEMPLATE_PDF);
    const pdfExists = fileExists(pdfPath);
    const pdfStats = pdfExists ? getFileStats(pdfPath) : null;

    return json({ template: readFile(templatePath), pdfExists, pdfSize: pdfStats?.size || 0, pdfModified: pdfStats?.mtime || null });
  } catch (error) {
    return handleError(error, 'Failed to read template');
  }
}
