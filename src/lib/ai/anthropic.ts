/**
 * Centralized Anthropic AI Client — Claude Sonnet 4.6 with Extended Thinking
 *
 * This is the SINGLE source of truth for ALL AI operations in the system.
 * Every service and API route MUST use `generate()`, `generateJson()`,
 * or `generateStream()` from this file. No exceptions.
 *
 * Features:
 *  - Locked to claude-sonnet-4-6 (no fallback models)
 *  - Extended thinking enabled on all calls — 8k token budget for batch, 4k for streams
 *  - Streaming support via generateStream() — thinking blocks silently skipped
 *  - Aggressive retry with exponential backoff (handles 529 overloaded)
 *  - Per-request timeout protection (prevents hung requests)
 *  - Auth / quota / model error classification
 *  - JSON response cleaning & parsing
 */

import Anthropic from '@anthropic-ai/sdk';

// ─── Model Configuration ─────────────────────────────────────────────────────
// Single model. No fallbacks. Claude Sonnet 4.6 with extended thinking.

const MODEL_NAME = 'claude-sonnet-4-6';

// With extended thinking, max_tokens must be > budget_tokens.
// 16 000 total: 8 000 for thinking, 8 000 for output text.
const MAX_OUTPUT_TOKENS = 16000;
const THINKING_BUDGET_TOKENS = 8000;

// Streaming: smaller thinking budget keeps chat responsive.
const STREAM_THINKING_BUDGET_TOKENS = 4000;
const STREAM_MAX_OUTPUT_TOKENS = 12000;

// ─── Retry Configuration ─────────────────────────────────────────────────────
// Two configs:
//  STREAM: short delays so user gets feedback fast or error fast
//  BATCH:  patient retries for background operations

const STREAM_MAX_RETRIES = 2;
const STREAM_BASE_DELAY_MS = 1000;
const STREAM_TIMEOUT_MS = 60000;  // longer — thinking adds latency

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 3000;
const MAX_DELAY_MS = 60000;
const REQUEST_TIMEOUT_MS = 180000; // 3 min — thinking passes take longer

// ─── Error Types ─────────────────────────────────────────────────────────────

export class AIAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIAuthError';
  }
}

export class AIQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIQuotaError';
  }
}

export class AIModelError extends Error {
  public readonly failedModels: string[];
  constructor(message: string, failedModels: string[]) {
    super(message);
    this.name = 'AIModelError';
    this.failedModels = failedModels;
  }
}

// ─── Client Singleton ────────────────────────────────────────────────────────

let _client: Anthropic | null = null;
let _lastKey: string | null = null;

/**
 * Get (or create) the Anthropic client.
 * Re-creates if the API key has changed (hot-reload friendly).
 */
export function getClient(): Anthropic {
  const apiKey = (process.env.ANTHROPIC_API_KEY ?? '').trim();

  if (!apiKey) {
    throw new AIAuthError(
      'ANTHROPIC_API_KEY environment variable is required. ' +
      'Add ANTHROPIC_API_KEY=sk-ant-... to your .env.local file.'
    );
  }

  if (_client && _lastKey === apiKey) return _client;

  _client = new Anthropic({ apiKey });
  _lastKey = apiKey;
  return _client;
}

// ─── JSON Cleaning ───────────────────────────────────────────────────────────

/**
 * Strip markdown fences and extract the first JSON object/array
 * from an AI response string.
 */
