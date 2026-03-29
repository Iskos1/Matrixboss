"use client";

import portfolioData from "@/data/portfolio.json";
import type { Skill } from "@/lib/portfolio/types";
const defaultSkills = portfolioData.skills as Skill[];

interface SkillsProps {
  skills?: Skill[];
}

const CATEGORIES = [
  { key: "technical", label: "Technical",       color: "text-blue-600"   },
  { key: "business",  label: "Business",         color: "text-emerald-600" },
  { key: "tools",     label: "Tools & Platforms", color: "text-orange-600"  },
] as const;

export default function Skills({ skills = defaultSkills }: SkillsProps) {
  if (!skills) return null;

  return (
    <section id="skills" className="py-16 px-6 bg-white border-b border-slate-200">
      <div className="max-w-5xl mx-auto">

        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Skills</p>
        <h2 className="text-2xl font-bold text-slate-900 mb-8">What I Work With</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {CATEGORIES.map(({ key, label, color }) => {
            const categorySkills = skills.filter((s) => s.category === key);
            return (
              <div key={key}>
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-3 ${color}`}>
                  {label}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map((skill) => (
                    <span
                      key={skill.id}
                      className="text-sm text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
