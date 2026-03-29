import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/storage/file-utils';
import { generate, parseAIJson } from '@/lib/ai/anthropic';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface JobAnalysis {
  primary_focus: string;
  seniority_level: string;
  company_name: string;
  industry: string;
  technical_skills: string[];
  soft_skills: string[];
  ats_keywords: string[];
  must_haves: string[];
  nice_to_haves: string[];
}

export interface QualityReport {
  fit_score: number;
  fit_label: string;
  ats_keyword_coverage: number;
  bullet_quality_score: number;
  strengths: string[];
  gaps: string[];
  needs_refinement: boolean;
  refinement_instructions: string[];
}

export interface TailoredContent {
  tailored_professional_summary: string;
  selected_skills: Record<string, string[]>;
  selected_certifications: Array<{ name: string; year: string }>;
  selected_projects: Array<{
    id: string;
    title: string;
    role?: string;
    date: string;
    bullets: Array<{ original_id: string; tailored_text: string; relevance_score: number }>;
    include: boolean;
  }>;
  selected_work_experience: Array<{
    id: string;
    company: string;
    location: string;
    title: string;
    date: string;
    bullets: Array<{ original_id: string; tailored_text: string; relevance_score: number }>;
    include: boolean;
  }>;
  section_order: Array<'work_experience' | 'projects'>;
  tailoring_summary: string;
  job_analysis: JobAnalysis;
  quality_report: QualityReport;
  ats_keywords_used: string[];
  refinement_applied: boolean;
}

export interface ResumeData {
  personal_info: {
    name: string;
    location?: string;
    email: string;
    phone: string;
    github: { url: string; display: string };
    linkedin: { url: string; display: string };
  };
  professional_summary: string;
  education: {
    institution: string;
    location: string;
    degree: string;
    gpa?: string;
    graduation_date: string;
    coursework: string[];
  };
  secondary_education?: {
    institution: string;
    location: string;
    degree: string;
    graduation_date: string;
    notes?: string[];
  };
  skills: Record<string, string[]>;
  projects: any[];
  work_experience: any[];
  certifications: Array<{ name: string; year: string }>;
  leadership: Array<{
    id: string | number;
    organization: string;
    role: string;
    period: string;
    location?: string;
    bullets: string[];
  }>;
}

// ─── Data loading (cached per process) ────────────────────────────────────────

let _resumeDataCache: ResumeData | null = null;

export function loadResumeData(): ResumeData {
  if (_resumeDataCache) return _resumeDataCache;
  try {
    const root = getProjectRoot();
    const resumeData: any = JSON.parse(fs.readFileSync(path.join(root, 'src/data/resume_data.json'), 'utf-8'));
    const portfolioPath = path.join(root, 'src/data/portfolio.json');

    if (!fs.existsSync(portfolioPath)) {
      console.warn('[resume-service] portfolio.json not found — using resume_data.json only');
      return resumeData;
    }

    const pd: any = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));

    if (Array.isArray(pd.skills)) {
      const grouped: Record<string, string[]> = {};
      for (const s of pd.skills) {
        const cat = (s.category ?? 'other').toLowerCase();
        (grouped[cat] ??= []).push(s.name);
      }
      resumeData.skills = grouped;
    }

    if (Array.isArray(pd.projects)) {
      const rdProjects: any[] = Array.isArray(resumeData.projects) ? resumeData.projects : [];
      resumeData.projects = pd.projects.map((p: any) => {
        const words = (p.title ?? '').toLowerCase().split(/\s+/);
        const match = rdProjects.find((r: any) =>
          words.some((w: string) => w.length > 4 && (r.title ?? '').toLowerCase().includes(w))
        );
        return {
          id: String(p.id), title: p.title ?? '', date: p.date ?? '',
          featured: p.featured ?? false, tags: p.tags ?? [],
          description: p.description ?? '', technicalDetails: p.technicalDetails ?? '',
          key_features: p.key_features ?? [], link: p.link ?? '',
          pre_written_bullets: match?.bullets?.map((b: any) => b.text) ?? [],
        };
      });
    }

    if (Array.isArray(pd.experience)) {
      const rdJobs: any[] = Array.isArray(resumeData.work_experience) ? resumeData.work_experience : [];
      const flat: any[] = [];
      for (const exp of pd.experience) {
        const key = (exp.company ?? '').toLowerCase().split(/\s+/)[0];
        const match = rdJobs.find((r: any) =>
          (r.company ?? '').toLowerCase().includes(key) ||
          key.includes((r.company ?? '').toLowerCase().split(/\s+/)[0])
        );
        for (const pos of (Array.isArray(exp.positions) ? exp.positions : [])) {
          flat.push({
            id: String(exp.id), company: exp.company ?? '', location: exp.location ?? '',
            title: pos.role ?? '', date: pos.period ?? '',
            description: pos.description ?? '', technicalDetails: pos.technicalDetails ?? '',
            tags: pos.tags ?? [], pre_written_bullets: match?.bullets?.map((b: any) => b.text) ?? [],
          });
        }
      }
      resumeData.work_experience = flat;
    }

    if (Array.isArray(pd.certifications)) {
      resumeData.certifications = pd.certifications.map((c: any) => ({
        name: c.name ?? '', issuer: c.issuer ?? '', year: c.year ?? '',
      }));
    }

    resumeData.leadership = Array.isArray(pd.leadership)
      ? pd.leadership.map((l: any) => ({
          id: String(l.id ?? ''), organization: l.organization ?? '',
          role: l.role ?? '', period: l.period ?? '', location: l.location ?? '',
          bullets: Array.isArray(l.bullets) ? l.bullets.filter((b: string) => b.trim()) : [],
        }))
      : [];

    _resumeDataCache = resumeData as ResumeData;
    return _resumeDataCache;
  } catch (err) {
    console.error('[resume-service] Failed to load data:', err);
    throw new Error('Failed to load resume data');
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}~^]/g, (c) => ({
      '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#',
      '_': '\\_', '{': '\\{', '}': '\\}',
      '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
    }[c] as string));
}

