/**
 * gemini-browser.ts
 *
 * Client-side (browser) Gemini utility.
 * Uses NEXT_PUBLIC_GEMINI_API_KEY so it works on static deployments
 * (GitHub Pages) where server-side API routes are not available.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/** Clean JSON from Gemini responses (strips markdown fences) */
export function cleanJson(text: string): string {
  let clean = text.replace(/```json\n?|\n?```/g, '').trim();
  clean = clean.replace(/```\n?|\n?```/g, '').trim();
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  if (firstBrace === -1 && firstBracket === -1) return clean;
  let start = -1, end = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace; end = clean.lastIndexOf('}');
  } else {
    start = firstBracket; end = clean.lastIndexOf(']');
  }
  if (start !== -1 && end !== -1 && end > start) return clean.substring(start, end + 1);
  return clean;
}

/** Returns true when running as a static GitHub Pages export */
export function isStaticDeployment(): boolean {
  return process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true';
}

/** Returns the public API key (available in browser on static deployments) */
export function getPublicApiKey(): string {
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

/** Creates a GoogleGenerativeAI client using the public API key */
export function getBrowserGeminiClient(): GoogleGenerativeAI {
  const key = getPublicApiKey();
  if (!key) {
    throw new Error(
      'NEXT_PUBLIC_GEMINI_API_KEY is not configured. ' +
      'Add it as a GitHub Actions secret and redeploy.'
    );
  }
  return new GoogleGenerativeAI(key);
}

/** Priority model list for client-side calls */
const MODELS = ['gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest'];

/**
 * Call Gemini with automatic model fallback.
 * Returns the generated text or throws on complete failure.
 */
export async function generateText(prompt: string, opts?: {
  systemInstruction?: string;
  jsonMode?: boolean;
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  imageParts?: Array<{ inlineData: { mimeType: string; data: string } }>;
}): Promise<string> {
  const client = getBrowserGeminiClient();

  for (const modelName of MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        ...(opts?.systemInstruction ? { systemInstruction: opts.systemInstruction } : {}),
        ...(opts?.jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
      });

      let text: string;

      if (opts?.history?.length) {
        // Multi-turn chat
        const chatSession = model.startChat({ history: opts.history });
        const msgParts: any[] = [{ text: prompt }, ...(opts.imageParts || [])];
        const result = await chatSession.sendMessage(msgParts);
        text = result.response.text();
      } else {
        const parts: any[] = [{ text: prompt }, ...(opts.imageParts || [])];
        const result = await model.generateContent(parts);
        text = result.response.text();
      }

      if (!text) throw new Error(`Empty response from ${modelName}`);
      return text;
    } catch (err: any) {
      const msg = err.message || '';
      // Hard-fail immediately on auth errors
      if (msg.includes('API_KEY_INVALID') || err.status === 403 || msg.includes('API key not valid')) {
        throw err;
      }
      // Otherwise try the next model
      console.warn(`[gemini-browser] ${modelName} failed: ${msg}`);
    }
  }
  throw new Error('All Gemini models failed. Check your API key.');
}

