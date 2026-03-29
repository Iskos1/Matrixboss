"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Lock, Save, Eye, RefreshCw, Sparkles, Bot, GraduationCap, 
  ShieldCheck, ShieldAlert, Activity, Target, User, Briefcase, 
  Rocket, Medal, Link as LinkIcon, FileText, Settings, Menu, X,
  LayoutDashboard, ChevronRight, LogOut, Code, Map, MessageSquare
} from "lucide-react";
import NewsletterButton from "@/components/NewsletterButton";
import PortfolioChat from "@/components/PortfolioChat";
import portfolioDataFallback from "@/data/portfolio.json";
import { isStaticDeployment, testApiKey } from "@/lib/http/browser-api";

import ProfileTab from "./tabs/ProfileTab";
import SkillsTab from "./tabs/SkillsTab";
import CertificationsTab from "./tabs/CertificationsTab";
import ExperienceTab from "./tabs/ExperienceTab";
import ProjectsTab from "./tabs/ProjectsTab";
import SocialTab from "./tabs/SocialTab";
import CourseworkTab from "./tabs/CourseworkTab";
import ResumeTab from "./tabs/ResumeTab";
import SystemTab from "./tabs/SystemTab";
import ChatTab from "./tabs/ChatTab";
import JobTrackerTab from "./tabs/JobTrackerTab";
import SkillBuilderTab from "./tabs/SkillBuilderTab";

const ADMIN_PASSWORD = "jawad2026";

