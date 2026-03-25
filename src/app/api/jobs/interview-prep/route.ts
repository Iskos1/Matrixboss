import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/file-utils';
import { generate } from '@/lib/ai/anthropic';
import { handleError, badRequest, json } from '@/lib/api/responses';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function loadCandidateData(): any {
  const portfolioPath = path.join(getProjectRoot(), 'src/data/portfolio.json');
  const resumePath = path.join(getProjectRoot(), 'src/data/resume_data.json');

  if (fs.existsSync(portfolioPath)) {
    const portfolio = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));
    return {
      profile: portfolio.profile || {},
      skills: portfolio.skills || [],
      experience: portfolio.experience || [],
      projects: (portfolio.projects || []).map((p: any) => ({
        title: p.title,
        description: p.description,
        technicalDetails: p.technicalDetails,
        tags: p.tags,
        key_features: p.key_features,
      })),
      certifications: portfolio.certifications || [],
      education: portfolio.education || {},
    };
  }

  if (fs.existsSync(resumePath)) {
    const rd = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));
    return {
      personal_info: rd.personal_info || {},
      skills: rd.skills || {},
      experience: rd.work_experience || [],
      projects: (rd.projects || []).map((p: any) => ({
        title: p.title,
        description: p.description,
        tags: p.tags,
      })),
      certifications: rd.certifications || [],
      education: rd.education || {},
    };
  }

  return {};
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, jobDescription, company, role, analysis } = body;

    if (!question?.trim()) {
      return badRequest('question is required');
    }
    if (!jobDescription?.trim()) {
      return badRequest('jobDescription is required');
    }

    const candidateData = loadCandidateData();

    const presentSkills = analysis?.presentSkills?.join(', ') || 'N/A';
    const missingSkills = analysis?.missingSkills?.map((s: any) => s.skill).join(', ') || 'None';
    const criticalVerdict = analysis?.criticalVerdict || '';
    const industry = analysis?.industry || '';
    const roleType = analysis?.roleType || '';
    const seniorityLevel = analysis?.seniorityLevel || '';
    const companyName = company || 'the company';
    const roleName = role || 'this role';

    const prompt = `You are an expert career coach and interview preparation specialist. Your job is to craft the perfect, genuine, personalized response to an application or interview question for this specific candidate applying to this specific role.

═══════════════════════════════════════════
THE JOB THEY'RE APPLYING FOR
═══════════════════════════════════════════
Company: ${companyName}
Role: ${roleName}
Industry: ${industry} | Role Type: ${roleType} | Level: ${seniorityLevel}

Job Description:
${jobDescription}

═══════════════════════════════════════════
JOB-SPECIFIC INSIGHTS (from compatibility analysis)
═══════════════════════════════════════════
Skills this candidate HAS that match this job: ${presentSkills}
Skills this candidate is missing: ${missingSkills}
AI Recruiter Verdict: ${criticalVerdict}

═══════════════════════════════════════════
CANDIDATE'S COMPLETE BACKGROUND — SOURCE OF TRUTH
═══════════════════════════════════════════
${JSON.stringify(candidateData, null, 2)}

═══════════════════════════════════════════
THE APPLICATION QUESTION TO ANSWER
═══════════════════════════════════════════
${question}

═══════════════════════════════════════════
RULES
═══════════════════════════════════════════
1. ONLY real experiences from the candidate's background. NEVER fabricate.
2. IDENTIFY THE QUESTION TYPE and adapt the format:
   - Behavioral → STAR format
   - Situational → Ground in real past experience, then apply
   - Skills/Technical → Reference specific projects or roles
   - Motivation → Connect genuine background to company/role
   - Personal → Draw from real life experiences
3. TAILOR TO THIS EXACT JOB for ${companyName} and ${roleName}.
4. BE SPECIFIC: Name actual projects, companies, tools, outcomes.
5. HONEST ABOUT GAPS: Acknowledge, then pivot to relevant experience.
6. LENGTH: Behavioral/complex: 8-14 sentences. Simple: 4-6 sentences.
7. OPENING: Don't restate the question. Answer directly.
8. ENTRY-LEVEL LANGUAGE: This is a student or recent graduate. Write in a natural, entry-level voice. Never use senior or executive vocabulary — no words like "spearheaded", "orchestrated", "leveraged", "synergized", "drove strategic vision", "owned end-to-end", or similar corporate buzzwords. Use plain, clear, conversational words.
9. HUMANIZE: Sound like a real person talking, not a polished PR statement. Use natural sentence rhythm with some variation. It's okay to show enthusiasm, genuine curiosity, or a brief personal moment — these make the response feel authentic. Avoid sounding robotic, formulaic, or like it was written by AI. Write the way a thoughtful, grounded student would actually speak in an interview.

Return ONLY the response text in first person. No preamble.`;

    const result = await generate(prompt, { tier: 'standard' });

    return json({ success: true, answer: result.text.trim() });
  } catch (error) {
    return handleError(error, 'Failed to generate response');
  }
}
