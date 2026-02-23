import { NextResponse } from 'next/server';
import { getGeminiClient, cleanJsonResponse } from '@/lib/utils/api-utils';
import portfolioData from '@/data/portfolio.json';

const SUBREDDITS: Record<string, string> = {
  tech: 'technology',
  ai: 'artificial',
  web: 'webdev',
  business: 'startups',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'tech';
  const subreddit = SUBREDDITS[category] || 'technology';
  const useAi = searchParams.get('ai') !== 'false'; // Default to true

  try {
    // 1. Fetch raw news from Reddit
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`, {
      headers: {
        'User-Agent': 'portfolio-newsletter-app/1.0',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
        throw new Error(`Reddit API responded with ${response.status}`);
    }

    const data = await response.json();
    
    // 2. Initial processing/cleaning
    let articles = data.data.children
      .filter((post: any) => {
        // Filter out stickied posts and self posts
        if (post.data.stickied || post.data.is_self) return false;
        
        // Filter out Reddit-hosted content (images, videos, galleries)
        const domain = post.data.domain || '';
        const isRedditHosted = domain.includes('redd.it') || 
                              domain.includes('reddit.com') ||
                              domain === 'reddit';
        
        // Only keep posts that link to external websites
        return !isRedditHosted && domain.length > 0;
      })
      .map((post: any) => {
        const { title, url, thumbnail, created_utc, domain, selftext, score, num_comments, permalink } = post.data;
        
        const date = new Date(created_utc * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        // Helper to decode HTML entities
        const decodeHtml = (str: string) => {
          if (!str) return str;
          return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'");
        };

        // Decode URL and ensure it's absolute
        let cleanUrl = url ? decodeHtml(url) : `https://www.reddit.com${permalink}`;
        
        // Handle relative URLs (e.g. from crossposts or internal reddit links)
        if (cleanUrl.startsWith('/')) {
            cleanUrl = `https://www.reddit.com${cleanUrl}`;
        }

        let imageUrl = null;
        if (thumbnail && thumbnail.startsWith('http') && !thumbnail.includes('default')) {
            imageUrl = thumbnail;
        } else if (post.data.preview?.images?.[0]?.source?.url) {
            imageUrl = decodeHtml(post.data.preview.images[0].source.url);
        }

        return {
          id: post.data.id,
          title: decodeHtml(title), // Also decode title just in case
          summary: selftext ? selftext.substring(0, 150) + '...' : `Posted on ${domain} • ${score} upvotes • ${num_comments} comments`,
          url: cleanUrl,
          redditUrl: `https://www.reddit.com${permalink}`,
          source: `r/${subreddit}`,
          domain: domain, // Add domain so users can see where the link goes
          date: date,
          imageUrl: imageUrl,
          category: category,
          originalScore: score
        };
      })
      .slice(0, 20); // Get top 20 candidates for AI to review

    // 3. AI Analysis & Filtering
    if (useAi && articles.length > 0) {
      try {
        const genAI = getGeminiClient();
        
        // Use model fallback logic
        const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
        let aiData = null;

        const prompt = `
          You are an expert content curator for a professional portfolio newsletter.
          
          User Profile:
          - Role: ${portfolioData.profile.role}
          - Bio: ${portfolioData.profile.bio}
          - Key Skills: ${portfolioData.skills.map(s => s.name).slice(0, 10).join(', ')}
          - Recent Projects: ${portfolioData.projects.map(p => p.title).join(', ')}

          Task:
          Review the following list of ${articles.length} news articles from r/${subreddit}.
          Select the top 6-9 articles that are most relevant to this user's professional interests and career growth.
          
          For each selected article, provide:
          1. A relevance score (1-10) based on the user's profile.
          2. A brief 1-sentence "AI Insight" explaining why this specific article matters to them.
          
          Return ONLY a valid JSON array of objects with this structure:
          [
            { "id": "article_id", "relevanceScore": 8, "aiInsight": "Reason..." }
          ]

          Articles to Review:
          ${JSON.stringify(articles.map((a: any) => ({ id: a.id, title: a.title })), null, 2)}
        `;

        for (const modelName of models) {
          try {
            const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: { responseMimeType: "application/json" }
            });
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const cleanText = cleanJsonResponse(responseText);
            aiData = JSON.parse(cleanText);
            break;
          } catch (e) {
            if (models.indexOf(modelName) === models.length - 1) throw e;
          }
        }
        
        if (Array.isArray(aiData)) {
          // Merge AI data back into articles
          articles = articles.map((article: any) => {
            const analysis = aiData.find((a: any) => a.id === article.id);
            if (analysis) {
              return { 
                ...article, 
                relevanceScore: analysis.relevanceScore, 
                aiInsight: analysis.aiInsight,
                isAiRecommended: analysis.relevanceScore >= 7
              };
            }
            return article;
          })
          .filter((a: any) => a.relevanceScore) // Keep only those selected by AI
          .sort((a: any, b: any) => (b.relevanceScore || 0) - (a.relevanceScore || 0)); // Sort by score
        }
      } catch (aiError) {
        console.error("AI Analysis failed:", aiError);
        // Fallback: just return the raw list sorted by reddit score
        articles.sort((a: any, b: any) => b.originalScore - a.originalScore);
      }
    }

    return NextResponse.json({ articles: articles.slice(0, 9) });

  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}
