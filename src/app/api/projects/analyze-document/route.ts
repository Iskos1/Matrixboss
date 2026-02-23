import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, cleanJsonResponse } from '@/lib/utils/api-utils';
import { fileExists, joinPath } from '@/lib/utils/file-utils';
import { handleApiError } from '@/lib/utils/error-utils';
import fs from 'fs';
import path from 'path';
const pdf = require('pdf-parse');

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
    const { documentPath, documentType, projectTitle, projectContext } = body;

    if (!documentPath) {
      return NextResponse.json(
        { error: 'Document path is required' },
        { status: 400 }
      );
    }

    // Read the file from public directory
    const filePath = joinPath('public', documentPath);
    
    if (!fileExists(filePath)) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = getMimeType(documentPath);
    
    // Use Gemini with improved model handling
    const genAI = getGeminiClient();
    const models = ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    let resultText = '';
    
    const promptText = `Analyze the provided document (project artifact, report, or screenshot) to extract portfolio-worthy content.
    Context: ${projectContext || 'No specific context provided.'}
    Project Title: ${projectTitle || 'Unknown Project'}
    
    Extract the following structured information:
    1. A professional summary of what this document represents.
    2. Key achievements or milestones shown.
    3. Technical details (technologies, methods, patterns used).
    4. Skills demonstrated (both hard and soft skills).
    5. Quantitative metrics and results if available.
    6. What roles this evidence is relevant for.
    7. Bullet points for a resume.

    Format the response as a JSON object with these keys:
    summary, key_achievements, technical_details, skills_demonstrated, metrics_and_results, relevant_for_roles, resume_talking_points.`;
    
    // Helper to run with fallback
    const runAnalysis = async () => {
      let lastError;
      for (const modelName of models) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
          
          if (mimeType.startsWith('image/')) {
            const base64Image = fileBuffer.toString('base64');
            const result = await model.generateContent([
              promptText,
              { inlineData: { mimeType, data: base64Image } }
            ]);
            resultText = result.response.text();
          } else if (mimeType === 'application/pdf') {
            const data = await pdf(fileBuffer);
            const textContent = data.text;
            const result = await model.generateContent([
              promptText,
              `Document Content:\n${textContent.substring(0, 100000)}`
            ]);
            resultText = result.response.text();
          } else {
            const textContent = fileBuffer.toString('utf-8');
            const result = await model.generateContent([
              promptText,
              `Document Content:\n${textContent}`
            ]);
            resultText = result.response.text();
          }
          
          console.log(`[AnalyzeDocument] Success with model: ${modelName}`);
          return; // Success
        } catch (e: any) {
          console.warn(`[AnalyzeDocument] Failed with model ${modelName}:`, e.message);
          lastError = e;
        }
      }
      throw lastError || new Error('All models failed to analyze document');
    };

    await runAnalysis();

    // Clean up potential markdown formatting
    const jsonString = cleanJsonResponse(resultText);
    const analysis: DocumentAnalysis = JSON.parse(jsonString);

    return NextResponse.json({
      success: true,
      analysis,
      documentPath,
      documentType: mimeType,
    });

  } catch (error: any) {
    console.error("Document analysis error:", error);
    return handleApiError(error, 'Failed to analyze document');
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
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