async function ai(prompt: string, jsonMode = false): Promise<string> {
  const result = await generate(prompt, { jsonMode, disableThinking: true });
  return result.text;
}

// ─── Step 1: Job Analysis ─────────────────────────────────────────────────────

async function analyzeJob(jobDescription: string): Promise<JobAnalysis> {
  const prompt = `You are a senior recruiter. Deeply analyze this job description and extract all critical information.

JOB DESCRIPTION:
${jobDescription}

Return JSON ONLY with this exact structure:
{
  "primary_focus": "One sentence describing what this role is fundamentally about",
  "seniority_level": "entry | junior | mid | senior | lead | executive",
  "company_name": "Company name or empty string if not mentioned",
  "industry": "Industry sector (e.g. Tech, Finance, Healthcare, Aerospace)",
  "technical_skills": ["hard skills explicitly required or strongly implied"],
  "soft_skills": ["soft skills mentioned (communication, leadership, etc.)"],
  "ats_keywords": ["critical keywords an ATS scanner would look for — include exact phrases from JD"],
  "must_haves": ["hard requirements — if candidate lacks these, they likely won't pass screening"],
  "nice_to_haves": ["preferred but not required qualifications"]
}`;
  return parseAIJson<JobAnalysis>(await ai(prompt, true));
}

// ─── Step 2: Select + Tailor ──────────────────────────────────────────────────

type DraftContent = Omit<TailoredContent, 'job_analysis' | 'quality_report' | 'ats_keywords_used' | 'refinement_applied'>;

