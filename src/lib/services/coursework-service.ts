import fs from 'fs';
import path from 'path';
import { getGeminiClient, cleanJsonResponse } from '@/lib/utils/api-utils';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to convert file to base64 for Gemini
function fileToGenerativePart(filePath: string, mimeType: string) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
      mimeType
    },
  };
}

export interface CourseworkAnalysis {
  title: string;
  description: string;
  tags: string[];
  key_features: string[];
  technicalDetails?: string;
  analysis_summary?: string;
}

export class CourseworkService {
  
  /**
   * Send a prompt (with optional images/files) to Gemini and return the raw text response.
   */
  private async generateAIAnalysis(filePaths: string[]): Promise<string> {
    const client = getGeminiClient();
    
    // Priority order: 
    // 1. Gemini 2.5 Pro (Best balance of quality and stability)
    // 2. Gemini 2.0 Flash (Fast fallback)
    const models = [
      'gemini-2.5-pro',
      'gemini-2.0-flash', 
      'gemini-flash-latest'
    ];

    let lastError: any = null;
    
    const prompt = `
    You are an expert portfolio curator and technical writer. 
    I am providing documents or images from my university coursework.
    
    Your task is to analyze ALL of this content and generate a SINGLE comprehensive, professional project entry for my portfolio.
    
    CRITICAL: You must synthesize information from ALL provided files.
    
    Please extract or infer the following:
    1. A catchy, professional **Project Title**.
    2. A **Description** (2-3 paragraphs) that explains:
       - The Problem/Challenge addressed.
       - The Solution/Methodology (technologies, algorithms, frameworks used).
       - The Results/Impact (what was achieved, any metrics, or simply the successful outcome).
       - MAKE IT SOUND PROFESSIONAL and IMPRESSIVE, highlighting technical depth.
    3. A list of **Tags/Skills** (e.g., Python, AWS, SQL, Machine Learning, Research, etc.).
    4. A **Key Features** list (3-5 bullet points).
    5. **Technical Details**: A short paragraph or bulleted list summarizing the specific technical implementation details (architecture, specific libraries, data pipeline, etc.).
    
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

    console.log(`[CourseworkService] Starting AI analysis. Files: ${filePaths.length}`);

    for (const modelName of models) {
      try {
        console.log(`[CourseworkService] Attempting to analyze with model: ${modelName}`);
        const model = client.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" } 
        });
        
        const parts: any[] = [{ text: prompt }];

        // Add files
        for (const filePath of filePaths) {
          const ext = path.extname(filePath).toLowerCase();
          let mimeType = '';
          
          if (ext === '.pdf') mimeType = 'application/pdf';
          else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
          else if (ext === '.png') mimeType = 'image/png';
          else if (ext === '.webp') mimeType = 'image/webp';
          else if (ext === '.txt') {
             // For text files, just append the text content directly
             const textContent = fs.readFileSync(filePath, 'utf-8');
             parts.push({ text: `\n--- Content from ${path.basename(filePath)} ---\n${textContent}\n--- End of File ---\n` });
             continue;
          } else if (ext === '.docx') {
             // Skip docx for now as Gemini doesn't support it directly via inlineData 
             // (it needs file API upload or text extraction). 
             // For this fix, we'll assume PDF/Images/Text primarily or rely on converted text.
             console.warn(`[CourseworkService] Skipping .docx file (convert to PDF for AI analysis): ${filePath}`);
             continue;
          }
          else {
            console.warn(`[CourseworkService] Skipping unsupported file type for direct AI input: ${ext}`);
            continue;
          }

          // Limit file size to avoid hitting limits (simple check)
          const stats = fs.statSync(filePath);
          if (stats.size > 10 * 1024 * 1024) { // 10MB limit
            console.warn(`[CourseworkService] Skipping file too large: ${filePath}`);
            continue;
          }

          parts.push(fileToGenerativePart(filePath, mimeType));
        }

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
          throw new Error(`Empty response from ${modelName}`);
        }
        
        console.log(`[CourseworkService] Success with model: ${modelName}. Response length: ${text.length} chars.`);
        return text;
      } catch (error: any) {
        const status = error.status || error.response?.status;
        const message = error.message || 'Unknown error';
        console.warn(`[CourseworkService] Failed with model ${modelName} (Status: ${status}): ${message}`);
        
        lastError = error;
        
        if (message.includes('API_KEY_INVALID') || status === 403) {
           throw error;
        }
      }
    }

    throw lastError || new Error('Failed to analyze coursework with any available Gemini model');
  }

  /**
   * Analyze coursework files to extract project details.
   */
  async analyzeCoursework(filePaths: string[]): Promise<CourseworkAnalysis> {
    try {
      const text = await this.generateAIAnalysis(filePaths);
      return JSON.parse(cleanJsonResponse(text));
    } catch (error) {
      console.error('Error analyzing coursework:', error);
      throw new Error('Failed to analyze coursework');
    }
  }
}
