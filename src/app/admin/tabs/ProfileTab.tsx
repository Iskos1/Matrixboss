"use client";

import { useState, useEffect } from "react";
import { commitProfileImage, commitPortfolioJson, isValidGitHubToken } from "@/lib/http/github-api";

interface ProfileTabProps {
  portfolioData: any;
  onChange: (data: any) => void;
}

const GITHUB_TOKEN_KEY = "github_pat";

export default function ProfileTab({ portfolioData, onChange }: ProfileTabProps) {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDragOver, setAvatarDragOver] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<"" | "success" | "error" | "deploying">("");
  const [avatarStatusMsg, setAvatarStatusMsg] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [tokenSaved, setTokenSaved] = useState(false);

  const isStaticSite = process.env.NEXT_PUBLIC_GITHUB_PAGES === "true";

  useEffect(() => {
    try {
      const saved = localStorage.getItem(GITHUB_TOKEN_KEY);
      if (saved) { setGithubToken(saved); setTokenSaved(true); }
    } catch { /* ignore */ }
  }, []);

  const updateProfile = (field: string, value: string) => {
    onChange({ ...portfolioData, profile: { ...portfolioData.profile, [field]: value } });
  };

  const saveToken = () => {
    const trimmed = githubToken.trim();
    if (!trimmed) { alert("Please enter a token."); return; }
    if (!isValidGitHubToken(trimmed)) {
      alert("Token must start with ghp_ or github_pat_ — please check and try again.");
      return;
    }
    try {
      localStorage.setItem(GITHUB_TOKEN_KEY, trimmed);
      setGithubToken(trimmed);
      setTokenSaved(true);
      setShowTokenInput(false);
    } catch { alert("Could not save token to localStorage."); }
  };

  const clearToken = () => {
    try { localStorage.removeItem(GITHUB_TOKEN_KEY); } catch { /* ignore */ }
    setGithubToken("");
    setTokenSaved(false);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (JPG, PNG, WebP, or GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File too large. Maximum size is 5MB.");
      return;
    }
    setAvatarUploading(true);
    setAvatarStatus("");
    setAvatarStatusMsg("");

    // GitHub Pages: commit directly to the repo via GitHub API
    if (isStaticSite) {
      if (!githubToken) {
        setShowTokenInput(true);
        setAvatarUploading(false);
        alert("Add your GitHub token first (see the setup section below the upload area).");
        return;
      }

      // Optimistic preview via base64 data URL
      const reader = new FileReader();
      const base64DataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      onChange({ ...portfolioData, profile: { ...portfolioData.profile, avatar: base64DataUrl } });

      setAvatarStatus("deploying");
      setAvatarStatusMsg("Committing image to GitHub…");

      const imageResult = await commitProfileImage(githubToken, file);
      if (!imageResult.success) {
        onChange({ ...portfolioData, profile: { ...portfolioData.profile, avatar: portfolioData.profile.avatar } });
        setAvatarStatus("error");
        setAvatarStatusMsg(imageResult.error || "Upload failed");
        setAvatarUploading(false);
        return;
      }

      setAvatarStatusMsg("Updating portfolio data…");
      const updatedData = { ...portfolioData, profile: { ...portfolioData.profile, avatar: imageResult.avatarPath } };
      const jsonResult = await commitPortfolioJson(githubToken, updatedData);
      if (!jsonResult.success) {
        setAvatarStatus("error");
        setAvatarStatusMsg(`Image saved, but portfolio.json update failed: ${jsonResult.error}`);
        setAvatarUploading(false);
        return;
      }

      onChange(updatedData);
      setAvatarStatus("success");
      setAvatarStatusMsg("Committed! GitHub Pages is deploying — live in ~2 minutes.");
      setAvatarUploading(false);
      setTimeout(() => { setAvatarStatus(""); setAvatarStatusMsg(""); }, 15000);
      return;
    }

    // Local dev: use the server API
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/avatar", { method: "POST", body: form });
      const result = await res.json();
      if (result.success) {
        onChange({ ...portfolioData, profile: { ...portfolioData.profile, avatar: result.path } });
        setAvatarStatus("success");
        setAvatarStatusMsg("Photo saved! Push to GitHub to deploy.");
        setTimeout(() => { setAvatarStatus(""); setAvatarStatusMsg(""); }, 8000);
      } else {
        setAvatarStatus("error");
        setAvatarStatusMsg(result.error || "Upload failed");
      }
    } catch {
      setAvatarStatus("error");
      setAvatarStatusMsg("Upload failed — please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!confirm("Remove your profile photo?")) return;
    if (isStaticSite) {
      if (githubToken) {
        const updatedData = { ...portfolioData, profile: { ...portfolioData.profile, avatar: "" } };
        await commitPortfolioJson(githubToken, updatedData).catch(() => {});
        onChange(updatedData);
      } else {
        onChange({ ...portfolioData, profile: { ...portfolioData.profile, avatar: "" } });
      }
      return;
    }
    try {
      await fetch("/api/avatar", { method: "DELETE" });
      onChange({ ...portfolioData, profile: { ...portfolioData.profile, avatar: "" } });
    } catch {
      alert("Failed to remove photo — please try again.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Quick Info Card */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl shadow-xl p-5 md:p-7 text-white admin-card">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl backdrop-blur-sm flex-shrink-0 border border-white/20">
            👤
          </div>
          <div className="min-w-0">
            <h2 className="text-xl md:text-2xl font-bold truncate">{portfolioData.profile.name || "Your Name"}</h2>
            <p className="text-purple-100 truncate">{portfolioData.profile.role || "Your Role"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 bg-white/10 rounded-xl p-3 md:p-4 backdrop-blur-sm">
          <div className="min-w-0">
            <p className="text-purple-200/70 text-xs font-medium">Email</p>
            <p className="font-semibold text-sm truncate">{portfolioData.profile.email || "—"}</p>
          </div>
          <div className="min-w-0">
            <p className="text-purple-200/70 text-xs font-medium">Location</p>
            <p className="font-semibold text-sm truncate">{portfolioData.profile.location || "—"}</p>
          </div>
        </div>
      </div>

      {/* Profile Photo Upload */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 md:px-6 py-4 border-b border-purple-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-sm">🖼️</span>
            Profile Photo
          </h3>
          <p className="text-xs text-slate-500 mt-1">Shown in the hero banner on your portfolio</p>
        </div>
        <div className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0 relative">
              <div
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center border-4"
                style={{ borderImage: "linear-gradient(135deg,#7c3aed,#2563eb) 1", borderRadius: "9999px", borderStyle: "solid" }}
              >
                {portfolioData.profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${portfolioData.profile.avatar}?t=${Date.now()}`}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: "linear-gradient(135deg,#dbeafe,#ede9fe)" }}>
                    <span className="text-3xl font-extrabold" style={{ background: "linear-gradient(125deg,#2563eb,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                      {portfolioData.profile.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                    </span>
                    <span className="text-[9px] text-slate-400 tracking-widest uppercase mt-0.5">No photo</span>
                  </div>
                )}
              </div>
              {avatarStatus === "success" && (
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </span>
              )}
            </div>

            <div className="flex-1 w-full">
              <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                  avatarDragOver ? "border-purple-500 bg-purple-50 scale-[1.01]" : "border-slate-300 bg-slate-50 hover:border-purple-400 hover:bg-purple-50/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setAvatarDragOver(true); }}
                onDragLeave={() => setAvatarDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setAvatarDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleAvatarUpload(file); }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarUpload(file); e.target.value = ""; }}
                />
                {avatarUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-purple-600 font-medium">Uploading…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center px-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">📷</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Drop your photo here, or <span className="text-purple-600">browse</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP or GIF · Max 5 MB</p>
                    </div>
                  </div>
                )}
              </label>

              {portfolioData.profile.avatar && (
                <button onClick={handleAvatarRemove} className="mt-2.5 text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Remove photo
                </button>
              )}

              {avatarStatus === "deploying" && (
                <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                  <p className="text-xs text-blue-700 font-medium flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    {avatarStatusMsg}
                  </p>
                </div>
              )}
              {avatarStatus === "success" && (
                <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {avatarStatusMsg}
                  </p>
                </div>
              )}
              {avatarStatus === "error" && (
                <div className="mt-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    {avatarStatusMsg}
                  </p>
                </div>
              )}

              {/* GitHub Token setup — only shown on static site */}
              {isStaticSite && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      GitHub Token {tokenSaved ? <span className="text-emerald-600 font-semibold">✓ Connected</span> : <span className="text-amber-600">Required for permanent upload</span>}
                    </p>
                    <button
                      onClick={() => setShowTokenInput(v => !v)}
                      className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                    >
                      {tokenSaved ? "Change" : showTokenInput ? "Cancel" : "Set up"}
                    </button>
                  </div>

                  {!tokenSaved && !showTokenInput && (
                    <p className="text-xs text-slate-500">
                      Without a token, uploads only save in this browser.{" "}
                      <button onClick={() => setShowTokenInput(true)} className="text-purple-600 underline underline-offset-2">Add token →</button>
                    </p>
                  )}

                  {showTokenInput && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-slate-500">
                        Create a token at{" "}
                        <a href="https://github.com/settings/tokens/new?scopes=public_repo&description=Portfolio+Upload" target="_blank" rel="noopener noreferrer" className="text-purple-600 underline underline-offset-2">github.com/settings/tokens</a>
                        {" "}with <strong>Contents: Read & Write</strong> permission on the Matrixboss repo.
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={githubToken}
                          onChange={(e) => setGithubToken(e.target.value)}
                          placeholder="ghp_xxxxxxxxxxxx"
                          className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white font-mono"
                          onKeyDown={(e) => { if (e.key === "Enter") saveToken(); }}
                        />
                        <button
                          onClick={saveToken}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}

                  {tokenSaved && !showTokenInput && (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">Token saved — uploads will commit directly to GitHub.</p>
                      <button onClick={clearToken} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-4 md:px-6 py-4 border-b border-purple-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-sm">📋</span>
            Basic Information
          </h3>
          <p className="text-xs text-slate-500 mt-1">Your primary contact details and headline</p>
        </div>
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Full Name", field: "name", type: "text", placeholder: "John Doe" },
              { label: "Professional Role", field: "role", type: "text", placeholder: "Software Engineer" },
              { label: "Email Address", field: "email", type: "email", placeholder: "john@example.com" },
              { label: "Location", field: "location", type: "text", placeholder: "San Francisco, CA" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <input
                  type={type}
                  value={(portfolioData.profile as any)[field]}
                  onChange={(e) => updateProfile(field, e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-base bg-slate-50 focus:bg-white"
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Availability Status</label>
              <input
                type="text"
                value={portfolioData.profile.availability}
                onChange={(e) => updateProfile("availability", e.target.value)}
                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all text-base bg-slate-50 focus:bg-white"
                placeholder="Available for hire / Open to opportunities"
              />
              <p className="text-xs text-slate-400 mt-1.5">Displayed in your hero section</p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden admin-card">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 md:px-6 py-4 border-b border-indigo-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">✍️</span>
            About &amp; Tagline
          </h3>
          <p className="text-xs text-slate-500 mt-1">Craft your professional story and headline</p>
        </div>
        <div className="p-4 md:p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Professional Tagline</label>
            <input
              type="text"
              value={portfolioData.profile.tagline}
              onChange={(e) => updateProfile("tagline", e.target.value)}
              className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-base bg-slate-50 focus:bg-white"
              placeholder="Crafting elegant solutions to complex problems"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700">Professional Bio</label>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{portfolioData.profile.bio.length} chars</span>
            </div>
            <textarea
              value={portfolioData.profile.bio}
              onChange={(e) => updateProfile("bio", e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none text-base bg-slate-50 focus:bg-white"
              placeholder="Tell your story..."
            />
            <p className="text-xs text-slate-400 mt-1.5">2–3 paragraphs recommended</p>
          </div>
        </div>
      </div>
    </div>
  );
}