async function selectAndTailor(jobDescription: string, jobAnalysis: JobAnalysis, resumeData: ResumeData): Promise<DraftContent> {
  const candidateData = {
    skills: resumeData.skills,
    certifications: resumeData.certifications,
    projects: resumeData.projects.map((p: any) => ({
      id: p.id, title: p.title, date: p.date, tags: p.tags,
      description: p.description, technicalDetails: p.technicalDetails,
      pre_written_bullets: p.pre_written_bullets,
    })),
    work_experience: resumeData.work_experience.map((j: any) => ({
      id: j.id, company: j.company, location: j.location, title: j.title, date: j.date,
      description: j.description, technicalDetails: j.technicalDetails, tags: j.tags,
      pre_written_bullets: j.pre_written_bullets,
    })),
  };

  const mandatoryKeywords = jobAnalysis.ats_keywords.slice(0, 10);

  const prompt = `You are an expert resume writer and ATS optimization specialist. Select the BEST content from this candidate's background and write powerful, tailored bullet points for the specific job.

═══ JOB ANALYSIS ═══
Role Focus: ${jobAnalysis.primary_focus}
Seniority: ${jobAnalysis.seniority_level}
Company/Industry: ${jobAnalysis.company_name || 'Not specified'} / ${jobAnalysis.industry}
Must-Have Skills: ${jobAnalysis.must_haves.join(', ')}
Technical Skills Required: ${jobAnalysis.technical_skills.join(', ')}

═══ MANDATORY ATS KEYWORDS ═══
Include AT LEAST 8 of these across all bullets and the summary:
${mandatoryKeywords.map((kw, i) => `  ${i + 1}. "${kw}"`).join('\n')}

═══ FULL JOB DESCRIPTION ═══
${jobDescription}

═══ CANDIDATE DATA ═══
${JSON.stringify(candidateData, null, 2)}

═══ INSTRUCTIONS ═══
1. Pick the 2-3 most relevant work experience entries and 3-4 most relevant projects.
2. Write 3-4 bullets per entry: action verb + what + result/metric (10-18 words max, one idea).
3. Distribute ATS keywords naturally. Never fabricate metrics.
4. Entry-level professional tone: avoid Spearheaded, Orchestrated, Championed.
5. Section order MUST be ["work_experience", "projects"].

Return JSON ONLY:
{
  "tailored_professional_summary": "2-sentence summary with ATS keywords",
  "selected_skills": { "CategoryName": ["skill1", "skill2"] },
  "selected_certifications": [{ "name": "", "year": "" }],
  "section_order": ["work_experience", "projects"],
  "selected_work_experience": [{ "id": "", "company": "", "location": "", "title": "", "date": "", "bullets": [{ "original_id": "derived", "tailored_text": "...", "relevance_score": 95 }], "include": true }],
  "selected_projects": [{ "id": "", "title": "", "role": "", "date": "", "bullets": [{ "original_id": "derived", "tailored_text": "...", "relevance_score": 90 }], "include": true }],
  "tailoring_summary": "Brief explanation of strategy"
}`;

  return parseAIJson<DraftContent>(await ai(prompt, true));
}

// ─── Step 3: Quality Check ────────────────────────────────────────────────────

async function qualityCheck(jobAnalysis: JobAnalysis, draft: DraftContent): Promise<QualityReport> {
  const allBullets = [
    ...draft.selected_work_experience.flatMap((j) => j.bullets?.map((b) => b.tailored_text) ?? []),
    ...draft.selected_projects.flatMap((p) => p.bullets?.map((b) => b.tailored_text) ?? []),
  ];
  const allText = [draft.tailored_professional_summary, ...allBullets].join(' ').toLowerCase();
  const kw_found = jobAnalysis.ats_keywords.filter(kw => allText.includes(kw.toLowerCase()));
  const kw_missing = jobAnalysis.ats_keywords.filter(kw => !allText.includes(kw.toLowerCase()));

  const prompt = `You are a senior resume quality reviewer. Score this tailored resume content against the job requirements.

═══ JOB REQUIREMENTS ═══
Primary Focus: ${jobAnalysis.primary_focus}
ATS Keywords (${jobAnalysis.ats_keywords.length} total): ${jobAnalysis.ats_keywords.join(', ')}
Must-Haves: ${jobAnalysis.must_haves.join(', ')}

═══ RESUME CONTENT ═══
SUMMARY: ${draft.tailored_professional_summary}
BULLETS: ${allBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
SKILLS: ${Object.entries(draft.selected_skills).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('\n')}

═══ ATS KEYWORD ANALYSIS ═══
Keywords FOUND (${kw_found.length}): ${kw_found.join(', ') || 'none'}
Keywords MISSING (${kw_missing.length}): ${kw_missing.join(', ') || 'none'}

Score and return JSON ONLY:
{
  "fit_score": <0-100>,
  "fit_label": "Excellent Match | Strong Match | Good Match | Partial Match | Weak Match",
  "ats_keyword_coverage": <(found/total)*100 rounded>,
  "bullet_quality_score": <0-100>,
  "strengths": ["max 3"],
  "gaps": ["max 3"],
  "needs_refinement": <true if fit_score < 80 OR ats_keyword_coverage < 60>,
  "refinement_instructions": ["max 3 concrete fixes"]
}`;

  return parseAIJson<QualityReport>(await ai(prompt, true));
}

