import { NextRequest } from 'next/server';
import fs from 'fs';
import { generate } from '@/lib/ai/anthropic';
import { compileLatex } from '@/lib/resume/latex';
import { resolveGeneratedDir } from '@/lib/storage/file-utils';
import { handleError, badRequest, json } from '@/lib/http/responses';
import { LATEX_CONFIG } from '@/lib/config/constants';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a precise LaTeX resume editor. Apply only the change(s) the candidate requests.

Rules:
1. Make ONLY the requested change — do not touch anything else
2. Never add content not already in the document
3. Never remove a whole section unless explicitly asked
4. Bullet rewrites must stay factually accurate — reword for clarity, never fabricate
5. Preserve all LaTeX commands and special characters exactly

Output: Return the COMPLETE updated LaTeX source only. First character must be the first character of the file. No markdown fences, no commentary.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latexContent, instruction, filename, history } = body;

    if (!latexContent?.trim()) return badRequest('latexContent is required');
    if (!instruction?.trim()) return badRequest('instruction is required');
    if (!filename?.trim()) return badRequest('filename is required');

    const result = await generate(
      `Here is the current LaTeX resume source:\n\`\`\`latex\n${latexContent}\n\`\`\`\n\nCandidate instruction: "${instruction}"\n\nApply exactly that change and return the complete updated LaTeX source. Output ONLY the LaTeX — no fences, no explanation.`,
      { systemInstruction: SYSTEM_PROMPT, history: Array.isArray(history) ? history : [] }
    );

    let updatedLatex = result.text.trim()
      .replace(/^```(?:latex|tex)?\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    if (!updatedLatex.includes('\\') && !updatedLatex.startsWith('%')) {
      return json({ success: false, error: 'AI returned unexpected content instead of LaTeX. Please try again.' }, 502);
    }

    const workingDir = resolveGeneratedDir(filename);
    fs.writeFileSync(`${workingDir}/${filename}`, updatedLatex, 'utf-8');

    const compileResult = compileLatex(filename, { timeout: LATEX_CONFIG.DEFAULT_TIMEOUT, workingDir });

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
