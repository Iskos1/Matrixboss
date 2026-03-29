import { generateJson } from '@/lib/ai/anthropic';

const SCHEMAS = {
  experience: `{
  "company": "Company Name",
  "location": "Location",
  "website": "URL (optional)",
  "positions": [{ "role": "Job Title", "period": "Date Range", "description": "Responsibilities.", "technicalDetails": "Implementation details.", "tags": ["Skill"] }]
}`,
  project: `{
  "title": "Project Title",
  "description": "Detailed public description.",
  "technicalDetails": "Technical implementation details.",
  "tags": ["Tech"],
  "link": "URL (optional)",
  "featured": false,
  "hasLiveDemo": false
}`,
  skill: `{ "name": "Skill Name", "category": "technical | business | tools" }`,
};

export async function processText(text: string, category = 'auto'): Promise<any> {
  const prompt = `You are a data structuring assistant for a portfolio website.
Take the provided raw text and organize it into structured JSON.

Target Category: ${category} (if "auto", determine best: experience, project, or skill)

Schemas:
Experience: ${SCHEMAS.experience}
Project: ${SCHEMAS.project}
Skill: ${SCHEMAS.skill}

Raw Text:
${text}

Extract all relevant info. Use empty strings or sensible defaults for missing fields.
Improve writing style to be professional and concise.
Return ONLY the JSON object.`;

  const result = await generateJson(prompt);
  return result.data;
}

// Backward compat shim
export const DataProcessingService = {
  getInstance: () => ({ processText }),
};
