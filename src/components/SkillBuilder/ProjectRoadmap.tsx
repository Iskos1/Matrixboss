"use client";

import {
  CheckCircle2,
  Lock,
  PlayCircle,
  Circle,
  ArrowLeft,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";

interface Project {
  level: string;
  title: string;
  description: string;
  estimatedTime: string;
  skills: string[];
  totalSteps: number;
  completedSteps: number;
}

interface ProjectRoadmapProps {
  pathTitle: string;
  pathDescription: string;
  pathIcon: string;
  projects: Project[];
  currentLevel: string | null;
  completedLevels: string[];
  onSelectProject: (level: string) => void;
  onBack: () => void;
}

const levelOrder = ["easy", "medium", "hard"];

const levelConfig = {
  easy: {
    label: "Beginner",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100",
    gradient: "from-emerald-500 to-green-500",
    icon: "🌱",
    ring: "ring-emerald-500",
  },
  medium: {
    label: "Intermediate",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeBg: "bg-amber-100",
    gradient: "from-amber-500 to-yellow-500",
    icon: "⚡",
    ring: "ring-amber-500",
  },
  hard: {
    label: "Advanced",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    badgeBg: "bg-red-100",
    gradient: "from-red-500 to-rose-500",
    icon: "🔥",
    ring: "ring-red-500",
  },
};

export default function ProjectRoadmap({
  pathTitle,
  pathDescription,
  pathIcon,
  projects,
  currentLevel,
  completedLevels,
  onSelectProject,
  onBack,
}: ProjectRoadmapProps) {
  const getProjectStatus = (level: string) => {
    if (completedLevels.includes(level)) return "completed";
    if (currentLevel === level) return "in-progress";

    const levelIdx = levelOrder.indexOf(level);
    // A level is available if all previous levels are completed
    const previousCompleted = levelOrder
      .slice(0, levelIdx)
      .every((l) => completedLevels.includes(l));
    if (previousCompleted) return "available";
    return "locked";
  };

  const sortedProjects = [...projects].sort(
    (a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level)
  );

  const overallSteps = projects.reduce((a, p) => a + p.totalSteps, 0);
  const overallCompleted = projects.reduce((a, p) => a + p.completedSteps, 0);
  const overallPercent = overallSteps > 0 ? Math.round((overallCompleted / overallSteps) * 100) : 0;

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">All Paths</span>
        </button>

        {/* Path Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="text-5xl sm:text-6xl">{pathIcon}</div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                {pathTitle}
              </h1>
              <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-4">
                {pathDescription}
              </p>

              {/* Overall Progress */}
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Overall Progress</span>
                    <span className="font-semibold text-slate-700">{overallPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${overallPercent}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  {overallCompleted}/{overallSteps} steps
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap Title */}
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-slate-900">
            Learning Roadmap
          </h2>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Project Cards */}
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-0.5 bg-slate-200 hidden sm:block" />

          <div className="space-y-5">
            {sortedProjects.map((project, index) => {
              const status = getProjectStatus(project.level);
              const isLocked = status === "locked";
              const isCompleted = status === "completed";
              const isInProgress = status === "in-progress";
              const isAvailable = status === "available";
              const config = levelConfig[project.level as keyof typeof levelConfig];
              const stepProgress =
                project.totalSteps > 0
                  ? Math.round((project.completedSteps / project.totalSteps) * 100)
                  : 0;

              return (
                <div key={project.level} className="relative">
                  {/* Timeline dot (desktop) */}
                  <div className="absolute left-4 sm:left-6 top-7 hidden sm:flex items-center justify-center z-10">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        isCompleted
                          ? "bg-green-500 border-green-500"
                          : isInProgress
                          ? "bg-purple-500 border-purple-500"
                          : isAvailable
                          ? "bg-white border-purple-400"
                          : "bg-slate-200 border-slate-300"
                      }`}
                    />
                  </div>

                  {/* Card */}
                  <div
                    className={`sm:ml-16 bg-white rounded-2xl border-2 p-5 sm:p-6 transition-all duration-300 ${
                      isLocked
                        ? "opacity-50 border-slate-200 cursor-not-allowed"
                        : isInProgress
                        ? `border-purple-400 shadow-lg shadow-purple-100 ring-1 ring-purple-200`
                        : isCompleted
                        ? "border-green-300 shadow-sm"
                        : "border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer"
                    }`}
                    onClick={() => !isLocked && onSelectProject(project.level)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Level Badge + Icon */}
                      <div className="flex items-center gap-3 sm:flex-col sm:items-center sm:min-w-[80px]">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                            isCompleted ? "bg-green-50" : isLocked ? "bg-slate-100" : config.bg
                          }`}
                        >
                          {isCompleted ? "✅" : isLocked ? "🔒" : config.icon}
                        </div>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            isCompleted
                              ? "bg-green-100 text-green-700"
                              : isLocked
                              ? "bg-slate-100 text-slate-500"
                              : `${config.badgeBg} ${config.color}`
                          }`}
                        >
                          {config.label}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-bold text-slate-900">
                            {project.title}
                          </h3>
                          {isInProgress && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                              <PlayCircle className="w-3 h-3" />
                              In Progress
                            </span>
                          )}
                          {isCompleted && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3" />
                              Done
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-500 mb-3 leading-relaxed">
                          {project.description}
                        </p>

                        {/* Skills */}
                        {project.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {project.skills.map((skill) => (
                              <span
                                key={skill}
                                className={`text-xs px-2 py-0.5 rounded-md font-medium ${
                                  isLocked
                                    ? "bg-slate-100 text-slate-400"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Progress + Meta */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Step progress */}
                          {(isInProgress || isCompleted || project.completedSteps > 0) && (
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    isCompleted
                                      ? "bg-green-500"
                                      : "bg-purple-500"
                                  }`}
                                  style={{ width: `${stepProgress}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">
                                {project.completedSteps}/{project.totalSteps}
                              </span>
                            </div>
                          )}

                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {project.estimatedTime}
                          </span>

                          <span className="text-xs text-slate-400">
                            {project.totalSteps} steps
                          </span>
                        </div>

                        {/* Action Button */}
                        {!isLocked && (
                          <button
                            className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                              isInProgress
                                ? "bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
                                : isCompleted
                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectProject(project.level);
                            }}
                          >
                            {isCompleted ? (
                              <>Review Project</>
                            ) : isInProgress ? (
                              <>
                                Continue Learning
                                <ChevronRight className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                Start Project
                                <ChevronRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}

                        {isLocked && (
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Complete the previous project to unlock</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}