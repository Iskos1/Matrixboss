import { NextRequest, NextResponse } from 'next/server';
import { fileExists, joinPath } from '@/lib/utils/file-utils';
import { FILE_PATTERNS, CONTENT_TYPES, PATHS } from '@/lib/constants';
import { handleError, badRequest, notFound } from '@/lib/api/responses';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const filename = request.nextUrl.searchParams.get('file');

    if (!filename) {
      return badRequest('Filename is required');
    }

    // Security: Only allow downloading files that match the safe pattern
    if (!FILE_PATTERNS.SAFE_DOWNLOAD.test(filename)) {
      return badRequest('Invalid filename');
    }

    let filePath: string;

    if (filename === 'resume_template.tex' || filename === 'resume_template.pdf') {
      filePath = joinPath(PATHS.RESUME_TEMPLATE.replace('.tex', filename.includes('.pdf') ? '.pdf' : '.tex'));
    } else {
      const generatedPath = joinPath('generated', filename);
      const generatedResumesPath = joinPath('generated_resumes', filename);
      
      if (fileExists(generatedResumesPath)) {
        filePath = generatedResumesPath;
      } else if (fileExists(generatedPath)) {
        filePath = generatedPath;
      } else {
        filePath = joinPath(filename);
      }
    }

    if (!fileExists(filePath)) {
      return notFound('File not found');
    }

    let contentType: string;
    if (filename.endsWith('.pdf')) {
      contentType = CONTENT_TYPES.PDF;
    } else if (filename.endsWith('.json')) {
      contentType = CONTENT_TYPES.JSON;
    } else {
      contentType = CONTENT_TYPES.TEXT;
    }

    const fileContent = fs.readFileSync(filePath);
    const disposition = filename.endsWith('.pdf')
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`;

    return new NextResponse(new Uint8Array(fileContent), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleError(error, 'Failed to download file');
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const filename = request.nextUrl.searchParams.get('file');

    if (!filename) {
      return new NextResponse(null, { status: 400 });
    }

    if (!FILE_PATTERNS.SAFE_DOWNLOAD.test(filename)) {
      return new NextResponse(null, { status: 400 });
    }

    let filePath: string;

    if (filename === 'resume_template.tex' || filename === 'resume_template.pdf') {
      filePath = joinPath(PATHS.RESUME_TEMPLATE.replace('.tex', filename.includes('.pdf') ? '.pdf' : '.tex'));
    } else {
      const generatedPath = joinPath('generated', filename);
      const generatedResumesPath = joinPath('generated_resumes', filename);

      if (fileExists(generatedResumesPath)) {
        filePath = generatedResumesPath;
      } else if (fileExists(generatedPath)) {
        filePath = generatedPath;
      } else {
        filePath = joinPath(filename);
      }
    }

    if (!fileExists(filePath)) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': filename.endsWith('.pdf') ? CONTENT_TYPES.PDF : CONTENT_TYPES.TEXT,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
