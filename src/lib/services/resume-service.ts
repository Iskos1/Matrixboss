import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '@/lib/utils/file-utils';
import { getGeminiClient, cleanJsonResponse } from '@/lib/utils/api-utils';

export interface JobAnalysis {
  technical_skills: string[];
  soft_skills: string[];
  experience_areas: string[];
  ats_keywords: string[];
  primary_focus: string;
  seniority_level: string;
}

export interface TailoredContent {
  tailored_professional_summary: string;
  selected_skills: Record<string, string[]>;
  selected_certifications: Array<{ name: string; year: string }>;
  selected_projects: Array<{
    id: string;
    title: string;
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
  /**
   * The order in which the two main content sections should appear on the resume.
   * AI decides this based on job requirements:
   *   - ["work_experience", "projects"] → experience-first (e.g. corporate, ops, sales roles)
   *   - ["projects", "work_experience"] → project-first (e.g. tech, dev, data science roles)
   */
  section_order: Array<'work_experience' | 'projects'>;
  tailoring_summary: string;
}

export interface ResumeData {
  personal_info: {
    name: string;
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
    graduation_date: string;
    coursework: string[];
  };
  /**
   * Skills grouped by category, populated from portfolio.json.
   * Keys are category names (e.g. "technical", "business", "tools").
   * Values are arrays of skill name strings.
   */
  skills: Record<string, string[]>;
  /**
   * All projects from portfolio.json — every entry the admin has saved,
   * including non-featured / private ones.  Each item carries the full
   * description, technicalDetails, key_features, and tags so the AI can
   * generate rich, specific bullet points.
   */
  projects: any[];
  /**
   * All work-experience positions from portfolio.json, flattened so each
   * role is its own entry (one company with two roles → two entries).
   * Each entry carries the full description paragraph and tags.
   */
  work_experience: any[];
  certifications: Array<{ name: string; year: string }>;
}

export class ResumeService {
  private resumeData: ResumeData;

