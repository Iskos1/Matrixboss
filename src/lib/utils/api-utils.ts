import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Get a Google Generative AI client.
 * Creates a fresh client each call so env var changes are always picked up.
 */
export function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is required. ' +
      'Please add GEMINI_API_KEY=AIza... to your .env.local file.'
    );
  }

  // Basic validation
  if (!apiKey.startsWith('AIza')) {
    console.warn('Warning: GEMINI_API_KEY does not start with "AIza". It might be invalid.');
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Gemini API Key configured:', `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Clean JSON response from AI (removes markdown code blocks and finds the JSON object/array)
 */
export function cleanJsonResponse(text: string): string {
  // First, remove markdown code blocks if present
  let clean = text.replace(/```json\n?|\n?```/g, '').trim();
  clean = clean.replace(/```\n?|\n?```/g, '').trim(); // Handle generic code blocks too
  
  // Try to find the first JSON-like structure (object or array)
  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');
  
  if (firstBrace === -1 && firstBracket === -1) return clean;
  
  let start = -1;
  let end = -1;
  
  // Determine if object or array comes first
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      start = firstBrace;
      end = clean.lastIndexOf('}');
  } else {
      start = firstBracket;
      end = clean.lastIndexOf(']');
  }
  
  if (start !== -1 && end !== -1 && end > start) {
    return clean.substring(start, end + 1);
  }
  
  return clean;
}
