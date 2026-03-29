"use client";

import {
  ArrowLeft,
  Trophy,
  Flame,
  Clock,
  BookOpen,
  Target,
  Zap,
  ChevronRight,
  BarChart3,
  Star,
} from "lucide-react";
import { type SkillPath } from "@/lib/skills/paths";

interface Stats {
  totalPaths: number;
  startedPaths: number;
  totalLevels: number;
  completedLevels: number;
  totalSteps: number;
  completedSteps: number;
  overallProgress: number;
  streak: number;
  totalTimeMinutes: number;
}

interface ProgressData {
  completedLevels: Record<string, string[]>;
  currentLevels: Record<string, string | null>;
  completedSteps: Record<string, number[]>;
  startedPaths: string[];
  streak: number;
  lastActiveDate: string | null;
  totalTimeMinutes: number;
  selectedPathId: string | null;
}

interface ProgressDashboardProps {
  stats: Stats;
  paths: SkillPath[];
  progress: ProgressData;
  onBack: () => void;
  onSelectPath: (pathId: string) => void;
}

const pathGradients: Record<string, string> = {
  "data-scientist": "from-blue-500 to-cyan-500",
  "full-stack-developer": "from-purple-500 to-pink-500",
  "ai-ml-engineer": "from-orange-500 to-red-500",
};

