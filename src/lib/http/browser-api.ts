/** Returns true when running as a static GitHub Pages export */
export function isStaticDeployment(): boolean {
  return process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true';
}

/** Test the Anthropic API key via the server diagnose endpoint */
export async function testApiKey(): Promise<{ ok: boolean; error?: string }> {
  if (isStaticDeployment()) return { ok: false, error: 'Not available on static deployments' };
  try {
    const resp = await fetch('/api/resume/diagnose');
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      return { ok: false, error: body?.error || `HTTP ${resp.status}` };
    }
    const data = await resp.json();
    return { ok: data.anthropic_test?.ok === true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

function staticError(feature: string): never {
  throw new Error(`${feature} requires a server-side API and is not available on static deployments.`);
}

/** Chat with portfolio AI — routes through /api/chat */
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
  return resp.text();
}

/** Analyze job description — routes through /api/jobs/analyze */
export async function browserAnalyzeJob(jobDescription: string, _portfolioData: any): Promise<any> {
  if (isStaticDeployment()) staticError('Job analysis');
  const resp = await fetch('/api/jobs/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobDescription }),
  });
  if (!resp.ok) throw new Error(`Job analysis API error: ${resp.status}`);
  return (await resp.json()).analysis;
}

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
  return (await resp.json()).answer ?? '';
}

/** Analyze coursework — routes through /api/coursework/analyze */
export async function browserAnalyzeCoursework(text: string): Promise<any> {
  if (isStaticDeployment()) staticError('Coursework analysis');
  const resp = await fetch('/api/coursework/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!resp.ok) throw new Error(`Coursework analysis API error: ${resp.status}`);
  return resp.json();
}
