import { NextRequest, NextResponse } from 'next/server';
import { generateJson } from '@/lib/ai/anthropic';
import portfolioData from '@/data/portfolio.json';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const SUBREDDITS: Record<string, string> = {
  tech: 'technology',
  ai: 'artificial',
  web: 'webdev',
  business: 'startups',
};

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') || 'tech';
  const subreddit = SUBREDDITS[category] || 'technology';
  const useAi = request.nextUrl.searchParams.get('ai') !== 'false';

  try {
    // 1. Fetch raw news from Reddit
    const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`, {
      headers: { 'User-Agent': 'portfolio-newsletter-app/1.0' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`Reddit API responded with ${response.status}`);
    }

    const data = await response.json();

    // 2. Initial processing/cleaning
    const decodeHtml = (str: string) => {
      if (!str) return str;
      return str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
    };

    let articles = data.data.children
      .filter((post: any) => {
        if (post.data.stickied || post.data.is_self) return false;
        const domain = post.data.domain || '';
        const isRedditHosted =
          domain.includes('redd.it') ||
          domain.includes('reddit.com') ||
          domain === 'reddit';
        return !isRedditHosted && domain.length > 0;
      })
      .map((post: any) => {
        const { title, url, thumbnail, created_utc, domain, selftext, score, num_comments, permalink } = post.data;
        const date = new Date(created_utc * 1000).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });

        let cleanUrl = url ? decodeHtml(url) : `https://www.reddit.com${permalink}`;
        if (cleanUrl.startsWith('/')) cleanUrl = `https://www.reddit.com${cleanUrl}`;

        let imageUrl = null;
        if (thumbnail && thumbnail.startsWith('http') && !thumbnail.includes('default')) {
          imageUrl = thumbnail;
        } else if (post.data.preview?.images?.[0]?.source?.url) {
          imageUrl = decodeHtml(post.data.preview.images[0].source.url);
        }

        return {
          id: post.data.id,
          title: decodeHtml(title),
          summary: selftext
            ? selftext.substring(0, 150) + '...'
            : `Posted on ${domain} • ${score} upvotes • ${num_comments} comments`,
          url: cleanUrl,
          redditUrl: `https://www.reddit.com${permalink}`,
          source: `r/${subreddit}`,
          domain,
          date,
          imageUrl,
          category,
          originalScore: score,
        };
      })
      .slice(0, 20);

    // 3. AI Analysis & Filtering
    if (useAi && articles.length > 0) {
      try {
        const prompt = `You are an expert content curator for a professional portfolio newsletter.
          
User Profile:
- Role: ${portfolioData.profile.role}
- Bio: ${portfolioData.profile.bio}
- Key Skills: ${portfolioData.skills.map((s: any) => s.name).slice(0, 10).join(', ')}
- Recent Projects: ${portfolioData.projects.map((p: any) => p.title).join(', ')}

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
${JSON.stringify(articles.map((a: any) => ({ id: a.id, title: a.title })), null, 2)}`;

        const result = await generateJson<Array<{ id: string; relevanceScore: number; aiInsight: string }>>(
          prompt,
          { tier: 'fast' }
        );
        const aiData = result.data;

        if (Array.isArray(aiData)) {
          articles = articles
            .map((article: any) => {
              const analysis = aiData.find((a) => a.id === article.id);
              if (analysis) {
                return {
                  ...article,
                  relevanceScore: analysis.relevanceScore,
                  aiInsight: analysis.aiInsight,
                  isAiRecommended: analysis.relevanceScore >= 7,
                };
              }
              return article;
            })
            .filter((a: any) => a.relevanceScore)
            .sort((a: any, b: any) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        }
      } catch (aiError) {
        console.error('[NewsAPI] AI Analysis failed, falling back to score sort:', aiError);
        articles.sort((a: any, b: any) => b.originalScore - a.originalScore);
      }
    }

    return NextResponse.json({ articles: articles.slice(0, 9) });
  } catch (error) {
    console.error('[NewsAPI] Failed to fetch news:', error);
    return NextResponse.json({ articles: [] }, { status: 500 });
  }
}
