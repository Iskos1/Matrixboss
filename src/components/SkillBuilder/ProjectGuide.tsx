"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  Code,
  BookOpen,
  ExternalLink,
  Trophy,
  Copy,
  Check,
  StickyNote,
  ChevronDown,
  Keyboard,
  ArrowLeft,
  Clock,
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  content: string;
  codeSnippet?: string;
  resources?: Array<{ title: string; url: string }>;
}

interface ProjectGuideProps {
  projectTitle: string;
  level: string;
  steps: Step[];
  completedStepIds: number[];
  onStepToggle: (stepId: number) => void;
  onComplete: () => void;
  onBack: () => void;
  pathId: string;
  projectLevel: string;
  skills: string[];
}

const levelConfig = {
  easy: {
    label: "Beginner",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    gradient: "from-emerald-500 to-green-500",
  },
  medium: {
    label: "Intermediate",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    gradient: "from-amber-500 to-yellow-500",
  },
  hard: {
    label: "Advanced",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    gradient: "from-red-500 to-rose-500",
  },
};

export default function ProjectGuide({
  projectTitle,
  level,
  steps,
  completedStepIds,
  onStepToggle,
  onComplete,
  onBack,
  pathId,
  projectLevel,
  skills,
}: ProjectGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load notes from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`skill-notes-${pathId}-${projectLevel}`);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
  }, [pathId, projectLevel]);

  // Save notes
  useEffect(() => {
    localStorage.setItem(
      `skill-notes-${pathId}-${projectLevel}`,
      JSON.stringify(notes)
    );
  }, [notes, pathId, projectLevel]);

  // Load last step index
  useEffect(() => {
    const saved = localStorage.getItem(`skill-step-${pathId}-${projectLevel}`);
    if (saved) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx < steps.length) {
        setCurrentStepIndex(idx);
      }
    }
  }, [pathId, projectLevel, steps.length]);

  // Save current step index
  useEffect(() => {
    localStorage.setItem(
      `skill-step-${pathId}-${projectLevel}`,
      String(currentStepIndex)
    );
  }, [currentStepIndex, pathId, projectLevel]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case "ArrowRight":
        case "j":
          e.preventDefault();
          setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
          break;
        case "ArrowLeft":
        case "k":
          e.preventDefault();
          setCurrentStepIndex((prev) => Math.max(0, prev - 1));
          break;
        case "c":
          e.preventDefault();
          onStepToggle(steps[currentStepIndex].id);
          break;
        case "n":
          e.preventDefault();
          setShowNotes((v) => !v);
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts((v) => !v);
          break;
      }
    },
    [currentStepIndex, steps, onStepToggle]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Scroll to top when step changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStepIndex]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const progress = (completedStepIds.length / steps.length) * 100;
  const allStepsCompleted = completedStepIds.length === steps.length;
  const currentStep = steps[currentStepIndex];
  const config = levelConfig[level as keyof typeof levelConfig] || levelConfig.easy;

  // Format content: detect code blocks in content text
  const formatContent = (text: string) => {
    // Split by code blocks (```...```)
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).split("\n");
        const lang = lines[0]?.trim() || "";
        const code = (lang ? lines.slice(1) : lines).join("\n").trim();
        return (
          <div key={idx} className="relative group my-3">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-lg">
              <span className="text-xs text-slate-400 font-mono">
                {lang || "code"}
              </span>
              <button
                onClick={() => copyToClipboard(code)}
                className="text-slate-400 hover:text-white transition-colors"
                title="Copy code"
              >
                {copiedSnippet ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-b-lg overflow-x-auto text-sm leading-relaxed">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      // Regular text
      return (
        <span key={idx} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Header */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Back + Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Roadmap</span>
              </button>
              <span className="text-slate-300">|</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${config.bg} ${config.color} ${config.border} border shrink-0`}
              >
                {config.label}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {projectTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Keyboard shortcut hint */}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                title="Keyboard shortcuts"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>?</span>
              </button>

              {/* Notes toggle */}
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`p-1.5 rounded-lg transition-colors ${
                  showNotes
                    ? "bg-yellow-100 text-yellow-700"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
                title="Toggle notes (N)"
              >
                <StickyNote className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-100 rounded-full h-2">
              <div
                className={`bg-gradient-to-r ${config.gradient} h-2 rounded-full`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              {completedStepIds.length}/{steps.length} steps
            </span>
          </div>
        </div>
      </div>

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-purple-600" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-3">
              {[
                ["← / K", "Previous step"],
                ["→ / J", "Next step"],
                ["C", "Toggle step complete"],
                ["N", "Toggle notes"],
                ["?", "Show shortcuts"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{desc}</span>
                  <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Steps Sidebar */}
          <div
            className={`hidden lg:block shrink-0 transition-all duration-300 ${
              sidebarCollapsed ? "w-12" : "w-72"
            }`}
          >
            <div className="sticky top-40">
              {sidebarCollapsed ? (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h2 className="text-sm font-semibold text-slate-900">Steps</h2>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      title="Collapse sidebar"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-2 max-h-[60vh] overflow-y-auto">
                    {steps.map((step, index) => {
                      const isCompleted = completedStepIds.includes(step.id);
                      const isCurrent = index === currentStepIndex;

                      return (
                        <button
                          key={step.id}
                          onClick={() => setCurrentStepIndex(index)}
                          className={`w-full text-left p-3 rounded-xl transition-all mb-1 ${
                            isCurrent
                              ? "bg-purple-50 border border-purple-200"
                              : isCompleted
                              ? "bg-green-50/50 border border-transparent hover:border-green-200"
                              : "border border-transparent hover:bg-slate-50 hover:border-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                              ) : isCurrent ? (
                                <div className="w-4.5 h-4.5 rounded-full border-2 border-purple-500 bg-purple-100" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-slate-300" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`text-xs font-medium leading-tight block truncate ${
                                  isCurrent
                                    ? "text-purple-800"
                                    : isCompleted
                                    ? "text-green-800"
                                    : "text-slate-600"
                                }`}
                              >
                                {index + 1}. {step.title}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 min-w-0" ref={contentRef}>
            {/* Mobile step selector */}
            <div className="lg:hidden mb-4">
              <details className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <summary className="px-4 py-3 cursor-pointer flex items-center justify-between text-sm font-medium text-slate-700">
                  <span>
                    Step {currentStepIndex + 1} of {steps.length}:{" "}
                    {currentStep.title}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </summary>
                <div className="px-2 pb-2 border-t border-slate-100">
                  {steps.map((step, index) => {
                    const isCompleted = completedStepIds.includes(step.id);
                    const isCurrent = index === currentStepIndex;
                    return (
                      <button
                        key={step.id}
                        onClick={() => setCurrentStepIndex(index)}
                        className={`w-full text-left p-3 rounded-lg text-sm flex items-center gap-2 ${
                          isCurrent ? "bg-purple-50 text-purple-900" : "text-slate-600"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span className="truncate">
                          {index + 1}. {step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </details>
            </div>

            <div key={currentStepIndex}>
              {/* Step Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Step Header */}
                <div className="px-6 py-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-400 font-medium mb-1">
                        Step {currentStepIndex + 1} of {steps.length}
                      </p>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {currentStep.title}
                      </h2>
                      <p className="text-slate-500 mt-1 text-sm">
                        {currentStep.description}
                      </p>
                    </div>
                    <button
                      onClick={() => onStepToggle(currentStep.id)}
                      className={`shrink-0 p-2.5 rounded-xl transition-all duration-200 ${
                        completedStepIds.includes(currentStep.id)
                          ? "bg-green-100 text-green-600 hover:bg-green-200 ring-2 ring-green-200"
                          : "bg-slate-100 text-slate-400 hover:bg-purple-100 hover:text-purple-600"
                      }`}
                      title={
                        completedStepIds.includes(currentStep.id)
                          ? "Mark as incomplete (C)"
                          : "Mark as complete (C)"
                      }
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-5">
                  {/* Instructions */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-slate-900">
                        Instructions
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                      <div className="text-sm text-slate-700 leading-relaxed">
                        {formatContent(currentStep.content)}
                      </div>
                    </div>
                  </div>

                  {/* Code Snippet */}
                  {currentStep.codeSnippet && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4 text-purple-600" />
                          <span className="text-sm font-semibold text-slate-900">
                            Quick Reference Code
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(currentStep.codeSnippet || "")
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          {copiedSnippet ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="rounded-xl overflow-hidden border border-slate-800">
                        <pre className="bg-slate-900 text-slate-100 p-5 overflow-x-auto text-sm leading-relaxed">
                          <code>{currentStep.codeSnippet}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {currentStep.resources && currentStep.resources.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <ExternalLink className="w-4 h-4 text-purple-600" />
                        Resources
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {currentStep.resources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                              <ExternalLink className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="text-sm text-slate-700 font-medium group-hover:text-purple-700 transition-colors truncate">
                              {resource.title}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {showNotes && (
                    <div className="overflow-hidden">
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <StickyNote className="w-4 h-4 text-yellow-600" />
                          Your Notes
                        </h3>
                        <textarea
                          value={notes[currentStep.id] || ""}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [currentStep.id]: e.target.value,
                            }))
                          }
                          placeholder="Write your notes, observations, or reminders here..."
                          className="w-full p-4 rounded-xl border border-yellow-200 bg-yellow-50/50 text-sm text-slate-700 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent min-h-[120px]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() =>
                        setCurrentStepIndex(Math.max(0, currentStepIndex - 1))
                      }
                      disabled={currentStepIndex === 0}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {/* Step dots (mini) */}
                    <div className="hidden sm:flex items-center gap-1">
                      {steps.map((step, idx) => (
                        <button
                          key={step.id}
                          onClick={() => setCurrentStepIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentStepIndex
                              ? "w-6 bg-purple-600"
                              : completedStepIds.includes(step.id)
                              ? "bg-green-400"
                              : "bg-slate-300 hover:bg-slate-400"
                          }`}
                          title={`Step ${idx + 1}: ${step.title}`}
                        />
                      ))}
                    </div>

                    {currentStepIndex < steps.length - 1 ? (
                      <button
                        onClick={() => {
                          // Auto-mark current step as complete when moving forward
                          if (!completedStepIds.includes(currentStep.id)) {
                            onStepToggle(currentStep.id);
                          }
                          setCurrentStepIndex(
                            Math.min(steps.length - 1, currentStepIndex + 1)
                          );
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors shadow-sm"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!completedStepIds.includes(currentStep.id)) {
                            onStepToggle(currentStep.id);
                          }
                          if (allStepsCompleted || completedStepIds.length === steps.length - 1) {
                            onComplete();
                          }
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm ${
                          allStepsCompleted || completedStepIds.length >= steps.length - 1
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-slate-200 text-slate-500 cursor-not-allowed"
                        }`}
                        disabled={
                          !allStepsCompleted &&
                          completedStepIds.length < steps.length - 1
                        }
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Complete Project</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Completion Celebration */}
              {allStepsCompleted && (
                <div className="mt-6 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-8 text-white text-center shadow-lg shadow-green-200">
                  <div>
                    <Trophy className="w-16 h-16 mx-auto mb-4 drop-shadow-lg" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    🎉 Amazing Work!
                  </h3>
                  <p className="text-green-100 mb-2">
                    You&apos;ve completed all {steps.length} steps in this project!
                  </p>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={onComplete}
                    className="px-8 py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-green-50 transition-colors shadow-lg"
                  >
                    Mark Project Complete →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}