import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  details?: string;
  output?: string;
  stack?: string;
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  options: {
    details?: string;
    output?: string;
    includeStack?: boolean;
  } = {}
): NextResponse<ApiError> {
  const response: ApiError = {
    error,
  };

  if (options.details) {
    response.details = options.details;
  }

  if (options.output) {
    response.output = options.output;
  }

  if (options.includeStack && process.env.NODE_ENV === 'development') {
    // Stack will be added by the caller if needed
  }

  return NextResponse.json(response, { status });
}

/**
 * Handle API errors with standardized responses
 */
export function handleApiError(error: any, defaultMessage: string = 'An error occurred'): NextResponse<ApiError> {
  console.error('API Error:', error);

  // Check for specific error types
  if (
    error.message?.includes('OPENAI_API_KEY') ||
    error.message?.includes('GEMINI_API_KEY') ||
    error.message?.includes('API_KEY_INVALID') ||
    error.status === 401 ||
    error.status === 403 ||
    error.code === 'invalid_api_key' ||
    error.message?.includes('Incorrect API key') ||
    error.message?.includes('environment variable is required')
  ) {
    return createErrorResponse(
      'AI service configuration error: Invalid or missing API key. Please check your .env.local file.',
      500,
      { details: error.message }
    );
  }

  if (error.message?.includes('Quota exceeded') || error.status === 429) {
    return createErrorResponse(
      'AI Service Quota Exceeded. Please try again later or switch to a different model/key.',
      429,
      { details: error.message }
    );
  }

  if (error.message?.includes('not found') || error.code === 'ENOENT') {
    return createErrorResponse(
      'File or resource not found',
      404,
      { details: error.message }
    );
  }

  // Generic error
  return createErrorResponse(
    defaultMessage,
    500,
    {
      details: error.message || 'Unknown error occurred',
      output: error.stdout || error.stderr,
      includeStack: true,
    }
  );
}
