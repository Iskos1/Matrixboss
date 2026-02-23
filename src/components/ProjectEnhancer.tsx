"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Lightbulb, Code2, FileText, Zap, Loader2 } from "lucide-react";

interface ProjectEnhancerProps {
  project: {
    title: string;
    description: string;
    tags: string[];
    link: string;
  };
}

interface Advice {
  visual_enhancements: string[];
  technical_deep_dive: string[];
  resume_improvements: string[];
  wow_factor: string;
}

export default function ProjectEnhancer({ project }: ProjectEnhancerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/projects/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project }),
      });

      if (!res.ok) throw new Error("Failed to fetch advice");

      const data = await res.json();
      setAdvice(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (!advice) {
      fetchAdvice();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 px-4 py-2 rounded-xl transition-all duration-300 border-2 border-purple-200 hover:border-purple-300 hover:shadow-md hover:scale-105"
      >
        <Sparkles size={16} className="animate-pulse" />
        Enhance with AI
      </button>

      <AnimatePresence mode="wait">
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b-2 border-slate-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">AI Project Enhancer</h3>
                    <p className="text-xs text-slate-500">Get personalized improvement suggestions</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-slate-400 hover:bg-white hover:text-slate-700 transition-all hover:scale-110"
                  aria-label="Close modal"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-white to-slate-50">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-purple-600 animate-spin" />
                      <div className="absolute inset-0 w-16 h-16 border-4 border-purple-200 rounded-full animate-ping" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-900 text-lg font-semibold mb-1">
                        Analyzing your project...
                      </p>
                      <p className="text-slate-500 text-sm">
                        &quot;{project.title}&quot;
                      </p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                      <X className="w-8 h-8 text-red-600" />
                    </div>
                    <p className="text-red-600 font-bold text-lg mb-2">Analysis Failed</p>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">{error}</p>
                    <button
                      onClick={fetchAdvice}
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all hover:shadow-lg"
                    >
                      <Sparkles size={16} />
                      Try Again
                    </button>
                  </div>
                ) : advice ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Wow Factor */}
                    <div className="relative overflow-hidden rounded-2xl">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 opacity-90" />
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-gradient" />
                      <div className="relative p-6 text-white">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Zap className="w-6 h-6 text-yellow-300" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-xl mb-2 flex items-center gap-2">
                              The &quot;Wow&quot; Factor
                              <Sparkles className="w-5 h-5 text-yellow-300" />
                            </h4>
                            <p className="text-white/95 leading-relaxed">
                              {advice.wow_factor}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {/* Visual Enhancements */}
                      <div className="group bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200/60 hover:border-orange-300 transition-all hover:shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-orange-500 rounded-lg">
                            <Lightbulb className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-bold text-orange-900 uppercase tracking-wider">Visual Value</h4>
                        </div>
                        <ul className="space-y-3">
                          {advice.visual_enhancements.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                              <span className="mt-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shrink-0 shadow-sm" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Technical Deep Dive */}
                      <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200/60 hover:border-blue-300 transition-all hover:shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Code2 className="w-5 h-5 text-white" />
                          </div>
                          <h4 className="font-bold text-blue-900 uppercase tracking-wider">Tech Deep Dive</h4>
                        </div>
                        <ul className="space-y-3">
                          {advice.technical_deep_dive.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                              <span className="mt-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 shrink-0 shadow-sm" />
                              <span className="leading-relaxed">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Resume Impact */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border-2 border-slate-200 hover:border-slate-300 transition-all hover:shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-slate-700 rounded-lg">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider">Resume Impact</h4>
                      </div>
                      <ul className="space-y-3">
                        {advice.resume_improvements.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                            <span className="mt-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 shrink-0 shadow-sm" />
                            <span className="leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : null}
              </div>

              {/* Footer */}
              {advice && !loading && !error && (
                <div className="px-6 py-4 border-t-2 border-slate-100 bg-slate-50 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    💡 Tip: Save these suggestions for your next portfolio update
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Got it!
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
