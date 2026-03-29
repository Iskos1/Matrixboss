/**
 * Standardized API Response Helpers
 * 
 * Every API route should use these instead of manually
 * constructing NextResponse.json() calls. This ensures:
 *  - Consistent response shape
 *  - Proper HTTP status codes
 *  - AI-specific error classification
 *  - Safe error messages (no stack traces in production)
 */

import { NextResponse } from 'next/server';
import { AIAuthError, AIQuotaError, AIModelError } from '@/lib/ai/anthropic';

// ─── Response Types ─────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
}

// ─── Success Helpers ────────────────────────────────────────────────────────

/**
 * Return a standardized success response.
 */
export function ok<T>(data: T, status: number = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true as const, data }, { status });
}

/**
 * Return a raw JSON response (for backwards compatibility with existing
 * routes that don't wrap in { success, data }).
 */
export function json<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

// ─── Error Helpers ──────────────────────────────────────────────────────────

/**
 * Return a standardized error response.
 */
export function error(
  message: string,
  status: number = 500,
  details?: string
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    success: false,
    error: message,
  };

  if (details && process.env.NODE_ENV === 'development') {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}

/**
 * Return a 400 Bad Request error.
 */
export function badRequest(message: string): NextResponse<ApiErrorResponse> {
  return error(message, 400);
}

/**
 * Return a 404 Not Found error.
 */
export function notFound(message: string = 'Resource not found'): NextResponse<ApiErrorResponse> {
  return error(message, 404);
}

// ─── Catch-All Error Handler ────────────────────────────────────────────────

/**
 * Handle any error and return the appropriate API response.
 * Classifies AI errors, file errors, and generic errors.
 * 
 * Usage:
 *   catch (err) { return handleError(err, 'Failed to do X'); }
 */
export function handleError(
  err: unknown,
  fallbackMessage: string = 'An unexpected error occurred'
): NextResponse<ApiErrorResponse> {
  // Ensure we have an Error object
  const e = err instanceof Error ? err : new Error(String(err));

  console.error(`[API Error] ${fallbackMessage}:`, e.message);

  // AI Auth errors → 500 with helpful message
  if (e instanceof AIAuthError) {
    return error(
      'AI service configuration error: Invalid or missing API key. Check your .env.local file.',
      500,
      e.message
    );
  }

  // AI Quota errors → 429
  if (e instanceof AIQuotaError) {
    return error(
      'AI service quota exceeded. Please try again later.',
      429,
      e.message
    );
  }

  // AI Model errors → 503 (service unavailable — upstream AI overloaded)
  if (e instanceof AIModelError) {
    const isHighDemand = e.message.includes('high demand') || e.message.includes('503') || e.message.includes('overloaded');
    return error(
      isHighDemand
        ? 'AI service is experiencing high demand. Please wait a moment and try again.'
        : 'AI service temporarily unavailable. Please try again.',
      503,
      `Failed models: ${e.failedModels.join(', ')}. ${e.message}`
    );
  }

  // File not found
  if ('code' in e && (e as any).code === 'ENOENT') {
    return notFound('File or resource not found');
  }

  // JSON parse errors
  if (e.message.includes('JSON') || e.message.includes('parse')) {
    return error(
      'Failed to process AI response. Please try again.',
      502,
      e.message
    );
  }

  // Generic
  return error(fallbackMessage, 500, e.message);
}