// ─── Step 4 (conditional): Refinement ────────────────────────────────────────

async function refineContent(jobAnalysis: JobAnalysis, jobDescription: string, draft: DraftContent, qualityReport: QualityReport, pass = 1): Promise<DraftContent> {
  console.log(`[resume-service] Refinement pass ${pass}...`);
  const allText = [
    draft.tailored_professional_summary,
    ...draft.selected_work_experience.flatMap((j) => j.bullets?.map((b) => b.tailored_text) ?? []),
    ...draft.selected_projects.flatMap((p) => p.bullets?.map((b) => b.tailored_text) ?? []),
  ].join(' ').toLowerCase();
  const missingKeywords = jobAnalysis.ats_keywords.filter(kw => !allText.includes(kw.toLowerCase()));

  const prompt = `You are a resume refinement specialist. Improve this draft to achieve a fit score of 85+.

Current fit score: ${qualityReport.fit_score}/100 — Target: 85+
ATS coverage: ${qualityReport.ats_keyword_coverage}% — Target: 70%+

GAPS: ${qualityReport.gaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}
FIXES NEEDED: ${qualityReport.refinement_instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}
MISSING ATS KEYWORDS: ${missingKeywords.slice(0, 8).map((kw, i) => `${i + 1}. "${kw}"`).join('\n') || 'none'}
JOB FOCUS: ${jobAnalysis.primary_focus}

CURRENT DRAFT:
${JSON.stringify(draft, null, 2)}

Fix every gap. Weave missing ATS keywords naturally. Keep bullets 10-18 words, action verb first.
Do NOT fabricate metrics. Return COMPLETE updated JSON with same structure.

Return JSON ONLY:`;

  return parseAIJson<DraftContent>(await ai(prompt, true));
}

// ─── Public: Full tailoring pipeline ─────────────────────────────────────────

export async function tailorContent(jobDescription: string): Promise<TailoredContent> {
  const resumeData = loadResumeData();
  const SCORE_TARGET = 80;
  const MAX_PASSES = 3;

  const jobAnalysis = await analyzeJob(jobDescription);
  console.log(`[resume-service] Job analyzed: ${jobAnalysis.primary_focus} | ${jobAnalysis.ats_keywords.length} ATS keywords`);

  let draft = await selectAndTailor(jobDescription, jobAnalysis, resumeData);
  let qualityReport = await qualityCheck(jobAnalysis, draft);
  console.log(`[resume-service] Initial score: ${qualityReport.fit_score} (${qualityReport.fit_label})`);

  let refinementApplied = false;
  let passes = 0;

  while (qualityReport.needs_refinement && passes < MAX_PASSES) {
    passes++;
    try {
      draft = await refineContent(jobAnalysis, jobDescription, draft, qualityReport, passes);
      refinementApplied = true;
      qualityReport = await qualityCheck(jobAnalysis, draft);
      console.log(`[resume-service] Pass ${passes} score: ${qualityReport.fit_score} (${qualityReport.fit_label})`);
    } catch (err) {
      console.error(`[resume-service] Refinement pass ${passes} failed:`, err);
      break;
    }
  }

  const allText = [
    draft.tailored_professional_summary,
    ...draft.selected_work_experience.flatMap((j) => j.bullets?.map((b) => b.tailored_text) ?? []),
    ...draft.selected_projects.flatMap((p) => p.bullets?.map((b) => b.tailored_text) ?? []),
  ].join(' ').toLowerCase();

  return {
    ...draft,
    job_analysis: jobAnalysis,
    quality_report: qualityReport,
    ats_keywords_used: jobAnalysis.ats_keywords.filter(kw => allText.includes(kw.toLowerCase())),
    refinement_applied: refinementApplied,
  };
}

// ─── Public: Cover letter ─────────────────────────────────────────────────────

