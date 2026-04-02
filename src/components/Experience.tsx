"use client";

import { useState } from "react";
import portfolioData from "@/data/portfolio.json";
import type { ExperienceItem } from "@/lib/portfolio/types";
const defaultExperience = portfolioData.experience as ExperienceItem[];
import { ExternalLink, ArrowUpDown } from "lucide-react";
import { getExperienceStartDate } from "@/lib/portfolio/utils";

function isValidExternalWebsite(url: string): boolean {
  if (!url || !url.trim()) return false;
  try {
    const u = new URL(url);
    return (u.protocol === "http:" || u.protocol === "https:") && Boolean(u.host);
  } catch {
    return false;
  }
}

interface ExperienceProps {
  experience?: ExperienceItem[];
}

export default function Experience({ experience = defaultExperience }: ExperienceProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  if (!experience) return null;

  const filtered = experience.filter((e) => {
    const firstPosition = e.positions?.[0];
    const desc = firstPosition?.description || (e as any).description || "";
    return desc && !desc.startsWith("Description of your role");
  });

  const displayExperience = [...filtered].sort((a, b) => {
    const diff = getExperienceStartDate(b) - getExperienceStartDate(a);
    return sortOrder === "newest" ? diff : -diff;
  });

  return (
    <section id="experience" className="py-16 px-6 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Experience</p>
            <h2 className="text-2xl font-bold text-slate-900">Professional Background</h2>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-2 rounded-lg transition-colors flex-shrink-0"
            title="Toggle sort order"
          >
            <ArrowUpDown size={13} />
            {sortOrder === "newest" ? "Newest First" : "Oldest First"}
          </button>
        </div>

        <div className="space-y-10">
          {displayExperience.map((item) => {
            const positions = item.positions && item.positions.length > 0
              ? item.positions
              : [{ role: (item as any).role, period: (item as any).period, description: (item as any).description, tags: (item as any).tags || [] }];

            return (
              <div key={item.id} className="flex gap-5">
                {/* Logo or initials */}
                <div className="flex-shrink-0 mt-1">
                  {item.logo ? (
                    <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white p-1.5 flex items-center justify-center">
                      <img
                        src={item.logo}
                        alt={`${item.company} logo`}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                          const fallback = img.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                      <div
                        className="w-full h-full hidden items-center justify-center text-white text-xs font-bold rounded bg-blue-600"
                        style={{ display: "none" }}
                      >
                        {item.company.charAt(0)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                      {item.company.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.company}</h3>
                      {item.location && (
                        <p className="text-xs text-slate-500">{item.location}</p>
                      )}
                    </div>
                    {item.website && isValidExternalWebsite(item.website) && (
                      <a
                        href={item.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-blue-600 transition-colors flex-shrink-0"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>

                  <div className="space-y-5">
                    {positions.map((pos: any, i: number) => (
                      <div key={i}>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-slate-800">{pos.role}</span>
                          <span className="text-xs text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            {pos.period}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed mb-3">
                          {pos.description}
                        </p>
                        {pos.tags && pos.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {pos.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