const TAB_GROUPS = [
  { label: "Portfolio Management", icon: LayoutDashboard, tabs: [
    { id: "profile", label: "Profile", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: Rocket },
    { id: "skills", label: "Skills", icon: Code },
    { id: "certifications", label: "Certifications", icon: Medal },
    { id: "social", label: "Social Links", icon: LinkIcon },
  ]},
  { label: "Career & AI", icon: Target, tabs: [
    { id: "resume", label: "Resume AI", icon: FileText, badge: "AI" },
    { id: "jobtracker", label: "Job Tracker", icon: Map, badge: "NEW" },
  ]},
  { label: "Learning", icon: GraduationCap, tabs: [
    { id: "coursework", label: "Coursework", icon: GraduationCap, badge: "AI" },
    { id: "skillbuilder", label: "Skill Builder", icon: Bot, badge: "Beta" },
  ]},
  { label: "System", icon: Settings, tabs: [
    { id: "chat", label: "AI Chat", icon: MessageSquare, badge: "Bot" },
    { id: "system", label: "System Status", icon: Settings },
  ]},
];

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Shared cross-tab state
  const [savedApplications, setSavedApplications] = useState<any[]>([]);
  const [apiKeyStatus, setApiKeyStatus] = useState<"checking" | "valid" | "invalid" | "unknown">("unknown");
  const [apiKeyDiag, setApiKeyDiag] = useState<any>(null);
  const [checkingApiKey, setCheckingApiKey] = useState(false);

  // Re-tailor bridge: job tracker → resume tab
  const [resumeInitData, setResumeInitData] = useState<{ jobDescription: string; company: string; role: string } | null>(null);

  useEffect(() => {
    if (authenticated) {
      fetchPortfolioData();
      checkApiKeyHealth();
    }
  }, [authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authenticated) return;
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        const tabs = TAB_GROUPS.flatMap(g => g.tabs).map(t => t.id);
        const idx = parseInt(e.key) - 1;
        if (idx < tabs.length) setActiveTab(tabs[idx]);
      }
      if (e.key === "Escape" && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [authenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPortfolioData = async () => {
    if (isStaticDeployment()) { setPortfolioData(portfolioDataFallback); return; }
    try {
      const response = await fetch("/api/portfolio");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setPortfolioData(await response.json());
    } catch {
      setPortfolioData(portfolioDataFallback);
    }
  };

  const checkApiKeyHealth = async () => {
    setCheckingApiKey(true);
    setApiKeyStatus("checking");
    if (isStaticDeployment()) {
      const result = await testApiKey();
      setApiKeyStatus(result.ok ? "valid" : "invalid");
      setApiKeyDiag({ anthropic_test: { ok: result.ok, status: result.ok ? 200 : 0, error_message: result.error || null }, key_diagnostics: { exists: false, raw_length: 0, starts_with_sk_ant: false }, env_source_clues: { likely_source: "ANTHROPIC_API_KEY (server-side only)", loaded_from_env_local: false } });
      setCheckingApiKey(false);
      return;
    }
    try {
      const res = await fetch(`/api/resume/diagnose?t=${Date.now()}`, { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setApiKeyDiag(data);
      setApiKeyStatus(data.anthropic_test?.ok === true ? "valid" : "invalid");
    } catch (e: any) {
      setApiKeyStatus("invalid");
      setApiKeyDiag({ anthropic_test: { ok: false, status: 0, error_type: "CLIENT_FETCH_ERROR", error_message: e.message || "Failed to connect" }, key_diagnostics: { exists: false, raw_length: 0, starts_with_sk_ant: false }, env_source_clues: { likely_source: "Unknown (Check Failed)", loaded_from_env_local: false } });
    } finally {
      setCheckingApiKey(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) setAuthenticated(true);
    else alert("Incorrect password");
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus("Saving...");
    if (isStaticDeployment()) {
      try {
        localStorage.setItem("jawad_portfolio_data", JSON.stringify(portfolioData));
        setSaveStatus("✓ Saved to browser");
        setTimeout(() => setSaveStatus(""), 5000);
      } catch { setSaveStatus("✗ Could not save"); }
      finally { setLoading(false); }
      return;
    }
    try {
      const response = await fetch("/api/portfolio", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(portfolioData) });
      setSaveStatus(response.ok ? "✓ Saved successfully" : "✗ Failed to save");
      if (response.ok) setTimeout(() => setSaveStatus(""), 3000);
    } catch {
      setSaveStatus("✗ Error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Workspace Admin
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Sign in to manage your portfolio and AI tools
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-sm sm:rounded-2xl sm:px-10 border border-slate-200">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    placeholder="Enter secure password"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Unlock Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
          <p className="text-slate-600 font-medium">Loading workspace...</p>
        </div>
      </div>
    );
  }

  const allTabs = TAB_GROUPS.flatMap(g => g.tabs);
  const activeGroupLabel = TAB_GROUPS.find(g => g.tabs.some(t => t.id === activeTab))?.label || "Portfolio";
  const activeTabInfo = allTabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Mobile Nav Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setMobileNavOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-slate-900">Workspace</span>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              {TAB_GROUPS.map((group) => (
                <div key={group.label}>
                  <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    {group.label}
                  </h3>
                  <div className="space-y-1">
                    {group.tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => { setActiveTab(tab.id); setMobileNavOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive 
                              ? "bg-blue-50 text-blue-700" 
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                          <span className="flex-1 text-left">{tab.label}</span>
                          {(tab as any).badge && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                            }`}>
                              {(tab as any).badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 fixed inset-y-0 z-10 shadow-sm">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Workspace</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
          {TAB_GROUPS.map((group) => (
            <div key={group.label}>
              <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {(tab as any).badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {(tab as any).badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
           <div className="flex items-center gap-3 px-2 py-2">
             <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
               <User className="w-4 h-4 text-slate-600" />
             </div>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold text-slate-900 truncate">Administrator</p>
               <div className="flex items-center gap-1.5 mt-0.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">System Active</p>
               </div>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" onClick={() => setMobileNavOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-500">{activeGroupLabel}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-900">{activeTabInfo?.label}</span>
            </div>
            <h1 className="text-lg font-semibold text-slate-900 sm:hidden">
              {activeTabInfo?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* AI Status */}
            <button 
              onClick={() => { checkApiKeyHealth(); setActiveTab("system"); }}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                apiKeyStatus === "valid" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" :
                apiKeyStatus === "invalid" ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" :
                "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
               {apiKeyStatus === "checking" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 
                <div className={`w-2 h-2 rounded-full ${apiKeyStatus === "valid" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : apiKeyStatus === "invalid" ? "bg-red-500" : "bg-slate-400"}`} />}
               {apiKeyStatus === "valid" ? "AI Online" : apiKeyStatus === "invalid" ? "AI Offline" : "Checking AI"}
            </button>

            {saveStatus && (
              <span className={`hidden sm:flex text-sm font-medium ${saveStatus.includes("✓") ? "text-emerald-600" : saveStatus.includes("✗") ? "text-red-600" : "text-slate-600"}`}>
                {saveStatus}
              </span>
            )}

            <div className="h-6 w-px bg-slate-200 hidden sm:block mx-1"></div>

            <a href="/" className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
              <Eye className="w-4 h-4" />
              Preview Site
            </a>

            <button 
              onClick={handleSave} 
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-95"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">{loading ? "Saving..." : "Save Changes"}</span>
              <span className="sm:hidden">{loading ? "..." : "Save"}</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Content Area */}
        <main className="flex-1 p-4 sm:p-8 w-full max-w-6xl mx-auto pb-24 md:pb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden min-h-[calc(100vh-10rem)]">
            <div className="p-6 sm:p-8">
              {activeTab === "profile" && <ProfileTab portfolioData={portfolioData} onChange={setPortfolioData} />}
              {activeTab === "skills" && <SkillsTab portfolioData={portfolioData} onChange={setPortfolioData} />}
              {activeTab === "certifications" && <CertificationsTab portfolioData={portfolioData} onChange={setPortfolioData} />}
              {activeTab === "experience" && <ExperienceTab portfolioData={portfolioData} onChange={setPortfolioData} />}
              {activeTab === "projects" && <ProjectsTab portfolioData={portfolioData} onChange={setPortfolioData} onNavigate={setActiveTab} />}
              {activeTab === "social" && <SocialTab portfolioData={portfolioData} onChange={setPortfolioData} />}
              {activeTab === "coursework" && <CourseworkTab portfolioData={portfolioData} onChange={setPortfolioData} onNavigate={setActiveTab} />}
              {activeTab === "resume" && (
                <ResumeTab
                  onApplicationSaved={(app) => setSavedApplications(prev => [app, ...prev])}
                  onNavigate={setActiveTab}
                  initData={resumeInitData}
                  onInitDataConsumed={() => setResumeInitData(null)}
                />
              )}
              {activeTab === "system" && <SystemTab apiKeyStatus={apiKeyStatus} apiKeyDiag={apiKeyDiag} checkingApiKey={checkingApiKey} onCheckHealth={checkApiKeyHealth} />}
              {activeTab === "chat" && <ChatTab />}
              {activeTab === "jobtracker" && (
                <JobTrackerTab
                  portfolioData={portfolioData}
                  savedApplications={savedApplications}
                  onApplicationsChange={setSavedApplications}
                  onReTailor={(jd, company, role) => { setResumeInitData({ jobDescription: jd, company, role }); setActiveTab("resume"); }}
                />
              )}
              {activeTab === "skillbuilder" && <SkillBuilderTab />}
            </div>
          </div>
        </main>
      </div>

      <NewsletterButton />
      <PortfolioChat />
    </div>
  );
}
