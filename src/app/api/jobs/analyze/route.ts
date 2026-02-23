import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/file-utils';
import { getGeminiClient, cleanJsonResponse } from '@/lib/utils/api-utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface SkillGapAnalysis {
  /** 0-100 compatibility score — brutally honest */
  compatibilityScore: number;
  /** e.g. "Strong Match", "Partial Match", "Weak Match", "Not a Fit" */
  compatibilityLabel: string;
  /** Detected industry / sector */
  industry: string;
  /** Specific sub-domain of the role */
  roleType: string;
  /** Seniority expected */
  seniorityLevel: string;
  /** Skills from the JD that the candidate DOES have */
  presentSkills: string[];
  /** Skills from the JD that the candidate is MISSING */
  missingSkills: Array<{
    skill: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    reason: string;
  }>;
  /** Experience gaps (not just skills, but domain/industry experience) */
  experienceGaps: string[];
  /** Honest overall verdict — no sugar-coating */
  criticalVerdict: string;
  /** What would push this candidate to a strong match for THIS job */
  improvementPlan: string[];
  /** Skills that appear frequently as gaps across the market for this role type */
  marketSkillsToLearn: string[];
  /** Quick 2-3 sentence summary */
  summary: string;
}

async function generateAnalysis(
  jobDescription: string,
  candidateData: any
): Promise<SkillGapAnalysis> {
  const client = getGeminiClient();
  const models = ['gemini-3.1-pro-preview', 'gemini-3.1-pro', 'gemini-2.0-flash'];

  const prompt = `You are a brutally honest, senior technical recruiter with 20+ years of experience screening candidates at top-tier companies (Google, McKinsey, Goldman Sachs, etc.). You have zero tolerance for fluff and always give candidates the real picture.

Your job: Analyze how well this candidate matches this specific job, then produce a CRITICAL, HONEST evaluation.

═══════════════════════════════════════════
JOB DESCRIPTION
═══════════════════════════════════════════
${jobDescription}

═══════════════════════════════════════════
CANDIDATE PROFILE (SOURCE OF TRUTH)
═══════════════════════════════════════════
${JSON.stringify(candidateData, null, 2)}

═══════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════

1. COMPATIBILITY SCORE (0-100):
   - 85-100: The candidate is an excellent fit. Hire immediately.
   - 70-84: Strong match with minor gaps. Worth interviewing.
   - 50-69: Partial match. Missing key skills but has potential.
   - 30-49: Weak match. Significant gaps that would concern most recruiters.
   - 0-29: Not a fit for this specific role. Different career direction needed.
   BE HONEST. Do not inflate the score out of politeness.

2. PRESENT SKILLS: List skills from the job description that the candidate clearly demonstrates. Be specific — use exact skill names from the JD, not generic terms.

3. MISSING SKILLS: Be brutally specific. Don't just say "needs more experience" — name exact technologies, methodologies, frameworks, or domain knowledge missing. For each gap, indicate:
   - importance: "critical" (without it, they'd likely be rejected), "important" (a gap but not disqualifying), or "nice-to-have"
   - reason: WHY this specific gap matters for this role

4. EXPERIENCE GAPS: Beyond just skill names — what real-world experience, domain depth, or industry context is missing? (e.g., "Has never led a team of engineers", "No fintech regulatory experience", "Built projects but no production-scale systems")

5. CRITICAL VERDICT: 2-4 sentences. Be a senior recruiter talking to a friend. Tell them the truth about how competitive they are for this specific role. Don't be cruel, but don't be soft either.

6. IMPROVEMENT PLAN: Exactly what this candidate should do (learn, build, or get experience in) to be competitive for this type of role. Be specific and actionable.

7. MARKET SKILLS TO LEARN: Skills that are broadly in-demand for this role type across the industry — even if not explicitly mentioned in this specific JD. These are the skills that will make them more hireable in this space in general.

Return ONLY raw JSON — no markdown, no commentary.

{
  "compatibilityScore": number (0-100),
  "compatibilityLabel": "Strong Match" | "Good Match" | "Partial Match" | "Weak Match" | "Not a Fit",
  "industry": "string (e.g. 'Technology', 'Finance', 'Healthcare', 'Consulting', 'E-Commerce')",
  "roleType": "string (e.g. 'Software Engineering', 'Data Science', 'Product Management', 'Sales', 'Operations')",
  "seniorityLevel": "string (e.g. 'Entry Level', 'Mid Level', 'Senior', 'Manager', 'Director')",
  "presentSkills": ["skill1", "skill2"],
  "missingSkills": [
    {
      "skill": "exact skill name",
      "importance": "critical" | "important" | "nice-to-have",
      "reason": "why this gap matters for this role"
    }
  ],
  "experienceGaps": ["gap1", "gap2"],
  "criticalVerdict": "Honest 2-4 sentence assessment.",
  "improvementPlan": ["specific action 1", "specific action 2"],
  "marketSkillsToLearn": ["skill1", "skill2"],
  "summary": "2-3 sentence overview of the match."
}`;

  let lastError: any = null;

  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new Error('Empty response');
      return JSON.parse(cleanJsonResponse(text)) as SkillGapAnalysis;
    } catch (error: any) {
      lastError = error;
      if (
        error.message?.includes('API_KEY_INVALID') ||
        error.status === 403 ||
        error.message?.includes('API key not valid')
      ) {
        throw error;
      }
    }
  }

  throw lastError || new Error('All models failed');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription?.trim()) {
      return NextResponse.json({ error: 'jobDescription is required' }, { status: 400 });
    }

    // Load candidate data (skills, experience, projects)
    const portfolioPath = path.join(getProjectRoot(), 'src/data/portfolio.json');
    const resumePath = path.join(getProjectRoot(), 'src/data/resume_data.json');

    let candidateData: any = {};

    if (fs.existsSync(portfolioPath)) {
      const portfolio = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));
      candidateData = {
        skills: portfolio.skills || [],
        experience: portfolio.experience || [],
        projects: (portfolio.projects || []).map((p: any) => ({
          title: p.title,
          tags: p.tags,
          description: p.description?.slice(0, 200),
        })),
        certifications: portfolio.certifications || [],
      };
    } else if (fs.existsSync(resumePath)) {
      const rd = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));
      candidateData = {
        skills: rd.skills || {},
        experience: rd.work_experience || [],
        projects: (rd.projects || []).map((p: any) => ({
          title: p.title,
          tags: p.tags,
          description: p.description?.slice(0, 200),
        })),
        certifications: rd.certifications || [],
      };
    }

    const analysis = await generateAnalysis(jobDescription, candidateData);

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error('[JobAnalyze] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze job' },
      { status: 500 }
    );
  }
}
