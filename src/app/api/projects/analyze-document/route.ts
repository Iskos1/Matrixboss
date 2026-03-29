import { NextRequest } from 'next/server';
import { generate, parseAIJson } from '@/lib/ai/anthropic';
import { fileExists, joinPath } from '@/lib/storage/file-utils';
import { handleError, badRequest, notFound, json } from '@/lib/http/responses';
import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

interface DocumentAnalysis {
  summary: string;
  key_achievements: string[];
  technical_details: string[];
  skills_demonstrated: string[];
  metrics_and_results: string[];
  relevant_for_roles: string[];
  resume_talking_points: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentPath, projectTitle, projectContext } = body;

    if (!documentPath) {
      return badRequest('Document path is required');
    }

    const filePath = joinPath('public', documentPath);

    if (!fileExists(filePath)) {
      return notFound('Document not found');
    }

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = getMimeType(documentPath);

    const promptText = `Analyze the provided document (project artifact, report, or screenshot) to extract portfolio-worthy content.
Context: ${projectContext || 'No specific context provided.'}
Project Title: ${projectTitle || 'Unknown Project'}

Extract:
1. A professional summary of what this document represents.
2. Key achievements or milestones shown.
3. Technical details (technologies, methods, patterns used).
4. Skills demonstrated (both hard and soft skills).
5. Quantitative metrics and results if available.
6. What roles this evidence is relevant for.
7. Bullet points for a resume.

Format as JSON: { summary, key_achievements, technical_details, skills_demonstrated, metrics_and_results, relevant_for_roles, resume_talking_points }`;

    // Build parts based on file type
    const inlineParts: any[] = [];

    if (mimeType.startsWith('image/')) {
      inlineParts.push({
        inlineData: { mimeType, data: fileBuffer.toString('base64') },
      });
    } else if (mimeType === 'application/pdf') {
      const pdf = await import('pdf-parse').then(m => m.default || m);
      const data = await pdf(fileBuffer);
      inlineParts.push({ text: `Document Content:\n${data.text.substring(0, 100000)}` });
    } else {
      inlineParts.push({ text: `Document Content:\n${fileBuffer.toString('utf-8')}` });
    }

    const result = await generate(promptText, {
      tier: 'heavy',
      jsonMode: true,
      inlineParts,
    });

    const analysis = parseAIJson<DocumentAnalysis>(result.text);

    return json({
      success: true,
      analysis,
      documentPath,
      documentType: mimeType,
    });
  } catch (error) {
    return handleError(error, 'Failed to analyze document');
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}
