import { NextRequest } from 'next/server';
import { compileLatex } from '@/lib/resume/latex';
import { readFile, writeFile, fileExists, getFileStats, joinPath } from '@/lib/storage/file-utils';
import { PATHS, LATEX_CONFIG } from '@/lib/config/constants';
import { handleError, badRequest, notFound, json } from '@/lib/http/responses';

// GET: Fetch template content
export async function GET() {
  try {
    const templatePath = joinPath(PATHS.RESUME_TEMPLATE);

    if (!fileExists(templatePath)) {
      return notFound('Resume template not found');
    }

    const templateContent = readFile(templatePath);

    return json({ content: templateContent, success: true });
  } catch (error) {
    return handleError(error, 'Failed to read template');
  }
}

// POST: Update template content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, autoCompile } = body;

    if (!content) {
      return badRequest('Template content is required');
    }

    const templatePath = joinPath(PATHS.RESUME_TEMPLATE);
    writeFile(templatePath, content);

    let pdfCompiled = false;
    let pdfSize = 0;
    let compilationError = null;

    if (autoCompile) {
      const compileResult = compileLatex(PATHS.RESUME_TEMPLATE, { timeout: LATEX_CONFIG.DEFAULT_TIMEOUT });
      if (compileResult.success) {
        pdfCompiled = true;
        const stats = getFileStats(compileResult.pdfPath);
        pdfSize = stats.size;
      } else {
        compilationError = compileResult.error || 'Compilation failed';
      }
    }

    return json({
      success: true,
      message: 'Template updated successfully',
      pdfCompiled,
      pdfSize,
      compilationError,
    });
  } catch (error) {
    return handleError(error, 'Failed to update template');
  }
}
