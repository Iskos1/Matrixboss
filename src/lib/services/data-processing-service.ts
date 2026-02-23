import { getGeminiClient, cleanJsonResponse } from '@/lib/utils/api-utils';

export class DataProcessingService {
  async processText(text: string, category: string = 'auto'): Promise<any> {
    const client = getGeminiClient();
    
    // Priority order: 
    // 1. Gemini 2.5 Pro (Best balance of quality and stability)
    // 2. Gemini 2.0 Flash (Fast fallback)
    const models = [
      'gemini-2.5-pro',
      'gemini-2.0-flash', 
      'gemini-flash-latest'
    ];

    const schemas = {
      experience: `
{
  "company": "Company Name",
  "location": "Location",
  "website": "URL (optional)",
  "positions": [
    {
      "role": "Job Title",
      "period": "Date Range (e.g. Jan 2020 - Present)",
      "description": "Full description of responsibilities and achievements.",
      "technicalDetails": "Specific technical implementation details, architecture notes, AI training specifics, or other hidden context not for the public description.",
      "tags": ["Skill 1", "Skill 2"]
    }
  ]
}`,
      project: `
{
  "title": "Project Title",
  "description": "Detailed public description of the project.",
  "technicalDetails": "Specific technical implementation details, architecture notes, AI model specifics, training data info, or other hidden context not for the public description. Format this clearly.",
  "tags": ["Tech 1", "Tech 2"],
  "link": "URL (optional)",
  "featured": false,
  "hasLiveDemo": false
}`,
      skill: `
{
  "name": "Skill Name",
  "category": "technical | business | tools"
}`
    };

    const prompt = `You are a data structuring assistant for a portfolio website.
Your task is to take the provided raw text and organize it into a structured JSON format.

Target Category: ${category}

If category is "auto", determine the best category (experience, project, or skill) based on the content.

Expected JSON Schemas:

For Experience:
${schemas.experience}

For Project:
${schemas.project}
(CRITICAL: The 'technicalDetails' field is for "Technical / AI Context". If the input text contains implementation details, code structure, model architecture, training process, or data pipeline info, put it here. Use bullet points or structured text if appropriate for clarity.)

For Skill:
${schemas.skill}

Raw Text:
${text}

Instructions:
1. Extract all relevant information from the text.
2. If information is missing, use empty strings or sensible defaults (but do not invent facts).
3. Format the output as valid JSON.
4. Improve the writing style slightly to be professional and concise, but keep the core meaning.
5. CRITICAL: For "project" category, ensure 'technicalDetails' captures all the AI/Data specifics (models used, data sources, preprocessing steps, accuracy metrics) if present in the input.
6. Return ONLY the JSON object, no markdown formatting.
`;

    let lastError: any = null;

    console.log(`[DataProcessingService] Starting processing. Text length: ${text.length}. Category: ${category}`);

    for (const modelName of models) {
      try {
        console.log(`[DataProcessingService] Attempting to process with model: ${modelName}`);
        const model = client.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        
        if (!responseText) {
          throw new Error(`Empty response from ${modelName}`);
        }
        
        console.log(`[DataProcessingService] Success with model: ${modelName}. Response length: ${responseText.length} chars.`);
        
        const cleanText = cleanJsonResponse(responseText);
        return JSON.parse(cleanText);
        
      } catch (error: any) {
        const status = error.status || error.response?.status;
        const message = error.message || 'Unknown error';
        console.warn(`[DataProcessingService] Failed with model ${modelName} (Status: ${status}): ${message}`);
        
        lastError = error;
        
        if (message.includes('API_KEY_INVALID') || status === 403) {
           throw error;
        }
      }
    }

    throw lastError || new Error('Failed to process data with any available Gemini model');
  }
}
