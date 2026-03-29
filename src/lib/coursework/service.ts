import fs from 'fs';
import path from 'path';
import { generate, parseAIJson } from '@/lib/ai/anthropic';

export interface CourseworkAnalysis {
  title: string;
  description: string;
  tags: string[];
  key_features: string[];
  technicalDetails?: string;
  analysis_summary?: string;
}

export async function analyzeCoursework(filePaths: string[]): Promise<CourseworkAnalysis> {
  const prompt = `You are an expert portfolio curator and technical writer.
Analyze ALL provided coursework documents and generate a SINGLE comprehensive project entry.

Extract:
1. A catchy, professional Project Title
2. A Description (2-3 paragraphs) explaining the problem, solution, and results
3. Tags/Skills list (e.g., Python, AWS, SQL)
4. Key Features list (3-5 bullet points)
5. Technical Details (architecture, libraries, data pipeline)

Return JSON ONLY:
{
  "title": "Project Title",
  "description": "Full description...",
  "tags": ["Tag1", "Tag2"],
  "key_features": ["Feature 1", "Feature 2"],
  "technicalDetails": "Technical summary...",
  "analysis_summary": "Analyzed X files..."
}`;

  const inlineParts: any[] = [];
  const MIME_MAP: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
  };
  const MAX_SIZE = 10 * 1024 * 1024;

  for (const filePath of filePaths) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.txt') {
      inlineParts.push({ text: `\n--- ${path.basename(filePath)} ---\n${fs.readFileSync(filePath, 'utf-8')}\n` });
      continue;
    }

    if (ext === '.pdf') {
      try {
        if (fs.statSync(filePath).size > MAX_SIZE) { console.warn(`[coursework] Skipping oversized: ${filePath}`); continue; }
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string }>;
        const text = (await pdfParse(fs.readFileSync(filePath))).text.substring(0, 50000);
        inlineParts.push({ text: `\n--- ${path.basename(filePath)} ---\n${text}\n` });
      } catch (e) { console.warn(`[coursework] Could not parse PDF: ${filePath}`, e); }
      continue;
    }

    const mimeType = MIME_MAP[ext];
    if (!mimeType) { console.warn(`[coursework] Unsupported type: ${ext}`); continue; }
    if (fs.statSync(filePath).size > MAX_SIZE) { console.warn(`[coursework] Skipping oversized: ${filePath}`); continue; }
    inlineParts.push({ inlineData: { data: fs.readFileSync(filePath).toString('base64'), mimeType } });
  }

  const result = await generate(prompt, { jsonMode: true, inlineParts });
  return parseAIJson<CourseworkAnalysis>(result.text);
}

// Backward compat shim
export const CourseworkService = {
  getInstance: () => ({ analyzeCoursework }),
};
