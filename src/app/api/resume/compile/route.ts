import { NextRequest, NextResponse } from 'next/server';
import { compileLatex } from '@/lib/utils/latex-utils';
import { fileExists, getFileStats, joinPath, readFile } from '@/lib/utils/file-utils';
import { PATHS, LATEX_CONFIG } from '@/lib/constants';
import { handleApiError } from '@/lib/utils/error-utils';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename } = body;

    // Determine which file to compile
    let texFile = filename || 'resume_template.tex';
    let workingDir: string | undefined;
    
    // If it's the default template, look in src/templates/
    if (texFile === 'resume_template.tex' || texFile === 'src/templates/resume_template.tex') {
      texFile = PATHS.RESUME_TEMPLATE;
    } else {
      // Check if it exists in generated/
      const generatedDir = joinPath('generated');
      const generatedPath = path.join(generatedDir, texFile);
      if (fs.existsSync(generatedPath)) {
        workingDir = generatedDir;
        // texFile is just the filename relative to workingDir
      }
      // If not in generated, assume it's in root or relative to root (legacy behavior)
    }
    
    // Verify file exists (helper for early return)
    const fullPath = workingDir ? path.join(workingDir, texFile) : joinPath(texFile);
    if (!fileExists(fullPath)) {
      return NextResponse.json(
        { error: 'LaTeX file not found' },
        { status: 404 }
      );
    }

    // Compile LaTeX
    const result = compileLatex(texFile, { 
      timeout: LATEX_CONFIG.DEFAULT_TIMEOUT,
      workingDir 
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'PDF generation failed',
          details: result.error || 'PDF file was not created. Check LaTeX syntax.',
          output: result.output
        },
        { status: 500 }
      );
    }

    // Get file stats
    const stats = getFileStats(result.pdfPath);

    return NextResponse.json({
      success: true,
      filename: result.pdfFilename,
      size: stats.size,
      message: 'Resume compiled successfully',
      output: result.output
    });

  } catch (error: any) {
    return handleApiError(error, 'Failed to compile resume');
  }
}

export async function GET(request: NextRequest) {
  try {
    const templatePath = joinPath(PATHS.RESUME_TEMPLATE);
    const pdfPath = joinPath(PATHS.RESUME_TEMPLATE_PDF);

    // Check if template exists
    if (!fileExists(templatePath)) {
      return NextResponse.json(
        { error: 'Resume template not found' },
        { status: 404 }
      );
    }

    // Read template content
    const templateContent = readFile(templatePath);

    // Check if PDF exists
    const pdfExists = fileExists(pdfPath);
    let pdfStats = null;

    if (pdfExists) {
      pdfStats = getFileStats(pdfPath);
    }

    return NextResponse.json({
      template: templateContent,
      pdfExists: pdfExists,
      pdfSize: pdfStats?.size || 0,
      pdfModified: pdfStats?.mtime || null,
    });

  } catch (error: any) {
    return handleApiError(error, 'Failed to read template');
  }
}
