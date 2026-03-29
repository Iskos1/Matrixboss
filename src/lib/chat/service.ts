import fs from 'fs';
import path from 'path';
import { generate } from '@/lib/ai/anthropic';
import { getProjectRoot } from '@/lib/storage/file-utils';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

function loadPortfolioData() {
  try {
    const filePath = path.join(getProjectRoot(), 'src/data/portfolio.json');
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : {};
  } catch {
    return {};
  }
}

export async function chat(
  message: string,
  history: ChatMessage[] = [],
  image?: string
): Promise<{ response: string; model: string }> {
  const pd = loadPortfolioData();

  const systemInstruction = `You are the AI assistant for Jawad Iskandar's portfolio website and a helpful general assistant.

Portfolio Data:
Profile: ${JSON.stringify(pd.profile)}
Skills: ${JSON.stringify(pd.skills)}
Experience: ${JSON.stringify(pd.experience)}
Projects: ${JSON.stringify(pd.projects)}

Capabilities:
1. Portfolio Expert: Showcase Jawad's qualifications using the data above.
2. General Assistant: Answer questions, help with code, explain concepts.
3. Vision: Analyze uploaded images if provided.
4. Navigation: Append [[NAVIGATE:section_id]] when asked to go to a section (valid: profile, skills, experience, projects, social, coursework, resume).

Be professional, friendly, and concise. Stick to portfolio facts when discussing Jawad.`;

  const inlineParts: any[] = [];
  if (image) {
    const m = image.match(/^data:([a-zA-Z0-9/\-.+]+);base64,(.+)$/);
    if (m) inlineParts.push({ inlineData: { mimeType: m[1], data: m[2] } });
  }

  const result = await generate(message || 'Analyze the uploaded image.', {
    systemInstruction,
    history: history.map(h => ({ role: h.role, content: h.content })),
    inlineParts: inlineParts.length > 0 ? inlineParts : undefined,
  });

  return { response: result.text, model: result.model };
}

// Backward compat shim
export const ChatService = {
  getInstance: () => ({ chat, reload: () => {} }),
};
