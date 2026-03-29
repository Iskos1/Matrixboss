"use client";

import { Trash2 } from "lucide-react";
import { syncTagsToSkills } from "../utils";

interface ExperienceTabProps {
  portfolioData: any;
  onChange: (data: any) => void;
}

export default function ExperienceTab({ portfolioData, onChange }: ExperienceTabProps) {
  const updateExperience = (index: number, field: string, value: any) => {
    const newExperience = [...portfolioData.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    onChange({ ...portfolioData, experience: newExperience });
  };

  const addExperience = () => {
    onChange({
      ...portfolioData,
      experience: [...portfolioData.experience, {
        id: portfolioData.experience.length + 1,
        company: "Company Name", logo: "", website: "https://", location: "City, State",
        positions: [{ role: "Job Title", period: "Month Year — Month Year", description: "Description...", tags: ["Tag1", "Tag2"] }],
      }],
    });
  };

  const deleteExperience = (index: number) => {
    onChange({ ...portfolioData, experience: portfolioData.experience.filter((_: any, i: number) => i !== index) });
  };

  const addPosition = (expIndex: number) => {
    const newExperience = [...portfolioData.experience];
    const exp = { ...newExperience[expIndex] };
    if (!exp.positions) {
      exp.positions = exp.role ? [{ role: exp.role, period: exp.period, description: exp.description, tags: exp.tags || [] }] : [];
      delete exp.role; delete exp.period; delete exp.description; delete exp.tags;
    }
    exp.positions = [...exp.positions, { role: "New Position", period: "Month Year — Month Year", description: "Description...", tags: ["Tag1"] }];
    newExperience[expIndex] = exp;
    onChange({ ...portfolioData, experience: newExperience });
  };

  const updatePosition = (expIndex: number, posIndex: number, field: string, value: any) => {
    const newExperience = [...portfolioData.experience];
    const positions = [...(newExperience[expIndex].positions || [])];
    positions[posIndex] = { ...positions[posIndex], [field]: value };
    newExperience[expIndex] = { ...newExperience[expIndex], positions };
    let newData = { ...portfolioData, experience: newExperience };
    if (field === "tags" && Array.isArray(value)) newData = syncTagsToSkills(newData, value);
    onChange(newData);
  };

  const deletePosition = (expIndex: number, posIndex: number) => {
    const newExperience = [...portfolioData.experience];
    const positions = [...(newExperience[expIndex].positions || [])];
    positions.splice(posIndex, 1);
    newExperience[expIndex] = { ...newExperience[expIndex], positions };
    onChange({ ...portfolioData, experience: newExperience });
  };

  const handleCompanyLogoUpload = async (expIndex: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      if (response.ok) {
        const result = await response.json();
        const newExperience = [...portfolioData.experience];
        newExperience[expIndex] = { ...newExperience[expIndex], logo: result.path };
        onChange({ ...portfolioData, experience: newExperience });
        alert(`✓ Logo uploaded: ${result.filename}`);
      } else {
        const error = await response.json();
        alert(`Failed to upload: ${error.error}`);
      }
    } catch {
      alert("Failed to upload logo");
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-sm">💼</span>
              Work Experience
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Professional journey and accomplishments</p>
          </div>
          <button onClick={addExperience} className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition shadow-lg flex items-center gap-1.5 text-sm">
            <span>+</span> Add
          </button>
        </div>
      </div>

      <div className="space-y-5">
        {portfolioData.experience.map((exp: any, expIndex: number) => {
          const positions = exp.positions || (exp.role ? [{ role: exp.role, period: exp.period, description: exp.description, tags: exp.tags || [] }] : []);
          return (
            <div key={expIndex} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow admin-card">
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 md:px-6 py-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {exp.logo && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border-2 border-slate-200 p-1.5 flex-shrink-0 shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={exp.logo} alt="Logo" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3C/svg%3E"; }} />
                    </div>
                  )}
                  <input type="text" value={exp.company} onChange={(e) => updateExperience(expIndex, "company", e.target.value)} className="flex-1 px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-base bg-white min-w-0" placeholder="Company Name" />
                  <button onClick={() => deleteExperience(expIndex)} className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition border border-red-200" title="Delete company"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Logo</label>
                    <div className="flex items-center gap-2">
                      <input type="text" value={exp.logo || ""} onChange={(e) => updateExperience(expIndex, "logo", e.target.value)} className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-base bg-white min-w-0" placeholder="Logo path..." />
                      <label className="cursor-pointer w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex-shrink-0">
                        📤
                        <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCompanyLogoUpload(expIndex, file); }} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website</label>
                    <input type="url" value={exp.website || ""} onChange={(e) => updateExperience(expIndex, "website", e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-base" placeholder="https://company.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
                    <input type="text" value={exp.location || ""} onChange={(e) => updateExperience(expIndex, "location", e.target.value)} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-base" placeholder="City, State or Remote" />
                  </div>
                </div>
              </div>

              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <span>📝</span> Positions {positions.length > 0 && <span className="text-sm font-normal text-slate-400">({positions.length})</span>}
                  </h3>
                  <button onClick={() => addPosition(expIndex)} className="bg-emerald-500 text-white px-3 py-2 rounded-xl hover:bg-emerald-600 transition font-semibold text-sm flex items-center gap-1.5"><span>+</span> Add Position</button>
                </div>

                {positions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-slate-400 text-sm mb-2">No positions yet</p>
                    <button onClick={() => addPosition(expIndex)} className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold">+ Add your first position</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {positions.map((position: any, posIndex: number) => (
                      <div key={posIndex} className="p-4 border-2 border-slate-100 rounded-xl bg-white hover:border-emerald-200 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-full">Position {posIndex + 1}{posIndex === 0 && positions.length > 1 && " · Current"}</span>
                          <button onClick={() => deletePosition(expIndex, posIndex)} className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition font-semibold border border-red-200">Remove</button>
                        </div>
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Title</label>
                              <input type="text" value={position.role} onChange={(e) => updatePosition(expIndex, posIndex, "role", e.target.value)} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-base" placeholder="e.g. Senior Business Specialist" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Period</label>
                              <input type="text" value={position.period} onChange={(e) => updatePosition(expIndex, posIndex, "period", e.target.value)} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-base" placeholder="Jan 2023 — Present" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
                            <textarea value={position.description} onChange={(e) => updatePosition(expIndex, posIndex, "description", e.target.value)} rows={6} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-y min-h-[120px] text-base" placeholder="Describe your responsibilities..." />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">Hidden</span>
                              Technical / AI Details
                            </label>
                            <textarea value={position.technicalDetails || ""} onChange={(e) => updatePosition(expIndex, posIndex, "technicalDetails", e.target.value)} rows={4} className="w-full px-3 py-2.5 border-2 border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50/30 resize-y min-h-[100px] text-base" placeholder="Technical details for AI context (not public)" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Skills/Tags (comma separated)</label>
                            <input type="text" value={position.tags?.join(", ") || ""} onChange={(e) => updatePosition(expIndex, posIndex, "tags", e.target.value.split(",").map((t: string) => t.trim()))} className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-base" placeholder="Business Analysis, CRM, Strategy" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