export default function ProgressDashboard({
  stats,
  paths,
  progress,
  onBack,
  onSelectPath,
}: ProgressDashboardProps) {
  // Calculate achievements
  const achievements = [];

  if (stats.completedSteps >= 1) {
    achievements.push({ icon: "🎯", title: "First Step", desc: "Completed your first step" });
  }
  if (stats.completedSteps >= 10) {
    achievements.push({ icon: "🔟", title: "Ten Down", desc: "Completed 10 steps" });
  }
  if (stats.completedSteps >= 25) {
    achievements.push({ icon: "💪", title: "Quarter Century", desc: "Completed 25 steps" });
  }
  if (stats.completedLevels >= 1) {
    achievements.push({ icon: "🏆", title: "Project Master", desc: "Completed a full project" });
  }
  if (stats.completedLevels >= 3) {
    achievements.push({ icon: "🌟", title: "Triple Threat", desc: "Completed 3 projects" });
  }
  if (stats.streak >= 3) {
    achievements.push({ icon: "🔥", title: "On Fire", desc: "3-day learning streak" });
  }
  if (stats.streak >= 7) {
    achievements.push({ icon: "⚡", title: "Week Warrior", desc: "7-day learning streak" });
  }
  if (stats.startedPaths >= 2) {
    achievements.push({ icon: "🗺️", title: "Explorer", desc: "Started 2+ paths" });
  }
  if (stats.totalTimeMinutes >= 60) {
    achievements.push({ icon: "⏰", title: "Dedicated", desc: "1+ hour of learning" });
  }

  // Calculate recommended next action
  const getRecommendation = () => {
    for (const path of paths) {
      if (progress.startedPaths.includes(path.id)) {
        const completed = progress.completedLevels[path.id] || [];
        const currentLevel = progress.currentLevels[path.id];
        if (currentLevel) {
          const level = path.levels.find((l) => l.level === currentLevel);
          if (level) {
            const key = `${path.id}-${level.level}`;
            const stepsDone = (progress.completedSteps[key] || []).length;
            if (stepsDone < level.steps.length) {
              return {
                pathId: path.id,
                message: `Continue "${level.title}" in ${path.title}`,
                detail: `${stepsDone}/${level.steps.length} steps completed`,
                icon: path.icon,
              };
            }
          }
        }
        // Find next uncompleted level
        for (const level of path.levels) {
          if (!completed.includes(level.level)) {
            return {
              pathId: path.id,
              message: `Start "${level.title}" in ${path.title}`,
              detail: `${level.steps.length} steps • ${level.estimatedTime}`,
              icon: path.icon,
            };
          }
        }
      }
    }
    // No started paths
    return {
      pathId: paths[0]?.id || "",
      message: "Start your first learning path!",
      detail: "Choose a path and begin your journey",
      icon: "🚀",
    };
  };

  const recommendation = getRecommendation();

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Paths</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Your Progress
            </h1>
          </div>
          <p className="text-slate-500">
            Track your learning journey and celebrate your achievements.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: <Target className="w-5 h-5 text-purple-600" />,
              label: "Overall Progress",
              value: `${stats.overallProgress}%`,
              bg: "bg-purple-50",
              border: "border-purple-200",
            },
            {
              icon: <Trophy className="w-5 h-5 text-green-600" />,
              label: "Projects Done",
              value: `${stats.completedLevels}/${stats.totalLevels}`,
              bg: "bg-green-50",
              border: "border-green-200",
            },
            {
              icon: <Flame className="w-5 h-5 text-orange-500" />,
              label: "Day Streak",
              value: `${stats.streak}`,
              bg: "bg-orange-50",
              border: "border-orange-200",
            },
            {
              icon: <Clock className="w-5 h-5 text-blue-600" />,
              label: "Time Learning",
              value:
                stats.totalTimeMinutes < 60
                  ? `${stats.totalTimeMinutes}m`
                  : `${Math.floor(stats.totalTimeMinutes / 60)}h ${stats.totalTimeMinutes % 60}m`,
              bg: "bg-blue-50",
              border: "border-blue-200",
            },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className={`${stat.bg} border ${stat.border} rounded-2xl p-5`}
            >
              <div className="mb-3">{stat.icon}</div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recommended Next Action */}
        {recommendation && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Recommended Next
            </h2>
            <button
              onClick={() => onSelectPath(recommendation.pathId)}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-5 text-left text-white hover:shadow-lg hover:shadow-purple-200 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{recommendation.icon}</div>
                  <div>
                    <p className="font-semibold text-lg">{recommendation.message}</p>
                    <p className="text-purple-200 text-sm mt-0.5">
                      {recommendation.detail}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        )}

        {/* Path Progress Cards */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Path Progress
          </h2>
          <div className="space-y-3">
            {paths.map((path) => {
              const completed = progress.completedLevels[path.id] || [];
              const totalSteps = path.levels.reduce((a, l) => a + l.steps.length, 0);
              const doneSteps = path.levels.reduce((a, l) => {
                const key = `${path.id}-${l.level}`;
                return a + (progress.completedSteps[key] || []).length;
              }, 0);
              const percent = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;
              const gradient = pathGradients[path.id] || "from-slate-500 to-slate-600";
              const isStarted = progress.startedPaths.includes(path.id);

              return (
                <button
                  key={path.id}
                  onClick={() => onSelectPath(path.id)}
                  className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left hover:shadow-md hover:border-purple-200 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl shrink-0">{path.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate pr-2">
                          {path.title}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500 shrink-0">
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                        <div
                          className={`bg-gradient-to-r ${gradient} h-2 rounded-full transition-all duration-700`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>
                          {completed.length}/{path.levels.length} projects
                        </span>
                        <span>
                          {doneSteps}/{totalSteps} steps
                        </span>
                        {!isStarted && (
                          <span className="text-purple-500 font-medium">
                            Not started
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Star className="w-4 h-4" />
            Achievements
          </h2>
          {achievements.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((achievement, idx) => (
                <div
                  key={achievement.title}
                  className="bg-white rounded-xl border border-slate-200 p-4 text-center hover:shadow-sm transition-shadow"
                >
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <p className="text-sm font-semibold text-slate-900">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {achievement.desc}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-sm text-slate-500">
                Complete steps and projects to earn achievements!
              </p>
            </div>
          )}
        </div>

        {/* Steps Completed Detail */}
        <div className="mt-8 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Steps Breakdown
          </h3>
          <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 h-4 rounded-full"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{stats.completedSteps} steps completed</span>
            <span>{stats.totalSteps - stats.completedSteps} remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
}