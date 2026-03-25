import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/file-utils';
import { generate, parseAIJson } from '@/lib/ai/anthropic';

// ─── Interfaces ──────────────────────────────────────────────────────────────

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
    bullets: Array<{
      original_id: string;
      tailored_text: string;
      relevance_score: number;
    }>;
    include: boolean;
  }>;
  selected_work_experience: Array<{
    id: string;
    company: string;
    location: string;
    title: string;
    date: string;
    bullets: Array<{
      original_id: string;
      tailored_text: string;
      relevance_score: number;
    }>;
    include: boolean;
  }>;
  section_order: Array<'work_experience' | 'projects'>;
  tailoring_summary: string;
  // ─── New fields from the 3-step pipeline ───
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

// ─── Singleton ───────────────────────────────────────────────────────────────

let _instance: ResumeService | null = null;

export class ResumeService {
  private resumeData: ResumeData;

  constructor() {
    this.resumeData = this.loadResumeData();
  }

  static getInstance(): ResumeService {
    if (!_instance) {
      _instance = new ResumeService();
    }
    return _instance;
  }

  /** Force reload data (call after admin edits) */
  reload(): void {
    this.resumeData = this.loadResumeData();
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private loadResumeData(): ResumeData {
    try {
      const resumePath    = path.join(getProjectRoot(), 'src/data/resume_data.json');
      const portfolioPath = path.join(getProjectRoot(), 'src/data/portfolio.json');

      const resumeData: any = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));

      if (!fs.existsSync(portfolioPath)) {
        console.warn('[ResumeService] portfolio.json not found — falling back to resume_data.json only');
        return resumeData;
      }

      const portfolioData: any = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));

      // Skills — grouped by category
      if (portfolioData.skills && Array.isArray(portfolioData.skills)) {
        const grouped: Record<string, string[]> = {};
        for (const skill of portfolioData.skills) {
          const cat = (skill.category ?? 'other').toLowerCase();
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(skill.name);
        }
        resumeData.skills = grouped;
        console.log(`[ResumeService] Loaded ${portfolioData.skills.length} skills from portfolio.json`);
      }

      // Projects — merge portfolio data with pre-written bullets from resume_data.json
      const rdProjects: any[] = Array.isArray(resumeData.projects) ? resumeData.projects : [];
      if (portfolioData.projects && Array.isArray(portfolioData.projects)) {
        resumeData.projects = portfolioData.projects.map((p: any) => {
          const titleWords = (p.title ?? '').toLowerCase().split(/\s+/);
          const rdMatch = rdProjects.find((rdp: any) => {
            const rdTitle = (rdp.title ?? '').toLowerCase();
            return titleWords.some((w: string) => w.length > 4 && rdTitle.includes(w));
          });
          return {
            id:                  String(p.id),
            title:               p.title ?? '',
            date:                p.date ?? '',
            featured:            p.featured ?? false,
            tags:                p.tags ?? [],
            description:         p.description ?? '',
            technicalDetails:    p.technicalDetails ?? '',
            key_features:        p.key_features ?? [],
            link:                p.link ?? '',
            pre_written_bullets: rdMatch?.bullets?.map((b: any) => b.text) ?? [],
          };
        });
        console.log(`[ResumeService] Loaded ${resumeData.projects.length} projects from portfolio.json`);
      }

      // Work experience — flatten multi-position format, merge pre-written bullets
      const rdJobs: any[] = Array.isArray(resumeData.work_experience) ? resumeData.work_experience : [];
      if (portfolioData.experience && Array.isArray(portfolioData.experience)) {
        const flat: any[] = [];
        for (const exp of portfolioData.experience) {
          const companyKey = (exp.company ?? '').toLowerCase().split(/\s+/)[0];
          const rdMatch = rdJobs.find((rdj: any) =>
            (rdj.company ?? '').toLowerCase().includes(companyKey) ||
            companyKey.includes((rdj.company ?? '').toLowerCase().split(/\s+/)[0])
          );
          const positions: any[] = Array.isArray(exp.positions) ? exp.positions : [];
          for (const pos of positions) {
            flat.push({
              id:                  String(exp.id),
              company:             exp.company ?? '',
              location:            exp.location ?? '',
              title:               pos.role ?? '',
              date:                pos.period ?? '',
              description:         pos.description ?? '',
              technicalDetails:    pos.technicalDetails ?? '',
              tags:                pos.tags ?? [],
              pre_written_bullets: rdMatch?.bullets?.map((b: any) => b.text) ?? [],
            });
          }
        }
        resumeData.work_experience = flat;
        console.log(`[ResumeService] Loaded ${flat.length} experience positions from portfolio.json`);
      }

      // Certifications
      if (portfolioData.certifications && Array.isArray(portfolioData.certifications)) {
        resumeData.certifications = portfolioData.certifications.map((c: any) => ({
          name:   c.name   ?? '',
          issuer: c.issuer ?? '',
          year:   c.year   ?? '',
        }));
        console.log(`[ResumeService] Loaded ${resumeData.certifications.length} certifications from portfolio.json`);
      }

      // Leadership
      if (portfolioData.leadership && Array.isArray(portfolioData.leadership)) {
        resumeData.leadership = portfolioData.leadership.map((l: any) => ({
          id:           String(l.id ?? ''),
          organization: l.organization ?? '',
          role:         l.role ?? '',
          period:       l.period ?? '',
          location:     l.location ?? '',
          bullets:      Array.isArray(l.bullets) ? l.bullets.filter((b: string) => b.trim()) : [],
        }));
        console.log(`[ResumeService] Loaded ${resumeData.leadership.length} leadership entries from portfolio.json`);
      } else {
        resumeData.leadership = [];
      }

      return resumeData;
    } catch (error) {
      console.error('Error loading resume data:', error);
      throw new Error('Failed to load resume data');
    }
  }

  private escapeLatex(text: string): string {
    if (!text) return '';
    const escaped = text.replace(/\\/g, '\\textbackslash{}');
    const replacements: Record<string, string> = {
      '&': '\\&',
      '%': '\\%',
      '$': '\\$',
      '#': '\\#',
      '_': '\\_',
      '{': '\\{',
      '}': '\\}',
      '~': '\\textasciitilde{}',
      '^': '\\textasciicircum{}',
    };
    return escaped.replace(/[&%$#_{}~^]/g, (match) => replacements[match]);
  }

  private async ai(prompt: string, jsonMode: boolean = false): Promise<string> {
    const result = await generate(prompt, { jsonMode });
    console.log(`[ResumeService] AI call done: ${result.text.length} chars`);
    return result.text;
  }

  // ─── STEP 1: Deep Job Analysis ───────────────────────────────────────────────

  private async analyzeJob(jobDescription: string): Promise<JobAnalysis> {
    console.log('[ResumeService] Step 1: Analyzing job description...');

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

    const text = await this.ai(prompt, true);
    return parseAIJson<JobAnalysis>(text);
  }

  // ─── STEP 2: Smart Selection + Tailored Bullet Writing ───────────────────────

  private async selectAndTailor(
    jobDescription: string,
    jobAnalysis: JobAnalysis
  ): Promise<Omit<TailoredContent, 'job_analysis' | 'quality_report' | 'ats_keywords_used' | 'refinement_applied'>> {
    console.log('[ResumeService] Step 2: Selecting content + writing tailored bullets...');

    const candidateData = {
      skills: this.resumeData.skills,
      certifications: this.resumeData.certifications,
      projects: this.resumeData.projects.map((p: any) => ({
        id: p.id,
        title: p.title,
        date: p.date,
        tags: p.tags,
        description: p.description,
        technicalDetails: p.technicalDetails,
        pre_written_bullets: p.pre_written_bullets,
      })),
      work_experience: this.resumeData.work_experience.map((j: any) => ({
        id: j.id,
        company: j.company,
        location: j.location,
        title: j.title,
        date: j.date,
        description: j.description,
        technicalDetails: j.technicalDetails,
        tags: j.tags,
        pre_written_bullets: j.pre_written_bullets,
      })),
    };

    // Top ATS keywords to mandate inclusion of — take up to 10 most important
    const mandatoryKeywords = jobAnalysis.ats_keywords.slice(0, 10);

    const prompt = `You are an expert resume writer and ATS optimization specialist. Your task is to select the BEST content from this candidate's background and write powerful, tailored bullet points for the specific job.

═══ JOB ANALYSIS ═══
Role Focus: ${jobAnalysis.primary_focus}
Seniority: ${jobAnalysis.seniority_level}
Company/Industry: ${jobAnalysis.company_name || 'Not specified'} / ${jobAnalysis.industry}
Must-Have Skills: ${jobAnalysis.must_haves.join(', ')}
Technical Skills Required: ${jobAnalysis.technical_skills.join(', ')}

═══ MANDATORY ATS KEYWORDS ═══
You MUST include AT LEAST 8 of these exact phrases (or their direct variants) somewhere across all bullets and the summary. This is non-negotiable for ATS passage:
${mandatoryKeywords.map((kw, i) => `  ${i + 1}. "${kw}"`).join('\n')}

═══ FULL JOB DESCRIPTION ═══
${jobDescription}

═══ CANDIDATE DATA ═══
${JSON.stringify(candidateData, null, 2)}

═══ YOUR INSTRUCTIONS ═══
1. SELECTION: Pick the 2-3 most relevant work experience entries AND 3-4 most relevant projects. Quality over quantity.
2. BULLET WRITING: Write 3-4 strong bullets per entry. Each bullet must:
   - Start with a strong action verb (Built, Developed, Implemented, Designed, Analyzed, Created, Automated, Delivered, Improved, Reduced, Increased)
   - Include quantification where real metrics exist in the candidate data (never fabricate)
   - Include ATS keywords from the mandatory list above — distribute them naturally across bullets
   - Be factually accurate — only use metrics and details that appear in the candidate data
   - Be concise: ONE line, 10–18 words maximum
   - Format: [Action verb] + [what you did] + [result/metric if available]
   - NO filler: cut "in order to", "was responsible for", "helped to", "worked on"
   - No semicolons, no multi-clause run-ons — one idea per bullet
3. LANGUAGE STYLE — ENTRY-LEVEL PROFESSIONAL:
   - Simple, clear, honest language for a junior/early-career candidate
   - Do NOT use Spearheaded, Orchestrated, Championed, Evangelized, or Drove strategic vision
   - Tone: professional and competent, not boastful or over-inflated
4. SKILLS: Select only skills directly relevant to this role
5. SUMMARY: Write a 2-sentence professional summary that directly addresses what this role needs AND uses at least 3 ATS keywords from the mandatory list
6. SECTION ORDER: Always ["work_experience", "projects"] — Work Experience ALWAYS first
7. CERTIFICATIONS: Include only certifications relevant to this role

Return JSON ONLY:
{
  "tailored_professional_summary": "2-sentence summary targeting this specific role with ATS keywords woven in",
  "selected_skills": {
    "CategoryName": ["skill1", "skill2"]
  },
  "selected_certifications": [{ "name": "", "year": "" }],
  "section_order": ["work_experience", "projects"],
  "selected_work_experience": [
    {
      "id": "",
      "company": "",
      "location": "",
      "title": "",
      "date": "",
      "bullets": [
        { "original_id": "derived", "tailored_text": "Action verb + what you did + result/metric", "relevance_score": 95 }
      ],
      "include": true
    }
  ],
  "selected_projects": [
    {
      "id": "",
      "title": "",
      "role": "",
      "date": "",
      "bullets": [
        { "original_id": "derived", "tailored_text": "Action verb + what you did + result/metric", "relevance_score": 90 }
      ],
      "include": true
    }
  ],
  "tailoring_summary": "Brief explanation of your tailoring strategy, which ATS keywords were used, and why specific entries were selected"
}`;

    const text = await this.ai(prompt, true);
    return parseAIJson<Omit<TailoredContent, 'job_analysis' | 'quality_report' | 'ats_keywords_used' | 'refinement_applied'>>(text);
  }

  // ─── STEP 3: Quality Check & Optional Refinement ─────────────────────────────

  private async qualityCheck(
    jobAnalysis: JobAnalysis,
    tailoredDraft: Omit<TailoredContent, 'job_analysis' | 'quality_report' | 'ats_keywords_used' | 'refinement_applied'>
  ): Promise<QualityReport> {
    console.log('[ResumeService] Step 3: Running quality check...');

    const allBullets = [
      ...tailoredDraft.selected_work_experience.flatMap((j: any) => j.bullets?.map((b: any) => b.tailored_text) ?? []),
      ...tailoredDraft.selected_projects.flatMap((p: any) => p.bullets?.map((b: any) => b.tailored_text) ?? []),
    ];

    // Check which ATS keywords actually appear in all text
    const allText = [
      tailoredDraft.tailored_professional_summary,
      ...allBullets,
    ].join(' ').toLowerCase();
    const kw_found = jobAnalysis.ats_keywords.filter(kw => allText.includes(kw.toLowerCase()));
    const kw_missing = jobAnalysis.ats_keywords.filter(kw => !allText.includes(kw.toLowerCase()));

    const prompt = `You are a senior resume quality reviewer. Score this tailored resume content against the job requirements using the rubric below.

═══ JOB REQUIREMENTS ═══
Primary Focus: ${jobAnalysis.primary_focus}
ATS Keywords (${jobAnalysis.ats_keywords.length} total): ${jobAnalysis.ats_keywords.join(', ')}
Must-Haves: ${jobAnalysis.must_haves.join(', ')}
Technical Skills Required: ${jobAnalysis.technical_skills.join(', ')}

═══ RESUME CONTENT TO REVIEW ═══
SUMMARY:
${tailoredDraft.tailored_professional_summary}

BULLETS (${allBullets.length} total):
${allBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

SELECTED SKILLS:
${Object.entries(tailoredDraft.selected_skills).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('\n')}

═══ ATS KEYWORD ANALYSIS (pre-computed) ═══
Keywords FOUND in resume (${kw_found.length}): ${kw_found.join(', ') || 'none'}
Keywords MISSING from resume (${kw_missing.length}): ${kw_missing.join(', ') || 'none'}

═══ SCORING RUBRIC ═══
fit_score (0–100): Holistic match of candidate content to job requirements.
  - 90–100: All must-haves covered, 80%+ ATS keywords present, bullets are specific and quantified
  - 80–89: Most must-haves covered, 60–79% ATS keywords present, strong bullets
  - 70–79: Core skills present but some must-haves missing or bullets are vague
  - 60–69: Partial match — key technical skills or several must-haves absent
  - Below 60: Weak match — major requirements unaddressed

ats_keyword_coverage: Percentage of ATS keywords found in the resume. Use the pre-computed data above.
  - Formula: (keywords found / total keywords) × 100, rounded to nearest integer

bullet_quality_score (0–100):
  - 90–100: Every bullet starts with action verb, has real metric, is concise (≤18 words)
  - 70–89: Most bullets are strong; minor vagueness or missing metrics
  - Below 70: Bullets are generic, wordy, or lack quantification

needs_refinement: Set to true if fit_score < 80 OR ats_keyword_coverage < 60.

Score and return JSON ONLY:
{
  "fit_score": <integer 0-100>,
  "fit_label": "Excellent Match | Strong Match | Good Match | Partial Match | Weak Match",
  "ats_keyword_coverage": <integer 0-100 — use the pre-computed formula above>,
  "bullet_quality_score": <integer 0-100>,
  "strengths": ["specific strength — max 3"],
  "gaps": ["specific gap with the exact keyword or requirement missing — max 3"],
  "needs_refinement": <true if fit_score < 80 OR ats_keyword_coverage < 60>,
  "refinement_instructions": ["concrete fix: e.g. 'Add keyword X to bullet 3 of Handshake entry' — max 3 instructions"]
}`;

    const text = await this.ai(prompt, true);
    return parseAIJson<QualityReport>(text);
  }

  // ─── STEP 4 (conditional): Targeted Refinement ───────────────────────────────

  private async refineContent(
    jobAnalysis: JobAnalysis,
    jobDescription: string,
    draft: Omit<TailoredContent, 'job_analysis' | 'quality_report' | 'ats_keywords_used' | 'refinement_applied'>,
    qualityReport: QualityReport,
    passNumber: number = 1
  ): Promise<Omit<TailoredContent, 'job_analysis' | 'quality_report' | 'ats_keywords_used' | 'refinement_applied'>> {
    console.log(`[ResumeService] Step 4 (pass ${passNumber}): Applying targeted refinement...`);

    // Which keywords are still missing?
    const allText = [
      draft.tailored_professional_summary,
      ...draft.selected_work_experience.flatMap((j: any) => j.bullets?.map((b: any) => b.tailored_text) ?? []),
      ...draft.selected_projects.flatMap((p: any) => p.bullets?.map((b: any) => b.tailored_text) ?? []),
    ].join(' ').toLowerCase();
    const missingKeywords = jobAnalysis.ats_keywords.filter(kw => !allText.includes(kw.toLowerCase()));

    const prompt = `You are a resume refinement specialist. Improve this tailored resume draft to achieve a fit score of 85+.

═══ WHAT NEEDS FIXING ═══
Current fit score: ${qualityReport.fit_score}/100 — Target: 85+
ATS keyword coverage: ${qualityReport.ats_keyword_coverage}% — Target: 70%+

GAPS TO FIX:
${qualityReport.gaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

SPECIFIC INSTRUCTIONS:
${qualityReport.refinement_instructions.map((inst, i) => `${i + 1}. ${inst}`).join('\n')}

MISSING ATS KEYWORDS (${missingKeywords.length}) — you MUST work these into bullets or the summary:
${missingKeywords.slice(0, 8).map((kw, i) => `  ${i + 1}. "${kw}"`).join('\n') || '  (none missing)'}

JOB FOCUS: ${jobAnalysis.primary_focus}
MUST-HAVES REQUIRED: ${jobAnalysis.must_haves.join(', ')}

═══ CURRENT DRAFT ═══
${JSON.stringify(draft, null, 2)}

═══ YOUR TASK ═══
- Fix every gap listed above
- Weave the missing ATS keywords into bullets naturally (don't just append them)
- Keep bullets concise: ONE line, 10–18 words, action verb first
- Do NOT fabricate metrics — only use numbers that appear in the candidate data
- Return the COMPLETE updated JSON with the SAME structure as the input draft

Return JSON ONLY:`;

    const text = await this.ai(prompt, true);
    return parseAIJson<Omit<TailoredContent, 'job_analysis' | 'quality_report' | 'ats_keywords_used' | 'refinement_applied'>>(text);
  }

  // ─── Public AI methods ───────────────────────────────────────────────────────

  /**
   * Full pipeline:
   * 1. Deep job analysis
   * 2. Smart content selection + tailored bullet writing
   * 3. Quality check + re-score loop (up to 3 refinement passes if score < 80)
   */
  async tailorContent(jobDescription: string): Promise<TailoredContent> {
    const SCORE_TARGET = 80;
    const MAX_REFINEMENT_PASSES = 3;

    // ── Step 1: Job Analysis ─────────────────────────────────────────────────
    const jobAnalysis = await this.analyzeJob(jobDescription);
    console.log(`[ResumeService] Job analyzed: ${jobAnalysis.primary_focus} | ${jobAnalysis.seniority_level} | ${jobAnalysis.ats_keywords.length} ATS keywords`);

    // ── Step 2: Select + Tailor ──────────────────────────────────────────────
    let draft = await this.selectAndTailor(jobDescription, jobAnalysis);

    // ── Step 3: Quality Check + Refinement loop ──────────────────────────────
    let qualityReport = await this.qualityCheck(jobAnalysis, draft);
    console.log(`[ResumeService] Initial quality score: ${qualityReport.fit_score} (${qualityReport.fit_label}) | ATS coverage: ${qualityReport.ats_keyword_coverage}%`);

    let refinementApplied = false;
    let refinementPasses = 0;

    while (qualityReport.needs_refinement && refinementPasses < MAX_REFINEMENT_PASSES) {
      refinementPasses++;
      console.log(`[ResumeService] Score ${qualityReport.fit_score} < ${SCORE_TARGET} — starting refinement pass ${refinementPasses}/${MAX_REFINEMENT_PASSES}...`);
      try {
        draft = await this.refineContent(jobAnalysis, jobDescription, draft, qualityReport, refinementPasses);
        refinementApplied = true;

        // Re-score after each refinement pass
        qualityReport = await this.qualityCheck(jobAnalysis, draft);
        console.log(`[ResumeService] Post-refinement pass ${refinementPasses} score: ${qualityReport.fit_score} (${qualityReport.fit_label}) | ATS coverage: ${qualityReport.ats_keyword_coverage}%`);
      } catch (err) {
        console.error(`[ResumeService] Refinement pass ${refinementPasses} failed:`, err);
        break;
      }
    }

    if (refinementPasses > 0) {
      console.log(`[ResumeService] Refinement complete after ${refinementPasses} pass(es). Final score: ${qualityReport.fit_score}`);
    }

    // Collect which ATS keywords actually appear in the final bullets
    const allText = [
      draft.tailored_professional_summary,
      ...draft.selected_work_experience.flatMap((j: any) => j.bullets?.map((b: any) => b.tailored_text) ?? []),
      ...draft.selected_projects.flatMap((p: any) => p.bullets?.map((b: any) => b.tailored_text) ?? []),
    ].join(' ').toLowerCase();

    const atsKeywordsUsed = jobAnalysis.ats_keywords.filter(kw =>
      allText.includes(kw.toLowerCase())
    );

    return {
      ...draft,
      job_analysis: jobAnalysis,
      quality_report: qualityReport,
      ats_keywords_used: atsKeywordsUsed,
      refinement_applied: refinementApplied,
    };
  }

  async generateCoverLetter(
    jobDescription: string,
    tailoredContent: TailoredContent
  ): Promise<string> {
    const { personal_info } = this.resumeData;

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

    const jobFocus = tailoredContent.job_analysis?.primary_focus || 'the role';
    const companyName = tailoredContent.job_analysis?.company_name || 'the company';

    const prompt = `Write a compelling, personalized cover letter for ${personal_info.name} applying to ${companyName}.

Today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

ROLE FOCUS: ${jobFocus}

JOB DESCRIPTION:
${jobDescription.substring(0, 1000)}

CANDIDATE'S TAILORED HIGHLIGHTS:
Summary: ${tailoredContent.tailored_professional_summary}
Skills: ${topSkills}
Key Projects: ${includedProjects || 'None'}
Work Experience: ${includedJobs || 'None'}

INSTRUCTIONS:
- Open with a strong, specific hook (not "I am writing to apply...")
- Show genuine understanding of what the company/role needs
- Connect 2-3 specific achievements to those needs
- Close confidently with a clear call to action
- Keep it to 3-4 paragraphs, professional but personable
- Write the full letter: date, contact block, salutation, body, sign-off (Sincerely, ${personal_info.name})`;

    const result = await generate(prompt);
    return result.text;
  }

  // ─── LaTeX generation (deterministic — no AI calls) ──────────────────────────

  private readTemplatePreamble(): string {
    try {
      const templatePath = path.join(getProjectRoot(), 'src/templates/resume_template.tex');
      const raw = fs.readFileSync(templatePath, 'utf-8');
      const marker = '\\begin{document}';
      const idx = raw.indexOf(marker);
      if (idx !== -1) return raw.substring(0, idx + marker.length);
      console.warn('[ResumeService] \\begin{document} not found in template — using fallback preamble');
    } catch (err) {
      console.warn('[ResumeService] Could not read resume_template.tex — using fallback preamble:', err);
    }
    return `\\documentclass[10pt, a4paper]{article}

% --- UNIVERSAL PREAMBLE BLOCK ---
\\usepackage[a4paper, top=1.2cm, bottom=1.2cm, left=1.2cm, right=1.2cm]{geometry}
\\usepackage{fontspec}

\\usepackage[english]{babel}

% IBM Plex Sans — clean, modern, professional sans-serif (available in TeX Live 2025)
\\setmainfont{IBMPlexSans}[
  Extension = .otf,
  UprightFont = *-Regular,
  BoldFont = *-Bold,
  ItalicFont = *-Italic,
  BoldItalicFont = *-BoldItalic,
]

% List formatting - compact and clean
\\usepackage{enumitem}
\\setlist[itemize]{leftmargin=*, nosep, label=\\textbullet}

% Section formatting - Centered and Uppercase transformation
\\usepackage{titlesec}
\\titleformat{\\section}
  {\\large\\bfseries\\filcenter} 
  {} 
  {0em} 
  {\\MakeUppercase} 
  [\\titlerule] 
\\titlespacing{\\section}{0pt}{8pt}{4pt}

% Link Coloring (Professional Dark Blue)
\\usepackage{xcolor}
\\definecolor{linkblue}{RGB}{0, 0, 139}

% Hyperlink setup
\\usepackage{hyperref}
\\hypersetup{
    colorlinks=true,
    linkcolor=linkblue,
    filecolor=linkblue,
    urlcolor=linkblue,
    pdftitle={Resume - Jawad Mousa Iskandar},
    pdfpagemode=FullScreen,
}

% --- USER CONFIGURATION SECTION ---
\\newcommand{\\myName}{Jawad Mousa Iskandar}
\\newcommand{\\myEmail}{Jawad.iskandar@outlook.com}
\\newcommand{\\myPhone}{(571) 269-8465}

% Social Links
\\newcommand{\\myGithubLink}{https://github.com/Iskos1}
\\newcommand{\\myGithubDisp}{github.com/Iskos1}

\\newcommand{\\myLinkedinLink}{https://linkedin.com/in/jawad-iskandar/}
\\newcommand{\\myLinkedinDisp}{linkedin.com/in/jawad-iskandar}

\\begin{document}`;
  }

  generateLatexResume(tailoredContent: TailoredContent): string {
    const { personal_info, education } = this.resumeData;

    let latex = this.readTemplatePreamble();

    // Header
    latex += `

\\pagestyle{empty}

\\begin{center}
    {\\LARGE \\textbf{${this.escapeLatex(personal_info.name)}}} \\\\
    \\vspace{2pt}
    {\\small ${this.escapeLatex(personal_info.email)} \\ | \\ ${this.escapeLatex(personal_info.phone)} \\ | \\ \\href{${personal_info.github.url}}{${this.escapeLatex(personal_info.github.display)}} \\ | \\ \\href{${personal_info.linkedin.url}}{${this.escapeLatex(personal_info.linkedin.display)}}}
\\end{center}

`;

    // Skills
    const skillEntries = Object.entries(tailoredContent.selected_skills).filter(
      ([, skills]) => skills && skills.length > 0
    );
    if (skillEntries.length > 0) {
      latex += `\\section{Skills}\n\\begin{itemize}\n`;
      for (const [category, skills] of skillEntries) {
        const escapedSkills = (skills as string[]).map((s) => this.escapeLatex(s)).join(', ');
        latex += `    \\item \\textbf{${this.escapeLatex(category)}:} ${escapedSkills}\n`;
      }
      latex += `\\end{itemize}\n\n`;
    }

    // Work Experience always comes first — hardcoded, non-negotiable
    const sectionOrder: Array<'work_experience' | 'projects'> = ['work_experience', 'projects'];

    console.log(`[ResumeService] Section order: ${sectionOrder.join(' → ')} (fixed — Work Experience always first)`);

    const renderWorkExperience = (): string => {
      let block = `\\section{Work Experience}\n\n`;
      const included = tailoredContent.selected_work_experience.filter(
        (j) => j.include !== false && j.bullets && j.bullets.length > 0
      );
      for (let i = 0; i < included.length; i++) {
        const job = included[i];
        if (i > 0) block += `\\vspace{4pt}\n\n`;
        block += `\\noindent\n`;
        block += `\\textbf{${this.escapeLatex(job.company)}} \\hfill ${this.escapeLatex(job.location)} \\\\\n`;
        block += `\\textit{${this.escapeLatex(job.title)}} \\hfill ${this.escapeLatex(job.date)}\n`;
        block += `\\begin{itemize}\n`;
        for (const bullet of job.bullets) {
          block += `    \\item ${this.escapeLatex(bullet.tailored_text)}\n`;
        }
        block += `\\end{itemize}\n\n`;
      }
      return block;
    };

    const renderProjectWork = (): string => {
      let block = `\\section{Project Work}\n\n`;
      const included = tailoredContent.selected_projects.filter(
        (p) => p.include !== false && p.bullets && p.bullets.length > 0
      );
      for (let i = 0; i < included.length; i++) {
        const project = included[i];
        if (i > 0) block += `\\vspace{4pt}\n\n`;
        block += `\\noindent\n`;
        if (project.role) {
          block += `\\textbf{${this.escapeLatex(project.title)}} \\hfill ${this.escapeLatex(project.date)} \\\\\n`;
          block += `\\textit{${this.escapeLatex(project.role)}}\n`;
        } else {
          block += `\\textbf{${this.escapeLatex(project.title)}} \\hfill ${this.escapeLatex(project.date)}\n`;
        }
        block += `\\begin{itemize}\n`;
        for (const bullet of project.bullets) {
          block += `    \\item ${this.escapeLatex(bullet.tailored_text)}\n`;
        }
        block += `\\end{itemize}\n\n`;
      }
      return block;
    };

    for (const section of sectionOrder) {
      latex += section === 'projects' ? renderProjectWork() : renderWorkExperience();
    }

    // Certifications
    const certs = tailoredContent.selected_certifications ?? [];
    if (certs.length > 0) {
      latex += `\\section{Certifications}\n\\noindent\n`;
      const certParts = certs.map(
        (cert) => `\\textbf{${this.escapeLatex(cert.name)}} (${this.escapeLatex(cert.year)})`
      );
      latex += certParts.join(' \\ | \\ ') + '\n\n';
    }

    // Education (always last)
    latex += `\\section{Education}\n`;
    latex += `\\noindent\n`;
    latex += `\\textbf{${this.escapeLatex(education.institution)}} \\hfill ${this.escapeLatex(education.location)} \\\\\n`;
    latex += `\\textit{${this.escapeLatex(education.degree)}} \\hfill ${this.escapeLatex(education.graduation_date)} \\\\\n`;
    latex += `{\\small \\textbf{Relevant Coursework:} ${education.coursework.map((c) => this.escapeLatex(c)).join(', ')}.}\n\n`;

    latex += `\\end{document}\n`;

    return latex;
  }

  generateLatexCoverLetter(coverLetterBody: string): string {
    const { personal_info } = this.resumeData;

    return `\\documentclass[11pt, a4paper]{article}

% --- PREAMBLE ---
\\usepackage[a4paper, top=2.5cm, bottom=2.5cm, left=2.5cm, right=2.5cm]{geometry}
\\usepackage{fontspec}
\\usepackage[english]{babel}
\\setmainfont{IBMPlexSans}[
  Extension = .otf,
  UprightFont = *-Regular,
  BoldFont = *-Bold,
  ItalicFont = *-Italic,
  BoldItalicFont = *-BoldItalic,
]

\\pagestyle{empty}

\\usepackage{parskip}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{10pt}

\\usepackage{xcolor}
\\definecolor{linkblue}{RGB}{0, 0, 139}
\\usepackage{hyperref}
\\hypersetup{
    colorlinks=true,
    linkcolor=linkblue,
    filecolor=linkblue,
    urlcolor=linkblue,
}

\\begin{document}

% --- CANDIDATE HEADER ---
\\begin{center}
    {\\Large \\textbf{${this.escapeLatex(personal_info.name)}}} \\\\
    \\vspace{2pt}
    {\\small ${this.escapeLatex(personal_info.email)} \\ | \\ ${this.escapeLatex(personal_info.phone)}} \\\\
    {\\small \\href{${personal_info.linkedin.url}}{${this.escapeLatex(personal_info.linkedin.display)}} \\ | \\ \\href{${personal_info.github.url}}{${this.escapeLatex(personal_info.github.display)}}}
\\end{center}

\\vspace{14pt}

${this.escapeLatex(coverLetterBody)}

\\end{document}
`;
  }
}
