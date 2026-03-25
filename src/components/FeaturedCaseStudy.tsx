"use client";

import Link from "next/link";
import { ArrowRight, TrendingDown, CheckCircle2 } from "lucide-react";

const MINI_REVENUE = [8, 22, 36, 49, 42, 46, 53, 61, 69, 74, 58, 52, 50, 72, 89, 96, 88, 92];
const Q3_INDEXES = [10, 11, 12];
const MAX_REV = Math.max(...MINI_REVENUE);

const STATS = [
  { value: "100k+", label: "Orders analyzed" },
  { value: "R$13.6M", label: "Revenue tracked" },
  { value: "−21.4%", label: "Q3 dip identified" },
  { value: "3",       label: "Root causes found" },
];

const FINDINGS = [
  "51% of the Q3 gap — logistics failures, Northeast avg 19.7-day delivery",
  "28% category concentration drop across top-3 revenue categories simultaneously",
  "R$448k missed Northeast revenue with zero local seller coverage",
];

const TAGS = ["SQL", "Data Modeling", "Business Analysis", "React", "Recharts", "KPI Framework", "Root Cause Analysis", "Agile User Stories", "Process Mapping"];

const DELIVERABLES = ["BRD", "10 User Stories", "Process Maps", "5-Slide Exec Deck"];

export default function FeaturedCaseStudy() {
  return (
    <section className="py-16 px-6 bg-slate-50 border-y border-slate-200">
      <div className="max-w-5xl mx-auto">

        {/* Label */}
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-4">
          Featured Case Study
        </p>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

          {/* Top strip — title + chart */}
          <div className="p-6 sm:p-8 border-b border-slate-200">
            <div className="flex flex-col lg:flex-row lg:items-start gap-8">

              {/* Left */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  Brazilian E-Commerce Analytics Platform
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-5 max-w-xl">
                  End-to-end business analysis on 100k+ real Olist orders — SQL data pipeline, KPI modeling,
                  root-cause analysis of a recurring Q3 revenue decline, interactive React dashboard,
                  and a complete BA deliverables package.
                </p>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {STATS.map((s) => (
                    <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <p className="text-lg font-bold text-slate-900">{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.map((t) => (
                    <span key={t} className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right — mini chart */}
              <div className="lg:w-52 flex-shrink-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Monthly Revenue · Sep '16 – Aug '18
                </p>
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex items-end gap-0.5 h-20">
                    {MINI_REVENUE.map((v, i) => {
                      const isQ3 = Q3_INDEXES.includes(i);
                      const h = Math.round((v / MAX_REV) * 100);
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-sm"
                          style={{
                            height: `${h}%`,
                            backgroundColor: isQ3 ? "#f59e0b" : "#3b82f6",
                            opacity: 0.75,
                          }}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-[9px] text-slate-400">
                      <span className="w-2 h-2 rounded-sm bg-blue-400 inline-block" /> Revenue
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-amber-500 font-semibold">
                      <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" /> Q3 dip
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom strip — findings + deliverables + CTA */}
          <div className="p-6 sm:p-8 bg-slate-50 flex flex-col sm:flex-row sm:items-end gap-6">

            {/* Findings */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                <TrendingDown size={11} className="text-red-500" />
                Root Cause Findings
              </p>
              <ul className="space-y-2 mb-4">
                {FINDINGS.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-red-100 border border-red-200 text-red-600 text-[9px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* Deliverables */}
              <div className="flex flex-wrap gap-1.5">
                {DELIVERABLES.map((d) => (
                  <span key={d} className="flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 size={9} />
                    {d}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0">
              <Link
                href="/projects/ecommerce-analytics"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Explore Full Platform
                <ArrowRight size={15} />
              </Link>
              <p className="text-[11px] text-slate-400 mt-2 text-center">
                SQL · Dashboard · BA Artifacts
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
