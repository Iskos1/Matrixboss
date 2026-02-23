import { NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/utils/api-utils';

/**
 * GET /api/resume/test-key
 * Quick sanity-check: verifies the GEMINI_API_KEY is valid by sending
 * a tiny completion request.
 */
export async function GET() {
  try {
    const genAI = getGeminiClient();
    
    // Try reliable models
    const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    let reply = '';
    let usedModel = '';

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Reply with the single word: OK');
        const response = await result.response;
        reply = response.text()?.trim();
        usedModel = modelName;
        break;
      } catch (e) {
        if (models.indexOf(modelName) === models.length - 1) throw e;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Gemini API key is valid and working',
      model: usedModel,
      reply,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Unknown error',
        code: error?.status, // Google Generative AI errors often have status
        status: error?.status || 500,
        hint:
          error?.status === 400 && error?.message?.includes('API key')
            ? 'Your GEMINI_API_KEY in .env.local is invalid. Generate a new key at https://aistudio.google.com/app/apikey and restart the dev server.'
            : 'Check your .env.local and restart the dev server.',
      },
      { status: 500 }
    );
  }
}
