import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { fileExists, joinPath, resolveGeneratedPath } from '@/lib/storage/file-utils';
import { FILE_PATTERNS, CONTENT_TYPES, PATHS } from '@/lib/config/constants';
import { handleError, badRequest, notFound } from '@/lib/http/responses';

function resolveFilePath(filename: string): string {
  if (filename === 'resume_template.tex' || filename === 'resume_template.pdf') {
    return joinPath(PATHS.RESUME_TEMPLATE.replace('.tex', filename.endsWith('.pdf') ? '.pdf' : '.tex'));
  }
  return resolveGeneratedPath(filename);
}

function contentType(filename: string): string {
  if (filename.endsWith('.pdf')) return CONTENT_TYPES.PDF;
  if (filename.endsWith('.json')) return CONTENT_TYPES.JSON;
  return CONTENT_TYPES.TEXT;
}

export async function GET(request: NextRequest) {
  try {
    const filename = request.nextUrl.searchParams.get('file');
    if (!filename) return badRequest('Filename is required');
    if (!FILE_PATTERNS.SAFE_DOWNLOAD.test(filename)) return badRequest('Invalid filename');

    const filePath = resolveFilePath(filename);
    if (!fileExists(filePath)) return notFound('File not found');

    const ct = contentType(filename);
    const disposition = filename.endsWith('.pdf') ? `inline; filename="${filename}"` : `attachment; filename="${filename}"`;

    return new NextResponse(new Uint8Array(fs.readFileSync(filePath)), {
      status: 200,
      headers: {
        'Content-Type': ct,
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
    if (!filename || !FILE_PATTERNS.SAFE_DOWNLOAD.test(filename)) return new NextResponse(null, { status: 400 });

    const filePath = resolveFilePath(filename);
    if (!fileExists(filePath)) return new NextResponse(null, { status: 404 });

    return new NextResponse(null, {
      status: 200,
      headers: { 'Content-Type': contentType(filename), 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
