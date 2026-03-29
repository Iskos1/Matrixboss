import https from 'https';

// ─── Model Configuration ──────────────────────────────────────────────────────

const MODEL_NAME = 'claude-sonnet-4-6';

// Non-stream path: larger cap for JSON-heavy resume/analysis tasks
const MAX_OUTPUT_TOKENS = 16000;
// Stream path: smaller cap, thinking disabled for fast chat replies
const STREAM_MAX_OUTPUT_TOKENS = 8000;

// ─── Retry Configuration ──────────────────────────────────────────────────────

const STREAM_MAX_RETRIES    = 2;
const STREAM_BASE_DELAY_MS  = 1000;
const STREAM_TIMEOUT_MS     = 60000;

const MAX_RETRIES       = 5;
const BASE_DELAY_MS     = 3000;
const MAX_DELAY_MS      = 60000;
const REQUEST_TIMEOUT_MS = 180000;

// ─── Types ────────────────────────────────────────────────────────────────────

type AnthropicContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source: {
        type: 'base64';
        media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
        data: string;
      };
    };

type AnthropicMessageParam = {
  role: 'user' | 'assistant';
  content: string | AnthropicContentBlock[];
};

type AnthropicResponse = {
  model?: string;
  content?: Array<{ type: string; text?: string }>;
  error?: { type?: string; message?: string };
};

class AnthropicHttpError extends Error {
  status?: number;
  errorType?: string;
  constructor(message: string, status?: number, errorType?: string) {
    super(message);
    this.name = 'AnthropicHttpError';
    this.status = status;
    this.errorType = errorType;
  }
}

// ─── Public Error Classes ─────────────────────────────────────────────────────

export class AIAuthError extends Error {
  constructor(message: string) { super(message); this.name = 'AIAuthError'; }
}

export class AIQuotaError extends Error {
  constructor(message: string) { super(message); this.name = 'AIQuotaError'; }
}

export class AIModelError extends Error {
  public readonly failedModels: string[];
  constructor(message: string, failedModels: string[]) {
    super(message);
    this.name = 'AIModelError';
    this.failedModels = failedModels;
  }
}

// ─── Key Retrieval ────────────────────────────────────────────────────────────

function getApiKey(): string {
  const apiKey = (process.env.ANTHROPIC_API_KEY ?? '').trim();
  if (!apiKey) {
    throw new AIAuthError(
      'ANTHROPIC_API_KEY is not set. Add it to your .env.local file.'
    );
  }
  return apiKey;
}

// ─── JSON Utilities ───────────────────────────────────────────────────────────

export function cleanJsonResponse(text: string): string {
  const clean = text.replace(/```(?:json)?\n?|\n?```/g, '').trim();
  const firstBrace   = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');

  if (firstBrace === -1 && firstBracket === -1) return clean;

  let start: number, end: number;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace; end = clean.lastIndexOf('}');
  } else {
    start = firstBracket; end = clean.lastIndexOf(']');
  }

  return (start !== -1 && end !== -1 && end > start)
    ? clean.substring(start, end + 1)
    : clean;
}

