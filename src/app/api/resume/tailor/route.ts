import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ResumeService } from '@/lib/services/resume-service';
import { compileLatex, cleanupLatexArtifacts } from '@/lib/utils/latex-utils';
import { joinPath } from '@/lib/utils/file-utils';
import { handleApiError } from '@/lib/utils/error-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Extend timeout for AI processing

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[TailorAPI] Request received at', new Date().toISOString());

  try {
    const body = await request.json();
    const { jobDescription, fileName } = body;

    console.log('[TailorAPI] Payload size:', JSON.stringify(body).length, 'chars');
    console.log('[TailorAPI] Job Description provided:', !!jobDescription);

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // Initialise service — loads resume_data.json and validates OpenAI key
    console.log('[TailorAPI] Initializing ResumeService...');
    const service = new ResumeService();

    // Step 1 — Analyse the job description
    console.log('[TailorAPI] Step 1: Analyzing Job Description...');
    const jobAnalysis = await service.analyzeJobDescription(jobDescription);
    console.log('[TailorAPI] Job Analysis completed. Keywords:', jobAnalysis.ats_keywords?.length || 0);

    // Step 2 — Tailor resume content to match the job
    console.log('[TailorAPI] Step 2: Tailoring Content...');
    const tailoredContent = await service.tailorContent(jobAnalysis);
    console.log('[TailorAPI] Tailoring completed.');

    // Step 3 — Generate LaTeX resume
    console.log('[TailorAPI] Step 3: Generating LaTeX...');
    const latexResume = service.generateLatexResume(tailoredContent);

    // Step 4 — Generate cover letter
    console.log('[TailorAPI] Step 4: Generating Cover Letter...');
    const coverLetterBody = await service.generateCoverLetter(jobDescription, tailoredContent);
    const latexCoverLetter = service.generateLatexCoverLetter(coverLetterBody);

    // ------------------------------------------------------------------
    // Prepare output paths
    // ------------------------------------------------------------------
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseName = fileName
      ? fileName.replace(/\.tex$/, '')
      : `tailored_resume_${timestamp.replace(/-/g, '_').substring(0, 15)}`;

    const outputDir = joinPath('generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const texFilename          = `${baseName}.tex`;
    const coverLetterFilename  = `${baseName.replace('resume', 'cover_letter')}.tex`;
    const analysisFilename     = `${baseName}_analysis.json`;

    const texPath          = path.join(outputDir, texFilename);
    const coverLetterPath  = path.join(outputDir, coverLetterFilename);
    const analysisPath     = path.join(outputDir, analysisFilename);

    // Write source files
    fs.writeFileSync(texPath, latexResume);
    fs.writeFileSync(coverLetterPath, latexCoverLetter);
    fs.writeFileSync(analysisPath, JSON.stringify(
      { job_analysis: jobAnalysis, tailored_content: tailoredContent, timestamp: new Date().toISOString() },
      null,
      2
    ));

    // ------------------------------------------------------------------
    // Compile PDFs
    // ------------------------------------------------------------------
    let pdfFilename             = null;
    let pdfCompiled             = false;
    let coverLetterPdfFilename  = null;
    let coverLetterPdfCompiled  = false;

    const resumeCompileResult = compileLatex(texFilename, { workingDir: outputDir });
    if (resumeCompileResult.success) {
      pdfCompiled  = true;
      pdfFilename  = resumeCompileResult.pdfFilename;
      cleanupLatexArtifacts(baseName, outputDir);
    } else {
      console.error('Resume compilation failed:', resumeCompileResult.error);
    }

    const coverCompileResult = compileLatex(coverLetterFilename, { workingDir: outputDir });
    if (coverCompileResult.success) {
      coverLetterPdfCompiled  = true;
      coverLetterPdfFilename  = coverCompileResult.pdfFilename;
      cleanupLatexArtifacts(baseName.replace('resume', 'cover_letter'), outputDir);
    } else {
      console.error('Cover letter compilation failed:', coverCompileResult.error);
    }

    const message =
      pdfCompiled && coverLetterPdfCompiled
        ? 'Resume and cover letter tailored and compiled to PDF successfully'
        : pdfCompiled
        ? 'Resume tailored and compiled to PDF successfully'
        : 'Resume tailored successfully';

    return NextResponse.json({
      success:                  true,
      filename:                 texFilename,
      pdfFilename,
      pdfCompiled,
      coverLetterFilename,
      coverLetterPdfFilename,
      coverLetterPdfCompiled,
      analysisFilename,
      job_analysis:             jobAnalysis,
      tailored_content:         tailoredContent,
      message,
    });

  } catch (error: any) {
    console.error('Tailoring error:', error);
    
    // Construct a more helpful error message
    let errorMessage = 'Failed to tailor resume';
    let details = error.message;

    if (error.message?.includes('generate content')) {
      errorMessage = 'AI Model Failed to Generate Content';
      details = 'The AI service could not process the request. ' + error.message;
    } else if (error.message?.includes('LaTeX')) {
      errorMessage = 'PDF Compilation Failed';
    }

    return handleApiError(error, errorMessage);
  }
}
