import { NextRequest } from 'next/server';
import { generate } from '@/lib/ai/anthropic';
import { compileLatex } from '@/lib/utils/latex-utils';
import { joinPath } from '@/lib/utils/file-utils';
import { handleError, badRequest, json } from '@/lib/api/responses';
import { LATEX_CONFIG } from '@/lib/constants';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a precise LaTeX resume editor. Your only job is to apply the specific change the candidate requests to their LaTeX resume source.

Rules you must follow without exception:
1. Make ONLY the change(s) explicitly requested — do not touch anything else
2. Keep every other line, section, bullet, command, and piece of formatting exactly as-is
3. Never add content that was not already in the document (no new jobs, projects, skills, or metrics)
4. Never remove a whole section unless explicitly asked to
5. Bullet rewrites must stay accurate to the facts already present — you may reword for emphasis or clarity, never for fabrication
6. Preserve all LaTeX commands, escaping, and special characters exactly

Output format:
- Return the COMPLETE updated LaTeX source — nothing more, nothing less
- Your very first character must be the first character of the LaTeX file (e.g. \\ or %)
- No markdown fences, no explanation text before or after the LaTeX, no commentary`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latexContent, instruction, filename, history } = body;

    if (!latexContent?.trim()) {
      return badRequest('latexContent is required');
    }
    if (!instruction?.trim()) {
      return badRequest('instruction is required');
    }
    if (!filename?.trim()) {
      return badRequest('filename is required');
    }

    // Build the prompt
    const prompt = `Here is the current LaTeX resume source:

\`\`\`latex
${latexContent}
\`\`\`

The candidate's instruction:
"${instruction}"

Apply exactly that change and return the complete updated LaTeX source. Remember: output ONLY the LaTeX — no explanation, no fences.`;

    // Include prior conversation so the AI has context on what's already been changed
    const priorHistory = Array.isArray(history) ? history : [];

    const result = await generate(prompt, {
      systemInstruction: SYSTEM_PROMPT,
      history: priorHistory,
    });

    let updatedLatex = result.text.trim();

    // Strip any accidental markdown fences the model might add
    updatedLatex = updatedLatex
      .replace(/^```(?:latex|tex)?\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    // Validate it looks like LaTeX
    if (!updatedLatex.includes('\\') && !updatedLatex.startsWith('%')) {
      return json({
        success: false,
        error: 'AI returned unexpected content instead of LaTeX. Please try again.',
      }, 502);
    }

    // Determine where to save
    let workingDir: string | undefined;
    const generatedDir = joinPath('generated');
    const generatedResumesDir = joinPath('generated_resumes');

    if (fs.existsSync(path.join(generatedResumesDir, filename))) {
      workingDir = generatedResumesDir;
    } else if (fs.existsSync(path.join(generatedDir, filename))) {
      workingDir = generatedDir;
    } else {
      // Default to generated_resumes
      workingDir = generatedResumesDir;
      if (!fs.existsSync(workingDir)) fs.mkdirSync(workingDir, { recursive: true });
    }

    // Save the updated LaTeX
    fs.writeFileSync(path.join(workingDir, filename), updatedLatex, 'utf-8');

    // Recompile
    const compileResult = compileLatex(filename, {
      timeout: LATEX_CONFIG.DEFAULT_TIMEOUT,
      workingDir,
    });

    return json({
      success: true,
      updatedLatex,
      pdfCompiled: compileResult.success,
      pdfFilename: compileResult.success ? compileResult.pdfFilename : null,
      compileError: compileResult.success ? null : (compileResult.error || 'Compilation failed'),
    });

  } catch (error) {
    return handleError(error, 'Failed to refine resume');
  }
}
