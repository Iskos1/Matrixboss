"use client";

import { ArrowRight, CheckCircle2, Layers, Zap } from "lucide-react";

interface Path {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  levelCount: number;
  skills: string[];
  completedLevels: number;
  totalSteps: number;
  completedSteps: number;
}

interface PathSelectorProps {
  paths: Path[];
  filteredPaths: string[];
  searchQuery: string;
  onSelectPath: (pathId: string) => void;
}

const pathGradients: Record<string, string> = {
  "data-scientist": "from-blue-500 to-cyan-500",
  "full-stack-developer": "from-purple-500 to-pink-500",
  "ai-ml-engineer": "from-orange-500 to-red-500",
};

const pathBgGradients: Record<string, string> = {
  "data-scientist": "from-blue-50 to-cyan-50",
  "full-stack-developer": "from-purple-50 to-pink-50",
  "ai-ml-engineer": "from-orange-50 to-red-50",
};

export default function PathSelector({
  paths,
  filteredPaths,
  searchQuery,
  onSelectPath,
}: PathSelectorProps) {
  const visiblePaths = paths.filter((p) => filteredPaths.includes(p.id));

  if (!paths || paths.length === 0) {
    return (
      <div className="py-20 px-6 text-center">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-2xl font-bold text-slate-900">
          No Learning Paths Available
        </h1>
        <p className="text-slate-600 mt-2">
          Please check back later for new content.
        </p>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Learn by Building Real Projects
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            Choose Your Path
          </h1>
          <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Master in-demand skills through structured, hands-on projects.
            Go from beginner to advanced with guided learning paths.
          </p>
        </div>

        {/* No results */}
        {searchQuery && visiblePaths.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              No paths match &ldquo;{searchQuery}&rdquo;
            </h2>
            <p className="text-slate-500">
              Try a different search term or browse all paths.
            </p>
          </div>
        )}

        {/* Path Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {visiblePaths.map((path, index) => {
            const progressPercent =
              path.totalSteps > 0
                ? Math.round((path.completedSteps / path.totalSteps) * 100)
                : 0;
            const isStarted = path.completedSteps > 0;
            const isComplete = path.completedLevels === path.levelCount;
            const gradient = pathGradients[path.id] || "from-slate-500 to-slate-600";
            const bgGradient = pathBgGradients[path.id] || "from-slate-50 to-slate-100";

            return (
              <div
                key={path.id}
                className="group relative bg-white rounded-2xl shadow-md border border-slate-200/80 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow duration-300"
                onClick={() => onSelectPath(path.id)}
              >
                {/* Top gradient accent */}
                <div
                  className={`h-1.5 bg-gradient-to-r ${gradient}`}
                />

                {/* Card Content */}
                <div className="p-6">
                  {/* Icon & Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`text-4xl sm:text-5xl p-3 rounded-2xl bg-gradient-to-br ${bgGradient}`}
                    >
                      {path.icon}
                    </div>
                    {isComplete ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold">Complete</span>
                      </div>
                    ) : isStarted ? (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                        <span className="text-xs font-semibold">{progressPercent}%</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">
                    {path.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                    {path.description}
                  </p>

                  {/* Skills Preview */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {path.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                    {path.skills.length > 4 && (
                      <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-400 font-medium">
                        +{path.skills.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar (if started) */}
                  {isStarted && (
                    <div className="mb-4">
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full bg-gradient-to-r ${gradient}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {path.completedSteps}/{path.totalSteps} steps •{" "}
                        {path.completedLevels}/{path.levelCount} projects
                      </p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        {path.levelCount} projects
                      </span>
                      <span>⏱️ {path.estimatedTime}</span>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent group-hover:gap-2.5 transition-all`}
                    >
                      {isStarted ? "Continue" : "Start"}
                      <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom encouragement */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-sm text-slate-400">
            🎯 Each path includes easy → medium → hard projects with step-by-step guides, code examples, and curated resources.
          </p>
        </div>
      </div>
    </div>
  );
}