export async function generateCoverLetter(jobDescription: string, tailoredContent: TailoredContent): Promise<string> {
  const { personal_info } = loadResumeData();
  const companyName = tailoredContent.job_analysis?.company_name || 'the company';
  const jobFocus = tailoredContent.job_analysis?.primary_focus || 'the role';

  const includedProjects = tailoredContent.selected_projects
    .filter(p => p.include !== false && p.bullets?.length > 0)
    .map(p => `${p.title}${p.role ? ` (${p.role})` : ''}: ${p.bullets.slice(0, 2).map(b => b.tailored_text).join('; ')}`)
    .join('\n');

  const includedJobs = tailoredContent.selected_work_experience
    .filter(j => j.include !== false && j.bullets?.length > 0)
    .map(j => `${j.company} — ${j.title}: ${j.bullets.slice(0, 2).map(b => b.tailored_text).join('; ')}`)
    .join('\n');

  const topSkills = Object.entries(tailoredContent.selected_skills)
    .map(([cat, skills]) => `${cat}: ${(skills as string[]).slice(0, 4).join(', ')}`)
    .join(' | ');

  const prompt = `Write a compelling, personalized cover letter for ${personal_info.name} applying to ${companyName}.

Today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Role Focus: ${jobFocus}
Job Description: ${jobDescription.substring(0, 1000)}

Candidate Highlights:
Summary: ${tailoredContent.tailored_professional_summary}
Skills: ${topSkills}
Projects: ${includedProjects || 'None'}
Experience: ${includedJobs || 'None'}

Instructions:
- Open with a strong, specific hook (not "I am writing to apply...")
- Show genuine understanding of what the company/role needs
- Connect 2-3 specific achievements to those needs
- Close confidently with a clear call to action
- 3-4 paragraphs, professional but personable
- Full letter: date, contact block, salutation, body, sign-off (Sincerely, ${personal_info.name})`;

  return (await generate(prompt, { disableThinking: true })).text;
}

// ─── Public: LaTeX generation (deterministic) ─────────────────────────────────

function readTemplatePreamble(): string {
  try {
    const raw = fs.readFileSync(path.join(getProjectRoot(), 'src/templates/resume_template.tex'), 'utf-8');
    const idx = raw.indexOf('\\begin{document}');
    if (idx !== -1) return raw.substring(0, idx + '\\begin{document}'.length);
  } catch {
    console.warn('[resume-service] Could not read resume_template.tex — using fallback');
  }
  return `\\documentclass[10pt, a4paper]{article}
\\usepackage[a4paper, top=1.2cm, bottom=1.2cm, left=1.2cm, right=1.2cm]{geometry}
\\usepackage{fontspec}
\\usepackage[english]{babel}
\\setmainfont{IBMPlexSans}[Extension=.otf,UprightFont=*-Regular,BoldFont=*-Bold,ItalicFont=*-Italic,BoldItalicFont=*-BoldItalic]
\\usepackage{enumitem}
\\setlist[itemize]{leftmargin=*, nosep, label=\\textbullet}
\\usepackage{titlesec}
\\titleformat{\\section}{\\large\\bfseries\\filcenter}{}{0em}{\\MakeUppercase}[\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{4pt}
\\usepackage{xcolor}
\\definecolor{linkblue}{RGB}{0, 0, 139}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true,linkcolor=linkblue,filecolor=linkblue,urlcolor=linkblue}
\\begin{document}`;
}