export function cleanJsonResponse(text: string): string {
  const clean = text.replace(/```(?:json)?\n?|\n?```/g, '').trim();

  const firstBrace = clean.indexOf('{');
  const firstBracket = clean.indexOf('[');

  if (firstBrace === -1 && firstBracket === -1) return clean;

  let start: number;
  let end: number;

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

/**
 * Parse JSON from an AI response, cleaning it first.
 * Throws a descriptive error on parse failure.
 */
export function parseAIJson<T = unknown>(text: string): T {
  const cleaned = cleanJsonResponse(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(
      `Failed to parse AI JSON response. ` +
      `Cleaned text (first 200 chars): ${cleaned.substring(0, 200)}`
    );
  }
}

// ─── Error Classification ────────────────────────────────────────────────────

function isAuthError(error: any): boolean {
  const msg = (error?.message ?? '').toLowerCase();
  const status = error?.status ?? error?.response?.status;
  return (
    msg.includes('authentication') ||
    msg.includes('invalid api key') ||
    msg.includes('api key') ||
    msg.includes('unauthorized') ||
    msg.includes('environment variable is required') ||
    status === 401 ||
    status === 403
  );
}

function isQuotaError(error: any): boolean {
  const msg = (error?.message ?? '').toLowerCase();
  const status = error?.status ?? error?.response?.status;
  return (
    msg.includes('credit balance') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    status === 429
  );
}

function isRetryableError(error: any): boolean {
  const msg = (error?.message ?? '').toLowerCase();
  const status = error?.status ?? error?.response?.status;
  return (
    (typeof status === 'number' && status >= 500) ||
    status === 529 ||
    status === 503 ||
    status === 502 ||
    status === 500 ||
    msg.includes('529') ||
    msg.includes('503') ||
    msg.includes('502') ||
    msg.includes('500') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('service unavailable') ||
    msg.includes('internal error') ||
    msg.includes('backend error') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('socket hang up') ||
    msg.includes('aborted')
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRetryDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  const jitter = Math.floor(Math.random() * 1000) - 500;
  return delay + jitter;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms (${label})`));
    }, ms);
    promise
      .then(value => { clearTimeout(timer); resolve(value); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}

/**
 * Convert Gemini-style inlineParts to Anthropic content blocks.
 * Supports: { inlineData: { data, mimeType } } for images
 *           { text: '...' } for text chunks
 */
function buildUserContent(
  prompt: string,
  inlineParts?: any[]
): Anthropic.ContentBlockParam[] {
  const content: Anthropic.ContentBlockParam[] = [];

  if (inlineParts && inlineParts.length > 0) {
    for (const part of inlineParts) {
      if (part.inlineData) {
        // Image/binary part — only include if it's an image type Anthropic supports
        const mimeType = part.inlineData.mimeType as string;
        if (mimeType.startsWith('image/')) {
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: part.inlineData.data,
            },
          });
        }
        // PDFs and other binary types: skip (caller should extract text first)
      } else if (part.text) {
        content.push({ type: 'text', text: part.text });
      }
    }
  }

  // Main prompt text always goes last
  content.push({ type: 'text', text: prompt });

  return content;
}

// ─── Options Interface ───────────────────────────────────────────────────────

export interface GenerateOptions {
  /** System instruction for the AI */
  systemInstruction?: string;
  /** Request JSON output — the prompt will be augmented to enforce JSON */
  jsonMode?: boolean;
  /** Multi-turn chat history in Anthropic format */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Inline image/file parts (Gemini-style, auto-converted) */
  inlineParts?: any[];

  // Legacy fields — ignored but kept for backward compatibility
  tier?: string;
  models?: string[];
}

// ─── Core Generation ─────────────────────────────────────────────────────────

/**
 * Generate text from Claude Sonnet 4.6 (extended thinking) with automatic retry.
 *
 * This is the SINGLE function every service should call.
 */
export async function generate(
  prompt: string,
  options: GenerateOptions = {}
): Promise<{ text: string; model: string }> {
  const {
    systemInstruction,
    jsonMode = false,
    history,
    inlineParts,
  } = options;

  const client = getClient();
  let lastError: any = null;

  // Append JSON instruction if needed
  const finalPrompt = jsonMode
    ? `${prompt}\n\nIMPORTANT: Return ONLY valid JSON. No markdown, no explanation, no code fences.`
    : prompt;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Anthropic] Retry attempt ${attempt}/${MAX_RETRIES} for ${MODEL_NAME}...`);
      }

      // Build message history
      const messages: Anthropic.MessageParam[] = [];

      if (history && history.length > 0) {
        for (const h of history) {
          messages.push({ role: h.role, content: h.content });
        }
      }

      // Add the current user message
      const userContent = buildUserContent(finalPrompt, inlineParts);
      messages.push({
        role: 'user',
        content: userContent.length === 1 && userContent[0].type === 'text'
          ? userContent[0].text  // simple string when no images
          : userContent,
      });

      const requestParams: Anthropic.MessageCreateParamsNonStreaming = {
        model: MODEL_NAME,
        max_tokens: MAX_OUTPUT_TOKENS,
        // Extended thinking — Claude reasons internally before answering.
        // temperature is implicitly 1 when thinking is enabled (API default).
        thinking: {
          type: 'enabled',
          budget_tokens: THINKING_BUDGET_TOKENS,
        },
        messages,
        ...(systemInstruction ? { system: systemInstruction } : {}),
      };

      const response = await withTimeout(
        client.messages.create(requestParams),
        REQUEST_TIMEOUT_MS,
        `generate:${MODEL_NAME}`
      );

      // Skip thinking blocks — only return the final text output.
      const text = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

      if (!text) {
        throw new Error(`Empty response from ${MODEL_NAME}`);
      }

      if (attempt > 0) {
        console.log(`[Anthropic] ✅ ${MODEL_NAME} succeeded on retry attempt ${attempt}`);
      }

      return { text, model: MODEL_NAME };

    } catch (error: any) {
      lastError = error;

      if (isAuthError(error)) {
        throw new AIAuthError(
          `Anthropic API key is invalid or missing. Check your .env.local file. (${error.message})`
        );
      }

      if (isQuotaError(error)) {
        throw new AIQuotaError(
          `Anthropic quota/rate limit exceeded. Please try again later. (${error.message})`
        );
      }

      if (isRetryableError(error) && attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.warn(
          `[Anthropic] ⚠️  ${MODEL_NAME} hit retryable error (attempt ${attempt + 1}/${MAX_RETRIES + 1}). ` +
          `Waiting ${Math.round(delay / 1000)}s before retry. Error: ${error.message?.substring(0, 120)}`
        );
        await sleep(delay);
        continue;
      }

      console.error(
        `[Anthropic] ❌ ${MODEL_NAME} failed permanently after ${attempt + 1} attempt(s): ${error.message?.substring(0, 200)}`
      );
      break;
    }
  }

  throw new AIModelError(
    `AI request failed. Last error: ${lastError?.message ?? 'Unknown'}`,
    [MODEL_NAME]
  );
}

