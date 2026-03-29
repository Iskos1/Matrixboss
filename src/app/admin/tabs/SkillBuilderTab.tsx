"use client";

import Link from "next/link";
import { Eye, GraduationCap } from "lucide-react";

export default function SkillBuilderTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap className="w-8 h-8" />
          <h2 className="text-3xl font-bold">Skill Builder Program</h2>
        </div>
        <p className="text-emerald-100 text-lg">
          Manage learning paths and structured projects for visitors.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Skill Builder Preview</h3>
        <p className="text-slate-600 mb-8 max-w-lg mx-auto">
          The Skill Builder is live on the public site. Access it directly to review content and test the user experience.
        </p>
        <Link href="/skill-builder" target="_blank" className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
          <Eye className="w-5 h-5" />
          Launch Skill Builder
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {[
          { emoji: "📊", title: "Data Scientist", desc: "Master data analysis, ML, and predictive modeling." },
          { emoji: "💻", title: "Full Stack Dev", desc: "Build modern web apps with React and Node.js." },
          { emoji: "🤖", title: "AI Engineer", desc: "Create intelligent systems and deploy ML models." },
        ].map(({ emoji, title, desc }) => (
          <div key={title} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 transition group cursor-pointer">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{emoji}</div>
            <h3 className="font-bold text-lg mb-2 text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mb-4">{desc}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">3 Levels</span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">5 Projects</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