export function generateLatexResume(tailoredContent: TailoredContent): string {
  const { personal_info, education } = loadResumeData();
  let latex = readTemplatePreamble();

  latex += `\n\n\\pagestyle{empty}\n\n\\begin{center}\n    {\\LARGE \\textbf{${escapeLatex(personal_info.name)}}} \\\\\n    \\vspace{2pt}\n    {\\small ${escapeLatex(personal_info.email)} \\ | \\ ${escapeLatex(personal_info.phone)} \\ | \\ \\href{${personal_info.github.url}}{${escapeLatex(personal_info.github.display)}} \\ | \\ \\href{${personal_info.linkedin.url}}{${escapeLatex(personal_info.linkedin.display)}}}\n\\end{center}\n\n`;

  const skillEntries = Object.entries(tailoredContent.selected_skills).filter(([, s]) => s?.length > 0);
  if (skillEntries.length > 0) {
    latex += `\\section{Skills}\n\\begin{itemize}\n`;
    for (const [cat, skills] of skillEntries) {
      latex += `    \\item \\textbf{${escapeLatex(cat)}:} ${(skills as string[]).map(escapeLatex).join(', ')}\n`;
    }
    latex += `\\end{itemize}\n\n`;
  }

  // Work Experience always first
  const includedJobs = tailoredContent.selected_work_experience.filter(j => j.include !== false && j.bullets?.length > 0);
  if (includedJobs.length > 0) {
    latex += `\\section{Work Experience}\n\n`;
    includedJobs.forEach((job, i) => {
      if (i > 0) latex += `\\vspace{4pt}\n\n`;
      latex += `\\noindent\n\\textbf{${escapeLatex(job.company)}} \\hfill ${escapeLatex(job.location)} \\\\\n`;
      latex += `\\textit{${escapeLatex(job.title)}} \\hfill ${escapeLatex(job.date)}\n\\begin{itemize}\n`;
      for (const b of job.bullets) latex += `    \\item ${escapeLatex(b.tailored_text)}\n`;
      latex += `\\end{itemize}\n\n`;
    });
  }

  // Projects always second
  const includedProjects = tailoredContent.selected_projects.filter(p => p.include !== false && p.bullets?.length > 0);
  if (includedProjects.length > 0) {
    latex += `\\section{Project Work}\n\n`;
    includedProjects.forEach((p, i) => {
      if (i > 0) latex += `\\vspace{4pt}\n\n`;
      latex += `\\noindent\n`;
      if (p.role) {
        latex += `\\textbf{${escapeLatex(p.title)}} \\hfill ${escapeLatex(p.date)} \\\\\n\\textit{${escapeLatex(p.role)}}\n`;
      } else {
        latex += `\\textbf{${escapeLatex(p.title)}} \\hfill ${escapeLatex(p.date)}\n`;
      }
      latex += `\\begin{itemize}\n`;
      for (const b of p.bullets) latex += `    \\item ${escapeLatex(b.tailored_text)}\n`;
      latex += `\\end{itemize}\n\n`;
    });
  }

  const certs = tailoredContent.selected_certifications ?? [];
  if (certs.length > 0) {
    latex += `\\section{Certifications}\n\\noindent\n`;
    latex += certs.map(c => `\\textbf{${escapeLatex(c.name)}} (${escapeLatex(c.year)})`).join(' \\ | \\ ') + '\n\n';
  }

  latex += `\\section{Education}\n\\noindent\n`;
  latex += `\\textbf{${escapeLatex(education.institution)}} \\hfill ${escapeLatex(education.location)} \\\\\n`;
  latex += `\\textit{${escapeLatex(education.degree)}} \\hfill ${escapeLatex(education.graduation_date)} \\\\\n`;
  latex += `{\\small \\textbf{Relevant Coursework:} ${education.coursework.map(escapeLatex).join(', ')}.}\n\n`;
  latex += `\\end{document}\n`;

  return latex;
}

export function generateLatexCoverLetter(coverLetterBody: string): string {
  const { personal_info } = loadResumeData();
  return `\\documentclass[11pt, a4paper]{article}
\\usepackage[a4paper, top=2.5cm, bottom=2.5cm, left=2.5cm, right=2.5cm]{geometry}
\\usepackage{fontspec}
\\usepackage[english]{babel}
\\setmainfont{IBMPlexSans}[Extension=.otf,UprightFont=*-Regular,BoldFont=*-Bold,ItalicFont=*-Italic,BoldItalicFont=*-BoldItalic]
\\pagestyle{empty}
\\usepackage{parskip}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{10pt}
\\usepackage{xcolor}
\\definecolor{linkblue}{RGB}{0, 0, 139}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true,linkcolor=linkblue,filecolor=linkblue,urlcolor=linkblue}

\\begin{document}

\\begin{center}
    {\\Large \\textbf{${escapeLatex(personal_info.name)}}} \\\\
    \\vspace{2pt}
    {\\small ${escapeLatex(personal_info.email)} \\ | \\ ${escapeLatex(personal_info.phone)}} \\\\
    {\\small \\href{${personal_info.linkedin.url}}{${escapeLatex(personal_info.linkedin.display)}} \\ | \\ \\href{${personal_info.github.url}}{${escapeLatex(personal_info.github.display)}}}
\\end{center}

\\vspace{14pt}

${escapeLatex(coverLetterBody)}

\\end{document}
`;
}

// ─── Backward compat: class-free singleton shim ───────────────────────────────
// The API route previously called ResumeService.getInstance().methodName()
// This shim keeps that call working without changes to the route file.

export const ResumeService = {
  getInstance: () => ({
    tailorContent,
    generateCoverLetter,
    generateLatexResume,
    generateLatexCoverLetter,
    reload: () => {},
  }),
};