export function parseAIJson<T = unknown>(text: string): T {
  const cleaned = cleanJsonResponse(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Failed to parse AI JSON. First 200 chars: ${cleaned.substring(0, 200)}`
    );
  }
}

// ─── Error Classification ─────────────────────────────────────────────────────

function isAuthError(error: any): boolean {
  const msg    = (error?.message ?? '').toLowerCase();
  const status = error?.status ?? error?.response?.status;
  return (
    msg.includes('authentication') ||
    msg.includes('invalid api key') ||
    msg.includes('api key') ||
    msg.includes('unauthorized') ||
    msg.includes('environment variable') ||
    status === 401 || status === 403
  );
}

function isQuotaError(error: any): boolean {
  const msg    = (error?.message ?? '').toLowerCase();
  const status = error?.status ?? error?.response?.status;
  return (
    msg.includes('credit balance') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    status === 429
  );
}

function isRetryableError(error: any): boolean {
  const msg    = (error?.message ?? '').toLowerCase();
  const status = error?.status ?? error?.response?.status;
  return (
    (typeof status === 'number' && status >= 500) ||
    [529, 503, 502, 500].includes(status) ||
    ['529','503','502','500','overloaded','high demand','service unavailable',
     'internal error','backend error','connection error','network error',
     'econnreset','econnrefused','etimedout','socket hang up','aborted',
    ].some(k => msg.includes(k))
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function retryDelay(attempt: number, base: number, max: number): number {
  const jitter = Math.floor(Math.random() * 1000) - 500;
  return Math.min(base * Math.pow(2, attempt), max) + jitter;
}

function buildUserContent(
  prompt: string,
  inlineParts?: any[]
): AnthropicContentBlock[] {
  const blocks: AnthropicContentBlock[] = [];
  if (inlineParts?.length) {
    for (const part of inlineParts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        blocks.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: part.inlineData.mimeType as any,
            data: part.inlineData.data,
          },
        });
      } else if (part.text) {
        blocks.push({ type: 'text', text: part.text });
      }
    }
  }
  blocks.push({ type: 'text', text: prompt });
  return blocks;
}

// ─── Non-Streaming HTTP Request ───────────────────────────────────────────────

async function postAnthropicMessages(
  payload: Record<string, unknown>,
  timeoutMs: number
): Promise<AnthropicResponse> {
  const apiKey = getApiKey();
  const body   = JSON.stringify(payload);

  return new Promise<AnthropicResponse>((resolve, reject) => {
    const req = https.request(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'content-type':    'application/json',
          'content-length':  Buffer.byteLength(body),
          'x-api-key':       apiKey,
          'anthropic-version': '2023-06-01',
        },
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          const status = res.statusCode ?? 0;
          let parsed: AnthropicResponse = {};
          try { parsed = raw ? JSON.parse(raw) : {}; } catch { /* ok */ }

          if (status >= 200 && status < 300) { resolve(parsed); return; }

          const message =
            parsed?.error?.message ||
            raw.substring(0, 500) ||
            `HTTP ${status}`;
          reject(new AnthropicHttpError(message, status, parsed?.error?.type));
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on('error', err => reject(new AnthropicHttpError(`Connection error: ${err.message}`)));
    req.write(body);
    req.end();
  });
}

// ─── True SSE Streaming Request ───────────────────────────────────────────────

async function* streamAnthropicMessages(
  payload: Record<string, unknown>,
  timeoutMs: number
): AsyncGenerator<string> {
  const apiKey = getApiKey();
  const body   = JSON.stringify({ ...payload, stream: true });

  const chunks: string[]   = [];
  let   done   = false;
  let   error: Error | null = null;
  const resolvers: Array<() => void> = [];

  function notify() {
    const r = resolvers.shift();
    if (r) r();
  }

  const req = https.request(
    'https://api.anthropic.com/v1/messages',
    {
      method: 'POST',
      headers: {
        'content-type':    'application/json',
        'content-length':  Buffer.byteLength(body),
        'x-api-key':       apiKey,
        'anthropic-version': '2023-06-01',
      },
    },
    (res) => {
      const status = res.statusCode ?? 0;

      if (status < 200 || status >= 300) {
        let errBody = '';
        res.setEncoding('utf8');
        res.on('data', c => { errBody += c; });
        res.on('end', () => {
          let parsed: any = {};
          try { parsed = JSON.parse(errBody); } catch { /* ok */ }
          error = new AnthropicHttpError(
            parsed?.error?.message || `HTTP ${status}`,
            status,
            parsed?.error?.type
          );
          done = true;
          notify();
        });
        return;
      }

      let buffer = '';
      res.setEncoding('utf8');

      res.on('data', (rawChunk: string) => {
        buffer += rawChunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr || jsonStr === '[DONE]') continue;

          try {
            const event = JSON.parse(jsonStr);
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta' &&
              typeof event.delta.text === 'string'
            ) {
              chunks.push(event.delta.text);
              notify();
            }
          } catch { /* ignore malformed SSE line */ }
        }
      });

      res.on('end', () => { done = true; notify(); });
      res.on('error', err => { error = err; done = true; notify(); });
    }
  );

  req.setTimeout(timeoutMs, () => {
    error = new Error(`Stream timed out after ${timeoutMs}ms`);
    done = true;
    notify();
    req.destroy();
  });

  req.on('error', err => {
    error = new AnthropicHttpError(`Connection error: ${err.message}`);
    done = true;
    notify();
  });

  req.write(body);
  req.end();

  // Yield chunks as they arrive
  let i = 0;
  while (true) {
    while (i < chunks.length) { yield chunks[i++]; }
    if (done) break;
    await new Promise<void>(r => resolvers.push(r));
    while (i < chunks.length) { yield chunks[i++]; }
    if (done) break;
  }

  if (error) throw error;
}

// ─── Core Request (non-streaming) ────────────────────────────────────────────

type RequestProfile = {
  maxOutputTokens: number;
  thinking:        Record<string, unknown>;
  timeoutMs:       number;
  maxRetries:      number;
  baseDelayMs:     number;
  maxDelayMs:      number;
};

async function requestText(
  prompt: string,
  options: GenerateOptions,
  profile: RequestProfile
): Promise<{ text: string; model: string }> {
  const { systemInstruction, jsonMode = false, history, inlineParts } = options;

  const finalPrompt = jsonMode
    ? `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no explanation.`
    : prompt;

  let lastError: any = null;

  for (let attempt = 0; attempt <= profile.maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Anthropic] Retry ${attempt}/${profile.maxRetries}…`);
      }

      const messages: AnthropicMessageParam[] = [];

      if (history?.length) {
        for (const h of history) {
          messages.push({ role: h.role, content: h.content });
        }
      }

      const userContent = buildUserContent(finalPrompt, inlineParts);
      messages.push({
        role: 'user',
        content:
          userContent.length === 1 && userContent[0].type === 'text'
            ? (userContent[0] as { type: 'text'; text: string }).text
            : userContent,
      });

      const payload: Record<string, unknown> = {
        model:      MODEL_NAME,
        max_tokens: profile.maxOutputTokens,
        messages,
      };
      if ((profile.thinking as any)?.type !== 'disabled') {
        payload.thinking = profile.thinking;
      }
      if (systemInstruction) payload.system = systemInstruction;

      const response = await postAnthropicMessages(payload, profile.timeoutMs);

      const text = (response.content ?? [])
        .filter(b => b.type === 'text')
        .map(b => b.text ?? '')
        .join('');

      if (!text) throw new Error(`Empty response from ${MODEL_NAME}`);

      return { text, model: response.model ?? MODEL_NAME };
    } catch (err: any) {
      lastError = err;

      if (isAuthError(err)) {
        throw new AIAuthError(
          `Invalid or missing API key. Check .env.local. (${err.message})`
        );
      }
      if (isQuotaError(err)) {
        throw new AIQuotaError(
          `Anthropic quota/rate limit exceeded. Try again later. (${err.message})`
        );
      }
      if (isRetryableError(err) && attempt < profile.maxRetries) {
        const delay = retryDelay(attempt, profile.baseDelayMs, profile.maxDelayMs);
        console.warn(
          `[Anthropic] ⚠️  Retryable error (attempt ${attempt + 1}). ` +
          `Waiting ${Math.round(delay / 1000)}s. Error: ${err.message?.substring(0, 120)}`
        );
        await sleep(delay);
        continue;
      }

      console.error(
        `[Anthropic] ❌ Failed after ${attempt + 1} attempt(s): ${err.message?.substring(0, 200)}`
      );
      break;
    }
  }

  throw new AIModelError(
    `AI request failed. Last error: ${lastError?.message ?? 'Unknown'}`,
    [MODEL_NAME]
  );
}

