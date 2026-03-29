"use client";

import { useState, useEffect } from "react";
import { Target, Brain, RefreshCw, Save, XCircle, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Briefcase, BarChart2, FileText, Download, Trash2, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { isStaticDeployment, browserAnalyzeJob, browserInterviewPrep } from "@/lib/http/browser-api";

const JOBS_STORAGE_KEY = "jawad_portfolio_jobs";

const STAGES = [
  { id: "not_applied",  label: "Not Applied",   emoji: "📋", color: "bg-slate-100 text-slate-600 border-slate-300",      active: "bg-slate-700 text-white border-slate-700" },
  { id: "applied",      label: "Applied",        emoji: "📤", color: "bg-blue-50 text-blue-700 border-blue-300",           active: "bg-blue-600 text-white border-blue-600" },
  { id: "in_review",    label: "In Review",      emoji: "👀", color: "bg-indigo-50 text-indigo-700 border-indigo-300",     active: "bg-indigo-600 text-white border-indigo-600" },
  { id: "phone_screen", label: "Phone Screen",   emoji: "📞", color: "bg-purple-50 text-purple-700 border-purple-300",     active: "bg-purple-600 text-white border-purple-600" },
  { id: "interview",    label: "Interview",      emoji: "🤝", color: "bg-yellow-50 text-yellow-800 border-yellow-300",     active: "bg-yellow-500 text-white border-yellow-500" },
  { id: "final_round",  label: "Final Round",    emoji: "🏆", color: "bg-orange-50 text-orange-700 border-orange-300",     active: "bg-orange-500 text-white border-orange-500" },
  { id: "offer",        label: "Offer! 🎉",      emoji: "✅", color: "bg-green-50 text-green-700 border-green-300",        active: "bg-green-600 text-white border-green-600" },
  { id: "declined",     label: "Declined",       emoji: "❌", color: "bg-red-50 text-red-700 border-red-300",              active: "bg-red-600 text-white border-red-600" },
  { id: "withdrawn",    label: "Withdrawn",      emoji: "↩️", color: "bg-slate-50 text-slate-500 border-slate-200",        active: "bg-slate-500 text-white border-slate-500" },
];

const getStage = (id: string) => STAGES.find(s => s.id === id) || STAGES[0];

interface JobTrackerTabProps {
  portfolioData: any;
  savedApplications: any[];
  onApplicationsChange: (apps: any[]) => void;
  onReTailor: (jd: string, company: string, role: string) => void;
}

export default function JobTrackerTab({ portfolioData, savedApplications, onApplicationsChange, onReTailor }: JobTrackerTabProps) {
  const [jobTrackerJD, setJobTrackerJD] = useState("");
  const [jobTrackerCompany, setJobTrackerCompany] = useState("");
  const [jobTrackerRole, setJobTrackerRole] = useState("");
  const [analyzingJob, setAnalyzingJob] = useState(false);
  const [jobAnalysisResult, setJobAnalysisResult] = useState<any>(null);
  const [jobAnalysisError, setJobAnalysisError] = useState<string | null>(null);
  const [savingApplication, setSavingApplication] = useState(false);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [jdOpenId, setJdOpenId] = useState<string | null>(null);
  const [runningCompatibilityId, setRunningCompatibilityId] = useState<string | null>(null);
  const [appPdfPreview, setAppPdfPreview] = useState<string | null>(null);
  const [qaInputs, setQaInputs] = useState<Record<string, string>>({});
  const [qaLoadingId, setQaLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSavedApplications = async () => {
    setLoadingApplications(true);
    try {
      if (isStaticDeployment()) {
        const stored = localStorage.getItem(JOBS_STORAGE_KEY);
        onApplicationsChange(stored ? JSON.parse(stored) : []);
      } else {
        const res = await fetch("/api/jobs");
        const data = await res.json();
        onApplicationsChange(data.applications || []);
      }
    } catch {
      try {
        const stored = localStorage.getItem(JOBS_STORAGE_KEY);
        onApplicationsChange(stored ? JSON.parse(stored) : []);
      } catch { /* give up */ }
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleAnalyzeJob = async (saveAfter: boolean) => {
    if (!jobTrackerJD.trim()) { alert("Please paste a job description first"); return; }
    setAnalyzingJob(true); setJobAnalysisResult(null); setJobAnalysisError(null);
    try {
      let analysis: any;
      if (isStaticDeployment()) {
        analysis = await browserAnalyzeJob(jobTrackerJD, portfolioData);
      } else {
        const res = await fetch("/api/jobs/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobDescription: jobTrackerJD }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        analysis = data.analysis;
      }
      setJobAnalysisResult(analysis);

      if (saveAfter) {
        setSavingApplication(true);
        const newApp = { id: `app_${Date.now()}`, company: jobTrackerCompany || "Unknown Company", role: jobTrackerRole || "Unknown Role", jobDescription: jobTrackerJD, compatibilityScore: analysis.compatibilityScore, analysis, createdAt: new Date().toISOString() };
        if (isStaticDeployment()) {
          const stored = localStorage.getItem(JOBS_STORAGE_KEY);
          const apps = stored ? JSON.parse(stored) : [];
          apps.unshift(newApp);
          localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(apps));
          onApplicationsChange(apps);
        } else {
          await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company: newApp.company, role: newApp.role, jobDescription: jobTrackerJD, compatibilityScore: analysis.compatibilityScore, analysis }) });
          await fetchSavedApplications();
        }
        setSavingApplication(false);
        setJobTrackerJD(""); setJobTrackerCompany(""); setJobTrackerRole("");
      }
    } catch (err: any) {
      setJobAnalysisError(err.message || "An unexpected error occurred");
    } finally {
      setAnalyzingJob(false); setSavingApplication(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Delete this saved application?")) return;
    try {
      if (isStaticDeployment()) {
        const stored = localStorage.getItem(JOBS_STORAGE_KEY);
        const apps = (stored ? JSON.parse(stored) : []).filter((a: any) => a.id !== id);
        localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(apps));
        onApplicationsChange(apps);
      } else {
        await fetch(`/api/jobs?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        await fetchSavedApplications();
      }
      if (expandedAppId === id) setExpandedAppId(null);
    } catch (e) { console.error("Delete failed:", e); }
  };

  const handleClearAllApplications = async () => {
    if (!confirm(`Remove all ${savedApplications.length} application${savedApplications.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;
    try {
      if (isStaticDeployment()) {
        localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify([]));
        onApplicationsChange([]);
      } else {
        await Promise.all(savedApplications.map((app: any) => fetch(`/api/jobs?id=${encodeURIComponent(app.id)}`, { method: "DELETE" })));
        await fetchSavedApplications();
      }
      setExpandedAppId(null);
    } catch (e) { console.error("Clear all failed:", e); }
  };

  const handleUpdateApplication = async (id: string, updates: Record<string, any>) => {
    try {
      if (isStaticDeployment()) {
        const stored = localStorage.getItem(JOBS_STORAGE_KEY);
        const apps = (stored ? JSON.parse(stored) : []).map((a: any) => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a);
        localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(apps));
        onApplicationsChange(apps);
      } else {
        const res = await fetch("/api/jobs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
        if (res.ok) {
          onApplicationsChange(savedApplications.map(app => app.id === id ? { ...app, ...updates, updatedAt: new Date().toISOString() } : app));
        }
      }
    } catch (e) { console.error("Update failed:", e); }
  };

  const handleRunCompatibilityTest = async (app: any) => {
    if (!app.jobDescription?.trim()) { alert("No job description saved."); return; }
    setRunningCompatibilityId(app.id);
    try {
      let analysis: any;
      if (isStaticDeployment()) analysis = await browserAnalyzeJob(app.jobDescription, portfolioData);
      else {
        const res = await fetch("/api/jobs/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobDescription: app.jobDescription }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Analysis failed");
        analysis = data.analysis;
      }
      await handleUpdateApplication(app.id, { compatibilityScore: analysis.compatibilityScore, analysis });
    } catch (err: any) { alert(`Compatibility test failed: ${err.message}`); }
    finally { setRunningCompatibilityId(null); }
  };

  const handleGenerateApplicationResponse = async (app: any) => {
    const question = qaInputs[app.id]?.trim();
    if (!question) return;
    setQaLoadingId(app.id);
    try {
      let answer: string;
      if (isStaticDeployment()) {
        answer = await browserInterviewPrep(question, app.jobDescription, app.company, app.role, app.analysis, portfolioData);
      } else {
        const res = await fetch("/api/jobs/interview-prep", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, jobDescription: app.jobDescription, company: app.company, role: app.role, analysis: app.analysis }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate response");
        answer = data.answer;
      }
      const newEntry = { q: question, a: answer, createdAt: new Date().toISOString() };
      await handleUpdateApplication(app.id, { qaHistory: [newEntry, ...(app.qaHistory || [])] });
      setQaInputs(prev => ({ ...prev, [app.id]: "" }));
    } catch (err: any) { alert(`Failed: ${err.message}`); }
    finally { setQaLoadingId(null); }
  };

  const filteredApps = appStatusFilter === "all" ? savedApplications : savedApplications.filter(a => (a.applicationStatus || "not_applied") === appStatusFilter);
  const statusCounts: Record<string, number> = { all: savedApplications.length };
  for (const app of savedApplications) {
    const s = app.applicationStatus || "not_applied";
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-3"><Target className="w-8 h-8" /><h2 className="text-3xl font-bold">Job Application Tracker</h2></div>
        <p className="text-rose-100 text-lg">Paste any job description and get a brutally honest AI analysis of how competitive you are.</p>
      </div>

      {/* Analyzer Form */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white">
          <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-rose-400" /><h3 className="text-lg font-bold">Analyze a Job Description</h3></div>
          <p className="text-slate-400 text-sm mt-1">The AI will compare this job against your full resume and give a critical, honest assessment.</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
              <input type="text" placeholder="e.g. Google, McKinsey" value={jobTrackerCompany} onChange={(e) => setJobTrackerCompany(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Role / Job Title</label>
              <input type="text" placeholder="e.g. Software Engineer" value={jobTrackerRole} onChange={(e) => setJobTrackerRole(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Job Description *</label>
            <textarea placeholder="Paste the full job description here..." value={jobTrackerJD} onChange={(e) => setJobTrackerJD(e.target.value)} rows={10} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-rose-500 resize-none" />
            <p className="text-xs text-slate-400 mt-1">{jobTrackerJD.length} characters</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => handleAnalyzeJob(false)} disabled={analyzingJob || !jobTrackerJD.trim()} className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-700 transition disabled:opacity-50">
              {analyzingJob ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}{analyzingJob ? "Analyzing…" : "Analyze Only"}
            </button>
            <button onClick={() => handleAnalyzeJob(true)} disabled={analyzingJob || !jobTrackerJD.trim()} className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-rose-700 hover:to-pink-700 transition disabled:opacity-50 shadow-lg">
              {analyzingJob ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{analyzingJob ? (savingApplication ? "Saving…" : "Analyzing…") : "Analyze & Save"}
            </button>
            {jobAnalysisResult && (
              <button onClick={() => { setJobAnalysisResult(null); setJobAnalysisError(null); }} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-200 transition">
                <RefreshCw className="w-4 h-4" />Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {jobAnalysisError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-semibold flex items-center gap-2"><XCircle className="w-4 h-4" /> Analysis Failed</p>
          <p className="text-red-600 text-sm mt-1">{jobAnalysisError}</p>
        </div>
      )}

      {/* Analysis Result Card */}
      {jobAnalysisResult && (() => {
        const r = jobAnalysisResult;
        const score = r.compatibilityScore ?? 0;
        const scoreColor = score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
        const scoreBg = score >= 75 ? "bg-green-50 border-green-300" : score >= 50 ? "bg-yellow-50 border-yellow-300" : "bg-red-50 border-red-300";
        const scoreRing = score >= 75 ? "stroke-green-500" : score >= 50 ? "stroke-yellow-500" : "stroke-red-500";
        const circumference = 2 * Math.PI * 40;
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className={`p-5 border-b ${scoreBg}`}>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="none" className={scoreRing} strokeWidth="10" strokeDasharray={circumference} strokeDashoffset={circumference - (score / 100) * circumference} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-2xl font-black ${scoreColor}`}>{score}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>
                <div>
                  <p className={`text-xl font-black ${scoreColor}`}>{r.compatibilityLabel}</p>
                  <p className="text-slate-500 text-sm">{r.summary}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1"><Briefcase className="w-3 h-3" /> {r.industry}</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">{r.roleType}</span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">{r.seniorityLevel}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-900 rounded-xl p-5 text-white">
                <h4 className="font-bold text-rose-400 flex items-center gap-2 mb-2"><Brain className="w-4 h-4" /> AI Critical Verdict</h4>
                <p className="text-slate-200 text-sm leading-relaxed">{r.criticalVerdict}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-green-600" />Skills You Have ({r.presentSkills?.length || 0})</h4>
                  <div className="flex flex-wrap gap-2">
                    {r.presentSkills?.map((s: string, i: number) => <span key={i} className="text-xs bg-green-100 text-green-800 border border-green-300 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {s}</span>)}
                    {(!r.presentSkills || !r.presentSkills.length) && <p className="text-sm text-slate-400 italic">No matching skills found</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4 text-red-600" />Skills You&apos;re Missing ({r.missingSkills?.length || 0})</h4>
                  <div className="space-y-2">
                    {r.missingSkills?.map((ms: any, i: number) => (
                      <div key={i} className={`rounded-lg p-2.5 text-xs border flex items-start gap-2 ${ms.importance === "critical" ? "bg-red-50 border-red-200" : ms.importance === "important" ? "bg-orange-50 border-orange-200" : "bg-yellow-50 border-yellow-200"}`}>
                        <span className={`font-black uppercase text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${ms.importance === "critical" ? "bg-red-200 text-red-800" : ms.importance === "important" ? "bg-orange-200 text-orange-800" : "bg-yellow-200 text-yellow-800"}`}>{ms.importance === "nice-to-have" ? "NICE" : ms.importance?.toUpperCase()}</span>
                        <div><p className="font-bold text-slate-800">{ms.skill}</p><p className="text-slate-600 mt-0.5">{ms.reason}</p></div>
                      </div>
                    ))}
                    {(!r.missingSkills || !r.missingSkills.length) && <p className="text-sm text-green-600 font-semibold">✓ No critical skill gaps!</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Application Pipeline */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-rose-400" /><h3 className="text-lg font-bold">Application Pipeline</h3>
            <span className="ml-2 text-xs bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-semibold">{savedApplications.length} total</span>
          </div>
          <div className="flex items-center gap-3">
            {savedApplications.length > 0 && (
              <button onClick={handleClearAllApplications} className="flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/20 hover:bg-rose-500/40 border border-rose-500/30 px-2.5 py-1 rounded-lg transition" title="Remove all">
                <Trash2 className="w-3.5 h-3.5" />Empty All
              </button>
            )}
            <button onClick={fetchSavedApplications} disabled={loadingApplications} className="text-slate-300 hover:text-white transition" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loadingApplications ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {savedApplications.length > 0 && (
          <div className="border-b border-slate-100 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setAppStatusFilter("all")} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${appStatusFilter === "all" ? "bg-slate-800 text-white border-slate-800" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
              All ({savedApplications.length})
            </button>
            {STAGES.filter(s => statusCounts[s.id]).map(stage => (
              <button key={stage.id} onClick={() => setAppStatusFilter(stage.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1 ${appStatusFilter === stage.id ? stage.active : stage.color}`}>
                {stage.emoji} {stage.label} ({statusCounts[stage.id] || 0})
              </button>
            ))}
          </div>
        )}

        {savedApplications.length === 0 ? (
          <div className="p-10 text-center"><Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-500 font-semibold">No applications saved yet</p><p className="text-slate-400 text-sm mt-1">Paste a job above and click &quot;Analyze &amp; Save&quot; to start tracking.</p></div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 text-center"><p className="text-slate-400 text-sm">No applications with this status.</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredApps.map((app) => {
              const score = app.compatibilityScore ?? 0;
              const scoreColor = score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
              const scoreRingColor = score >= 75 ? "stroke-green-500" : score >= 50 ? "stroke-yellow-500" : "stroke-red-500";
              const isExpanded = expandedAppId === app.id;
              const isJdOpen = jdOpenId === app.id;
              const stage = getStage(app.applicationStatus || "not_applied");
              const circumference = 2 * Math.PI * 18;

              return (
                <div key={app.id} className="group">
                  <div className="p-4 flex items-center gap-3 hover:bg-slate-50/80 transition">
                    <div className="flex-shrink-0 relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 44 44">
                        <circle cx="22" cy="22" r="18" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                        <circle cx="22" cy="22" r="18" fill="none" className={scoreRingColor} strokeWidth="5" strokeDasharray={circumference} strokeDashoffset={circumference - (score / 100) * circumference} strokeLinecap="round" />
                      </svg>
                      <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${scoreColor}`}>{score}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900 text-sm truncate">{app.company}</p>
                        <span className="text-slate-300 text-sm">·</span>
                        <p className="text-slate-600 text-sm truncate max-w-[200px]">{app.role}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${stage.active}`}>{stage.emoji} {stage.label}</span>
                        {app.analysis?.industry && <span className="text-[11px] text-slate-400">{app.analysis.industry}</span>}
                        <span className="text-[11px] text-slate-300">{new Date(app.savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {app.resumeFilename?.endsWith(".pdf") && (
                        <button onClick={() => { if (!isExpanded) setExpandedAppId(app.id); setAppPdfPreview(appPdfPreview === `${app.id}:resume` ? null : `${app.id}:resume`); }} className={`p-1.5 rounded-lg transition ${appPdfPreview === `${app.id}:resume` ? "text-green-700 bg-green-50" : "text-slate-400 hover:text-green-700 hover:bg-green-50"}`} title="View Resume PDF"><FileText className="w-4 h-4" /></button>
                      )}
                      {app.coverLetterFilename?.endsWith(".pdf") && (
                        <button onClick={() => { if (!isExpanded) setExpandedAppId(app.id); setAppPdfPreview(appPdfPreview === `${app.id}:coverletter` ? null : `${app.id}:coverletter`); }} className={`p-1.5 rounded-lg transition ${appPdfPreview === `${app.id}:coverletter` ? "text-blue-700 bg-blue-50" : "text-slate-400 hover:text-blue-700 hover:bg-blue-50"}`} title="View Cover Letter PDF"><Download className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => { setExpandedAppId(isExpanded ? null : app.id); if (isExpanded) setAppPdfPreview(null); }} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleDeleteApplication(app.id)} className="p-1.5 rounded-lg text-slate-200 hover:text-red-600 hover:bg-red-50 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-5 space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Company</label>
                          <input type="text" defaultValue={app.company} onBlur={(e) => { if (e.target.value !== app.company) handleUpdateApplication(app.id, { company: e.target.value }); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-rose-400" />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Role</label>
                          <input type="text" defaultValue={app.role} onBlur={(e) => { if (e.target.value !== app.role) handleUpdateApplication(app.id, { role: e.target.value }); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-rose-400" />
                        </div>
                      </div>

                      {/* Stage Pipeline */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Application Stage</label>
                        <div className="flex flex-wrap gap-2">
                          {STAGES.map(s => {
                            const isCurrent = (app.applicationStatus || "not_applied") === s.id;
                            return (
                              <button key={s.id} onClick={() => handleUpdateApplication(app.id, { applicationStatus: s.id })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${isCurrent ? s.active : s.color}`}>
                                {s.emoji} {s.label}{isCurrent && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Compatibility Test */}
                      {(() => {
                        const isRunning = runningCompatibilityId === app.id;
                        const score = app.compatibilityScore ?? null;
                        const scoreColor = score === null ? "text-slate-400" : score >= 75 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
                        const scoreBg = score === null ? "bg-slate-50 border-slate-200" : score >= 75 ? "bg-green-50 border-green-200" : score >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200";
                        const scoreRing = score === null ? "stroke-slate-300" : score >= 75 ? "stroke-green-500" : score >= 50 ? "stroke-yellow-500" : "stroke-red-500";
                        const circ = 2 * Math.PI * 30;
                        return (
                          <div className={`rounded-xl border p-4 ${scoreBg}`}>
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 flex-shrink-0">
                                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
                                    <circle cx="36" cy="36" r="30" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                    <circle cx="36" cy="36" r="30" fill="none" className={scoreRing} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={isRunning ? circ * 0.25 : score !== null ? circ - (score / 100) * circ : circ} strokeLinecap="round" style={isRunning ? { animation: "spin 1s linear infinite", transformOrigin: "center" } : {}} />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    {isRunning ? <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" /> : score !== null ? <><span className={`text-lg font-black leading-none ${scoreColor}`}>{score}</span><span className="text-[9px] text-slate-400">/100</span></> : <span className="text-[10px] text-slate-400 font-bold text-center">No Score</span>}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-0.5">Compatibility Test</p>
                                  {isRunning ? <p className="text-sm font-semibold text-slate-600 animate-pulse">Running analysis…</p> : score !== null ? <><p className={`text-base font-black ${scoreColor}`}>{app.analysis?.compatibilityLabel || (score >= 75 ? "Strong Match" : score >= 50 ? "Partial Match" : "Weak Match")}</p>{app.analysis?.summary && <p className="text-xs text-slate-500 mt-0.5 max-w-xs">{app.analysis.summary}</p>}</> : <p className="text-sm text-slate-400">No score yet.</p>}
                                </div>
                              </div>
                              <button onClick={() => handleRunCompatibilityTest(app)} disabled={isRunning} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-violet-700 hover:to-purple-700 transition disabled:opacity-50 shadow-sm flex-shrink-0">
                                {isRunning ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Analyzing…</> : <><Brain className="w-3.5 h-3.5" />{score !== null ? "Re-run Test" : "Run Test"}</>}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Documents */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Tailored Documents</label>
                        <div className="flex flex-wrap gap-2">
                          {app.resumeFilename ? (
                            app.resumeFilename.endsWith(".pdf") ? (
                              <button onClick={() => setAppPdfPreview(appPdfPreview === `${app.id}:resume` ? null : `${app.id}:resume`)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm ${appPdfPreview === `${app.id}:resume` ? "bg-green-800 text-white" : "bg-green-600 text-white hover:bg-green-700"}`}>
                                <FileText className="w-4 h-4" />{appPdfPreview === `${app.id}:resume` ? "✕ Close Resume" : "📄 View Resume PDF"}
                              </button>
                            ) : (
                              <a href={`/api/resume/download/?file=${encodeURIComponent(app.resumeFilename)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-sm"><FileText className="w-4 h-4" />📄 Download Resume</a>
                            )
                          ) : (
                            <span className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 rounded-lg text-sm border border-slate-200"><FileText className="w-4 h-4" />No Resume Saved</span>
                          )}
                          {app.coverLetterFilename ? (
                            app.coverLetterFilename.endsWith(".pdf") ? (
                              <button onClick={() => setAppPdfPreview(appPdfPreview === `${app.id}:coverletter` ? null : `${app.id}:coverletter`)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm ${appPdfPreview === `${app.id}:coverletter` ? "bg-blue-800 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                                <Download className="w-4 h-4" />{appPdfPreview === `${app.id}:coverletter` ? "✕ Close Cover Letter" : "📝 View Cover Letter PDF"}
                              </button>
                            ) : (
                              <a href={`/api/resume/download/?file=${encodeURIComponent(app.coverLetterFilename)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"><Download className="w-4 h-4" />📝 Download Cover Letter</a>
                            )
                          ) : (
                            <span className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 rounded-lg text-sm border border-slate-200"><Download className="w-4 h-4" />No Cover Letter Saved</span>
                          )}
                          <button onClick={() => onReTailor(app.jobDescription || "", app.company || "", app.role || "")} className="flex items-center gap-2 px-4 py-2.5 bg-violet-100 text-violet-800 rounded-lg text-sm font-semibold hover:bg-violet-200 transition border border-violet-300">🔄 Re-tailor Resume</button>
                        </div>

                        {appPdfPreview === `${app.id}:resume` && app.resumeFilename?.endsWith(".pdf") && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> Resume Preview</p>
                              <a href={`/api/resume/download/?file=${encodeURIComponent(app.resumeFilename)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:text-green-900 underline font-semibold">Open in new tab ↗</a>
                            </div>
                            <div className="border-2 border-green-200 rounded-xl overflow-hidden bg-slate-100 shadow">
                              <iframe src={`/api/resume/download/?file=${encodeURIComponent(app.resumeFilename)}&t=${Date.now()}#view=FitH`} className="w-full h-[600px]" title="Resume PDF" />
                            </div>
                          </div>
                        )}
                        {appPdfPreview === `${app.id}:coverletter` && app.coverLetterFilename?.endsWith(".pdf") && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Cover Letter Preview</p>
                              <a href={`/api/resume/download/?file=${encodeURIComponent(app.coverLetterFilename)}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 hover:text-blue-900 underline font-semibold">Open in new tab ↗</a>
                            </div>
                            <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-slate-100 shadow">
                              <iframe src={`/api/resume/download/?file=${encodeURIComponent(app.coverLetterFilename)}&t=${Date.now()}#view=FitH`} className="w-full h-[600px]" title="Cover Letter PDF" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Verdict */}
                      {app.analysis?.criticalVerdict && (
                        <div className="bg-slate-900 rounded-xl p-4 text-white">
                          <p className="text-[11px] font-bold text-rose-400 uppercase mb-1.5 flex items-center gap-1"><Brain className="w-3 h-3" /> AI Verdict</p>
                          <p className="text-slate-200 text-sm leading-relaxed">{app.analysis.criticalVerdict}</p>
                        </div>
                      )}

                      {/* Skills */}
                      {app.analysis && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Matching Skills</label>
                            <div className="flex flex-wrap gap-1.5">
                              {app.analysis.presentSkills?.map((s: string, i: number) => <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium border border-green-200">{s}</span>)}
                              {!app.analysis.presentSkills?.length && <p className="text-xs text-slate-400 italic">None identified</p>}
                            </div>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Missing Skills</label>
                            <div className="flex flex-wrap gap-1.5">
                              {app.analysis.missingSkills?.map((ms: any, i: number) => <span key={i} title={ms.reason} className={`text-xs px-2 py-0.5 rounded-full font-medium border ${ms.importance === "critical" ? "bg-red-100 text-red-800 border-red-200" : ms.importance === "important" ? "bg-orange-100 text-orange-800 border-orange-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"}`}>{ms.skill}</span>)}
                              {!app.analysis.missingSkills?.length && <p className="text-xs text-green-600 font-semibold">✓ No gaps</p>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* JD Viewer */}
                      <div>
                        <button onClick={() => setJdOpenId(isJdOpen ? null : app.id)} className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wide hover:text-slate-700 transition">
                          {isJdOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}{isJdOpen ? "Hide" : "View"} Full Job Description
                        </button>
                        {isJdOpen && <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 max-h-72 overflow-y-auto"><pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{app.jobDescription}</pre></div>}
                      </div>

                      {/* Q&A */}
                      {(() => {
                        const isGenerating = qaLoadingId === app.id;
                        const history: any[] = app.qaHistory || [];
                        const currentInput = qaInputs[app.id] || "";
                        return (
                          <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden">
                            <div className="bg-gradient-to-r from-violet-700 to-purple-700 px-4 py-3 flex items-center gap-2">
                              <Brain className="w-4 h-4 text-violet-200" />
                              <div><p className="text-white font-bold text-sm">Application Q&amp;A Assistant</p><p className="text-violet-200 text-[11px]">Paste any question — AI answers using your real background</p></div>
                            </div>
                            <div className="p-4 space-y-3">
                              <div>
                                <label className="text-[11px] font-bold text-violet-700 uppercase tracking-wide mb-1.5 block">Application Question</label>
                                <textarea rows={3} value={currentInput} onChange={(e) => setQaInputs(prev => ({ ...prev, [app.id]: e.target.value }))} placeholder={`e.g. "Why do you want to work at ${app.company}?"`} disabled={isGenerating} className="w-full border border-violet-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-violet-400 resize-none placeholder:text-slate-300 disabled:opacity-60" />
                              </div>
                              <button onClick={() => handleGenerateApplicationResponse(app)} disabled={isGenerating || !currentInput.trim()} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:from-violet-700 hover:to-purple-700 transition disabled:opacity-50 shadow-sm">
                                {isGenerating ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Crafting response…</> : <><Sparkles className="w-3.5 h-3.5" />Generate Response</>}
                              </button>
                              {history.length > 0 && (
                                <div className="space-y-3 pt-1">
                                  <p className="text-[11px] font-bold text-violet-700 uppercase tracking-wide">{history.length} saved response{history.length !== 1 ? "s" : ""}</p>
                                  {history.map((entry: any, i: number) => (
                                    <div key={i} className="bg-white rounded-xl border border-violet-100 overflow-hidden shadow-sm">
                                      <div className="px-4 py-2.5 border-b border-violet-50 flex items-start gap-2"><span className="text-violet-400 font-black text-xs mt-0.5 flex-shrink-0">Q</span><p className="text-slate-700 text-sm font-semibold leading-snug">{entry.q}</p></div>
                                      <div className="px-4 py-3">
                                        <div className="flex items-start gap-2"><span className="text-green-500 font-black text-xs mt-0.5 flex-shrink-0">A</span><p className="text-slate-700 text-sm leading-relaxed flex-1 whitespace-pre-wrap">{entry.a}</p></div>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
                                          <span className="text-[10px] text-slate-300">{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                                          <div className="flex items-center gap-1.5">
                                            <button onClick={() => navigator.clipboard.writeText(entry.a)} className="text-[11px] text-slate-400 hover:text-violet-600 font-semibold flex items-center gap-1 transition px-2 py-1 rounded hover:bg-violet-50"><FileText className="w-3 h-3" /> Copy</button>
                                            <button onClick={() => handleUpdateApplication(app.id, { qaHistory: history.filter((_: any, idx: number) => idx !== i) })} className="text-[11px] text-slate-300 hover:text-red-500 font-semibold flex items-center gap-1 transition px-2 py-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /> Delete</button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Notes */}
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Notes / Reminders</label>
                        <textarea rows={3} defaultValue={app.notes || ""} placeholder="e.g. Interviewer: John Smith · Follow up by March 1" onBlur={(e) => { if (e.target.value !== (app.notes || "")) handleUpdateApplication(app.id, { notes: e.target.value }); }} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-rose-400 resize-none placeholder:text-slate-300" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aggregate Skill Gap Overview */}
      {savedApplications.length >= 2 && (() => {
        const skillTally: Record<string, { count: number; criticalCount: number }> = {};
        const industryTally: Record<string, number> = {};
        let totalScore = 0, totalWithScore = 0;
        for (const app of savedApplications) {
          if (app.compatibilityScore != null) { totalScore += app.compatibilityScore; totalWithScore++; }
          if (app.analysis?.industry) industryTally[app.analysis.industry] = (industryTally[app.analysis.industry] || 0) + 1;
          for (const ms of (app.analysis?.missingSkills || [])) {
            if (!skillTally[ms.skill]) skillTally[ms.skill] = { count: 0, criticalCount: 0 };
            skillTally[ms.skill].count++;
            if (ms.importance === "critical") skillTally[ms.skill].criticalCount++;
          }
        }
        const avgScore = totalWithScore > 0 ? Math.round(totalScore / totalWithScore) : 0;
        const topMissing = Object.entries(skillTally).sort((a, b) => b[1].count - a[1].count || b[1].criticalCount - a[1].criticalCount).slice(0, 15);
        const topIndustries = Object.entries(industryTally).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const avgColor = avgScore >= 75 ? "text-green-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600";
        const avgBg = avgScore >= 75 ? "bg-green-50 border-green-300" : avgScore >= 50 ? "bg-yellow-50 border-yellow-300" : "bg-red-50 border-red-300";
        return (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-5 text-white">
              <div className="flex items-center gap-2"><BarChart2 className="w-5 h-5 text-indigo-200" /><h3 className="text-lg font-bold">Skill Gap Overview</h3><span className="text-xs text-indigo-300 ml-1">across {savedApplications.length} tracked applications</span></div>
              <p className="text-indigo-200 text-sm mt-1">Your recurring weak spots across jobs you&apos;ve applied for.</p>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-xl p-4 border text-center ${avgBg}`}><p className={`text-3xl font-black ${avgColor}`}>{avgScore}</p><p className="text-xs text-slate-500 font-semibold mt-1">Avg. Compatibility</p></div>
                <div className="rounded-xl p-4 border border-slate-200 bg-slate-50 text-center"><p className="text-3xl font-black text-slate-800">{savedApplications.length}</p><p className="text-xs text-slate-500 font-semibold mt-1">Jobs Tracked</p></div>
                <div className="rounded-xl p-4 border border-red-200 bg-red-50 text-center"><p className="text-3xl font-black text-red-600">{Object.values(skillTally).filter(v => v.criticalCount > 0).length}</p><p className="text-xs text-slate-500 font-semibold mt-1">Critical Gaps</p></div>
                <div className="rounded-xl p-4 border border-purple-200 bg-purple-50 text-center"><p className="text-3xl font-black text-purple-600">{topIndustries.length}</p><p className="text-xs text-slate-500 font-semibold mt-1">Industries</p></div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4 text-red-600" /> Most Common Skill Gaps</h4>
                  <div className="space-y-2">
                    {topMissing.map(([skill, data], i) => (
                      <div key={skill} className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5 text-right">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-semibold text-slate-800 truncate">{skill}</span>
                            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                              {data.criticalCount > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">{data.criticalCount}× critical</span>}
                              <span className="text-xs text-slate-500 font-medium">{data.count}/{savedApplications.length}</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${data.criticalCount > 0 ? "bg-red-500" : "bg-orange-400"}`} style={{ width: `${(data.count / savedApplications.length) * 100}%` }} /></div>
                        </div>
                      </div>
                    ))}
                    {topMissing.length === 0 && <p className="text-slate-400 text-sm italic">Track more jobs to see patterns.</p>}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><Briefcase className="w-4 h-4 text-indigo-600" /> Industries You&apos;re Targeting</h4>
                  <div className="space-y-2">
                    {topIndustries.map(([industry, count]) => (
                      <div key={industry} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5"><span className="text-sm font-semibold text-slate-800">{industry}</span><span className="text-xs text-slate-500 font-medium">{count} job{count > 1 ? "s" : ""}</span></div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(count / savedApplications.length) * 100}%` }} /></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