/**
 * Generate and parse JSON from AI in one call.
 */
export async function generateJson<T = unknown>(
  prompt: string,
  options: Omit<GenerateOptions, 'jsonMode'> = {}
): Promise<{ data: T; model: string }> {
  const result = await generate(prompt, { ...options, jsonMode: true });
  const data = parseAIJson<T>(result.text);
  return { data, model: result.model };
}

// ─── Streaming Generation ─────────────────────────────────────────────────────

/**
 * Generate text from Claude Sonnet 4.6 as a streaming async generator.
 *
 * Thinking blocks are emitted internally by the model but silently dropped —
 * only the final text response is yielded to the caller.
 */
export async function* generateStream(
  prompt: string,
  options: GenerateOptions = {}
): AsyncGenerator<string, void, unknown> {
  const { systemInstruction, history, inlineParts } = options;
  const client = getClient();
  let lastError: any = null;

  for (let attempt = 0; attempt <= STREAM_MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Anthropic] Stream retry attempt ${attempt}/${STREAM_MAX_RETRIES}...`);
      }

      // Build message history
      const messages: Anthropic.MessageParam[] = [];

      if (history && history.length > 0) {
        for (const h of history) {
          messages.push({ role: h.role, content: h.content });
        }
      }

      const userContent = buildUserContent(prompt, inlineParts);
      messages.push({
        role: 'user',
        content: userContent.length === 1 && userContent[0].type === 'text'
          ? userContent[0].text
          : userContent,
      });

      const streamParams: Anthropic.MessageStreamParams = {
        model: MODEL_NAME,
        max_tokens: STREAM_MAX_OUTPUT_TOKENS,
        // Extended thinking for streaming — thinking_delta events are
        // automatically skipped below (we only yield text_delta).
        thinking: {
          type: 'enabled',
          budget_tokens: STREAM_THINKING_BUDGET_TOKENS,
        },
        messages,
        ...(systemInstruction ? { system: systemInstruction } : {}),
      };

      // Start the stream with timeout
      const stream = await withTimeout(
        Promise.resolve(client.messages.stream(streamParams)),
        STREAM_TIMEOUT_MS,
        `stream:${MODEL_NAME}`
      );

      for await (const event of stream) {
        // Only yield text deltas — thinking_delta events are silently skipped.
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          if (event.delta.text) yield event.delta.text;
        }
      }

      if (attempt > 0) {
        console.log(`[Anthropic] ✅ Stream succeeded on retry ${attempt}`);
      }
      return;

    } catch (error: any) {
      lastError = error;

      if (isAuthError(error)) {
        throw new AIAuthError(`Anthropic API key is invalid. (${error.message})`);
      }
      if (isQuotaError(error)) {
        throw new AIQuotaError(`Anthropic quota exceeded. (${error.message})`);
      }

      if (isRetryableError(error) && attempt < STREAM_MAX_RETRIES) {
        const delay = Math.min(STREAM_BASE_DELAY_MS * Math.pow(2, attempt), 4000);
        console.warn(
          `[Anthropic] ⚠️  Stream retryable error (attempt ${attempt + 1}/${STREAM_MAX_RETRIES + 1}). ` +
          `Waiting ${delay}ms... Error: ${error.message?.substring(0, 80)}`
        );
        await sleep(delay);
        continue;
      }

      console.error(
        `[Anthropic] ❌ Stream failed after ${attempt + 1} attempt(s): ${error.message?.substring(0, 200)}`
      );
      break;
    }
  }

  throw new AIModelError(
    `AI is temporarily unavailable. Please try again. (${lastError?.message?.substring(0, 100) ?? 'Unknown error'})`,
    [MODEL_NAME]
  );
}

// ─── Exported Constants (for backward compatibility) ──────────────────────────

export const MODEL = MODEL_NAME;
/** @deprecated Use MODEL */
export const MODELS_HEAVY = [MODEL_NAME] as const;
/** @deprecated Use MODEL */
export const MODELS_STANDARD = [MODEL_NAME] as const;
/** @deprecated Use MODEL */
export const MODELS_FAST = [MODEL_NAME] as const;
export type ModelTier = 'heavy' | 'standard' | 'fast';
