"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Eye, Save, Download, FileText } from "lucide-react";

interface ResumeInitData {
  jobDescription: string;
  company: string;
  role: string;
}

interface ResumeTabProps {
  onApplicationSaved: (app: any) => void;
  onNavigate: (tab: string) => void;
  initData?: ResumeInitData | null;
  onInitDataConsumed?: () => void;
}

export default function ResumeTab({ onApplicationSaved, onNavigate, initData, onInitDataConsumed }: ResumeTabProps) {
  const [jobDescription, setJobDescription] = useState("");
  const [tailorCompany, setTailorCompany] = useState("");
  const [tailorRole, setTailorRole] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [tailoringInProgress, setTailoringInProgress] = useState(false);
  const [tailoringResult, setTailoringResult] = useState<any>(null);
  const [tailoringError, setTailoringError] = useState<string | null>(null);
  const [tailoredSavedEntry, setTailoredSavedEntry] = useState<any>(null);
  const [tailoredSaveError, setTailoredSaveError] = useState<string | null>(null);

  const [latexEditorOpen, setLatexEditorOpen] = useState(false);
  const [latexEditorContent, setLatexEditorContent] = useState("");
  const [latexEditorTarget, setLatexEditorTarget] = useState<"resume" | "coverletter">("resume");
  const [recompiling, setRecompiling] = useState(false);
  const [recompileError, setRecompileError] = useState<string | null>(null);
  const [recompileSuccess, setRecompileSuccess] = useState(false);

  const [refineChatOpen, setRefineChatOpen] = useState(false);
  const [refineInput, setRefineInput] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [refineChatHistory, setRefineChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string; pdfUpdated?: boolean }>>([]);

  const [templateData, setTemplateData] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [templateContent, setTemplateContent] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoCompile, setAutoCompile] = useState(true);
  const [compilingTemplate, setCompilingTemplate] = useState(false);
  const [pdfKey, setPdfKey] = useState(Date.now());

  // Consume init data from job tracker "Re-tailor"
  useEffect(() => {
    if (initData) {
      setJobDescription(initData.jobDescription);
      setTailorCompany(initData.company);
      setTailorRole(initData.role);
      onInitDataConsumed?.();
    }
  }, [initData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadTemplateData();
    loadTemplateContent();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!autoCompile || !editMode) return;
    const timer = setTimeout(() => saveTemplate(true), 2000);
    return () => clearTimeout(timer);
  }, [templateContent, autoCompile, editMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTemplateData = async () => {
    try {
      const response = await fetch("/api/resume/compile");
      if (response.ok) setTemplateData(await response.json());
    } catch { /* non-fatal */ }
  };

  const loadTemplateContent = async () => {
    try {
      const response = await fetch("/api/resume/template");
      if (response.ok) setTemplateContent((await response.json()).content);
    } catch { /* non-fatal */ }
  };

  const saveTemplate = async (silent = false) => {
    if (silent) setIsAutoSaving(true); else setSavingTemplate(true);
    try {
      const response = await fetch("/api/resume/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: templateContent, autoCompile }),
      });
      if (response.ok) {
        const result = await response.json();
        await loadTemplateData();
        setPdfKey(Date.now());
        if (!silent) {
          if (result.pdfCompiled) alert(`✓ Template saved and compiled!\nPDF: ${(result.pdfSize / 1024).toFixed(2)} KB`);
          else if (result.compilationError) alert(`✓ Saved but compile failed:\n${result.compilationError}`);
          else alert("✓ Template saved!");
        }
      } else {
        const error = await response.json();
        if (!silent) alert(`Failed to save: ${error.details || error.error}`);
      }
    } catch (error) {
      if (!silent) alert("Failed to save template");
    } finally {
      if (silent) setIsAutoSaving(false); else setSavingTemplate(false);
    }
  };

  const compileTemplate = async () => {
    setCompilingTemplate(true);
    try {
      const response = await fetch("/api/resume/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: "resume_template.tex" }),
      });
      if (response.ok) {
        const result = await response.json();
        await loadTemplateData();
        setPdfKey(Date.now());
        alert(`✓ ${result.message}\nPDF Size: ${(result.size / 1024).toFixed(2)} KB`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        try {
          const details = JSON.parse(errorData.details || "{}");
          if (details.xelatexMissing) {
            const msg = "⚠️ PDF compilation requires xelatex (not installed).\n\nWould you like to download the .tex file?";
            if (confirm(msg) && details.texContent) {
              const blob = new Blob([details.texContent], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = "resume_template.tex"; a.click(); URL.revokeObjectURL(url);
            }
            return;
          }
        } catch { /* not xelatex error */ }
        alert(`Failed to compile: ${errorData.details || errorData.error || "Unknown error"}`);
      }
    } catch {
      alert("Failed to compile template. Make sure xelatex is installed.");
    } finally {
      setCompilingTemplate(false);
    }
  };

  const handleRecompile = async () => {
    if (!tailoringResult) return;
    const isResume = latexEditorTarget === "resume";
    const filename = isResume ? tailoringResult.filename : tailoringResult.coverLetterFilename;
    if (!filename || !latexEditorContent.trim()) return;

    setRecompiling(true); setRecompileError(null); setRecompileSuccess(false);
    try {
      const res = await fetch("/api/resume/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, latexContent: latexEditorContent }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        try {
          const details = JSON.parse(data.details || "{}");
          if (details.xelatexMissing) {
            setRecompileError("PDF compilation requires xelatex (not installed). Download the .tex file below.");
            if (details.texContent) {
              const blob = new Blob([details.texContent], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = (filename || "resume") + ".tex"; a.click(); URL.revokeObjectURL(url);
            }
            return;
          }
        } catch { /* not xelatex */ }
        throw new Error(data.details || data.error || "Compilation failed");
      }
      if (isResume) setTailoringResult((prev: any) => ({ ...prev, pdfFilename: data.filename, pdfCompiled: true }));
      else setTailoringResult((prev: any) => ({ ...prev, coverLetterPdfFilename: data.filename, coverLetterPdfCompiled: true }));
      setRecompileSuccess(true);
      setPdfKey(Date.now());
      setTimeout(() => setRecompileSuccess(false), 4000);
    } catch (err: any) {
      setRecompileError(err.message || "Unknown error");
    } finally {
      setRecompiling(false);
    }
  };

  const loadLatexForEditing = async (filename: string, target: "resume" | "coverletter") => {
    try {
      const res = await fetch(`/api/resume/download?file=${encodeURIComponent(filename)}`);
      if (res.ok) {
        setLatexEditorContent(await res.text());
        setLatexEditorTarget(target);
        setLatexEditorOpen(true);
        setRecompileError(null);
        setRecompileSuccess(false);
      }
    } catch { setLatexEditorContent(""); }
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || !tailoringResult || !latexEditorContent.trim()) return;
    const instruction = refineInput.trim();
    const filename = latexEditorTarget === "resume" ? tailoringResult.filename : tailoringResult.coverLetterFilename;
    if (!filename) return;

    setRefineLoading(true); setRefineError(null);
    const userMsg = { role: "user" as const, content: instruction };
    setRefineChatHistory(prev => [...prev, userMsg]);
    setRefineInput("");
    const apiHistory = refineChatHistory.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/resume/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latexContent: latexEditorContent, instruction, filename, history: apiHistory }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || data.details || "Refine failed");

      setLatexEditorContent(data.updatedLatex);
      if (data.pdfCompiled && data.pdfFilename) {
        if (latexEditorTarget === "resume") setTailoringResult((prev: any) => ({ ...prev, pdfFilename: data.pdfFilename, pdfCompiled: true }));
        else setTailoringResult((prev: any) => ({ ...prev, coverLetterPdfFilename: data.pdfFilename, coverLetterPdfCompiled: true }));
        setPdfKey(Date.now());
      }
      const summary = data.pdfCompiled ? "✅ Changes applied and PDF recompiled." : `✏️ Changes applied.${data.compileError ? ` (Warning: ${data.compileError})` : ""}`;
      setRefineChatHistory(prev => [...prev, { role: "assistant", content: summary, pdfUpdated: data.pdfCompiled }]);
    } catch (err: any) {
      setRefineError(err.message || "Unknown error");
      setRefineChatHistory(prev => prev.slice(0, -1));
      setRefineInput(instruction);
    } finally {
      setRefineLoading(false);
    }
  };

  const handleTailorResume = async () => {
    if (!jobDescription.trim()) { alert("Please paste a job description first"); return; }
    setTailoringInProgress(true); setTailoringResult(null); setTailoringError(null); setTailoredSavedEntry(null); setTailoredSaveError(null);

    try {
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, fileName: resumeFileName || undefined, company: tailorCompany || undefined, role: tailorRole || undefined }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || result.details || "Failed to tailor resume");

      setTailoringResult(result);
      setLatexEditorOpen(false); setRecompileError(null); setRecompileSuccess(false);

      if (result.filename) {
        try {
          const texRes = await fetch(`/api/resume/download?file=${encodeURIComponent(result.filename)}`);
          if (texRes.ok) setLatexEditorContent(await texRes.text());
        } catch { /* non-fatal */ }
      }

      try {
        const analyzeRes = await fetch("/api/jobs/analyze", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDescription }),
        });
        const analyzeData = analyzeRes.ok ? await analyzeRes.json() : null;
        const saveRes = await fetch("/api/jobs", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: tailorCompany.trim() || "Unknown Company",
            role: tailorRole.trim() || result.job_analysis?.primary_focus || "Unknown Role",
            jobDescription,
            resumeFilename: result.pdfFilename || result.filename || null,
            coverLetterFilename: result.coverLetterPdfFilename || result.coverLetterFilename || null,
            compatibilityScore: analyzeData?.analysis?.compatibilityScore ?? null,
            analysis: analyzeData?.analysis ?? null,
            applicationStatus: "not_applied", notes: "",
          }),
        });
        if (saveRes.ok) {
          const savedApp = (await saveRes.json()).application;
          setTailoredSavedEntry(savedApp);
          onApplicationSaved(savedApp);
        } else {
          const errData = await saveRes.json().catch(() => ({}));
          throw new Error(errData.error || `Save failed (HTTP ${saveRes.status})`);
        }
      } catch (trackErr: any) {
        setTailoredSaveError(trackErr.message || "Failed to save to job tracker");
      }

      setJobDescription(""); setResumeFileName(""); setTailorCompany(""); setTailorRole("");
    } catch (error: any) {
      setTailoringError(error.message || "An unexpected error occurred.");
    } finally {
      setTailoringInProgress(false);
    }
  };

  const downloadAnalysis = (analysis: any, filename: string) => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg px-4 md:px-6 py-5 text-white admin-card">
        <div className="flex items-center gap-2.5 mb-2">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          <h2 className="text-lg md:text-2xl font-bold">AI Resume Tailoring</h2>
        </div>
        <p className="text-purple-100 text-sm md:text-base leading-relaxed">
          Automatically tailor your resume to any job description using AI.
        </p>
      </div>

      {/* Resume Template Editor */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 md:px-6 py-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base md:text-xl font-bold truncate">Resume Template Editor</h3>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { if (!editMode) loadTemplateContent(); setEditMode(!editMode); }} className="bg-white text-blue-600 px-3 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-1.5 text-sm">
                <Eye className="w-3.5 h-3.5" />{editMode ? "View" : "Edit"}
              </button>
              {templateData?.pdfExists && (
                <a href="/api/resume/download?file=resume_template.pdf" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-1.5 text-sm">
                  <Download className="w-3.5 h-3.5" />PDF
                </a>
              )}
            </div>
          </div>
        </div>

        {!editMode ? (
          <div className="p-4 md:p-5">
            {templateData?.pdfExists ? (
              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-1"><span className="font-medium text-green-700">Status:</span><span className="text-green-600">✓ Compiled</span></div>
                    <div className="flex items-center gap-1"><span className="font-medium text-green-700">Size:</span><span className="text-green-600">{(templateData.pdfSize / 1024).toFixed(2)} KB</span></div>
                    <div className="flex items-center gap-1 flex-wrap"><span className="font-medium text-green-700">Modified:</span><span className="text-green-600 text-xs">{new Date(templateData.pdfModified).toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                  <iframe key={pdfKey} src={`/api/resume/download?file=resume_template.pdf#view=FitH`} className="w-full h-[500px] md:h-[800px]" title="Resume Preview" />
                </div>
                <p className="text-center text-xs md:text-sm text-slate-500">👆 Live resume preview. Tap <strong>&quot;Edit&quot;</strong> to make changes.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-amber-500 text-lg flex-shrink-0">⚠</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-amber-800 text-sm">PDF preview not available on this deployment</p>
                    <p className="text-amber-700 text-xs mt-1">
                      PDF compilation requires <code className="bg-amber-100 px-1 rounded">xelatex</code> which is not installed on Vercel.
                      Download the LaTeX source below to compile locally, or click <strong>Edit</strong> to modify the template.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button onClick={compileTemplate} disabled={compilingTemplate} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center gap-1.5">
                        {compilingTemplate ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Compiling...</> : <><FileText className="w-3.5 h-3.5" />Try Compile</>}
                      </button>
                      <a href="/api/resume/download?file=resume_template.tex" className="bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition inline-flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />Download .tex
                      </a>
                    </div>
                  </div>
                </div>
                {templateContent && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-700 text-sm">LaTeX Source (read-only — click Edit to modify)</h4>
                    <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-900">
                      <pre className="w-full h-[500px] md:h-[700px] px-4 py-3 font-mono text-xs text-green-400 overflow-auto whitespace-pre leading-relaxed">{templateContent}</pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 text-sm">LaTeX Source Code</h4>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="autoCompile" checked={autoCompile} onChange={(e) => setAutoCompile(e.target.checked)} className="rounded" />
                  <label htmlFor="autoCompile" className="text-xs text-slate-600 whitespace-nowrap">Auto-compile</label>
                </div>
              </div>
              <textarea value={templateContent} onChange={(e) => setTemplateContent(e.target.value)} className="w-full h-[400px] md:h-[700px] px-3 py-3 border-2 border-slate-300 rounded-xl font-mono text-xs bg-slate-900 text-green-400 focus:ring-2 focus:ring-blue-500 resize-none" spellCheck={false} placeholder="LaTeX code will appear here..." />
              <button onClick={() => saveTemplate(false)} disabled={savingTemplate} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {savingTemplate ? <><RefreshCw className="w-4 h-4 animate-spin" />Saving & Compiling...</> : <><Save className="w-4 h-4" />Save {autoCompile && "& Compile"}</>}
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Live Preview</h4>
                {isAutoSaving && <span className="text-xs text-blue-600 flex items-center gap-1.5 animate-pulse"><RefreshCw className="w-3.5 h-3.5 animate-spin" />Updating...</span>}
              </div>
              {templateData?.pdfExists ? (
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                  <iframe src={`/api/resume/download?file=resume_template.pdf&t=${pdfKey}#view=FitH`} className="w-full h-[400px] md:h-[700px]" title="Resume Preview" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl h-[300px] md:h-[700px] flex items-center justify-center bg-slate-50">
                  <div className="text-center"><FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" /><p className="text-slate-600 font-medium text-sm">No preview yet</p></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Job Description Input */}
      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 admin-card">
        <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Job Description</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 md:p-4 bg-purple-50 rounded-xl border border-purple-200">
            <div>
              <label className="block text-xs font-semibold text-purple-800 mb-1.5">🏢 Company Name <span className="font-normal text-purple-500">(saved to Job Tracker)</span></label>
              <input type="text" value={tailorCompany} onChange={(e) => setTailorCompany(e.target.value)} placeholder="e.g. Airbus, Google, McKinsey" className="w-full px-3 py-2.5 border border-purple-300 rounded-lg text-base focus:ring-2 focus:ring-purple-500 bg-white" disabled={tailoringInProgress} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-purple-800 mb-1.5">💼 Job Title <span className="font-normal text-purple-500">(saved to Job Tracker)</span></label>
              <input type="text" value={tailorRole} onChange={(e) => setTailorRole(e.target.value)} placeholder="e.g. Business Analyst, Software Engineer" className="w-full px-3 py-2.5 border border-purple-300 rounded-lg text-base focus:ring-2 focus:ring-purple-500 bg-white" disabled={tailoringInProgress} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Paste the full job description</label>
            <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={10} className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm" placeholder="Paste the entire job posting here..." disabled={tailoringInProgress} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Resume Filename (optional)</label>
            <input type="text" value={resumeFileName} onChange={(e) => setResumeFileName(e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-base" placeholder="e.g., Google_Software_Engineer (auto-generated if blank)" disabled={tailoringInProgress} />
          </div>
          <button onClick={handleTailorResume} disabled={tailoringInProgress || !jobDescription.trim()} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-4 rounded-xl font-bold text-base md:text-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {tailoringInProgress ? (
              <><RefreshCw className="w-5 h-5 animate-spin" /><span className="flex flex-col items-start leading-tight text-left"><span className="font-bold">AI is working...</span><span className="text-xs font-normal opacity-80">Analyze → Tailor → Quality check → Generate PDF</span></span></>
            ) : (
              <><Sparkles className="w-5 h-5" />Tailor Resume with AI</>
            )}
          </button>
        </div>
      </div>

      {tailoringError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-lg font-bold text-red-700 mb-2">⚠️ Tailoring Failed</h3>
          <p className="text-red-600 text-sm">{tailoringError}</p>
        </div>
      )}

      {tailoringResult && (
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 space-y-5 admin-card">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <h3 className="text-base md:text-xl font-bold text-green-600 flex items-center gap-2">
              ✓ Resume{tailoringResult.coverLetterFilename ? " & Cover Letter" : ""} Tailored!
            </h3>
            <div className="flex gap-2 flex-wrap">
              {tailoringResult.pdfCompiled && <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">Resume PDF ✓</span>}
              {tailoringResult.coverLetterPdfCompiled && <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">Cover Letter PDF ✓</span>}
            </div>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <h4 className="font-bold text-purple-900 mb-1.5 text-sm">Tailoring Strategy:</h4>
            <p className="text-purple-800 text-sm">{tailoringResult.tailored_content?.tailoring_summary || "Resume optimized for the job requirements"}</p>
          </div>

          {/* Quality Report */}
          {tailoringResult.quality_report && (() => {
            const qr = tailoringResult.quality_report;
            const score = qr.fit_score ?? 0;
            const scoreBg = score >= 85 ? "from-emerald-600 to-green-600" : score >= 72 ? "from-green-600 to-teal-600" : score >= 58 ? "from-yellow-500 to-amber-500" : "from-orange-500 to-red-500";
            const scoreBorder = score >= 72 ? "border-emerald-200" : score >= 58 ? "border-yellow-200" : "border-orange-200";
            return (
              <div className={`bg-white border ${scoreBorder} rounded-xl overflow-hidden`}>
                <div className={`bg-gradient-to-r ${scoreBg} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-2"><span className="text-lg">🎯</span><div><h4 className="font-bold text-white text-sm">AI Quality Report</h4><p className="text-white/80 text-xs">3-step pipeline{tailoringResult.refinement_applied ? " + refine" : ""}</p></div></div>
                  <div className="text-right"><p className="text-white/70 text-[10px] uppercase tracking-wide font-semibold">Fit Score</p><p className="text-white font-black text-3xl leading-none">{score}</p><p className="text-white/90 text-xs font-semibold">{qr.fit_label}</p></div>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold">ATS: {qr.ats_keyword_coverage}%</span>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-semibold">Bullet Quality: {qr.bullet_quality_score}%</span>
                    {tailoringResult.refinement_applied ? <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded-full font-bold">⚡ Refinement Applied</span> : <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold">✓ Passed Quality Check</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {qr.strengths?.length > 0 && (
                      <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">✅ Strengths</p><ul className="space-y-1">{qr.strengths.map((s: string, i: number) => <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5"><span className="text-emerald-500 mt-0.5 flex-shrink-0">•</span>{s}</li>)}</ul></div>
                    )}
                    {qr.gaps?.length > 0 && (
                      <div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{tailoringResult.refinement_applied ? "🔧 Gaps Fixed" : "⚠ Minor Gaps"}</p><ul className="space-y-1">{qr.gaps.map((g: string, i: number) => <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5"><span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>{g}</li>)}</ul></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Inline LaTeX Editor */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-900">
              <div className="flex items-center gap-2"><span className="text-base">✏️</span><div><h4 className="font-bold text-white text-sm">Edit Resume LaTeX</h4><p className="text-slate-400 text-xs">Make changes then hit Save &amp; Recompile</p></div></div>
              <div className="flex items-center gap-2">
                {tailoringResult.coverLetterFilename && (
                  <div className="flex rounded-lg overflow-hidden border border-slate-600 text-xs">
                    <button onClick={() => loadLatexForEditing(tailoringResult.filename, "resume")} className={`px-3 py-1.5 font-semibold transition ${latexEditorTarget === "resume" ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>Resume</button>
                    <button onClick={() => loadLatexForEditing(tailoringResult.coverLetterFilename, "coverletter")} className={`px-3 py-1.5 font-semibold transition ${latexEditorTarget === "coverletter" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>Cover Letter</button>
                  </div>
                )}
                <button onClick={() => setLatexEditorOpen(o => !o)} className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                  {latexEditorOpen ? "▲ Collapse" : "▼ Open Editor"}
                </button>
              </div>
            </div>

            {latexEditorOpen && (
              <div className="p-4 space-y-3 bg-slate-950">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">{latexEditorTarget === "resume" ? tailoringResult.filename : tailoringResult.coverLetterFilename}</span>
                  <span className="text-slate-500">{latexEditorContent.split("\n").length} lines</span>
                </div>
                <textarea value={latexEditorContent} onChange={e => setLatexEditorContent(e.target.value)} spellCheck={false} className="w-full h-[480px] bg-slate-900 text-green-300 font-mono text-xs leading-relaxed p-4 rounded-lg border border-slate-700 focus:outline-none focus:border-violet-500 resize-y" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }} placeholder="LaTeX source will appear here..." />
                {recompileError && <div className="bg-red-950 border border-red-700 rounded-lg p-3 text-xs text-red-300"><strong className="text-red-400">Compilation Error:</strong><pre className="mt-1 whitespace-pre-wrap leading-relaxed">{recompileError}</pre></div>}
                {recompileSuccess && <div className="bg-emerald-950 border border-emerald-700 rounded-lg p-3 text-xs text-emerald-300 flex items-center gap-2"><span>✅</span> Recompiled! PDF updated.</div>}
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={handleRecompile} disabled={recompiling || !latexEditorContent.trim()} className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition shadow">
                    {recompiling ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Compiling...</> : "🔨 Save & Recompile PDF"}
                  </button>
                  <button onClick={() => { const t = latexEditorTarget === "resume" ? tailoringResult.filename : tailoringResult.coverLetterFilename; if (t) loadLatexForEditing(t, latexEditorTarget); }} className="text-slate-400 hover:text-white text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-500 transition">↺ Reset</button>
                </div>
              </div>
            )}
          </div>

          {/* AI Resume Refine Chat */}
          <div className="bg-white border border-violet-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-700">
              <div className="flex items-center gap-2"><span className="text-lg">🤖</span><div><h4 className="font-bold text-white text-sm">AI Resume Refinement Chat</h4><p className="text-violet-200 text-xs">Tell the AI what to change — it edits surgically</p></div></div>
              <div className="flex items-center gap-2">
                {refineChatHistory.length > 0 && <span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">{Math.floor(refineChatHistory.length / 2)} edit{Math.floor(refineChatHistory.length / 2) !== 1 ? "s" : ""} applied</span>}
                <button onClick={() => setRefineChatOpen(o => !o)} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">{refineChatOpen ? "▲ Collapse" : "▼ Open Chat"}</button>
              </div>
            </div>

            {refineChatOpen && (
              <div className="flex flex-col" style={{ height: "480px" }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                  {refineChatHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-slate-400">
                      <span className="text-4xl">💬</span>
                      <div><p className="font-semibold text-slate-600 text-sm">Tell the AI what to change</p><p className="text-xs mt-1">Examples:</p></div>
                      <div className="grid grid-cols-1 gap-2 w-full max-w-sm text-left">
                        {["Make the project bullets more data-focused", "Emphasize leadership experience more", "Shorten the Skills section — keep only top 6", "Remove the third project entirely"].map((ex, i) => (
                          <button key={i} onClick={() => setRefineInput(ex)} className="text-left text-xs bg-white border border-slate-200 hover:border-violet-400 hover:bg-violet-50 text-slate-600 hover:text-violet-700 px-3 py-2 rounded-lg transition">&ldquo;{ex}&rdquo;</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    refineChatHistory.map((msg, i) => (
                      <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">🤖</div>}
                        <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${msg.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : msg.pdfUpdated ? "bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-bl-sm" : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"}`}>{msg.content}</div>
                        {msg.role === "user" && <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-white">You</div>}
                      </div>
                    ))
                  )}
                  {refineLoading && (
                    <div className="flex justify-start gap-2">
                      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-sm">🤖</div>
                      <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl rounded-bl-sm flex items-center gap-2">
                        <svg className="animate-spin w-3.5 h-3.5 text-violet-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                        <span className="text-slate-500 text-xs">Editing &amp; recompiling…</span>
                      </div>
                    </div>
                  )}
                </div>
                {refineError && <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-xs text-red-700 flex items-start gap-2"><span className="font-bold flex-shrink-0">⚠</span><span>{refineError}</span><button onClick={() => setRefineError(null)} className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0">✕</button></div>}
                <div className="px-4 py-1.5 bg-violet-50 border-t border-violet-100 flex items-center gap-2 text-xs text-violet-600">
                  <span className="font-semibold">Editing:</span>
                  <span className="font-mono text-violet-700">{latexEditorTarget === "resume" ? tailoringResult.filename : tailoringResult.coverLetterFilename}</span>
                  {tailoringResult.coverLetterFilename && (
                    <div className="ml-auto flex rounded overflow-hidden border border-violet-200 text-[10px]">
                      <button onClick={() => { setLatexEditorTarget("resume"); setRefineChatHistory([]); }} className={`px-2 py-0.5 font-semibold transition ${latexEditorTarget === "resume" ? "bg-violet-600 text-white" : "bg-white text-violet-600 hover:bg-violet-50"}`}>Resume</button>
                      <button onClick={() => { setLatexEditorTarget("coverletter"); setRefineChatHistory([]); }} className={`px-2 py-0.5 font-semibold transition ${latexEditorTarget === "coverletter" ? "bg-violet-600 text-white" : "bg-white text-violet-600 hover:bg-violet-50"}`}>Cover Letter</button>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                  <textarea value={refineInput} onChange={e => setRefineInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !refineLoading) { e.preventDefault(); handleRefine(); } }} disabled={refineLoading} rows={2} placeholder='Describe your change… e.g. "Focus the internship bullets more on data analysis"' className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-violet-500 disabled:opacity-50" />
                  <button onClick={handleRefine} disabled={refineLoading || !refineInput.trim() || !latexEditorContent.trim()} className="flex-shrink-0 self-end bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-40 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5">
                    {refineLoading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> : "↑"}
                    {refineLoading ? "" : "Apply"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PDF Previews */}
          <div className="space-y-5">
            {tailoringResult.pdfCompiled && tailoringResult.pdfFilename ? (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm md:text-base">📄 Resume Preview</h4>
                <div className="border-2 border-green-200 rounded-xl overflow-hidden bg-slate-100 shadow">
                  <iframe key={`resume-pdf-${pdfKey}`} src={`/api/resume/download?file=${encodeURIComponent(tailoringResult.pdfFilename)}&t=${pdfKey}#view=FitH`} className="w-full h-[500px] md:h-[800px]" title="Tailored Resume" />
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4"><p className="text-orange-800 text-sm">⏳ Resume PDF compiling... Check console if this doesn&apos;t update.</p></div>
            )}
            {tailoringResult.coverLetterPdfCompiled && tailoringResult.coverLetterPdfFilename && (
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 text-sm md:text-base">✉️ Cover Letter Preview</h4>
                <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-slate-100 shadow">
                  <iframe key={`cl-pdf-${pdfKey}`} src={`/api/resume/download?file=${encodeURIComponent(tailoringResult.coverLetterPdfFilename)}&t=${pdfKey}#view=FitH`} className="w-full h-[500px] md:h-[800px]" title="Cover Letter" />
                </div>
              </div>
            )}
          </div>

          {/* Job Tracker Status */}
          {tailoredSavedEntry && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1"><span className="text-2xl">✅</span><div><p className="font-bold text-emerald-800 text-sm">Saved to Job Tracker!</p><p className="text-emerald-700 text-xs">{tailoredSavedEntry.company} — {tailoredSavedEntry.role?.substring(0, 60)}{tailoredSavedEntry.role?.length > 60 ? "…" : ""}</p></div></div>
              <button onClick={() => onNavigate("jobtracker")} className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-2 rounded-lg transition flex-shrink-0">View in Job Tracker →</button>
            </div>
          )}
          {tailoredSaveError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-2"><span className="text-red-500 font-bold">⚠</span><div><p className="font-bold text-red-700 text-sm">Job Tracker Save Failed</p><p className="text-red-600 text-xs mt-0.5">{tailoredSaveError}</p></div></div>
          )}

          {/* Downloads */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm md:text-base">📥 Downloads</h4>
            <div>
              <h5 className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wide">Resume</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {tailoringResult.pdfCompiled && tailoringResult.pdfFilename && <a href={`/api/resume/download?file=${encodeURIComponent(tailoringResult.pdfFilename)}`} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2 shadow text-sm"><Download className="w-4 h-4" />View Resume PDF</a>}
                <a href={`/api/resume/download?file=${encodeURIComponent(tailoringResult.filename)}`} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"><FileText className="w-4 h-4" />LaTeX Source</a>
                <button onClick={() => downloadAnalysis({ job_analysis: tailoringResult.job_analysis, tailored_content: tailoringResult.tailored_content }, tailoringResult.filename.replace(".tex", "_analysis.json"))} className="bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"><FileText className="w-4 h-4" />Analysis JSON</button>
              </div>
            </div>
            {tailoringResult.coverLetterFilename && (
              <div>
                <h5 className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wide">Cover Letter</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tailoringResult.coverLetterPdfCompiled && tailoringResult.coverLetterPdfFilename && <a href={`/api/resume/download?file=${encodeURIComponent(tailoringResult.coverLetterPdfFilename)}`} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow text-sm"><Download className="w-4 h-4" />View Cover Letter PDF</a>}
                  <a href={`/api/resume/download?file=${encodeURIComponent(tailoringResult.coverLetterFilename)}`} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"><FileText className="w-4 h-4" />LaTeX Cover Letter</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 admin-card">
        <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">⚙️ How the AI Pipeline Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { n: "1", emoji: "🔍", title: "Deep Job Analysis", text: "Extracts required skills, ATS keywords, must-haves, seniority level, and role focus" },
            { n: "2", emoji: "✍️", title: "Smart Selection + Tailoring", text: "Picks the most relevant experience and writes ATS-optimized, quantified bullets" },
            { n: "3", emoji: "🎯", title: "Quality Check", text: "Scores ATS coverage, bullet quality, and overall fit. Triggers refinement if score < 72" },
            { n: "4", emoji: "📄", title: "PDF Generation", text: "Compiles a pixel-perfect LaTeX resume and personalized cover letter" },
          ].map(({ n, emoji, title, text }) => (
            <div key={n} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="bg-purple-100 text-purple-700 rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0 font-bold text-xs">{n}</div>
              <div><p className="text-sm font-bold text-slate-800">{emoji} {title}</p><p className="text-xs text-slate-500 mt-0.5">{text}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
