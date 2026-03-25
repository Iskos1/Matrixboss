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

// ─── Singleton ──────────────────────────────────────────────────────────────
let _instance: CourseworkService | null = null;

export class CourseworkService {
  private constructor() {}

  static getInstance(): CourseworkService {
    if (!_instance) {
      _instance = new CourseworkService();
    }
    return _instance;
  }

  /**
   * Analyze coursework files to extract project details.
   * Note: Anthropic supports images but not inline PDFs.
   * PDFs are extracted to text before sending.
   */
  async analyzeCoursework(filePaths: string[]): Promise<CourseworkAnalysis> {
    const prompt = `
    You are an expert portfolio curator and technical writer. 
    I am providing documents or images from my university coursework.
    
    Your task is to analyze ALL of this content and generate a SINGLE comprehensive, professional project entry for my portfolio.
    
    CRITICAL: You must synthesize information from ALL provided files.
    
    Please extract or infer the following:
    1. A catchy, professional **Project Title**.
    2. A **Description** (2-3 paragraphs) that explains the problem, solution, and results.
    3. A list of **Tags/Skills** (e.g., Python, AWS, SQL, Machine Learning).
    4. A **Key Features** list (3-5 bullet points).
    5. **Technical Details**: implementation specifics (architecture, libraries, data pipeline).
    
    Return the result strictly in valid JSON format with the following structure:
    {
      "title": "Project Title",
      "description": "The full description text...",
      "tags": ["Tag1", "Tag2"],
      "key_features": ["Feature 1", "Feature 2"],
      "technicalDetails": "Summary of technical implementation...",
      "analysis_summary": "Analyzed X files..."
    }
    `;

    // Build parts: images as inlineParts, text/PDF as text parts
    const inlineParts: any[] = [];

    for (const filePath of filePaths) {
      const ext = path.extname(filePath).toLowerCase();

      if (ext === '.txt') {
        const textContent = fs.readFileSync(filePath, 'utf-8');
        inlineParts.push({
          text: `\n--- Content from ${path.basename(filePath)} ---\n${textContent}\n--- End of File ---\n`,
        });
        continue;
      }

      // For PDFs, extract text using pdf-parse
      if (ext === '.pdf') {
        try {
          const stats = fs.statSync(filePath);
          if (stats.size > 10 * 1024 * 1024) {
            console.warn(`[CourseworkService] Skipping oversized file: ${filePath}`);
            continue;
          }
          const pdfParse = await import('pdf-parse').then(m => m.default || m);
          const buffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(buffer);
          inlineParts.push({
            text: `\n--- Content from ${path.basename(filePath)} ---\n${pdfData.text.substring(0, 50000)}\n--- End of File ---\n`,
          });
        } catch (e) {
          console.warn(`[CourseworkService] Could not parse PDF: ${filePath}`, e);
        }
        continue;
      }

      // For images: send as inline data (Anthropic supports image/jpeg, image/png, image/gif, image/webp)
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      };

      const mimeType = mimeMap[ext];
      if (!mimeType) {
        console.warn(`[CourseworkService] Skipping unsupported file type: ${ext}`);
        continue;
      }

      const stats = fs.statSync(filePath);
      if (stats.size > 10 * 1024 * 1024) {
        console.warn(`[CourseworkService] Skipping oversized file: ${filePath}`);
        continue;
      }

      inlineParts.push({
        inlineData: {
          data: fs.readFileSync(filePath).toString('base64'),
          mimeType,
        },
      });
    }

    const result = await generate(prompt, {
      jsonMode: true,
      inlineParts,
    });

    return parseAIJson<CourseworkAnalysis>(result.text);
  }
}
