"use client";

import { useState } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { isStaticDeployment, browserProcessData } from "@/lib/http/browser-api";
import { syncTagsToSkills } from "../utils";

interface ProjectsTabProps {
  portfolioData: any;
  onChange: (data: any) => void;
  onNavigate: (tab: string) => void;
}

export default function ProjectsTab({ portfolioData, onChange, onNavigate }: ProjectsTabProps) {
  const [processorInput, setProcessorInput] = useState("");
  const [processorCategory, setProcessorCategory] = useState("auto");
  const [processing, setProcessing] = useState(false);
  const [processorResult, setProcessorResult] = useState<any>(null);
  const [processorTarget, setProcessorTarget] = useState<{ index: number; mode: "update" } | null>(null);

  const updateProject = (index: number, field: string, value: any) => {
    const newProjects = [...portfolioData.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    let newData = { ...portfolioData, projects: newProjects };
    if (field === "tags" && Array.isArray(value)) newData = syncTagsToSkills(newData, value);
    onChange(newData);
  };

  const addProject = () => {
    onChange({
      ...portfolioData,
      projects: [...portfolioData.projects, { id: portfolioData.projects.length + 1, title: "Project Title", description: "Project description...", tags: ["Tag1", "Tag2"], link: "#", featured: false, images: [], hasLiveDemo: true }],
    });
  };

  const deleteProject = (index: number) => {
    onChange({ ...portfolioData, projects: portfolioData.projects.filter((_: any, i: number) => i !== index) });
  };

  const addProjectImage = (projectIndex: number) => {
    const newProjects = [...portfolioData.projects];
    newProjects[projectIndex] = { ...newProjects[projectIndex], images: [...(newProjects[projectIndex].images || []), ""] };
    onChange({ ...portfolioData, projects: newProjects });
  };

  const updateProjectImage = (projectIndex: number, imageIndex: number, value: string) => {
    const newProjects = [...portfolioData.projects];
    const images = [...(newProjects[projectIndex].images || [])];
    images[imageIndex] = value;
    newProjects[projectIndex] = { ...newProjects[projectIndex], images };
    onChange({ ...portfolioData, projects: newProjects });
  };

  const deleteProjectImage = (projectIndex: number, imageIndex: number) => {
    const newProjects = [...portfolioData.projects];
    const images = [...(newProjects[projectIndex].images || [])];
    images.splice(imageIndex, 1);
    newProjects[projectIndex] = { ...newProjects[projectIndex], images };
    onChange({ ...portfolioData, projects: newProjects });
  };

  const handleImageUpload = async (projectIndex: number, file: File, imageIndex?: number) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (response.ok) {
        const result = await response.json();
        const newProjects = [...portfolioData.projects];
        const currentImages = [...(newProjects[projectIndex].images || [])];
        if (imageIndex !== undefined) currentImages[imageIndex] = result.path;
        else currentImages.push(result.path);
        newProjects[projectIndex] = { ...newProjects[projectIndex], images: currentImages };
        onChange({ ...portfolioData, projects: newProjects });
        alert(`✓ Image uploaded: ${result.filename}`);
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch {
      alert("Failed to upload image");
    }
  };

  const handleProcessData = async () => {
    if (!processorInput.trim()) { alert("Please enter some text to process"); return; }
    setProcessing(true);
    setProcessorResult(null);
    try {
      if (isStaticDeployment()) {
        setProcessorResult(await browserProcessData(processorInput, processorCategory));
      } else {
        const response = await fetch("/api/portfolio/process", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: processorInput, category: processorCategory }),
        });
        const data = await response.json();
        if (response.ok) setProcessorResult(data.data);
        else alert(`Error: ${data.error || "Failed to process data"}`);
      }
    } catch (error: any) {
      alert("Failed to process: " + (error.message || "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  const handleAddToPortfolio = () => {
    if (!processorResult) return;

    if (processorTarget?.mode === "update") {
      const newProjects = [...portfolioData.projects];
      const p = { ...newProjects[processorTarget.index] };
      if (processorResult.technicalDetails) p.technicalDetails = processorResult.technicalDetails;
      if (processorResult.title && processorResult.title !== "Project Title" && confirm(`Update title to "${processorResult.title}"?`)) p.title = processorResult.title;
      if (processorResult.description && confirm("Update public description?")) p.description = processorResult.description;
      if (processorResult.tags?.length && confirm("Update tags?")) p.tags = processorResult.tags;
      newProjects[processorTarget.index] = p;
      onChange({ ...portfolioData, projects: newProjects });
      alert("Project updated!");
      setProcessorResult(null); setProcessorInput(""); setProcessorTarget(null);
      return;
    }

    let category = processorCategory;
    if (category === "auto") {
      if (processorResult.positions) category = "experience";
      else if (processorResult.title && processorResult.description) category = "project";
      else if (processorResult.name && processorResult.category) category = "skill";
    }

    const newData = { ...portfolioData };
    const mergeTagsToSkills = (tags: string[]) => {
      const existingNames = newData.skills.map((s: any) => s.name.toLowerCase());
      const fresh = tags.filter((t: string) => !existingNames.includes(t.toLowerCase())).map((t: string, i: number) => ({ id: newData.skills.length + i + 1, name: t, category: "technical" }));
      newData.skills = [...newData.skills, ...fresh];
      return fresh.length;
    };

    if (category === "experience") {
      newData.experience.push({ ...processorResult, id: newData.experience.length + 1, logo: processorResult.logo || "", website: processorResult.website || "" });
      const allTags: string[] = [];
      if (processorResult.positions) processorResult.positions.forEach((p: any) => { if (p.tags) allTags.push(...p.tags); });
      else if (processorResult.tags) allTags.push(...processorResult.tags);
      const added = mergeTagsToSkills(allTags);
      alert(`Added to Experience! ${added > 0 ? `Also added ${added} new skill${added > 1 ? "s" : ""}.` : "All skills existed."}`);
    } else if (category === "project") {
      newData.projects.push({ ...processorResult, id: newData.projects.length + 1, technicalDetails: processorResult.technicalDetails || "", images: processorResult.images || [], attachments: processorResult.attachments || [] });
      const added = mergeTagsToSkills(processorResult.tags || []);
      alert(`Added to Projects! ${added > 0 ? `Also added ${added} skill${added > 1 ? "s" : ""}.` : "All skills existed."}`);
    } else if (category === "skill") {
      newData.skills.push({ ...processorResult, id: newData.skills.length + 1 });
      alert("Added to Skills!");
    } else {
      alert("Could not determine category. Please add manually.");
      return;
    }

    onChange(newData);
    setProcessorResult(null); setProcessorInput("");
    if (category === "experience") onNavigate("experience");
    else if (category === "project") onNavigate("projects");
    else if (category === "skill") onNavigate("skills");
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">🚀</span>
              Projects &amp; Portfolio
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Showcase your best work</p>
          </div>
          <button onClick={addProject} className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg flex items-center gap-1.5 text-sm">
            <span>+</span> Add
          </button>
        </div>
      </div>

      {/* AI Data Processor */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-100 overflow-hidden">
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            AI Project Creator / Data Processor
          </h3>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Beta</span>
        </div>
        <div className="p-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                <select value={processorCategory} onChange={(e) => setProcessorCategory(e.target.value)} className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500">
                  <option value="auto">Auto-Detect</option>
                  <option value="project">Project</option>
                  <option value="experience">Experience (Job)</option>
                  <option value="skill">Skill</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Raw Information</label>
                <textarea value={processorInput} onChange={(e) => setProcessorInput(e.target.value)} rows={8} className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Paste project info, job description, or skill details..." />
              </div>
              <button onClick={handleProcessData} disabled={processing || !processorInput.trim()} className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Processing...</> : "✨ Process with AI"}
              </button>
            </div>

            {processorResult && (
              <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                <h4 className="font-bold text-slate-900 text-lg">Processed Result</h4>
                <pre className="text-xs bg-white rounded-lg p-4 border border-slate-200 overflow-auto max-h-48 font-mono text-slate-700">
                  {JSON.stringify(processorResult, null, 2)}
                </pre>
                <div className="flex gap-3 flex-wrap">
                  <button onClick={handleAddToPortfolio} className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-green-700 transition">Add to Portfolio</button>
                  <button onClick={() => { setProcessorResult(null); setProcessorInput(""); setProcessorTarget(null); }} className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition">Discard</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projects List */}
      {portfolioData.projects.map((project: any, index: number) => (
        <div key={index} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow admin-card">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 md:px-6 py-4 border-b border-slate-200 flex items-center gap-3">
            <input type="text" value={project.title} onChange={(e) => updateProject(index, "title", e.target.value)} className="flex-1 px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-base bg-white min-w-0" placeholder="Project Title" />
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer flex-shrink-0">
              <input type="checkbox" checked={project.featured || false} onChange={(e) => updateProject(index, "featured", e.target.checked)} className="rounded" />
              Featured
            </label>
            <button onClick={() => deleteProject(index)} className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition border border-red-200">✕</button>
          </div>

          <div className="p-4 md:p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Public Description</label>
              <textarea value={project.description} onChange={(e) => updateProject(index, "description", e.target.value)} rows={4} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y text-base" placeholder="Public-facing project description..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">Hidden</span>
                Technical / AI Details
              </label>
              <textarea value={project.technicalDetails || ""} onChange={(e) => updateProject(index, "technicalDetails", e.target.value)} rows={3} className="w-full px-3 py-2.5 border-2 border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50/30 resize-y text-base" placeholder="Technical details for AI context (not public)" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tags (comma separated)</label>
                <input type="text" value={project.tags?.join(", ") || ""} onChange={(e) => updateProject(index, "tags", e.target.value.split(",").map((t: string) => t.trim()))} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-base" placeholder="React, Python, ML" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project Link</label>
                <input type="text" value={project.link} onChange={(e) => updateProject(index, "link", e.target.value)} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-base" placeholder="https://github.com/..." />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Project Date</label>
              <input type="text" value={project.date || ""} onChange={(e) => updateProject(index, "date", e.target.value)} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-base" placeholder="Jan 2025" />
            </div>

            {/* Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-600">Project Images</label>
                <div className="flex gap-2">
                  <label className="cursor-pointer text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition font-semibold">
                    📤 Upload
                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(index, f); }} className="hidden" />
                  </label>
                  <button onClick={() => addProjectImage(index)} className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition font-semibold">+ URL</button>
                </div>
              </div>
              {(project.images || []).map((img: string, imgIndex: number) => (
                <div key={imgIndex} className="flex gap-2 mb-2">
                  <input type="text" value={img} onChange={(e) => updateProjectImage(index, imgIndex, e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" placeholder="Image URL or /path" />
                  <button onClick={() => deleteProjectImage(index, imgIndex)} className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition border border-red-200">✕</button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Key Features (one per line)</label>
              <textarea
                value={(project.key_features || []).join("\n")}
                onChange={(e) => updateProject(index, "key_features", e.target.value.split("\n").filter(Boolean))}
                rows={3}
                className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y text-base"
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => { setProcessorTarget({ index, mode: "update" }); setProcessorInput(""); }}
                className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition font-semibold border border-emerald-200"
              >
                🤖 AI Enhance
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
