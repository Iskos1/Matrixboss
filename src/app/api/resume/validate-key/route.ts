import { generate } from '@/lib/ai/anthropic';
import { handleError, json } from '@/lib/http/responses';

/**
 * GET /api/resume/validate-key
 * Quick sanity-check: verifies the ANTHROPIC_API_KEY is valid.
 */
export async function GET() {
  try {
    const result = await generate('Reply with the single word: OK');

    return json({
      success: true,
      message: 'Anthropic API key is valid and working',
      model: result.model,
      reply: result.text.trim(),
    });
  } catch (error: any) {
    return handleError(error, 'API key validation failed');
  }
}
