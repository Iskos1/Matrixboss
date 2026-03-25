import { generateJson } from '@/lib/ai/anthropic';

// ─── Singleton ──────────────────────────────────────────────────────────────
let _instance: DataProcessingService | null = null;

export class DataProcessingService {
  private constructor() {}

  static getInstance(): DataProcessingService {
    if (!_instance) {
      _instance = new DataProcessingService();
    }
    return _instance;
  }

  async processText(text: string, category: string = 'auto'): Promise<any> {
    const schemas = {
      experience: `{
  "company": "Company Name",
  "location": "Location",
  "website": "URL (optional)",
  "positions": [{
    "role": "Job Title",
    "period": "Date Range",
    "description": "Full description of responsibilities.",
    "technicalDetails": "Technical implementation details.",
    "tags": ["Skill 1", "Skill 2"]
  }]
}`,
      project: `{
  "title": "Project Title",
  "description": "Detailed public description.",
  "technicalDetails": "Technical implementation details.",
  "tags": ["Tech 1", "Tech 2"],
  "link": "URL (optional)",
  "featured": false,
  "hasLiveDemo": false
}`,
      skill: `{
  "name": "Skill Name",
  "category": "technical | business | tools"
}`,
    };

    const prompt = `You are a data structuring assistant for a portfolio website.
Your task is to take the provided raw text and organize it into structured JSON.

Target Category: ${category}
If category is "auto", determine the best category (experience, project, or skill).

Expected JSON Schemas:
Experience: ${schemas.experience}
Project: ${schemas.project}
Skill: ${schemas.skill}

Raw Text:
${text}

Instructions:
1. Extract all relevant information from the text.
2. If information is missing, use empty strings or sensible defaults.
3. Format the output as valid JSON.
4. Improve writing style to be professional and concise.
5. For "project" category, ensure technicalDetails captures implementation specifics.
6. Return ONLY the JSON object, no markdown formatting.`;

    const result = await generateJson(prompt, { tier: 'standard' });
    return result.data;
  }
}
