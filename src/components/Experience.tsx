"use client";

import { experience as defaultExperience } from "@/lib/data";
import { ExperienceItem } from "@/lib/data";
import { ExternalLink, MapPin, Briefcase } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface ExperienceProps {
  experience?: ExperienceItem[];
}

export default function Experience({ experience = defaultExperience }: ExperienceProps) {
  if (!experience) return null;

  return (
    <section id="experience" className="py-24 px-6 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-3">
            Career
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-14">
            Professional Experience
          </h2>
        </AnimatedSection>

        {/* Experience Cards */}
        <div className="space-y-8">
          {experience.map((item, idx) => {
            // Check if this experience has multiple positions
            const hasMultiplePositions = item.positions && item.positions.length > 0;
            const positions = hasMultiplePositions 
              ? item.positions 
              : [{
                  role: item.role || "",
                  period: item.period || "",
                  description: item.description || "",
                  tags: item.tags || []
                }];

            return (
              <AnimatedSection key={item.id} delay={idx * 0.1}>
                <div className="group relative bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Company Header */}
                  <div className="bg-gradient-to-r from-slate-50 to-white p-6 border-b border-slate-200">
                    <div className="flex items-start gap-4">
                      {/* Company Logo */}
                      <div className="flex-shrink-0">
                        {item.logo ? (
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 p-2 group-hover:shadow-md transition-shadow">
                            <img
                              src={item.logo}
                              alt={`${item.company} logo`}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                // Fallback to initials if logo fails
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                if (target.nextSibling) {
                                  (target.nextSibling as HTMLElement).style.display = 'flex';
                                }
                              }}
                            />
                            <div className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white font-bold text-xl">
                              {item.company.charAt(0)}
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-md group-hover:shadow-lg transition-shadow">
                            {item.company.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Company Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                              {item.company}
                            </h3>
                            {item.location && (
                              <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                                <MapPin size={14} />
                                <span className="text-sm">{item.location}</span>
                              </div>
                            )}
                          </div>
                          {item.website && (
                            <a
                              href={item.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 text-slate-400 hover:text-purple-600 transition-colors"
                              title={`Visit ${item.company} website`}
                            >
                              <ExternalLink size={20} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Positions */}
                  <div className="p-6">
                    {positions && positions.length > 1 ? (
                      /* LinkedIn-style Timeline for Multiple Positions */
                      <div className="relative">
                        {/* Vertical connecting line */}
                        <div className="absolute left-[11px] top-[12px] bottom-[12px] w-[2px] bg-gradient-to-b from-purple-400 via-purple-300 to-purple-200" />
                        
                        <div className="space-y-0">
                          {/* @ts-ignore - positions mapping issue */}
                          {positions.map((position, posIdx) => (
                            <div key={posIdx} className="relative pl-10 pb-8 last:pb-0">
                              {/* Timeline dot */}
                              <div className="absolute left-0 top-[6px] w-6 h-6 rounded-full bg-white border-[3px] border-purple-500 shadow-md z-10 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                              </div>

                              {/* Position content */}
                              <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
                                {/* Position header */}
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Briefcase className="text-purple-500 flex-shrink-0" size={18} />
                                    {position.role}
                                  </h4>
                                  <span className="flex-shrink-0 text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                                    {position.period}
                                  </span>
                                </div>

                                {/* Position description */}
                                <p className="text-sm text-slate-600 leading-relaxed mb-3 ml-7">
                                  {position.description}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 ml-7">
                                  {position.tags?.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs font-medium text-slate-600 bg-white hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {/* Career progression indicator */}
                                {posIdx === 0 && positions.length > 1 && (
                                  <div className="mt-3 ml-7">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                      </svg>
                                      Most Recent
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Total duration badge */}
                        <div className="mt-2 pl-10">
                          <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{positions.length} position{positions.length > 1 ? 's' : ''} at {item.company}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Single position display */
                      <div className="space-y-6">
                        {/* @ts-ignore - positions mapping issue */}
                        {positions?.map((position, posIdx) => (
                          <div key={posIdx}>
                            <div className="flex items-start gap-3 mb-3">
                              <div className="flex-shrink-0 mt-1">
                                <Briefcase className="text-purple-500" size={18} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <h4 className="text-lg font-semibold text-slate-900">
                                    {position.role}
                                  </h4>
                                  <span className="flex-shrink-0 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full whitespace-nowrap">
                                    {position.period}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {position.description}
                                </p>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {position.tags?.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Decorative accent */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
