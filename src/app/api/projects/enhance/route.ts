import { NextRequest } from 'next/server';
import { generateJson } from '@/lib/ai/anthropic';
import { handleError, badRequest, json } from '@/lib/api/responses';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { project } = await request.json();

    if (!project) {
      return badRequest('Project data is required');
    }

    const prompt = `You are a Senior Technical Recruiter and Lead Software Engineer mentoring a developer.
Analyze the following project from their portfolio:

Project: ${project.title}
Description: ${project.description}
Tech Stack: ${project.tags.join(', ')}
Link: ${project.link}

Provide specific, actionable advice on how to improve this project:
1. **Visual Value**: How to make it visually impressive.
2. **Technical Depth**: Advanced features or architectural improvements.
3. **Resume Impact**: How to rephrase the description or add metrics.
4. **The "Wow" Factor**: A unique feature idea.

Return valid JSON:
{
  "visual_enhancements": ["suggestion 1", "suggestion 2"],
  "technical_deep_dive": ["suggestion 1", "suggestion 2"],
  "resume_improvements": ["suggestion 1", "suggestion 2"],
  "wow_factor": "Single powerful idea..."
}`;

    const result = await generateJson(prompt, { tier: 'standard' });

    return json(result.data);
  } catch (error) {
    return handleError(error, 'Failed to generate advice');
  }
}
