"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Newspaper, TrendingUp, Cpu, Globe, ArrowRight, Loader2, Briefcase, Zap, Sparkles, X, ExternalLink, Bot } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary?: string;
  url: string;
  redditUrl?: string;
  source: string;
  domain?: string;
  date: string;
  category?: string;
  imageUrl?: string;
  relevanceScore?: number;
  aiInsight?: string;
}

const CATEGORIES = [
  { id: "tech", label: "Latest Tech", icon: <Cpu className="w-4 h-4" /> },
  { id: "ai", label: "Artificial Intelligence", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "web", label: "Web Development", icon: <Globe className="w-4 h-4" /> },
  { id: "business", label: "Business & Startups", icon: <Briefcase className="w-4 h-4" /> },
];

export default function NewsletterPage() {
  const [activeCategory, setActiveCategory] = useState("tech");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [articleContent, setArticleContent] = useState<string | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/news?category=${activeCategory}`);
        if (!response.ok) throw new Error("Failed to fetch news");
        const data = await response.json();
        setNews(data.articles || []);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [activeCategory]);

  useEffect(() => {
    if (selectedArticle) {
      const fetchArticleContent = async () => {
        setLoadingArticle(true);
        setArticleContent(null);
        try {
          const response = await fetch(`/api/news/read?url=${encodeURIComponent(selectedArticle.url)}`);
          if (response.ok) {
            const data = await response.json();
            setArticleContent(data.content);
          }
        } catch (error) {
          console.error("Error fetching article content:", error);
        } finally {
          setLoadingArticle(false);
        }
      };

      fetchArticleContent();
    } else {
      setArticleContent(null);
    }
  }, [selectedArticle]);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-16 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-12">
          
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  AI Curated Feed
                </span>
                <span className="inline-block px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 rounded-full">
                  Updated Hourly
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
                Industry Insights & News
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-4">
                Stay updated with the latest trends in technology, AI, and business. 
                Curated by AI based on my professional interests and expertise.
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.id
                    ? "bg-slate-900 text-white shadow-lg scale-105"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          {/* News Grid */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
              <p className="text-slate-500 animate-pulse">
                AI is analyzing the latest news for you...
              </p>
            </div>
          ) : news.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item, index) => (
                  <article
                    key={item.id}
                    className={`bg-white rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-all flex flex-col h-full group cursor-pointer ${
                      item.relevanceScore && item.relevanceScore >= 8 
                        ? 'border-purple-200 ring-1 ring-purple-100' 
                        : 'border-slate-200'
                    }`}
                    onClick={() => setSelectedArticle(item)}
                  >
                    {item.imageUrl && (
                      <div className="h-48 overflow-hidden bg-slate-100 relative">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/64748b?text=${encodeURIComponent(item.source)}`;
                          }}
                        />
                        <div 
                          className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                        >
                          {item.source}
                        </div>
                        {item.relevanceScore && item.relevanceScore >= 8 && (
                          <div className="absolute top-3 left-3 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold shadow-sm flex items-center gap-1">
                            <Zap className="w-3 h-3 fill-current" />
                            Top Pick
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-6 flex flex-col flex-1 relative">
                      {/* AI Insight Badge */}
                      {item.aiInsight && (
                        <div className="mb-4 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-100">
                          <div className="flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-purple-700 mb-0.5">AI Insight</p>
                              <p className="text-xs text-purple-900 leading-relaxed">
                                {item.aiInsight}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        {!item.imageUrl && (
                          <span 
                            className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded transition-colors"
                          >
                            {item.source}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">{item.date}</span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 hover:text-purple-600 transition-colors">
                        {item.title}
                      </h3>
                      
                      <p className="text-slate-600 text-sm line-clamp-3 mb-4 flex-1">
                        {item.summary || "Click to read the full article..."}
                      </p>
                      
                      <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
                        <button
                          onClick={() => setSelectedArticle(item)}
                          className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors group/link"
                        >
                          Read Article 
                          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/link:translate-x-1" />
                        </button>
                        {item.relevanceScore && (
                           <div className="flex items-center gap-1" title={`AI Relevance Score: ${item.relevanceScore}/10`}>
                              <div className="flex gap-0.5">
                                 {[...Array(5)].map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        (i + 1) * 2 <= item.relevanceScore! 
                                          ? 'bg-purple-500' 
                                          : 'bg-slate-200'
                                      }`}
                                    />
                                 ))}
                              </div>
                           </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
              <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No news found</h3>
              <p className="text-slate-500 mt-2">Check back later for updates in this category.</p>
            </div>
          )}
        </div>
      </main>

      {/* Analysis Modal */}
        {selectedArticle && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedArticle(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                <div className="pr-8">
                   <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      {selectedArticle.source}
                    </span>
                    <span className="text-slate-500 text-xs">{selectedArticle.date}</span>
                   </div>
                   <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {selectedArticle.title}
                   </h2>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto">
                {/* AI Analysis Section */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-5 h-5 text-purple-600" />
                    <h3 className="font-bold text-purple-900">AI Analysis & Insights</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">Why this matters to you</h4>
                      <p className="text-purple-900/80 leading-relaxed">
                        {selectedArticle.aiInsight || "This article was selected based on its relevance to your professional interests and current industry trends."}
                      </p>
                    </div>

                    {selectedArticle.relevanceScore && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                           <h4 className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Relevance Score</h4>
                           <span className="text-sm font-bold text-purple-700">{selectedArticle.relevanceScore}/10</span>
                        </div>
                        <div className="h-2 w-full bg-purple-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full" 
                            style={{ width: `${(selectedArticle.relevanceScore / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Article Content / Summary */}
                <div>
                  {loadingArticle ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-3">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                      <p className="text-slate-500 text-sm">Fetching article content...</p>
                    </div>
                  ) : articleContent ? (
                    <div className="prose prose-slate max-w-none">
                       <div dangerouslySetInnerHTML={{ __html: articleContent }} />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Summary</h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {selectedArticle.summary || "No summary available for this article."}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl sticky bottom-0 z-10">
                <div className="flex flex-col gap-3">
                  {selectedArticle.domain && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <ExternalLink size={14} />
                      <span>Article source: <span className="font-semibold text-slate-700">{selectedArticle.domain}</span></span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                    <button
                      onClick={() => setSelectedArticle(null)}
                      className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors order-last sm:order-first"
                    >
                      Close
                    </button>
                    <div className="flex gap-2">
                      {selectedArticle.redditUrl && (
                        <a
                          href={selectedArticle.redditUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium transition-all"
                          title="View discussion on Reddit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Discussion
                        </a>
                      )}
                      <a
                        href={selectedArticle.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all transform hover:-translate-y-0.5"
                        title={selectedArticle.domain ? `Open article on ${selectedArticle.domain}` : 'Open article'}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Read Full Article
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      <Footer />
    </>
  );
}
