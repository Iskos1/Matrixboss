import { NextRequest, NextResponse } from 'next/server';
import { fileExists, joinPath } from '@/lib/utils/file-utils';
import { FILE_PATTERNS, CONTENT_TYPES, PATHS } from '@/lib/constants';
import { handleApiError } from '@/lib/utils/error-utils';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const filename = searchParams.get('file');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Security: Only allow downloading files that match the pattern
    if (!FILE_PATTERNS.SAFE_DOWNLOAD.test(filename)) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    let filePath: string;

    // If it's a template file, look in src/templates/
    if (filename === 'resume_template.tex' || filename === 'resume_template.pdf') {
      filePath = joinPath(PATHS.RESUME_TEMPLATE.replace('.tex', filename.includes('.pdf') ? '.pdf' : '.tex'));
    } else {
      // First check generated/ directory
      const generatedPath = joinPath('generated', filename);
      if (fileExists(generatedPath)) {
        filePath = generatedPath;
      } else {
        // Fallback to root (legacy support)
        filePath = joinPath(filename);
      }
    }

    // Check if file exists
    if (!fileExists(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Determine content type
    let contentType: string;
    
    if (filename.endsWith('.pdf')) {
      contentType = CONTENT_TYPES.PDF;
    } else if (filename.endsWith('.json')) {
      contentType = CONTENT_TYPES.JSON;
    } else {
      contentType = CONTENT_TYPES.TEXT;
    }

    // Read file as buffer
    const fileContent = fs.readFileSync(filePath);

    // For PDFs in preview mode, display inline; otherwise download
    const disposition = filename.endsWith('.pdf') 
      ? 'inline' 
      : `attachment; filename="${filename}"`;

    return new NextResponse(fileContent as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error: any) {
    return handleApiError(error, 'Failed to download file');
  }
}
