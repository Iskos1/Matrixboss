"use client";

import { skills as defaultSkills } from "@/lib/data";
import { Skill } from "@/lib/data";
import { Code2, Briefcase, Wrench, Sparkles } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface SkillsProps {
  skills?: Skill[];
}

export default function Skills({ skills = defaultSkills }: SkillsProps) {
  // Safe check
  if (!skills) return null;

  // Duplicate the skills array for seamless marquee looping
  const marqueeSkills = [...skills, ...skills];

  const categoryConfig = {
    technical: {
      icon: Code2,
      label: "Technical",
      color: "from-purple-500 to-indigo-500",
      bgColor: "from-purple-50 to-indigo-50",
      textColor: "text-purple-700"
    },
    business: {
      icon: Briefcase,
      label: "Business",
      color: "from-emerald-500 to-green-500",
      bgColor: "from-emerald-50 to-green-50",
      textColor: "text-emerald-700"
    },
    tools: {
      icon: Wrench,
      label: "Tools & Platforms",
      color: "from-orange-500 to-amber-500",
      bgColor: "from-orange-50 to-amber-50",
      textColor: "text-orange-700"
    }
  };

  return (
    <section id="skills" className="py-32 px-6 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Skills & Tools
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-indigo-200 to-transparent" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-center bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent mb-6">
            Tech Stack
          </h2>
          <p className="text-center text-slate-600 max-w-2xl mx-auto mb-16">
            Technologies and tools I use to bring ideas to life
          </p>
        </AnimatedSection>

        {/* Enhanced Marquee */}
        <AnimatedSection delay={0.15}>
          <div className="relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 mb-12 shadow-sm">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            <div className="flex animate-marquee gap-3 w-max">
              {marqueeSkills.map((skill, idx) => (
                <span
                  key={`${skill.id}-${idx}`}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 text-sm font-semibold text-slate-700 whitespace-nowrap hover:border-purple-400 hover:shadow-md hover:scale-105 transition-all duration-200"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Enhanced Category Grid */}
        <AnimatedSection delay={0.3}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["technical", "business", "tools"] as const).map((category, idx) => {
              // @ts-ignore - indexing with string literal type issues sometimes
              const config = categoryConfig[category];
              const Icon = config.icon;
              const categorySkills = skills.filter((s) => s.category === category);
              
              if (!config) return null;

              return (
                <div
                  key={category}
                  className="group relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white hover:border-transparent transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative p-7">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${config.color} text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold uppercase tracking-wider ${config.textColor}`}>
                          {config.label}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {categorySkills.length} skill{categorySkills.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Skills List */}
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => (
                        <span
                          key={skill.id}
                          className={`relative text-sm font-medium px-4 py-2 rounded-lg bg-white border-2 border-slate-100 ${config.textColor} hover:bg-gradient-to-br hover:${config.bgColor} hover:border-transparent hover:shadow-md hover:scale-105 transition-all duration-200 cursor-default`}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Number Badge */}
                  <div className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br ${config.color} text-white font-bold text-lg flex items-center justify-center shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-300`}>
                    {categorySkills.length}
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
