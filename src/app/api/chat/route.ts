import { NextRequest } from 'next/server';
import { generateStream, AIAuthError, AIQuotaError, AIModelError } from '@/lib/ai/anthropic';
import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/storage/file-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ─── Portfolio data loader ────────────────────────────────────────────────────

function loadPortfolioData(): any {
  try {
    const filePath = path.join(getProjectRoot(), 'src/data/portfolio.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('[ChatRoute] Could not load portfolio.json:', e);
  }
  return {};
}

function buildSystemInstruction(portfolioData: any): string {
  return `You are the AI assistant for Jawad Iskandar's portfolio, but you are also a helpful general assistant.

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
1. **Portfolio Expert:** Your primary goal is to showcase Jawad's qualifications.
2. **General Assistant:** Answer general questions, provide coding help, explain concepts.
3. **Vision:** Analyze uploaded images if provided.
4. **Site Navigation:** Append [[NAVIGATE:section_id]] when asked to go to a section.
   Valid IDs: profile, skills, experience, projects, social, coursework, resume.

Guidelines:
- Be professional, friendly, and concise.
- When answering about Jawad, stick to the facts provided.`;
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, image } = body;

    if (!message && !image) {
      return new Response(
        JSON.stringify({ error: 'Message or image is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const portfolioData = loadPortfolioData();
    const systemInstruction = buildSystemInstruction(portfolioData);

    // Convert history to Anthropic format (role: 'user' | 'assistant')
    const chatHistory: Array<{ role: 'user' | 'assistant'; content: string }> =
      (history || []).map((msg: any) => ({
        role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content ?? '',
      }));

    // Prepare image parts if provided
    const inlineParts: any[] = [];
    if (image) {
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+);base64,(.+)$/);
      if (matches) {
        inlineParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
      }
    }

    const promptText = message || 'Analyze the uploaded image.';

    // ── Stream the response back to the client ────────────────────────────────
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const gen = generateStream(promptText, {
            systemInstruction,
            history: chatHistory,
            inlineParts: inlineParts.length > 0 ? inlineParts : undefined,
          });

          for await (const chunk of gen) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err: any) {
          let userMessage = 'Sorry, the AI is temporarily unavailable. Please try again in a moment.';

          if (err instanceof AIAuthError) {
            userMessage = 'AI is not configured on this deployment. To enable it, add ANTHROPIC_API_KEY to your environment variables (Vercel → Settings → Environment Variables).';
          } else if (err instanceof AIQuotaError) {
            userMessage = 'AI quota exceeded. Please try again later.';
          } else if (err instanceof AIModelError || (err?.message ?? '').includes('unavailable')) {
            userMessage = 'The AI is experiencing high demand right now. Please try again in a few seconds.';
          }

          controller.enqueue(encoder.encode(userMessage));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('[ChatRoute] Unexpected error:', error.message);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
