"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import PathSelector from "@/components/SkillBuilder/PathSelector";
import ProjectRoadmap from "@/components/SkillBuilder/ProjectRoadmap";
import ProjectGuide from "@/components/SkillBuilder/ProjectGuide";
import ProgressDashboard from "@/components/SkillBuilder/ProgressDashboard";
import { skillPaths, type SkillPath } from "@/lib/skills/paths";
import {
  Home,
  BarChart3,
  Search,
  RotateCcw,
  Flame,
  Trophy,
  BookOpen,
  Clock,
  X,
} from "lucide-react";

type View = "paths" | "roadmap" | "guide" | "dashboard";

interface ProgressData {
  selectedPathId: string | null;
  completedLevels: Record<string, string[]>; // pathId -> completed level keys
  currentLevels: Record<string, string | null>; // pathId -> current level
  completedSteps: Record<string, number[]>; // "pathId-level" -> step ids
  streak: number;
  lastActiveDate: string | null;
  totalTimeMinutes: number;
  startedPaths: string[];
}

const defaultProgress: ProgressData = {
  selectedPathId: null,
  completedLevels: {},
  currentLevels: {},
  completedSteps: {},
  streak: 0,
  lastActiveDate: null,
  totalTimeMinutes: 0,
  startedPaths: [],
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function calculateStreak(lastDate: string | null, currentStreak: number): number {
  if (!lastDate) return 1;
  const today = new Date(getToday());
  const last = new Date(lastDate);
  const diff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return currentStreak;
  if (diff === 1) return currentStreak + 1;
  return 1; // streak broken
}

export default function SkillBuilderPage() {
  const [currentView, setCurrentView] = useState<View>("paths");
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData>(defaultProgress);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("skill-builder-progress-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProgress({ ...defaultProgress, ...parsed });
        if (parsed.selectedPathId) {
          setSelectedPathId(parsed.selectedPathId);
        }
      } catch (e) {
        console.error("Error loading progress:", e);
      }
    }
    setSessionStartTime(Date.now());
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    localStorage.setItem("skill-builder-progress-v2", JSON.stringify(progress));
  }, [progress]);

  // Track session time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (sessionStartTime && currentView === "guide") {
        setProgress((prev) => ({
          ...prev,
          totalTimeMinutes: prev.totalTimeMinutes + 1,
        }));
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [sessionStartTime, currentView]);

  // Update streak on activity
  const updateStreak = useCallback(() => {
    const today = getToday();
    setProgress((prev) => {
      if (prev.lastActiveDate === today) return prev;
      return {
        ...prev,
        streak: calculateStreak(prev.lastActiveDate, prev.streak),
        lastActiveDate: today,
      };
    });
  }, []);

  const paths = skillPaths || [];

  // Search / filter paths
  const filteredPaths = useMemo(() => {
    if (!searchQuery.trim()) return paths;
    const q = searchQuery.toLowerCase();
    return paths.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.levels.some(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.skills?.some((s) => s.toLowerCase().includes(q))
        )
    );
  }, [paths, searchQuery]);

  // Stats calculations
  const stats = useMemo(() => {
    let totalLevels = 0;
    let completedCount = 0;
    let totalSteps = 0;
    let completedStepsCount = 0;

    paths.forEach((path) => {
      path.levels.forEach((level) => {
        totalLevels++;
        const key = `${path.id}-${level.level}`;
        if (progress.completedLevels[path.id]?.includes(level.level)) {
          completedCount++;
        }
        level.steps.forEach(() => {
          totalSteps++;
        });
        const stepsDone = progress.completedSteps[key] || [];
        completedStepsCount += stepsDone.length;
      });
    });

    return {
      totalPaths: paths.length,
      startedPaths: progress.startedPaths.length,
      totalLevels,
      completedLevels: completedCount,
      totalSteps,
      completedSteps: completedStepsCount,
      overallProgress: totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0,
      streak: progress.streak,
      totalTimeMinutes: progress.totalTimeMinutes,
    };
  }, [paths, progress]);

  const handleSelectPath = (pathId: string) => {
    setSelectedPathId(pathId);
    setProgress((prev) => ({
      ...prev,
      selectedPathId: pathId,
      startedPaths: prev.startedPaths.includes(pathId)
        ? prev.startedPaths
        : [...prev.startedPaths, pathId],
    }));
    updateStreak();
    setCurrentView("roadmap");
  };

  const handleSelectProject = (level: string) => {
    setSelectedLevel(level);
    if (selectedPathId) {
      setProgress((prev) => ({
        ...prev,
        currentLevels: { ...prev.currentLevels, [selectedPathId]: level },
      }));
    }
    updateStreak();
    setCurrentView("guide");
  };

  const handleCompleteProject = () => {
    if (selectedLevel && selectedPathId) {
      setProgress((prev) => {
        const pathCompleted = prev.completedLevels[selectedPathId] || [];
        if (!pathCompleted.includes(selectedLevel)) {
          return {
            ...prev,
            completedLevels: {
              ...prev.completedLevels,
              [selectedPathId]: [...pathCompleted, selectedLevel],
            },
            currentLevels: { ...prev.currentLevels, [selectedPathId]: null },
          };
        }
        return prev;
      });
    }
    updateStreak();
    setSelectedLevel(null);
    setCurrentView("roadmap");
  };

  const handleStepComplete = (stepId: number) => {
    if (!selectedPathId || !selectedLevel) return;
    const key = `${selectedPathId}-${selectedLevel}`;
    setProgress((prev) => {
      const current = prev.completedSteps[key] || [];
      const updated = current.includes(stepId)
        ? current.filter((id) => id !== stepId)
        : [...current, stepId];
      return {
        ...prev,
        completedSteps: { ...prev.completedSteps, [key]: updated },
      };
    });
    updateStreak();
  };

  const handleBackToRoadmap = () => {
    setSelectedLevel(null);
    setCurrentView("roadmap");
  };

  const handleBackToPaths = () => {
    setSelectedPathId(null);
    setSelectedLevel(null);
    setCurrentView("paths");
  };

  const handleResetProgress = () => {
    setProgress(defaultProgress);
    setSelectedPathId(null);
    setSelectedLevel(null);
    setCurrentView("paths");
    setShowResetConfirm(false);
    // Clear old localStorage keys too
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("skill-builder-")) {
        localStorage.removeItem(key);
      }
    });
  };

  const selectedPath = paths.find((p) => p.id === selectedPathId);
  const selectedProject = selectedPath?.levels.find(
    (l) => l.level === selectedLevel
  );

  const getCompletedStepsForLevel = (pathId: string, level: string): number[] => {
    return progress.completedSteps[`${pathId}-${level}`] || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & breadcrumb */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
                title="Back to Portfolio"
              >
                <Home className="w-4 h-4" />
              </Link>
              <span className="text-slate-300">/</span>
              <button
                onClick={handleBackToPaths}
                className="flex items-center gap-2 font-semibold text-slate-900"
              >
                <BookOpen className="w-5 h-5 text-purple-600" />
                <span className="hidden sm:inline">Skill Builder</span>
              </button>
              {selectedPath && currentView !== "paths" && currentView !== "dashboard" && (
                <>
                  <span className="text-slate-300">/</span>
                  <button
                    onClick={() => setCurrentView("roadmap")}
                    className="text-sm text-slate-500 hover:text-slate-900 transition-colors truncate max-w-[120px] sm:max-w-none"
                  >
                    {selectedPath.title}
                  </button>
                </>
              )}
              {selectedProject && currentView === "guide" && (
                <>
                  <span className="text-slate-300 hidden sm:inline">/</span>
                  <span className="text-sm text-purple-600 font-medium hidden sm:inline truncate max-w-[150px]">
                    {selectedProject.title}
                  </span>
                </>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Streak badge */}
              {progress.streak > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-700">
                    {progress.streak}
                  </span>
                </div>
              )}

              {/* Progress pill */}
              <button
                onClick={() => setCurrentView("dashboard")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors"
                title="View progress dashboard"
              >
                <BarChart3 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-700">
                  {stats.overallProgress}%
                </span>
              </button>

              {/* Search */}
              <button
                onClick={() => {
                  setShowSearch(!showSearch);
                  if (currentView !== "paths") {
                    handleBackToPaths();
                  }
                }}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Search paths & skills"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Reset */}
              <button
                onClick={() => setShowResetConfirm(true)}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Reset all progress"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar (expandable) */}
            {showSearch && (
              <div
                className="overflow-hidden pb-3"
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search paths, skills, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
        </div>
      </header>

      {/* Quick Stats Bar */}
      {currentView === "paths" && (
        <div
          className="bg-white border-b border-slate-100"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-center gap-6 sm:gap-10 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{stats.totalPaths}</p>
                  <p className="text-xs text-slate-500">Paths</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {stats.completedLevels}/{stats.totalLevels}
                  </p>
                  <p className="text-xs text-slate-500">Projects</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{stats.streak}</p>
                  <p className="text-xs text-slate-500">Day Streak</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {stats.totalTimeMinutes < 60
                      ? `${stats.totalTimeMinutes}m`
                      : `${Math.floor(stats.totalTimeMinutes / 60)}h ${stats.totalTimeMinutes % 60}m`}
                  </p>
                  <p className="text-xs text-slate-500">Learning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowResetConfirm(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  Reset All Progress?
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  This will clear all your completed steps, projects, and streak
                  data. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetProgress}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Main Content */}
      <main className="pb-16">
          {currentView === "paths" && (
            <PathSelector
              key="paths"
              paths={paths.map((p) => ({
                id: p.id,
                title: p.title,
                description: p.description,
                icon: p.icon,
                estimatedTime: p.estimatedTime,
                levelCount: p.levels.length,
                skills: p.levels.flatMap((l) => l.skills || []).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6),
                completedLevels: (progress.completedLevels[p.id] || []).length,
                totalSteps: p.levels.reduce((acc, l) => acc + l.steps.length, 0),
                completedSteps: p.levels.reduce((acc, l) => {
                  const key = `${p.id}-${l.level}`;
                  return acc + (progress.completedSteps[key] || []).length;
                }, 0),
              }))}
              filteredPaths={filteredPaths.map((p) => p.id)}
              searchQuery={searchQuery}
              onSelectPath={handleSelectPath}
            />
          )}

          {currentView === "roadmap" && selectedPath && (
            <ProjectRoadmap
              key="roadmap"
              pathTitle={selectedPath.title}
              pathDescription={selectedPath.description}
              pathIcon={selectedPath.icon}
              projects={selectedPath.levels.map((l) => ({
                level: l.level,
                title: l.title,
                description: l.description,
                estimatedTime: l.estimatedTime,
                skills: l.skills || [],
                totalSteps: l.steps.length,
                completedSteps: getCompletedStepsForLevel(selectedPath.id, l.level).length,
              }))}
              currentLevel={progress.currentLevels[selectedPath.id] || null}
              completedLevels={progress.completedLevels[selectedPath.id] || []}
              onSelectProject={handleSelectProject}
              onBack={handleBackToPaths}
            />
          )}

          {currentView === "guide" && selectedProject && selectedPath && (
            <ProjectGuide
              key="guide"
              projectTitle={selectedProject.title}
              level={selectedLevel!}
              steps={selectedProject.steps}
              completedStepIds={getCompletedStepsForLevel(selectedPath.id, selectedLevel!)}
              onStepToggle={handleStepComplete}
              onComplete={handleCompleteProject}
              onBack={handleBackToRoadmap}
              pathId={selectedPathId!}
              projectLevel={selectedLevel!}
              skills={selectedProject.skills || []}
            />
          )}

          {currentView === "dashboard" && (
            <ProgressDashboard
              key="dashboard"
              stats={stats}
              paths={paths}
              progress={progress}
              onBack={handleBackToPaths}
              onSelectPath={handleSelectPath}
            />
          )}
      </main>
    </div>
  );
}
