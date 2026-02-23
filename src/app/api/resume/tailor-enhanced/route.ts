import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, cleanJsonResponse } from '@/lib/utils/api-utils';
import { readJsonFile } from '@/lib/utils/file-utils';
import { PATHS } from '@/lib/constants';
import { handleApiError } from '@/lib/utils/error-utils';

interface ProjectDocument {
  projectTitle: string;
  analysis: {
    summary: string;
    key_achievements: string[];
    technical_details: string[];
    skills_demonstrated: string[];
    metrics_and_results: string[];
    relevant_for_roles: string[];
    resume_talking_points: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobDescription, projectDocuments } = body;

    if (!jobDescription || !jobDescription.trim()) {
      return NextResponse.json(
        { error: 'Job description is required' },
        { status: 400 }
      );
    }

    // Load portfolio data to get all project information
    const portfolioData = readJsonFile(PATHS.PORTFOLIO_DATA);

    // Use Gemini with updated model handling (prioritize 2.5 Pro)
    const genAI = getGeminiClient();
    
    // Model priority: Gemini 3.1 Pro first
    const models = ['gemini-3.1-pro-preview', 'gemini-3.1-pro'];
    let model = null;
    let jobAnalysis = null;
    
    // Attempt 1: Job Analysis
    for (const modelName of models) {
      try {
        model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });
        
        // First, analyze the job description
        const jobAnalysisPrompt = `
          Analyze this job description and extract:
          1. Key technical skills required
          2. Soft skills and competencies
          3. Experience areas (e.g., cloud, sales, AI, consulting, data analytics)
          4. Important keywords for ATS optimization
          5. The role's primary focus areas
          6. Project types that would be most relevant
    
          Job Description:
          ${jobDescription}
    
          Return your analysis in JSON format with these keys:
          - technical_skills: list of technical skills
          - soft_skills: list of soft skills
          - experience_areas: list of experience domains
          - ats_keywords: list of important keywords for ATS
          - primary_focus: string describing the main role focus
          - relevant_project_types: list of project categories that would be most impressive
          - seniority_level: string (entry, mid, senior)
    
          Do not include markdown formatting. Just raw JSON.
        `;
    
        const jobAnalysisResult = await model.generateContent(jobAnalysisPrompt);
        const jobAnalysisText = jobAnalysisResult.response.text();
        const cleanJobAnalysisText = cleanJsonResponse(jobAnalysisText);
        jobAnalysis = JSON.parse(cleanJobAnalysisText);
        
        console.log(`[TailorEnhanced] Job analysis successful with model: ${modelName}`);
        break; // Success, exit loop
      } catch (e: any) {
        console.warn(`[TailorEnhanced] Job analysis failed with model ${modelName}:`, e.message);
        if (models.indexOf(modelName) === models.length - 1) throw e; // Rethrow if last model fails
      }
    }

    // Now, use the project documents to enhance the resume recommendations
    let enhancedProjectInsights = '';
    
    if (projectDocuments && projectDocuments.length > 0) {
      enhancedProjectInsights = `

ADDITIONAL PROJECT DOCUMENTATION ANALYZED:
${projectDocuments.map((doc: ProjectDocument) => `
Project: ${doc.projectTitle}
Summary: ${doc.analysis.summary}
Key Achievements:
${doc.analysis.key_achievements.map((a: string) => `  - ${a}`).join('\n')}
Technical Details:
${doc.analysis.technical_details.map((t: string) => `  - ${t}`).join('\n')}
Skills Demonstrated:
${doc.analysis.skills_demonstrated.join(', ')}
Metrics & Results:
${doc.analysis.metrics_and_results.map((m: string) => `  - ${m}`).join('\n')}
Resume Talking Points:
${doc.analysis.resume_talking_points.map((p: string) => `  - ${p}`).join('\n')}
`).join('\n---\n')}
`;
    }

    // Generate recommendations for which projects and experiences to highlight
    const recommendationPrompt = `
      You are an expert resume consultant helping tailor a resume for a specific job.

      JOB ANALYSIS:
      ${JSON.stringify(jobAnalysis, null, 2)}

      CURRENT PORTFOLIO PROJECTS:
      ${JSON.stringify(portfolioData.projects, null, 2)}

      CURRENT EXPERIENCE:
      ${JSON.stringify(portfolioData.experience, null, 2)}

      ${enhancedProjectInsights}

      Based on the job requirements and the available projects/experience (including the detailed documentation analysis above), provide recommendations:

      1. Which projects should be highlighted in the resume (rank them 1-6)
      2. What specific aspects of each project to emphasize
      3. How to reframe project descriptions to match job requirements
      4. Which technical skills from the projects align best with the job
      5. Suggested bullet points for the most relevant projects using metrics from the documentation
      6. Which experiences to emphasize and how to reframe them

      CRITICAL RULE: USE SIMPLE, ENTRY-LEVEL PROFESSIONAL LANGUAGE for all suggested bullet points and reframes. Avoid complex jargon.

      Return your recommendations in JSON format:
      {
        "recommended_projects": [
          {
            "project_id": number,
            "project_title": string,
            "priority": number (1-6, 1 being highest),
            "relevance_score": number (1-10),
            "reasons": [list of why this project is relevant],
            "suggested_bullet_points": [list of impactful bullet points using real metrics],
            "key_skills_to_highlight": [list of skills to emphasize],
            "reframing_suggestions": string
          }
        ],
        "experience_recommendations": [
          {
            "company": string,
            "position": string,
            "aspects_to_emphasize": [list of what to highlight],
            "suggested_reframes": [list of how to rewrite bullets]
          }
        ],
        "overall_strategy": string,
        "cover_letter_angles": [list of key points for cover letter]
      }

      Do not include markdown formatting. Just raw JSON.
    `;

    // Try generating recommendations with fallback
    let recommendations = null;
    for (const modelName of models) {
      try {
        // Reuse model instance if possible or create new if needed (though API is stateless usually)
        const recModel = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { responseMimeType: "application/json" }
        });
        
        const recommendationResult = await recModel.generateContent(recommendationPrompt);
        const recommendationText = recommendationResult.response.text();
        const cleanRecommendationText = cleanJsonResponse(recommendationText);
        recommendations = JSON.parse(cleanRecommendationText);
        console.log(`[TailorEnhanced] Recommendations generated with model: ${modelName}`);
        break;
      } catch (e: any) {
        console.warn(`[TailorEnhanced] Recommendations failed with model ${modelName}:`, e.message);
        if (models.indexOf(modelName) === models.length - 1) throw e;
      }
    }

    return NextResponse.json({
      success: true,
      jobAnalysis,
      recommendations,
      message: 'Resume tailoring recommendations generated successfully',
    });

  } catch (error: any) {
    return handleApiError(error, 'Failed to generate recommendations');
  }
}
