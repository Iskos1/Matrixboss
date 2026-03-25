/**
 * anthropic-browser.ts — Browser-side AI utilities
 *
 * All AI calls are routed through server-side API endpoints.
 * Anthropic's API key is server-only (ANTHROPIC_API_KEY) and is never
 * exposed to the browser.
 *
 * On static deployments (GitHub Pages), AI features requiring a server
 * are not available and will return a clear error.
 */

// ─── Deployment Detection ─────────────────────────────────────────────────────

/** Returns true when running as a static GitHub Pages export */
export function isStaticDeployment(): boolean {
  return process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true';
}

/** Returns empty string — Anthropic API key is server-only */
export function getPublicApiKey(): string {
  return ''; // Anthropic key is never public
}

// ─── JSON Cleaning ────────────────────────────────────────────────────────────

/** Clean JSON from AI responses (strips markdown fences) */
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

// ─── API Key Test ─────────────────────────────────────────────────────────────

/** Test the Anthropic API key via the server validate-key endpoint */
export async function testApiKey(): Promise<{ ok: boolean; error?: string }> {
  if (isStaticDeployment()) {
    return { ok: false, error: 'API key validation not available on static deployments' };
  }
  try {
    const resp = await fetch('/api/resume/validate-key');
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      return { ok: false, error: body?.error || `HTTP ${resp.status}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// ─── Static Deployment Error ──────────────────────────────────────────────────

function staticError(feature: string): never {
  throw new Error(
    `${feature} requires a server-side API and is not available on static deployments. ` +
    `Please use the deployed version with server support.`
  );
}

// ─── Browser Chat ─────────────────────────────────────────────────────────────

/** Chat with portfolio AI — routes through /api/chat (not available on static deployments) */
export async function browserChat(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string; image?: string }>,
  _portfolioData: any,
  _image?: string
): Promise<string> {
  if (isStaticDeployment()) staticError('Chat');

  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, image: _image }),
  });

  if (!resp.ok) throw new Error(`Chat API error: ${resp.status}`);
  return await resp.text();
}

// ─── Browser Job Analysis ──────────────────────────────────────────────────────

/** Analyze job description — routes through /api/jobs/analyze */
export async function browserAnalyzeJob(
  jobDescription: string,
  _portfolioData: any
): Promise<any> {
  if (isStaticDeployment()) staticError('Job analysis');

  const resp = await fetch('/api/jobs/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription }),
  });

  if (!resp.ok) throw new Error(`Job analysis API error: ${resp.status}`);
  const data = await resp.json();
  return data.analysis;
}

// ─── Browser Data Processing ───────────────────────────────────────────────────

/** Process raw text into structured portfolio data — routes through /api/portfolio/process */
export async function browserProcessData(text: string, category: string): Promise<any> {
  if (isStaticDeployment()) staticError('Data processing');

  const resp = await fetch('/api/portfolio/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, category }),
  });

  if (!resp.ok) throw new Error(`Data processing API error: ${resp.status}`);
  const data = await resp.json();
  return data.result ?? data;
}

// ─── Browser Interview Prep ────────────────────────────────────────────────────

/** Generate interview response — routes through /api/jobs/interview-prep */
export async function browserInterviewPrep(
  question: string,
  jobDescription: string,
  company: string,
  role: string,
  analysis: any,
  _portfolioData: any
): Promise<string> {
  if (isStaticDeployment()) staticError('Interview prep');

  const resp = await fetch('/api/jobs/interview-prep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, jobDescription, company, role, analysis }),
  });

  if (!resp.ok) throw new Error(`Interview prep API error: ${resp.status}`);
  const data = await resp.json();
  return data.answer ?? '';
}

// ─── Browser Coursework Analysis ──────────────────────────────────────────────

/** Analyze coursework — routes through /api/coursework/analyze */
export async function browserAnalyzeCoursework(text: string): Promise<any> {
  if (isStaticDeployment()) staticError('Coursework analysis');

  const resp = await fetch('/api/coursework/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!resp.ok) throw new Error(`Coursework analysis API error: ${resp.status}`);
  return await resp.json();
}
