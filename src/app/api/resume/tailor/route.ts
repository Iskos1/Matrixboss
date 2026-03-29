import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ResumeService } from '@/lib/resume/service';
import { compileLatex, cleanupLatexArtifacts } from '@/lib/resume/latex';
import { joinPath, getWritableRoot } from '@/lib/storage/file-utils';
import { handleError, badRequest, json } from '@/lib/http/responses';

export const dynamic = 'force-dynamic';
export const maxDuration = 180; // 3 min — 3-step AI pipeline + LaTeX compilation

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[TailorAPI] Request received at', new Date().toISOString());

  try {
    const body = await request.json();
    const { jobDescription, fileName } = body;

    if (!jobDescription?.trim()) {
      return badRequest('Job description is required');
    }

    const service = ResumeService.getInstance();

    // ── 3-step AI pipeline: analyze → select+tailor → quality-check (+ optional refinement) ──
    console.log('[TailorAPI] Running AI tailoring pipeline...');
    const tailoredContent = await service.tailorContent(jobDescription);
    console.log(`[TailorAPI] Pipeline complete. Fit score: ${tailoredContent.quality_report?.fit_score} | Refinement applied: ${tailoredContent.refinement_applied}`);

    // ── Generate LaTeX (deterministic) ───────────────────────────────────────
    console.log('[TailorAPI] Generating LaTeX resume...');
    const latexResume = service.generateLatexResume(tailoredContent);

    // ── Generate cover letter ─────────────────────────────────────────────────
    console.log('[TailorAPI] Generating cover letter...');
    const coverLetterBody = await service.generateCoverLetter(jobDescription, tailoredContent);
    const latexCoverLetter = service.generateLatexCoverLetter(coverLetterBody);

    // ── Prepare output paths ─────────────────────────────────────────────────
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = fileName
      ? fileName.replace(/\.tex$/, '')
      : `tailored_resume_${timestamp.replace(/-/g, '_').substring(0, 15)}`;

    // On Vercel, /var/task is read-only — write generated files to /tmp instead.
    const outputDir = path.join(getWritableRoot(), 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const texFilename = `${baseName}.tex`;
    const coverLetterFilename = `${baseName.replace('resume', 'cover_letter')}.tex`;

    const texPath = path.join(outputDir, texFilename);
    const coverLetterPath = path.join(outputDir, coverLetterFilename);

    fs.writeFileSync(texPath, latexResume);
    fs.writeFileSync(coverLetterPath, latexCoverLetter);

    // ── Compile PDFs ─────────────────────────────────────────────────────────
    let pdfFilename: string | null = null;
    let pdfCompiled = false;
    let coverLetterPdfFilename: string | null = null;
    let coverLetterPdfCompiled = false;

    const resumeCompileResult = compileLatex(texFilename, { workingDir: outputDir });
    if (resumeCompileResult.success) {
      pdfCompiled = true;
      pdfFilename = resumeCompileResult.pdfFilename;
      cleanupLatexArtifacts(baseName, outputDir);
    } else {
      console.error('[TailorAPI] Resume compilation failed:', resumeCompileResult.error);
    }

    const coverCompileResult = compileLatex(coverLetterFilename, { workingDir: outputDir });
    if (coverCompileResult.success) {
      coverLetterPdfCompiled = true;
      coverLetterPdfFilename = coverCompileResult.pdfFilename;
      cleanupLatexArtifacts(baseName.replace('resume', 'cover_letter'), outputDir);
    } else {
      console.error('[TailorAPI] Cover letter compilation failed:', coverCompileResult.error);
    }

    const elapsed = Date.now() - startTime;
    console.log(`[TailorAPI] Completed in ${Math.round(elapsed / 1000)}s`);

    return json({
      success: true,
      // File references
      filename: texFilename,
      pdfFilename,
      pdfCompiled,
      coverLetterFilename,
      coverLetterPdfFilename,
      coverLetterPdfCompiled,
      // AI results (full)
      tailored_content: tailoredContent,
      // Convenience top-level fields for the UI
      job_analysis: tailoredContent.job_analysis,
      quality_report: tailoredContent.quality_report,
      ats_keywords_used: tailoredContent.ats_keywords_used,
      refinement_applied: tailoredContent.refinement_applied,
      tailoring_summary: tailoredContent.tailoring_summary,
      message: pdfCompiled && coverLetterPdfCompiled
        ? 'Resume and cover letter tailored and compiled to PDF successfully'
        : pdfCompiled
          ? 'Resume tailored and compiled to PDF successfully'
          : 'Resume tailored — PDF compilation unavailable on this server',
    });
  } catch (error) {
    return handleError(error, 'Failed to tailor resume');
  }
}
