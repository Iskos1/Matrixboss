import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/storage/file-utils';
import { generateJson } from '@/lib/ai/anthropic';
import { handleError, badRequest, json } from '@/lib/http/responses';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export interface SkillGapAnalysis {
  compatibilityScore: number;
  compatibilityLabel: string;
  industry: string;
  roleType: string;
  seniorityLevel: string;
  presentSkills: string[];
  missingSkills: Array<{
    skill: string;
    importance: 'critical' | 'important' | 'nice-to-have';
    reason: string;
  }>;
  experienceGaps: string[];
  criticalVerdict: string;
  improvementPlan: string[];
  marketSkillsToLearn: string[];
  summary: string;
}

function loadCandidateData(): any {
  const portfolioPath = path.join(getProjectRoot(), 'src/data/portfolio.json');
  const resumePath = path.join(getProjectRoot(), 'src/data/resume_data.json');

  if (fs.existsSync(portfolioPath)) {
    const portfolio = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));
    return {
      skills: portfolio.skills || [],
      experience: portfolio.experience || [],
      projects: (portfolio.projects || []).map((p: any) => ({
        title: p.title,
        tags: p.tags,
        description: p.description?.slice(0, 200),
      })),
      certifications: portfolio.certifications || [],
    };
  }

  if (fs.existsSync(resumePath)) {
    const rd = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));
    return {
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

  return {};
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription } = body;

    if (!jobDescription?.trim()) {
      return badRequest('jobDescription is required');
    }

    const candidateData = loadCandidateData();

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
   - 85-100: Excellent fit. Hire immediately.
   - 70-84: Strong match with minor gaps.
   - 50-69: Partial match. Missing key skills but has potential.
   - 30-49: Weak match. Significant gaps.
   - 0-29: Not a fit for this specific role.
   BE HONEST. Do not inflate the score.

2. PRESENT SKILLS: List skills the candidate clearly demonstrates.

3. MISSING SKILLS: Exact technologies, methodologies, frameworks missing. For each:
   - importance: "critical", "important", or "nice-to-have"
   - reason: WHY this gap matters

4. EXPERIENCE GAPS: Real-world experience, domain depth, or industry context missing.

5. CRITICAL VERDICT: 2-4 sentences. Honest assessment as a senior recruiter.

6. IMPROVEMENT PLAN: Specific, actionable steps to become competitive.

7. MARKET SKILLS TO LEARN: Broadly in-demand skills for this role type.

Return ONLY raw JSON:
{
  "compatibilityScore": number,
  "compatibilityLabel": "Strong Match" | "Good Match" | "Partial Match" | "Weak Match" | "Not a Fit",
  "industry": "string",
  "roleType": "string",
  "seniorityLevel": "string",
  "presentSkills": ["skill1", "skill2"],
  "missingSkills": [{ "skill": "name", "importance": "critical", "reason": "why" }],
  "experienceGaps": ["gap1", "gap2"],
  "criticalVerdict": "Honest assessment.",
  "improvementPlan": ["action 1", "action 2"],
  "marketSkillsToLearn": ["skill1", "skill2"],
  "summary": "2-3 sentence overview."
}`;

    const result = await generateJson<SkillGapAnalysis>(prompt, { tier: 'heavy' });

    return json({ success: true, analysis: result.data });
  } catch (error) {
    return handleError(error, 'Failed to analyze job');
  }
}
