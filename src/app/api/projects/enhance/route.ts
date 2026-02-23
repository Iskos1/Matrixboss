import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, cleanJsonResponse } from '@/lib/utils/api-utils';
import { handleApiError } from '@/lib/utils/error-utils';

export async function POST(request: NextRequest) {
  try {
    const { project } = await request.json();

    if (!project) {
      return NextResponse.json(
        { error: 'Project data is required' },
        { status: 400 }
      );
    }

    const genAI = getGeminiClient();
    
    // Model fallback logic
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let advice = null;

    const prompt = `
      You are a Senior Technical Recruiter and Lead Software Engineer mentoring a developer.
      Analyze the following project from their portfolio:

      Project: ${project.title}
      Description: ${project.description}
      Tech Stack: ${project.tags.join(', ')}
      Link: ${project.link}

      Your goal is to provide specific, actionable advice on how to improve this project to make it stand out to top-tier tech companies.
      Focus on:
      1.  **Visual Value**: How to make the project visually impressive (e.g., adding charts, interactive demos, better UI).
      2.  **Technical Depth**: Advanced features or architectural improvements to demonstrate deeper understanding (e.g., adding CI/CD, testing, optimization, new technologies).
      3.  **Resume Impact**: How to rephrase the project description or what specific metrics to add to make it sound more impressive on a resume.
      4.  **The "Wow" Factor**: A unique feature idea that would make a recruiter say "Wow".

      Output your response in valid JSON format with the following structure:
      {
        "visual_enhancements": ["suggestion 1", "suggestion 2", ...],
        "technical_deep_dive": ["suggestion 1", "suggestion 2", ...],
        "resume_improvements": ["suggestion 1", "suggestion 2", ...],
        "wow_factor": "Single powerful idea..."
      }
      Do not include any markdown formatting like \`\`\`json. Just the raw JSON.
    `;

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonString = cleanJsonResponse(text);
        advice = JSON.parse(jsonString);
        break;
      } catch (e) {
        if (models.indexOf(modelName) === models.length - 1) throw e;
      }
    }

    return NextResponse.json(advice);
  } catch (error: any) {
    return handleApiError(error, 'Failed to generate advice');
  }
}
