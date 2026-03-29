/**
 * Centralized constants for the application
 */

// File paths
export const PATHS = {
  PORTFOLIO_DATA: 'src/data/portfolio.json',
  RESUME_DATA: 'src/data/resume_data.json',
  RESUME_TEMPLATE: 'src/templates/resume_template.tex',
  RESUME_TEMPLATE_PDF: 'src/templates/resume_template.pdf',
  SKILL_PATHS: 'src/data/skill-paths.json',
} as const;

// File patterns
export const FILE_PATTERNS = {
  TAILORED_RESUME: /^tailored_resume_[\w-]+\.tex$/,
  TAILORED_COVER_LETTER: /^tailored_cover_letter_[\w-]+\.tex$/,
  ANALYSIS_FILE: /^tailored_resume_[\w-]+_analysis\.json$/,
  SAFE_DOWNLOAD: /^(tailored_(resume|cover_letter)_[\w-]+\.(tex|json|pdf)|resume_template\.(tex|pdf))$/,
} as const;

// LaTeX compilation settings
export const LATEX_CONFIG = {
  DEFAULT_TIMEOUT: 30000, // 30 seconds
  LONG_TIMEOUT: 120000, // 120 seconds for AI operations
  MAX_BUFFER: 10 * 1024 * 1024, // 10MB
} as const;

// API timeouts
export const API_TIMEOUTS = {
  LATEX_COMPILE: 30000,
  PYTHON_SCRIPT: 120000,
} as const;

// Content types
export const CONTENT_TYPES = {
  PDF: 'application/pdf',
  JSON: 'application/json',
  TEXT: 'text/plain',
  TEX: 'text/plain',
} as const;