// ─── Options Interface ────────────────────────────────────────────────────────

export interface GenerateOptions {
  systemInstruction?: string;
  jsonMode?:          boolean;
  history?:           Array<{ role: 'user' | 'assistant'; content: string }>;
  inlineParts?:       any[];
  tier?:              string;
  models?:            string[];
  disableThinking?:   boolean;
}

// ─── Public: generate (non-streaming) ────────────────────────────────────────

export async function generate(
  prompt: string,
  options: GenerateOptions = {}
): Promise<{ text: string; model: string }> {
  return requestText(prompt, options, {
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    thinking:        options.disableThinking ? { type: 'disabled' } : { type: 'adaptive' },
    timeoutMs:       REQUEST_TIMEOUT_MS,
    maxRetries:      MAX_RETRIES,
    baseDelayMs:     BASE_DELAY_MS,
    maxDelayMs:      MAX_DELAY_MS,
  });
}

export async function generateJson<T = unknown>(
  prompt: string,
  options: Omit<GenerateOptions, 'jsonMode'> = {}
): Promise<{ data: T; model: string }> {
  const result = await generate(prompt, { ...options, jsonMode: true, disableThinking: options.disableThinking ?? true });
  const data   = parseAIJson<T>(result.text);
  return { data, model: result.model };
}

