"use client";

import { useState } from "react";
import { FileText, RefreshCw, Sparkles, Save } from "lucide-react";
import { isStaticDeployment, browserAnalyzeCoursework } from "@/lib/http/browser-api";

interface CourseworkTabProps {
  portfolioData: any;
  onChange: (data: any) => void;
  onNavigate: (tab: string) => void;
}

export default function CourseworkTab({ portfolioData, onChange, onNavigate }: CourseworkTabProps) {
  const [courseworkFiles, setCourseworkFiles] = useState<File[]>([]);
  const [courseworkText, setCourseworkText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (courseworkFiles.length === 0 && !courseworkText.trim()) {
      alert("Please select at least one file or enter some text");
      return;
    }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      if (isStaticDeployment()) {
        const textToAnalyze = courseworkText.trim();
        if (!textToAnalyze && courseworkFiles.length > 0) {
          alert("On GitHub Pages, please paste the coursework text directly.");
          return;
        }
        setAnalysisResult(await browserAnalyzeCoursework(textToAnalyze));
      } else {
        const formData = new FormData();
        courseworkFiles.forEach((file) => formData.append("file", file));
        if (courseworkText.trim()) formData.append("text", courseworkText.trim());
        const response = await fetch("/api/coursework/analyze", { method: "POST", body: formData });
        if (!response.ok) throw new Error("Failed to analyze coursework");
        setAnalysisResult(await response.json());
      }
    } catch (error: any) {
      alert("Failed to analyze: " + (error.message || "Unknown error"));
    } finally {
      setAnalyzing(false);
    }
  };

  const addAnalyzedProject = () => {
    if (!analysisResult) return;
    const newProject = {
      id: portfolioData.projects.length + 1,
      title: analysisResult.title,
      description: analysisResult.description,
      tags: analysisResult.tags || [],
      link: analysisResult.attachments?.[0] ?? "#",
      featured: false, images: [], hasLiveDemo: !!(analysisResult.attachments?.length),
      key_features: analysisResult.key_features || [],
      attachments: analysisResult.attachments || [],
    };
    const existingNames = portfolioData.skills.map((s: any) => s.name.toLowerCase());
    const newSkills = (analysisResult.tags || [])
      .filter((tag: string) => !existingNames.includes(tag.toLowerCase()))
      .map((tag: string, i: number) => ({ id: portfolioData.skills.length + i + 1, name: tag, category: "technical" }));
    const added = newSkills.length;
    onChange({ ...portfolioData, projects: [...portfolioData.projects, newProject], skills: [...portfolioData.skills, ...newSkills] });
    alert(`Project added! ${added > 0 ? `Also added ${added} new skill${added > 1 ? "s" : ""} to Skills.` : "All skills already existed."}`);
    onNavigate("projects");
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">Coursework AI Analysis</h2>
        <p className="text-blue-100 text-lg">Upload your assignments or project files. AI will analyze them and generate professional project descriptions.</p>
        <div className="mt-4 bg-blue-500/30 rounded-lg p-3 text-sm">
          <p className="font-semibold mb-1">💡 Tip: You can select multiple files at once!</p>
          <p className="text-blue-50">Hold Ctrl (Windows/Linux) or Cmd (Mac) to select multiple files.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Paste Text Content</label>
          <textarea
            value={courseworkText}
            onChange={(e) => setCourseworkText(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
            placeholder="Paste text from your assignment, project description, or notes here..."
          />
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer">
          <input
            type="file" id="coursework-upload" className="hidden" multiple
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (courseworkFiles.length + files.length > 10) { alert("Maximum 10 files allowed"); return; }
              const valid = files.filter(f => { if (f.size > 10 * 1024 * 1024) { alert(`${f.name} is too large (max 10MB)`); return false; } return true; });
              if (valid.length > 0) setCourseworkFiles([...courseworkFiles, ...valid]);
            }}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
          />
          <label htmlFor="coursework-upload" className="cursor-pointer">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-2">
              {courseworkFiles.length > 0 ? `${courseworkFiles.length} file${courseworkFiles.length > 1 ? "s" : ""} selected` : "Click to select multiple files"}
            </p>
            <p className="text-sm text-slate-500 mb-3">Supports PDF, DOCX, PNG, JPG (Max 10MB each, up to 10 files)</p>
            <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
              {courseworkFiles.length > 0 ? "Add More Files" : "Select Files"}
            </div>
          </label>
        </div>

        {courseworkFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-700">Selected Files ({courseworkFiles.length}/10)</h4>
              <button onClick={() => setCourseworkFiles([])} className="text-sm text-red-600 hover:text-red-700 font-semibold">Clear All</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {courseworkFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button onClick={() => setCourseworkFiles(courseworkFiles.filter((_, i) => i !== index))} className="text-red-600 hover:text-red-700 text-sm font-semibold ml-3">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleAnalyze}
            disabled={(courseworkFiles.length === 0 && !courseworkText.trim()) || analyzing}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {analyzing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Sparkles className="w-5 h-5" /> Analyze with AI</>}
          </button>
        </div>
      </div>

      {analysisResult && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="text-2xl font-bold text-slate-900">Analysis Result</h3>
            <button onClick={addAnalyzedProject} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2">
              <Save className="w-4 h-4" /> Add to Projects
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input type="text" value={analysisResult.title} readOnly className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={analysisResult.description} readOnly rows={6} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
              <div className="flex flex-wrap gap-2">
                {analysisResult.tags?.map((tag: string, i: number) => (
                  <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{tag}</span>
                ))}
              </div>
            </div>
            {analysisResult.key_features && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Key Features</label>
                <ul className="list-disc list-inside space-y-1 text-slate-700 bg-slate-50 p-4 rounded-lg">
                  {analysisResult.key_features.map((f: string, i: number) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
