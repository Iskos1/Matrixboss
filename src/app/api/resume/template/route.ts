import { NextRequest, NextResponse } from 'next/server';
import { compileLatex } from '@/lib/utils/latex-utils';
import { readFile, writeFile, fileExists, getFileStats, joinPath } from '@/lib/utils/file-utils';
import { PATHS, LATEX_CONFIG } from '@/lib/constants';
import { handleApiError } from '@/lib/utils/error-utils';

// GET: Fetch template content
export async function GET(request: NextRequest) {
  try {
    const templatePath = joinPath(PATHS.RESUME_TEMPLATE);

    if (!fileExists(templatePath)) {
      return NextResponse.json(
        { error: 'Resume template not found' },
        { status: 404 }
      );
    }

    const templateContent = readFile(templatePath);

    return NextResponse.json({
      content: templateContent,
      success: true,
    });
  } catch (error: any) {
    return handleApiError(error, 'Failed to read template');
  }
}

// POST: Update template content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, autoCompile } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Template content is required' },
        { status: 400 }
      );
    }

    const templatePath = joinPath(PATHS.RESUME_TEMPLATE);

    // Save the updated content
    writeFile(templatePath, content);

    let pdfCompiled = false;
    let pdfSize = 0;
    let compilationError = null;

    // Auto-compile if requested
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

    return NextResponse.json({
      success: true,
      message: 'Template updated successfully',
      pdfCompiled,
      pdfSize,
      compilationError,
    });
  } catch (error: any) {
    return handleApiError(error, 'Failed to update template');
  }
}