// ─── Public: generateStream (true SSE streaming) ─────────────────────────────

export async function* generateStream(
  prompt: string,
  options: GenerateOptions = {}
): AsyncGenerator<string, void, unknown> {
  const { systemInstruction, history, inlineParts } = options;

  const messages: AnthropicMessageParam[] = [];

  if (history?.length) {
    for (const h of history) {
      messages.push({ role: h.role, content: h.content });
    }
  }

  const userContent = buildUserContent(prompt, inlineParts);
  messages.push({
    role: 'user',
    content:
      userContent.length === 1 && userContent[0].type === 'text'
        ? (userContent[0] as { type: 'text'; text: string }).text
        : userContent,
  });

  const payload: Record<string, unknown> = {
    model:      MODEL_NAME,
    max_tokens: STREAM_MAX_OUTPUT_TOKENS,
    messages,
  };
  if (systemInstruction) payload.system = systemInstruction;

  let lastError: any = null;

  for (let attempt = 0; attempt <= STREAM_MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Anthropic] Stream retry ${attempt}/${STREAM_MAX_RETRIES}…`);
      }

      const gen = streamAnthropicMessages(payload, STREAM_TIMEOUT_MS);
      let gotAny = false;

      for await (const chunk of gen) {
        gotAny = true;
        yield chunk;
      }

      if (!gotAny) throw new Error('Empty stream response from Anthropic');
      return;
    } catch (err: any) {
      lastError = err;

      if (isAuthError(err)) {
        throw new AIAuthError(
          `Invalid or missing API key. Check .env.local. (${err.message})`
        );
      }
      if (isQuotaError(err)) {
        throw new AIQuotaError(
          `Anthropic quota/rate limit exceeded. (${err.message})`
        );
      }
      if (isRetryableError(err) && attempt < STREAM_MAX_RETRIES) {
        const delay = retryDelay(attempt, STREAM_BASE_DELAY_MS, 4000);
        console.warn(
          `[Anthropic] ⚠️  Stream retry in ${Math.round(delay / 1000)}s. Error: ${err.message?.substring(0, 120)}`
        );
        await sleep(delay);
        continue;
      }

      console.error(`[Anthropic] ❌ Stream failed: ${err.message?.substring(0, 200)}`);
      throw new AIModelError(
        `AI stream failed. Last error: ${err.message ?? 'Unknown'}`,
        [MODEL_NAME]
      );
    }
  }

  throw new AIModelError(
    `AI stream failed after retries. Last error: ${lastError?.message ?? 'Unknown'}`,
    [MODEL_NAME]
  );
}

export const MODEL = MODEL_NAME;