  constructor() {
    this.resumeData = this.loadResumeData();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private loadResumeData(): ResumeData {
    try {
      const resumePath    = path.join(getProjectRoot(), 'src/data/resume_data.json');
      const portfolioPath = path.join(getProjectRoot(), 'src/data/portfolio.json');

      // resume_data.json supplies:
      //   • personal_info, education, professional_summary (always used as-is)
      //   • pre-written bullet points with specific metrics for projects & experience
      //     (used as a supplement so the AI can see real numbers/achievements)
      const resumeData: any = JSON.parse(fs.readFileSync(resumePath, 'utf-8'));

      // portfolio.json is the admin-managed source of truth for everything else.
      if (!fs.existsSync(portfolioPath)) {
        console.warn('[ResumeService] portfolio.json not found — falling back to resume_data.json only');
        return resumeData;
      }

      const portfolioData: any = JSON.parse(fs.readFileSync(portfolioPath, 'utf-8'));

      // ── 1. SKILLS ────────────────────────────────────────────────────────────
      // Use ALL skills the admin has saved, grouped by their category field.
      // This replaces the sparse 3-entry list that was hard-coded in resume_data.json.
      if (portfolioData.skills && Array.isArray(portfolioData.skills)) {
        const grouped: Record<string, string[]> = {};
        for (const skill of portfolioData.skills) {
          const cat = (skill.category ?? 'other').toLowerCase();
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(skill.name);
        }
        resumeData.skills = grouped;
        console.log(`[ResumeService] Loaded ${portfolioData.skills.length} skills across ${Object.keys(grouped).length} categories from portfolio.json`);
      }

      // ── 2. PROJECTS ──────────────────────────────────────────────────────────
      // Use EVERY project the admin has saved — including non-featured / private
      // ones — with the full description, technicalDetails, key_features, and tags.
      // ALSO merge in pre-written bullet points from resume_data.json (matched by
      // title keyword) so the AI has both rich context AND specific metrics.
      const rdProjects: any[] = Array.isArray(resumeData.projects) ? resumeData.projects : [];

      if (portfolioData.projects && Array.isArray(portfolioData.projects)) {
        resumeData.projects = portfolioData.projects.map((p: any) => {
          // Find the closest matching pre-written project in resume_data.json by title
          const titleWords = (p.title ?? '').toLowerCase().split(/\s+/);
          const rdMatch = rdProjects.find((rdp: any) => {
            const rdTitle = (rdp.title ?? '').toLowerCase();
            return titleWords.some((w: string) => w.length > 4 && rdTitle.includes(w));
          });

          return {
            id:                   String(p.id),
            title:                p.title ?? '',
            date:                 p.date ?? '',
            featured:             p.featured ?? false,
            tags:                 p.tags ?? [],
            description:          p.description ?? '',
            technicalDetails:     p.technicalDetails ?? '',
            key_features:         p.key_features ?? [],
            link:                 p.link ?? '',
            // Pre-written bullets carry specific metrics the AI should reference
            pre_written_bullets:  rdMatch?.bullets?.map((b: any) => b.text) ?? [],
          };
        });
        console.log(`[ResumeService] Loaded ${resumeData.projects.length} projects from portfolio.json`);
      }

      // ── 3. WORK EXPERIENCE ───────────────────────────────────────────────────
      // Flatten portfolio.json's multi-position format (one company → many roles)
      // into individual entries so every role is visible to the AI separately.
      // ALSO merge in pre-written bullets from resume_data.json (matched by company
      // name) so the AI can reference real metrics like "500+ prompts per week".
      const rdJobs: any[] = Array.isArray(resumeData.work_experience) ? resumeData.work_experience : [];

      if (portfolioData.experience && Array.isArray(portfolioData.experience)) {
        const flat: any[] = [];
        for (const exp of portfolioData.experience) {
          // Match by company name (first word is usually enough: "Apple" vs "Apple Inc.")
          const companyKey = (exp.company ?? '').toLowerCase().split(/\s+/)[0];
          const rdMatch = rdJobs.find((rdj: any) =>
            (rdj.company ?? '').toLowerCase().includes(companyKey) ||
            companyKey.includes((rdj.company ?? '').toLowerCase().split(/\s+/)[0])
          );

          const positions: any[] = Array.isArray(exp.positions) ? exp.positions : [];
          for (const pos of positions) {
            flat.push({
              id:                   String(exp.id),
              company:              exp.company ?? '',
              location:             exp.location ?? '',
              title:                pos.role ?? '',
              date:                 pos.period ?? '',
              description:          pos.description ?? '',
              tags:                 pos.tags ?? [],
              // Pre-written bullets carry specific metrics the AI should reference
              pre_written_bullets:  rdMatch?.bullets?.map((b: any) => b.text) ?? [],
            });
          }
        }
        resumeData.work_experience = flat;
        console.log(`[ResumeService] Loaded ${flat.length} experience positions from portfolio.json`);
      }

      // ── 4. CERTIFICATIONS ────────────────────────────────────────────────────
      // Admin manages these in portfolio.json via the Certifications tab.
      if (portfolioData.certifications && Array.isArray(portfolioData.certifications)) {
        resumeData.certifications = portfolioData.certifications.map((c: any) => ({
          name:   c.name  ?? '',
          issuer: c.issuer ?? '',
          year:   c.year  ?? '',
        }));
        console.log(`[ResumeService] Loaded ${resumeData.certifications.length} certifications from portfolio.json`);
      }

      return resumeData;
    } catch (error) {
      console.error('Error loading resume data:', error);
      throw new Error('Failed to load resume data');
    }
  }

  private escapeLatex(text: string): string {
    if (!text) return '';

    // Handle backslash first
    let escaped = text.replace(/\\/g, '\\textbackslash{}');

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

  /**
   * Send a prompt to Gemini and return the raw text response.
   * Implements fallback logic to try multiple models if the primary one fails.
   */
  private async generateAIText(prompt: string, jsonMode: boolean = false): Promise<string> {
    const client = getGeminiClient();
    
    // Priority order: 
    // 1. Gemini 3.1 Pro Preview (Cutting edge)
    // 2. Gemini 3.1 Pro (In case the stable name is available)
    const models = [
      'gemini-3.1-pro-preview',
      'gemini-3.1-pro'
    ];

    let lastError: any = null;

    console.log(`[ResumeService] Starting AI generation. Prompt length: ${prompt.length} chars. JSON Mode: ${jsonMode}`);

    for (const modelName of models) {
      try {
        console.log(`[ResumeService] Attempting to generate content with model: ${modelName}`);
        const model = client.getGenerativeModel({ 
          model: modelName,
          // Only use JSON mode for models that support it (most new ones do)
          generationConfig: jsonMode ? { responseMimeType: "application/json" } : undefined
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
          throw new Error(`Empty response from ${modelName}`);
        }
        
        console.log(`[ResumeService] Success with model: ${modelName}. Response length: ${text.length} chars.`);
        return text;
      } catch (error: any) {
        // Log detailed error info
        const status = error.status || error.response?.status;
        const message = error.message || 'Unknown error';
        console.warn(`[ResumeService] Failed with model ${modelName} (Status: ${status}): ${message}`);
        
        lastError = error;
        
        // CRITICAL: Stop if API key is invalid
        if (message.includes('API_KEY_INVALID') || status === 403 || message.includes('API key not valid')) {
          console.error('[ResumeService] CRITICAL: API Key appears invalid. Stopping retries.');
          throw error;
        }
      }
    }

    console.error('[ResumeService] All models failed. Last error:', lastError);
    throw lastError || new Error('Failed to generate content from any available Gemini model');
  }

  // ---------------------------------------------------------------------------
  // Public AI methods
  // ---------------------------------------------------------------------------

  /**
   * Step 1 – Analyse the job description and extract structured metadata.
   */
  async analyzeJobDescription(jobDescription: string): Promise<JobAnalysis> {
    const prompt = `Analyze this job description and extract:
1. Key technical skills required
2. Soft skills and competencies
3. Experience areas (e.g., cloud, sales, AI, consulting)
4. Important keywords for ATS optimization
5. The role's primary focus areas

Job Description:
${jobDescription}

Return your analysis in JSON format with these keys:
- technical_skills: list of technical skills
- soft_skills: list of soft skills
- experience_areas: list of experience domains
- ats_keywords: list of important keywords for ATS
- primary_focus: string describing the main role focus
- seniority_level: string (entry, mid, senior)

Do not include markdown formatting. Just raw JSON.`;

    try {
      const text = await this.generateAIText(prompt, true);
      console.log('Gemini Response (Job Analysis):', text.substring(0, 100) + '...');
      return JSON.parse(cleanJsonResponse(text));
    } catch (error) {
      console.error('Error analyzing job description:', error);
      throw new Error('Failed to analyze job description');
    }
  }

  /**
   * Step 2 – Select and rewrite resume content to match the job analysis.
   */
  async tailorContent(jobAnalysis: JobAnalysis): Promise<TailoredContent> {
    const prompt = `You are an expert resume writer and career coach. Your job is to tailor a candidate's resume to a specific role using ONLY the verified information provided below.

═══════════════════════════════════════════
JOB ANALYSIS
═══════════════════════════════════════════
${JSON.stringify(jobAnalysis, null, 2)}

═══════════════════════════════════════════
CANDIDATE'S COMPLETE RESUME DATA
═══════════════════════════════════════════
${JSON.stringify(this.resumeData, null, 2)}

═══════════════════════════════════════════
DATA STRUCTURE — READ THIS FIRST
═══════════════════════════════════════════
• "skills": object where each key is a category (e.g. "technical", "business", "tools") and the value is an array of skill name strings. Select ONLY from these — never invent skills.

• "projects": ALL of the candidate's projects, including private/non-public ones. Each has:
  - title, date, tags
  - description: full paragraph describing what was built and why
  - technicalDetails: implementation specifics, stack, architecture
  - key_features: array of standout capabilities
  - pre_written_bullets: reference material containing facts and some metrics — use these as inspiration for content, but rewrite them following the RULES below. Do not copy percentages blindly.
  Use ALL of the above as your source material to write strong, specific bullet points.

• "work_experience": ALL positions, already flattened — one entry per role. Each has:
  - company, location, title, date
  - description: full paragraph of what they did and achieved in this role
  - tags: skills/tools used
  - pre_written_bullets: reference material containing facts and some metrics — use these as inspiration for content, but rewrite them following the RULES below. Do not copy percentages blindly.
  Use the description, tags, AND pre_written_bullets together to write the strongest possible bullet points.

• "certifications": array of { name, issuer, year }. Select the most relevant ones — never invent new ones.

• "personal_info" + "education": use as-is for the resume header and education section.

═══════════════════════════════════════════
RULES
═══════════════════════════════════════════
1. SIMPLE ENTRY-LEVEL LANGUAGE: Write all bullet points and the professional summary in clear, simple, entry-level professional language. Avoid corporate jargon, buzzwords, and overly complex phrasing. Write confidently and clearly, as if explaining your work to someone outside your field.
2. ACTION VERBS: Start most bullet points with a strong action verb (e.g. Built, Designed, Managed, Analyzed, Improved, Developed, Led, Created, Implemented, Reduced, Increased, Supported, Coordinated, Delivered, Streamlined). Vary the verbs — do not repeat the same one back to back.
3. GOOGLE XYZ FORMAT & LIMIT PERCENTAGES: Structure bullet points using the Google XYZ formula — "Accomplished [X] by doing [Y] which resulted in [Z]." STRICT RULE: Use a maximum of 2 percentages across the ENTIRE resume. For all other results, describe the impact in plain language (e.g. "resulting in a faster onboarding experience for clients", "enabling the team to process requests without manual review", "allowing the business to scale without additional headcount"). A naturally described result is more believable and readable than a resume stuffed with percentages. Only keep a percentage if it is genuinely the most compelling way to express that specific result.
4. RECRUITER PERSPECTIVE: Before finalizing any bullet point, summary, or section — read it through the eyes of a seasoned recruiter with 30+ years of experience who has reviewed thousands of resumes for this exact type of role. Ask yourself: "Does this immediately show relevance to the job? Does it sound like a real person who can do this work, or does it sound generic?" Every word on this resume should earn its place. Cut anything vague, filler, or disconnected from the job. If a hiring manager spent 10 seconds scanning this resume, they should immediately see why this candidate fits the role.
5. YOU DECIDE THE SECTION ORDER: It is your responsibility — not the candidate's — to determine whether Work Experience or Project Work appears first on this resume. Base this decision entirely on the job description. If the role values professional experience, client-facing work, or years in the field, lead with Work Experience. If the role values technical ability, what has been built, or hands-on skills, lead with Projects. Make a confident, deliberate call. Do not default blindly — read the job and choose what gives this candidate the strongest first impression.
6. ONE PAGE ONLY — INCLUDING CERTIFICATIONS: The entire resume — Skills, Projects, Work Experience, Education, AND Certifications — must fit on a single page. To guarantee this: write a maximum of 2 bullet points per project or experience entry, select a maximum of 3 projects and 2 experience entries, and keep the professional summary to 2 sentences. Keep every bullet short and punchy — one line preferred, two lines maximum. Only include content that is directly relevant to the job. The Certifications section must appear on the same page as the rest of the resume — if the resume feels too full, cut a less-relevant bullet or project, not the certifications.

═══════════════════════════════════════════
SECTION ORDER DECISION RULES
═══════════════════════════════════════════
Output "section_order": ["work_experience", "projects"] (experience first) when the job is:
  • Corporate, enterprise, or government roles (ops, sales, account management, consulting)
  • Roles that explicitly ask for years of professional experience
  • Roles in regulated industries (finance, healthcare, federal/defense)
  • Management, leadership, or client-facing positions
  • Any role where the primary_focus is business operations, sales, or client relations

Output "section_order": ["projects", "work_experience"] (projects first) when the job is:
  • Technical or engineering roles (software dev, data science, cloud/infra, ML/AI engineering)
  • Roles that ask for a portfolio, GitHub, or specific technical deliverables
  • Startup or product roles where what you've built matters more than where you worked
  • Roles where the primary_focus is building, coding, data analysis, or research

If unclear, default to ["work_experience", "projects"].

═══════════════════════════════════════════
REQUIRED JSON OUTPUT (raw JSON only, no markdown)
═══════════════════════════════════════════
{
  "tailored_professional_summary": "2-3 sentence summary...",
  "selected_skills": {
    "CategoryName": ["skill1", "skill2"]
  },
  "selected_certifications": [
    { "name": "Certification Name", "year": "2025" }
  ],
  "section_order": ["work_experience", "projects"],
  "selected_projects": [
    {
      "id": "project id from data",
      "title": "Project Title",
      "date": "date from data",
      "bullets": [
        {
          "original_id": "derived",
          "tailored_text": "Action verb + what you did + result in plain language or one real metric",
          "relevance_score": 95
        }
      ],
      "include": true
    }
  ],
  "selected_work_experience": [
    {
      "id": "id from data",
      "company": "Company Name",
      "location": "Location",
      "title": "Job Title",
      "date": "Date Range",
      "bullets": [
        {
          "original_id": "derived",
          "tailored_text": "Action verb + what you did + result in plain language or one real metric",
          "relevance_score": 90
        }
      ],
      "include": true
    }
  ],
  "tailoring_summary": "Brief explanation of what was prioritized, section order chosen, and why"
}`;

    try {
      const text = await this.generateAIText(prompt, true);
      console.log('Gemini Response (Tailoring):', text.substring(0, 100) + '...');
      return JSON.parse(cleanJsonResponse(text));
    } catch (error) {
      console.error('Error tailoring content:', error);
      throw new Error('Failed to tailor content');
    }
  }

  /**
   * Step 3 – Generate a cover letter body matched to the job and tailored resume.
   */
  async generateCoverLetter(
    jobDescription: string,
    tailoredContent: TailoredContent
  ): Promise<string> {
    const prompt = `Write a professional cover letter for this job. Keep it simple, clear, and engaging.

Job Description Snippet:
${jobDescription.substring(0, 1000)}...

Candidate's Resume Summary (SOURCE OF TRUTH):
- Professional Summary: ${tailoredContent.tailored_professional_summary}
- Top Skills: ${Object.values(tailoredContent.selected_skills).flat().slice(0, 5).join(', ')}
- Recent Experience: ${tailoredContent.selected_work_experience[0]?.company || 'N/A'}

CRITICAL RULES:
1. ONLY use information explicitly stated in the "Candidate's Resume Summary" above.
2. DO NOT invent achievements, skills, roles, or companies.
3. If the candidate lacks a required skill, do NOT mention it. Focus on what they DO have.
4. Keep it 3-4 paragraphs maximum.
5. Use simple, clear, entry-level professional language.
6. Make it personal and genuine.
7. Highlight 2-3 relevant achievements, but only those present in the provided resume data.

Return ONLY the body paragraphs of the cover letter (no header/signature). Start with a strong opening paragraph.`;

    try {
      return await this.generateAIText(prompt);
    } catch (error) {
      console.error('Error generating cover letter:', error);
      throw new Error('Failed to generate cover letter');
    }
  }

  // ---------------------------------------------------------------------------
  // LaTeX generation (no AI calls — purely deterministic)
  // ---------------------------------------------------------------------------

  generateLatexResume(tailoredContent: TailoredContent): string {
    const { personal_info, education, certifications } = this.resumeData;

    // -----------------------------------------------------------------------
    // PREAMBLE — identical to src/templates/resume_template.tex
    // -----------------------------------------------------------------------
    let latex = `\\documentclass[11pt, a4paper]{article}

% --- UNIVERSAL PREAMBLE BLOCK ---
\\usepackage[a4paper, top=1.5cm, bottom=1.5cm, left=1.5cm, right=1.5cm]{geometry}
\\usepackage{fontspec}

% Use babel for font management
\\usepackage[english, provide=*]{babel}
\\babelprovide[import, main]{english}
% Font setup with TeX Gyre Heros (Helvetica clone)
\\setmainfont{texgyreheros-regular.otf}[
  BoldFont = texgyreheros-bold.otf,
  ItalicFont = texgyreheros-italic.otf,
  BoldItalicFont = texgyreheros-bolditalic.otf,
]

% List formatting
\\usepackage{enumitem}
\\setlist[itemize]{leftmargin=*, nosep, topsep=2pt, itemsep=1pt, label=\\textbullet}

% Section formatting
\\usepackage{titlesec}
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{6pt}{4pt}

% Link Coloring (Professional Dark Blue)
\\usepackage{xcolor}
\\definecolor{linkblue}{RGB}{0, 0, 139} % Dark Blue

% Hyperlink setup
\\usepackage{hyperref}
\\hypersetup{
    colorlinks=true,
    linkcolor=linkblue,
    filecolor=linkblue,
    urlcolor=linkblue,
    pdftitle={Resume - ${this.escapeLatex(personal_info.name)}},
    pdfpagemode=FullScreen,
}

% --- USER CONFIGURATION SECTION ---
\\newcommand{\\myName}{${this.escapeLatex(personal_info.name)}}
\\newcommand{\\myEmail}{${this.escapeLatex(personal_info.email)}}
\\newcommand{\\myPhone}{${this.escapeLatex(personal_info.phone)}}

% Social Links
\\newcommand{\\myGithubLink}{${personal_info.github.url}}
\\newcommand{\\myGithubDisp}{${this.escapeLatex(personal_info.github.display)}}

\\newcommand{\\myLinkedinLink}{${personal_info.linkedin.url}}
\\newcommand{\\myLinkedinDisp}{${this.escapeLatex(personal_info.linkedin.display)}}

\\begin{document}

\\pagestyle{empty}

% --- CONTACT INFORMATION ---
\\begin{center}
    {\\LARGE \\textbf{\\myName}} \\\\
    \\vspace{2pt}
    {\\small \\myEmail \\ | \\myPhone | \\href{\\myGithubLink}{\\myGithubDisp} | \\href{\\myLinkedinLink}{\\myLinkedinDisp}} \\\\
    \\vspace{2pt}
    U.S. Citizen | Eligible for Security Clearance
\\end{center}

% --- SKILLS ---
\\section{Skills}
\\begin{itemize}
`;

    // Add skills
    for (const [category, skills] of Object.entries(tailoredContent.selected_skills)) {
      if (skills && skills.length > 0) {
        const escapedSkills = skills.map((s) => this.escapeLatex(s)).join(', ');
        latex += `    \\item \\textbf{${this.escapeLatex(category)}:} ${escapedSkills}.\n`;
      }
    }

    latex += `\\end{itemize}\n`;

    // -----------------------------------------------------------------------
    // DYNAMIC SECTION ORDER
    // The AI decides whether Work Experience or Project Work comes first
    // based on what the job values most. Default: experience first.
    // -----------------------------------------------------------------------
    const sectionOrder: Array<'work_experience' | 'projects'> =
      tailoredContent.section_order?.length === 2
        ? tailoredContent.section_order
        : ['work_experience', 'projects'];

    console.log(`[ResumeService] Section order: ${sectionOrder.join(' → ')}`);

    // Helper: render the Projects block
    const renderProjects = (): string => {
      let block = `
% --- PROJECT WORK ---
\\section{Project Work}
`;
      let first = true;
      for (const project of tailoredContent.selected_projects) {
        if (project.include !== false && project.bullets && project.bullets.length > 0) {
          if (!first) block += '\n\\vspace{3pt}\n\n';
          first = false;
          block += `\\noindent
\\textbf{${this.escapeLatex(project.title)}} \\hfill ${this.escapeLatex(project.date)}
\\begin{itemize}
`;
          for (const bullet of project.bullets) {
            block += `    \\item ${this.escapeLatex(bullet.tailored_text)}\n`;
          }
          block += `\\end{itemize}\n`;
        }
      }
      return block;
    };

    // Helper: render the Work Experience block
    const renderWorkExperience = (): string => {
      let block = `
% --- WORK EXPERIENCE ---
\\section{Work Experience}
`;
      let first = true;
      for (const job of tailoredContent.selected_work_experience) {
        if (job.include !== false && job.bullets && job.bullets.length > 0) {
          if (!first) block += '\n\\vspace{3pt}\n\n';
          first = false;
          block += `\\noindent
\\textbf{${this.escapeLatex(job.company)}} \\hfill ${this.escapeLatex(job.location)} \\\\
\\textit{${this.escapeLatex(job.title)}} \\hfill ${this.escapeLatex(job.date)}
\\begin{itemize}
`;
          for (const bullet of job.bullets) {
            block += `    \\item ${this.escapeLatex(bullet.tailored_text)}\n`;
          }
          block += `\\end{itemize}\n`;
        }
      }
      return block;
    };

    // Render sections in AI-decided order
    for (const section of sectionOrder) {
      if (section === 'projects') {
        latex += renderProjects();
      } else {
        latex += renderWorkExperience();
      }
    }

    // Add education
    const coursework = education.coursework.map((c) => this.escapeLatex(c)).join(', ');
    latex += `
% --- EDUCATION ---
\\section{Education}
\\noindent
\\textbf{${this.escapeLatex(education.institution)}} \\hfill ${this.escapeLatex(education.location)} \\\\
\\textit{${this.escapeLatex(education.degree)}} \\hfill ${this.escapeLatex(education.graduation_date)} \\\\
\\textbf{Relevant Coursework:} ${coursework}.
`;

    // Add certifications — prefer AI-selected ones, fall back to all from resume data
    const certsToRender =
      tailoredContent.selected_certifications?.length > 0
        ? tailoredContent.selected_certifications
        : certifications ?? [];

    if (certsToRender.length > 0) {
      latex += `
% --- CERTIFICATIONS ---
\\section{Certifications}
\\noindent
`;
      certsToRender.forEach((cert, index) => {
        const separator = index < certsToRender.length - 1 ? ' \\\\\n' : '\n';
        latex += `\\textbf{${this.escapeLatex(cert.name)}} \\hfill ${this.escapeLatex(cert.year)}${separator}`;
      });
    }

    latex += `
\\end{document}
`;

    return latex;
  }

  generateLatexCoverLetter(coverLetterBody: string): string {
    const { personal_info } = this.resumeData;

    return `\\documentclass[11pt, a4paper]{article}

% --- PREAMBLE ---
\\usepackage[a4paper, top=2.5cm, bottom=2.5cm, left=2.5cm, right=2.5cm]{geometry}
\\usepackage{fontspec}
\\usepackage[english, provide=*]{babel}
\\babelprovide[import, main]{english}
\\setmainfont{texgyreheros-regular.otf}[
  BoldFont = texgyreheros-bold.otf,
  ItalicFont = texgyreheros-italic.otf,
  BoldItalicFont = texgyreheros-bolditalic.otf,
]

% Remove page numbers
\\pagestyle{empty}

% Paragraph formatting
\\usepackage{parskip}
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{10pt}

% Hyperlink setup
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

% --- HEADER ---
\\begin{center}
    {\\Large \\textbf{${this.escapeLatex(personal_info.name)}}} \\\\
    \\vspace{2pt}
    {\\small ${this.escapeLatex(personal_info.email)} $|$ ${this.escapeLatex(personal_info.phone)}} \\\\
    {\\small \\href{${personal_info.linkedin.url}}{${this.escapeLatex(personal_info.linkedin.display)}} $|$ \\href{${personal_info.github.url}}{${this.escapeLatex(personal_info.github.display)}}}
\\end{center}

\\vspace{10pt}

% --- DATE ---
\\today

\\vspace{10pt}

% --- BODY ---
Dear Hiring Manager,

${this.escapeLatex(coverLetterBody)}

Thank you for your time and consideration.

Sincerely,

${this.escapeLatex(personal_info.name)}

\\end{document}
`;
  }
}