/** Test the public API key – returns { ok, error? } */
export async function testApiKey(): Promise<{ ok: boolean; error?: string }> {
  const key = getPublicApiKey();
  if (!key) return { ok: false, error: 'NEXT_PUBLIC_GEMINI_API_KEY not set' };
  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      return { ok: false, error: body?.error?.message || `HTTP ${resp.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

/** Chat with portfolio AI (replaces /api/chat on static deployments) */
export async function browserChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string; image?: string }>,
  portfolioData: any,
  image?: string
): Promise<string> {
  const systemInstruction = `You are the AI assistant for Jawad Iskandar's portfolio, but you are also a helpful general assistant.

You have access to the following specific information about Jawad:

Profile:
${JSON.stringify(portfolioData?.profile, null, 2)}

Skills:
${JSON.stringify(portfolioData?.skills, null, 2)}

Experience:
${JSON.stringify(portfolioData?.experience, null, 2)}

Projects:
${JSON.stringify(portfolioData?.projects, null, 2)}

Your Role & Capabilities:
1. **Portfolio Expert:** Showcase Jawad's qualifications using the data above.
2. **General Assistant:** Answer general questions, provide coding help, explain concepts.
3. **Vision:** Analyze uploaded images if provided.
4. **Site Navigation:** If asked to navigate, append [[NAVIGATE:section_id]] at the end.
   Valid sections: profile, skills, experience, projects, social, coursework, resume.

Guidelines:
- Be professional, friendly, and concise.
- Stick to the facts provided for Jawad-related questions.`;

  const geminiHistory = history.map((m) => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }],
  }));

  const imageParts: any[] = [];
  if (image) {
    const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      imageParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
    }
  }

  return generateText(message, { systemInstruction, history: geminiHistory, imageParts });
}

/** Analyze job description (replaces /api/jobs/analyze on static deployments) */
export async function browserAnalyzeJob(
  jobDescription: string,
  portfolioData: any
): Promise<any> {
  const candidateData = {
    skills: portfolioData?.skills || [],
    experience: portfolioData?.experience || [],
    projects: (portfolioData?.projects || []).map((p: any) => ({
      title: p.title, tags: p.tags, description: p.description?.slice(0, 200),
    })),
    certifications: portfolioData?.certifications || [],
  };

  const prompt = `You are a brutally honest, senior technical recruiter. Analyze how well this candidate matches the job, then produce a CRITICAL, HONEST evaluation.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE PROFILE:
${JSON.stringify(candidateData, null, 2)}

Return ONLY raw JSON:
{
  "compatibilityScore": number (0-100),
  "compatibilityLabel": "Strong Match" | "Good Match" | "Partial Match" | "Weak Match" | "Not a Fit",
  "industry": "string",
  "roleType": "string",
  "seniorityLevel": "string",
  "presentSkills": ["skill1", "skill2"],
  "missingSkills": [{"skill": "name", "importance": "critical|important|nice-to-have", "reason": "why"}],
  "experienceGaps": ["gap1", "gap2"],
  "criticalVerdict": "honest 2-4 sentence assessment",
  "improvementPlan": ["action1", "action2"],
  "marketSkillsToLearn": ["skill1", "skill2"],
  "summary": "2-3 sentence overview"
}`;

  const text = await generateText(prompt, { jsonMode: true });
  return JSON.parse(cleanJson(text));
}

/** Process raw text into structured portfolio data (replaces /api/portfolio/process) */
export async function browserProcessData(text: string, category: string): Promise<any> {
  const schemas = {
    experience: `{"company":"Company Name","location":"Location","website":"URL","positions":[{"role":"Job Title","period":"Date Range","description":"Responsibilities","technicalDetails":"Technical details","tags":["Skill"]}]}`,
    project: `{"title":"Project Title","description":"Public description","technicalDetails":"Technical details","tags":["Tech"],"link":"URL","featured":false,"hasLiveDemo":false}`,
    skill: `{"name":"Skill Name","category":"technical|business|tools"}`,
  };

  const prompt = `You are a data structuring assistant for a portfolio website.
Take the provided raw text and organize it into structured JSON.

Target Category: ${category}
If "auto", determine the best category (experience, project, or skill).

Schemas:
Experience: ${schemas.experience}
Project: ${schemas.project}
Skill: ${schemas.skill}

Raw Text:
${text}

Return ONLY a JSON object, no markdown.`;

  const result = await generateText(prompt, { jsonMode: true });
  return JSON.parse(cleanJson(result));
}

/** Analyze coursework text (replaces /api/coursework/analyze on static deployments) */
export async function browserAnalyzeCoursework(text: string): Promise<any> {
  const prompt = `You are an academic project analyzer. Analyze this coursework/assignment text and extract structured information.

Text:
${text}

Return ONLY raw JSON:
{
  "title": "Project Title",
  "description": "Clear description of what was done (2-4 sentences)",
  "tags": ["Technology1", "Technology2", "Skill1"],
  "key_features": ["Feature or achievement 1", "Feature 2"],
  "attachments": [],
  "course": "Course name if mentioned",
  "grade": "Grade if mentioned"
}`;

  const result = await generateText(prompt, { jsonMode: true });
  return JSON.parse(cleanJson(result));
}
