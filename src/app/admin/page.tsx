"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Save, Eye, RefreshCw, FileText, Download, Sparkles, Bot, GraduationCap, ShieldCheck, ShieldAlert, Activity, Terminal, KeyRound, CheckCircle2, XCircle, AlertTriangle, Briefcase, TrendingUp, TrendingDown, Target, BarChart2, Trash2, ChevronDown, ChevronUp, Brain } from "lucide-react";
import PortfolioChat from "@/components/PortfolioChat";
import NewsletterButton from "@/components/NewsletterButton";
// Add custom styles for scrollbar + admin mobile polish
const scrollbarStyles = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  /* Mobile drawer overlay */
  .mobile-nav-overlay {
    background: rgba(2, 6, 23, 0.75);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  /* Admin card hover lift */
  .admin-card {
    transition: box-shadow 0.2s ease, transform 0.2s ease;
  }
  .admin-card:hover {
    box-shadow: 0 10px 40px rgba(109, 40, 217, 0.12);
  }
  /* Safe bottom padding for iPhone */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 16px);
  }
  /* Input focus ring */
  .admin-input:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
  }
  /* Bottom nav blur */
  .mobile-bottom-nav {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.92);
    border-top: 1px solid rgba(124, 58, 237, 0.12);
    box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
  }
  /* Smooth slide-in animation for drawer */
  @keyframes slideInFromLeft {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }
  @keyframes slideInFromBottom {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .drawer-enter { animation: slideInFromLeft 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .section-enter { animation: slideInFromBottom 0.25s ease; }
  /* Tab badge pulse */
  .badge-pulse {
    animation: badgePulse 2s ease-in-out infinite;
  }
  @keyframes badgePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
`;

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  
  // Resume tailoring state
  const [jobDescription, setJobDescription] = useState("");
  const [tailoringInProgress, setTailoringInProgress] = useState(false);
  const [tailoringResult, setTailoringResult] = useState<any>(null);
  const [tailoringError, setTailoringError] = useState<string | null>(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [tailorCompany, setTailorCompany] = useState("");
  const [tailorRole, setTailorRole] = useState("");
  
  // Template viewer state
  const [templateData, setTemplateData] = useState<any>(null);
  const [compilingTemplate, setCompilingTemplate] = useState(false);
  
  // Live editor state
  const [editMode, setEditMode] = useState(false);
  const [templateContent, setTemplateContent] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [autoCompile, setAutoCompile] = useState(true);
  const [pdfKey, setPdfKey] = useState(Date.now());
  
  // Coursework Analysis state
  const [courseworkFiles, setCourseworkFiles] = useState<File[]>([]);
  const [courseworkText, setCourseworkText] = useState("");
  const [analyzingCoursework, setAnalyzingCoursework] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Data Processor State
  const [processorInput, setProcessorInput] = useState("");
  const [processorCategory, setProcessorCategory] = useState("auto");
  const [processing, setProcessing] = useState(false);
  const [processorResult, setProcessorResult] = useState<any>(null);
  const [processorTarget, setProcessorTarget] = useState<{ index: number, mode: 'update' } | null>(null);

  // API Key Health State
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'unknown'>('unknown');
  const [apiKeyDiag, setApiKeyDiag] = useState<any>(null);
  const [checkingApiKey, setCheckingApiKey] = useState(false);

  // Job Tracker State
  const [jobTrackerJD, setJobTrackerJD] = useState("");
  const [jobTrackerCompany, setJobTrackerCompany] = useState("");
  const [jobTrackerRole, setJobTrackerRole] = useState("");
  const [analyzingJob, setAnalyzingJob] = useState(false);
  const [jobAnalysisResult, setJobAnalysisResult] = useState<any>(null);
  const [jobAnalysisError, setJobAnalysisError] = useState<string | null>(null);
  const [savedApplications, setSavedApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [savingApplication, setSavingApplication] = useState(false);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [jdOpenId, setJdOpenId] = useState<string | null>(null);

  // Mobile navigation state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Simple password protection (in production, use proper authentication)
  const ADMIN_PASSWORD = "jawad2026"; // Change this to your preferred password

  useEffect(() => {
    if (authenticated) {
      fetchPortfolioData();
      checkApiKeyHealth();
    }
  }, [authenticated]);

  const checkApiKeyHealth = async () => {
    setCheckingApiKey(true);
    setApiKeyStatus('checking');
    try {
      // Add timestamp to prevent caching
      const res = await fetch(`/api/resume/diagnose?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setApiKeyDiag(data);
      setApiKeyStatus(data.gemini_test?.ok === true ? 'valid' : 'invalid');
    } catch (e: any) {
      console.error("Diagnostic check failed:", e);
      setApiKeyStatus('invalid');
      
      // Fallback diagnostic data so the UI explains the failure
      setApiKeyDiag({
        gemini_test: {
          ok: false,
          status: 0,
          error_code: 'CLIENT_FETCH_ERROR',
          error_message: e.message || 'Failed to connect to diagnostic endpoint',
        },
        key_diagnostics: {
          exists: false,
          raw_length: 0,
          starts_with_AIza: false
        },
        env_source_clues: {
          likely_source: 'Unknown (Check Failed)',
          loaded_from_env_local: false
        }
      });
    } finally {
      setCheckingApiKey(false);
    }
  };

  useEffect(() => {
    if (authenticated && activeTab === "resume") {
      loadTemplateData();
    }
    if (authenticated && activeTab === "jobtracker") {
      fetchSavedApplications();
    }
  }, [authenticated, activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!authenticated) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // Ctrl/Cmd + 1-9 for tab navigation
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const tabs = ["profile", "experience", "projects", "skills", "social", "resume", "coursework", "chat", "skillbuilder"];
        const index = parseInt(e.key) - 1;
        if (index < tabs.length) {
          setActiveTab(tabs[index]);
        }
      }

      // Escape to blur focused input
      if (e.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [authenticated]);

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch("/api/portfolio");
      const data = await response.json();
      setPortfolioData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // ── Job Tracker Functions ──────────────────────────────────────────────────

  const fetchSavedApplications = async () => {
    setLoadingApplications(true);
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setSavedApplications(data.applications || []);
    } catch (e) {
      console.error('Error loading applications:', e);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleAnalyzeJob = async (saveAfter: boolean) => {
    if (!jobTrackerJD.trim()) {
      alert('Please paste a job description first');
      return;
    }
    setAnalyzingJob(true);
    setJobAnalysisResult(null);
    setJobAnalysisError(null);

    try {
      const res = await fetch('/api/jobs/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jobTrackerJD }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setJobAnalysisResult(data.analysis);

      if (saveAfter) {
        setSavingApplication(true);
        await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: jobTrackerCompany || 'Unknown Company',
            role: jobTrackerRole || 'Unknown Role',
            jobDescription: jobTrackerJD,
            compatibilityScore: data.analysis.compatibilityScore,
            analysis: data.analysis,
          }),
        });
        setSavingApplication(false);
        fetchSavedApplications();
        setJobTrackerJD('');
        setJobTrackerCompany('');
        setJobTrackerRole('');
      }
    } catch (err: any) {
      setJobAnalysisError(err.message || 'An unexpected error occurred');
    } finally {
      setAnalyzingJob(false);
      setSavingApplication(false);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm('Delete this saved application?')) return;
    try {
      await fetch(`/api/jobs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      fetchSavedApplications();
      if (expandedAppId === id) setExpandedAppId(null);
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleUpdateApplication = async (id: string, updates: Record<string, any>) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        // Optimistically update local state
        setSavedApplications(prev =>
          prev.map(app => app.id === id ? { ...app, ...updates, updatedAt: new Date().toISOString() } : app)
        );
      }
    } catch (e) {
      console.error('Update failed:', e);
    }
  };

  // ── End Job Tracker Functions ──────────────────────────────────────────────

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus("Saving...");
    
    try {
      const response = await fetch("/api/portfolio", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(portfolioData),
      });

      if (response.ok) {
        setSaveStatus("✓ Saved successfully!");
        setTimeout(() => setSaveStatus(""), 3000);
      } else {
        setSaveStatus("✗ Failed to save");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      setSaveStatus("✗ Error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field: string, value: string) => {
    setPortfolioData({
      ...portfolioData,
      profile: { ...portfolioData.profile, [field]: value },
    });
  };

  const updateSkill = (index: number, field: string, value: string) => {
    const newSkills = [...portfolioData.skills];
    newSkills[index] = { ...newSkills[index], [field]: value };
    setPortfolioData({ ...portfolioData, skills: newSkills });
  };

  const addSkill = () => {
    const newSkill = {
      id: portfolioData.skills.length + 1,
      name: "New Skill",
      category: "technical" as const,
    };
    setPortfolioData({
      ...portfolioData,
      skills: [...portfolioData.skills, newSkill],
    });
  };

  const deleteSkill = (index: number) => {
    const newSkills = portfolioData.skills.filter((_: any, i: number) => i !== index);
    setPortfolioData({ ...portfolioData, skills: newSkills });
  };

  const updateExperience = (index: number, field: string, value: any) => {
    const newExperience = [...portfolioData.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setPortfolioData({ ...portfolioData, experience: newExperience });
  };

  const addExperience = () => {
    const newExp = {
      id: portfolioData.experience.length + 1,
      company: "Company Name",
      logo: "",
      website: "https://",
      location: "City, State",
      positions: [
        {
          role: "Job Title",
          period: "Month Year — Month Year",
          description: "Description of your role and achievements...",
          tags: ["Tag1", "Tag2"],
        }
      ],
    };
    setPortfolioData({
      ...portfolioData,
      experience: [...portfolioData.experience, newExp],
    });
  };

  const handleCompanyLogoUpload = async (expIndex: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newExperience = [...portfolioData.experience];
        newExperience[expIndex] = {
          ...newExperience[expIndex],
          logo: result.path
        };
        setPortfolioData({ ...portfolioData, experience: newExperience });
        alert(`✓ Logo uploaded successfully!\n\nSaved as: ${result.filename}`);
      } else {
        const error = await response.json();
        alert(`Failed to upload: ${error.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload logo");
    }
  };

  const deleteExperience = (index: number) => {
    const newExperience = portfolioData.experience.filter((_: any, i: number) => i !== index);
    setPortfolioData({ ...portfolioData, experience: newExperience });
  };

  const addPosition = (expIndex: number) => {
    const newExperience = [...portfolioData.experience];
    const exp = newExperience[expIndex];
    
    // Convert legacy format to positions if needed
    if (!exp.positions) {
      exp.positions = exp.role ? [{
        role: exp.role,
        period: exp.period,
        description: exp.description,
        tags: exp.tags || []
      }] : [];
      // Clear legacy fields
      delete exp.role;
      delete exp.period;
      delete exp.description;
      delete exp.tags;
    }
    
    exp.positions.push({
      role: "New Position",
      period: "Month Year — Month Year",
      description: "Description of this role...",
      tags: ["Tag1", "Tag2"]
    });
    
    setPortfolioData({ ...portfolioData, experience: newExperience });
  };

  const updatePosition = (expIndex: number, posIndex: number, field: string, value: any) => {
    const newExperience = [...portfolioData.experience];
    const positions = [...(newExperience[expIndex].positions || [])];
    positions[posIndex] = { ...positions[posIndex], [field]: value };
    newExperience[expIndex] = { ...newExperience[expIndex], positions };
    setPortfolioData({ ...portfolioData, experience: newExperience });
  };

  const deletePosition = (expIndex: number, posIndex: number) => {
    const newExperience = [...portfolioData.experience];
    const positions = [...(newExperience[expIndex].positions || [])];
    positions.splice(posIndex, 1);
    newExperience[expIndex] = { ...newExperience[expIndex], positions };
    setPortfolioData({ ...portfolioData, experience: newExperience });
  };

  const updateProject = (index: number, field: string, value: any) => {
    const newProjects = [...portfolioData.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setPortfolioData({ ...portfolioData, projects: newProjects });
  };

  const addProject = () => {
    const newProject = {
      id: portfolioData.projects.length + 1,
      title: "Project Title",
      description: "Project description...",
      tags: ["Tag1", "Tag2"],
      link: "#",
      featured: false,
      images: [],
      hasLiveDemo: true,
    };
    setPortfolioData({
      ...portfolioData,
      projects: [...portfolioData.projects, newProject],
    });
  };

  const deleteProject = (index: number) => {
    const newProjects = portfolioData.projects.filter((_: any, i: number) => i !== index);
    setPortfolioData({ ...portfolioData, projects: newProjects });
  };

  const addProjectImage = (projectIndex: number) => {
    const newProjects = [...portfolioData.projects];
    const currentImages = newProjects[projectIndex].images || [];
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      images: [...currentImages, ""]
    };
    setPortfolioData({ ...portfolioData, projects: newProjects });
  };

  const updateProjectImage = (projectIndex: number, imageIndex: number, value: string) => {
    const newProjects = [...portfolioData.projects];
    const images = [...(newProjects[projectIndex].images || [])];
    images[imageIndex] = value;
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      images: images
    };
    setPortfolioData({ ...portfolioData, projects: newProjects });
  };

  const deleteProjectImage = (projectIndex: number, imageIndex: number) => {
    const newProjects = [...portfolioData.projects];
    const images = [...(newProjects[projectIndex].images || [])];
    images.splice(imageIndex, 1);
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      images: images
    };
    setPortfolioData({ ...portfolioData, projects: newProjects });
  };

  const handleImageUpload = async (projectIndex: number, file: File, imageIndex?: number) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        const newProjects = [...portfolioData.projects];
        const currentImages = [...(newProjects[projectIndex].images || [])];
        
        if (imageIndex !== undefined) {
          // Replace existing image
          currentImages[imageIndex] = result.path;
        } else {
          // Add new image
          currentImages.push(result.path);
        }
        
        newProjects[projectIndex] = {
          ...newProjects[projectIndex],
          images: currentImages
        };
        setPortfolioData({ ...portfolioData, projects: newProjects });
        alert(`✓ Image uploaded successfully!\n\nSaved as: ${result.filename}\nSize: ${(result.size / 1024).toFixed(2)} KB`);
      } else {
        const error = await response.json();
        alert(`Failed to upload: ${error.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    }
  };

  const handleFileInputChange = (projectIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(projectIndex, file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (projectIndex: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(projectIndex, file);
    } else {
      alert("Please drop an image file (JPG, PNG, GIF, or WebP)");
    }
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const newLinks = [...portfolioData.socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setPortfolioData({ ...portfolioData, socialLinks: newLinks });
  };

  const addSocialLink = () => {
    const newLink = {
      id: portfolioData.socialLinks.length + 1,
      label: "New Link",
      url: "https://",
      icon: "globe" as const,
    };
    setPortfolioData({
      ...portfolioData,
      socialLinks: [...portfolioData.socialLinks, newLink],
    });
  };

  const deleteSocialLink = (index: number) => {
    const newLinks = portfolioData.socialLinks.filter((_: any, i: number) => i !== index);
    setPortfolioData({ ...portfolioData, socialLinks: newLinks });
  };

  const handleCourseworkUpload = async () => {
    if (courseworkFiles.length === 0 && !courseworkText.trim()) {
      alert("Please select at least one file or enter some text");
      return;
    }

    setAnalyzingCoursework(true);
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      courseworkFiles.forEach((file) => {
        formData.append("file", file);
      });
      
      if (courseworkText.trim()) {
        formData.append("text", courseworkText.trim());
      }

      const response = await fetch("/api/coursework/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze coursework");
      }

      const result = await response.json();
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze coursework");
    } finally {
      setAnalyzingCoursework(false);
    }
  };

  const addAnalyzedProject = () => {
    if (!analysisResult) return;
    
    const newProject = {
      id: portfolioData.projects.length + 1,
      title: analysisResult.title,
      description: analysisResult.description,
      tags: analysisResult.tags || [],
      link: analysisResult.attachments && analysisResult.attachments.length > 0 ? analysisResult.attachments[0] : "#",
      featured: false,
      images: [],
      hasLiveDemo: !!(analysisResult.attachments && analysisResult.attachments.length > 0),
      key_features: analysisResult.key_features || [],
      attachments: analysisResult.attachments || []
    };
    
    setPortfolioData({
      ...portfolioData,
      projects: [...portfolioData.projects, newProject],
    });
    
    setActiveTab("projects");
    alert("Project added! You can now edit it in the Projects tab.");
  };

  // Template functions
  const loadTemplateData = async () => {
    try {
      const response = await fetch("/api/resume/compile");
      if (response.ok) {
        const data = await response.json();
        setTemplateData(data);
      }
    } catch (error) {
      console.error("Error loading template:", error);
    }
  };

  const loadTemplateContent = async () => {
    try {
      const response = await fetch("/api/resume/template");
      if (response.ok) {
        const data = await response.json();
        setTemplateContent(data.content);
      }
    } catch (error) {
      console.error("Error loading template content:", error);
    }
  };

  const saveTemplate = async (silent = false) => {
    if (silent) {
      setIsAutoSaving(true);
    } else {
      setSavingTemplate(true);
    }
    try {
      const response = await fetch("/api/resume/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: templateContent,
          autoCompile: autoCompile
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Reload template data first
        await loadTemplateData();
        
        // Force PDF reload with new timestamp
        setPdfKey(Date.now());
        
        if (!silent) {
          if (result.pdfCompiled) {
            alert(`✓ Template saved and compiled!\n\nPDF Size: ${(result.pdfSize / 1024).toFixed(2)} KB`);
          } else if (result.compilationError) {
            alert(`✓ Template saved but compilation failed:\n\n${result.compilationError}`);
          } else {
            alert("✓ Template saved successfully!");
          }
        }
      } else {
        const error = await response.json();
        if (!silent) alert(`Failed to save: ${error.details || error.error}`);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      if (!silent) alert("Failed to save template");
    } finally {
      if (silent) {
        setIsAutoSaving(false);
      } else {
        setSavingTemplate(false);
      }
    }
  };

  // Auto-compile effect
  useEffect(() => {
    if (!autoCompile || !editMode) return;

    const timer = setTimeout(() => {
      saveTemplate(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [templateContent, autoCompile, editMode]);

  const toggleEditMode = () => {
    if (!editMode) {
      loadTemplateContent();
    }
    setEditMode(!editMode);
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
        
        // Reload template data and force PDF refresh
        await loadTemplateData();
        setPdfKey(Date.now());
        
        alert(`✓ ${result.message}\n\nPDF Size: ${(result.size / 1024).toFixed(2)} KB`);
      } else {
        const error = await response.json();
        alert(`Failed to compile: ${error.details || error.error}`);
      }
    } catch (error) {
      console.error("Error compiling template:", error);
      alert("Failed to compile template");
    } finally {
      setCompilingTemplate(false);
    }
  };

  // Resume tailoring functions
  const handleTailorResume = async () => {
    if (!jobDescription.trim()) {
      alert("Please paste a job description first");
      return;
    }

    setTailoringInProgress(true);
    setTailoringResult(null);
    setTailoringError(null);

    try {
      const response = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          fileName: resumeFileName || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || result.details || "Failed to tailor resume";
        throw new Error(errorMsg);
      }

      console.log("Tailoring result:", result); // Debug log
      console.log("PDF Compiled:", result.pdfCompiled); // Debug log
      console.log("PDF Filename:", result.pdfFilename); // Debug log
      setTailoringResult(result);

      // Auto-save to Job Tracker (fire-and-forget — don't block the UI)
      try {
        // Run critical analysis in the background
        const analyzeRes = await fetch('/api/jobs/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobDescription }),
        });
        const analyzeData = analyzeRes.ok ? await analyzeRes.json() : null;

        await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: tailorCompany.trim() || 'Unknown Company',
            role: tailorRole.trim() || result.job_analysis?.primary_focus || 'Unknown Role',
            jobDescription,
            resumeFilename: result.pdfFilename || result.filename || null,
            coverLetterFilename: result.coverLetterPdfFilename || result.coverLetterFilename || null,
            compatibilityScore: analyzeData?.analysis?.compatibilityScore ?? null,
            analysis: analyzeData?.analysis ?? null,
            applicationStatus: 'not_applied',
            notes: '',
          }),
        });
        console.log('[JobTracker] Application auto-saved to tracker.');
      } catch (trackErr) {
        console.warn('[JobTracker] Auto-save failed (non-blocking):', trackErr);
      }

      // Clear job description for next use
      setJobDescription("");
      setResumeFileName("");
      setTailorCompany("");
      setTailorRole("");
    } catch (error: any) {
      console.error("Error tailoring resume:", error);
      setTailoringError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setTailoringInProgress(false);
    }
  };

  const downloadTexFile = (filename: string) => {
    window.open(`/api/resume/download?file=${encodeURIComponent(filename)}`, '_blank');
  };

  const downloadAnalysis = (analysis: any, filename: string) => {
    const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProcessData = async () => {
    if (!processorInput.trim()) {
      alert("Please enter some text to process");
      return;
    }

    setProcessing(true);
    setProcessorResult(null);

    try {
      const response = await fetch("/api/portfolio/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: processorInput,
          category: processorCategory
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setProcessorResult(data.data);
      } else {
        alert(`Error: ${data.error || "Failed to process data"}`);
      }
    } catch (error) {
      console.error("Error processing data:", error);
      alert("Failed to process data");
    } finally {
      setProcessing(false);
    }
  };

  const handleAddToPortfolio = () => {
    if (!processorResult) return;

    // Handle Update Mode
    if (processorTarget && processorTarget.mode === 'update') {
      const { index } = processorTarget;
      
      // We only support updating projects for now based on the UI context
      const newProjects = [...portfolioData.projects];
      const currentProject = newProjects[index];
      
      // Update fields if they exist in result
      if (processorResult.technicalDetails) {
        currentProject.technicalDetails = processorResult.technicalDetails;
      }
      
      // Optional: Update other fields if user wants, but prioritize technicalDetails for this specific flow
      // We can also update title/desc if they are improved versions
      if (processorResult.title && processorResult.title !== "Project Title") {
        if (confirm(`Update title to "${processorResult.title}"?`)) {
          currentProject.title = processorResult.title;
        }
      }
      if (processorResult.description) {
        if (confirm("Update public description as well?")) {
          currentProject.description = processorResult.description;
        }
      }
      if (processorResult.tags && processorResult.tags.length > 0) {
         if (confirm("Update tags?")) {
          currentProject.tags = processorResult.tags;
        }
      }

      setPortfolioData({
        ...portfolioData,
        projects: newProjects
      });
      
      alert("Project updated successfully!");
      setProcessorResult(null);
      setProcessorInput("");
      setProcessorTarget(null);
      return;
    }

    // Default: Create New Entry
    // Determine category if auto was used, based on result structure
    let category = processorCategory;
    if (category === "auto") {
      if (processorResult.positions) category = "experience";
      else if (processorResult.title && processorResult.description) category = "project";
      else if (processorResult.name && processorResult.category) category = "skill";
    }

    // Add to portfolio data
    const newData = { ...portfolioData };

    if (category === "experience") {
      // Add ID if missing
      const newEntry = {
        ...processorResult,
        id: newData.experience.length + 1,
        logo: processorResult.logo || "",
        website: processorResult.website || ""
      };
      newData.experience.push(newEntry);
      alert("Added to Experience!");
    } else if (category === "project") {
      const newEntry = {
        ...processorResult,
        id: newData.projects.length + 1,
        technicalDetails: processorResult.technicalDetails || "",
        images: processorResult.images || [],
        attachments: processorResult.attachments || []
      };
      newData.projects.push(newEntry);
      alert("Added to Projects!");
    } else if (category === "skill") {
      const newEntry = {
        ...processorResult,
        id: newData.skills.length + 1
      };
      newData.skills.push(newEntry);
      alert("Added to Skills!");
    } else {
      alert("Could not determine where to add this data. Please add manually.");
      return;
    }

    setPortfolioData(newData);
    setProcessorResult(null);
    setProcessorInput("");
    
    // Switch to the relevant tab
    if (category === "experience") setActiveTab("experience");
    else if (category === "project") setActiveTab("projects");
    else if (category === "skill") setActiveTab("skills");
  };


  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-700/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-sm mx-auto">
          {/* Glassmorphism card */}
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 section-enter">
            {/* Logo / Icon */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Portfolio Admin</h1>
              <p className="text-purple-200/70 text-sm mt-1">Enter your password to continue</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-purple-100/80 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400/60 focus:border-purple-400/60 text-base transition-all"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-0.5 active:translate-y-0"
              >
                Unlock Dashboard
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/10 text-center">
              <p className="text-white/30 text-xs">Secure admin access · Portfolio CMS</p>
            </div>
          </div>
        </div>
        <style jsx global>{scrollbarStyles}</style>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 flex items-center justify-center">
        <div className="text-center section-enter">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <RefreshCw className="w-10 h-10 animate-spin text-purple-300" />
          </div>
          <p className="text-white/70 text-lg font-medium">Loading your dashboard…</p>
          <p className="text-white/30 text-sm mt-1">Fetching portfolio data</p>
        </div>
        <style jsx global>{scrollbarStyles}</style>
      </div>
    );
  }

  // Tab groups for mobile drawer navigation
  const tabGroups = [
    {
      label: "Portfolio",
      emoji: "📁",
      tabs: [
        { id: "profile", label: "Profile", emoji: "👤" },
        { id: "experience", label: "Experience", emoji: "💼" },
        { id: "projects", label: "Projects", emoji: "🚀" },
        { id: "skills", label: "Skills", emoji: "🎯" },
        { id: "certifications", label: "Certifications", emoji: "🏅" },
        { id: "social", label: "Social Links", emoji: "🔗" },
      ],
    },
    {
      label: "Career",
      emoji: "✨",
      tabs: [
        { id: "resume", label: "Resume AI", emoji: "📄", badge: "AI" },
        { id: "jobtracker", label: "Job Tracker", emoji: "🎯", badge: "NEW" },
      ],
    },
    {
      label: "Learn",
      emoji: "🎓",
      tabs: [
        { id: "coursework", label: "Coursework", emoji: "📚", badge: "AI" },
        { id: "skillbuilder", label: "Skill Builder", emoji: "🤖", badge: "Beta" },
      ],
    },
    {
      label: "System",
      emoji: "⚙️",
      tabs: [
        { id: "chat", label: "AI Chat", emoji: "💬", badge: "Bot" },
        { id: "system", label: "System", emoji: "🛡️" },
      ],
    },
  ];

  const activeGroupLabel = tabGroups.find(g => g.tabs.some(t => t.id === activeTab))?.label || "Portfolio";
  const activeTabLabel = tabGroups.flatMap(g => g.tabs).find(t => t.id === activeTab)?.label || activeTab;
  const activeTabEmoji = tabGroups.flatMap(g => g.tabs).find(t => t.id === activeTab)?.emoji || "📋";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-50">

      {/* ── Mobile Nav Drawer Overlay ── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 mobile-nav-overlay md:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-gradient-to-b from-slate-900 via-purple-950 to-slate-950 shadow-2xl drawer-enter overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-base">⚡</span>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Portfolio Admin</p>
                  <p className="text-white/40 text-xs">Navigation</p>
                </div>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white bg-white/5 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Drawer Nav Groups */}
            <div className="p-4 space-y-1">
              {tabGroups.map((group) => (
                <div key={group.label} className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-3 mb-2">{group.emoji} {group.label}</p>
                  {group.tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMobileNavOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all mb-0.5 ${
                        activeTab === tab.id
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20"
                          : "text-white/60 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{tab.emoji}</span>
                      <span className="font-semibold text-sm flex-1">{tab.label}</span>
                      {tab.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          activeTab === tab.id ? "bg-white/20 text-white" : "bg-white/10 text-white/50"
                        }`}>{tab.badge}</span>
                      )}
                      {activeTab === tab.id && <span className="text-white/60 text-xs">●</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-white/10 mt-2 space-y-2">
              <a
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/8 transition w-full"
              >
                <Eye className="w-4 h-4" />
                <span className="font-semibold text-sm">Preview Site</span>
              </a>
              <button
                onClick={() => { handleSave(); setMobileNavOpen(false); }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold text-sm hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-50 shadow-lg"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving…" : "Save All Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-2xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-4">
          <div className="flex justify-between items-center gap-3">

            {/* Left: Logo + Mobile Hamburger */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              <button
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 transition flex-shrink-0 border border-white/20"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open navigation"
              >
                <span className="flex flex-col gap-1.5">
                  <span className="w-4 h-0.5 bg-white rounded-full block" />
                  <span className="w-4 h-0.5 bg-white rounded-full block" />
                  <span className="w-3 h-0.5 bg-white rounded-full block" />
                </span>
              </button>

              {/* Logo */}
              <div className="hidden sm:flex w-10 h-10 bg-white/20 rounded-xl items-center justify-center backdrop-blur-sm flex-shrink-0">
                <span className="text-xl">⚡</span>
              </div>

              {/* Title - Desktop */}
              <div className="hidden md:block">
                <h1 className="text-xl font-bold tracking-tight">Portfolio Admin</h1>
                <p className="text-purple-100/70 text-xs">Content management</p>
              </div>

              {/* Current section indicator - Mobile only */}
              <div className="md:hidden min-w-0">
                <p className="text-white font-bold text-sm truncate">{activeTabEmoji} {activeTabLabel}</p>
                <p className="text-purple-200/60 text-xs truncate">{activeGroupLabel}</p>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* API Status Pill */}
              <button
                onClick={() => { checkApiKeyHealth(); setActiveTab('system'); }}
                title={apiKeyStatus === 'valid' ? 'AI Online' : apiKeyStatus === 'invalid' ? 'AI Offline — Click to fix' : 'Check AI status'}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border backdrop-blur-sm transition-all hover:scale-105 cursor-pointer"
                style={{
                  background: apiKeyStatus === 'valid' ? 'rgba(34,197,94,0.15)' : apiKeyStatus === 'invalid' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                  borderColor: apiKeyStatus === 'valid' ? 'rgba(34,197,94,0.4)' : apiKeyStatus === 'invalid' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)',
                }}
              >
                {apiKeyStatus === 'checking' ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-yellow-200" />
                ) : apiKeyStatus === 'valid' ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                  </span>
                ) : apiKeyStatus === 'invalid' ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-gray-400" />
                )}
                <span className={`text-[11px] font-semibold hidden sm:inline ${
                  apiKeyStatus === 'valid' ? 'text-green-200' : apiKeyStatus === 'invalid' ? 'text-red-200' : 'text-white/70'
                }`}>
                  {apiKeyStatus === 'valid' ? 'AI Online' : apiKeyStatus === 'invalid' ? 'AI Offline' : apiKeyStatus === 'checking' ? 'Checking…' : 'AI'}
                </span>
              </button>

              {/* Save Status Toast */}
              {saveStatus && (
                <div className={`hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  saveStatus.includes('✓') ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                  : saveStatus.includes('✗') ? 'bg-red-500/20 text-red-100 border border-red-400/30'
                  : 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30'
                }`}>
                  {saveStatus}
                </div>
              )}

              {/* Preview - Desktop only */}
              <a
                href="/"
                className="hidden md:flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white px-3 py-2 rounded-lg font-semibold hover:bg-white/20 transition border border-white/20 text-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </a>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-1.5 bg-white text-purple-600 px-3 md:px-5 py-2 rounded-lg font-bold hover:bg-purple-50 transition disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{loading ? "Saving…" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Desktop Tab Navigation (hidden on mobile) ── */}
        <div className="hidden md:block max-w-7xl mx-auto px-6">
          <div className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-hide">

            {/* ── Portfolio Content ── */}
            <div className="flex gap-0.5 border-r border-white/20 pr-2 mr-1">
              <span className="self-end pb-3 pr-1 text-[10px] font-bold uppercase tracking-widest text-white/30 whitespace-nowrap hidden lg:block">Portfolio</span>
              {["profile", "experience", "projects", "skills", "certifications", "social"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-3 font-semibold capitalize transition-all whitespace-nowrap text-sm ${
                    activeTab === tab
                      ? "text-white border-b-2 border-white bg-white/10"
                      : "text-purple-100 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* ── Career Hub ── */}
            <div className="flex gap-0.5 border-r border-white/20 pr-2 mr-1">
              <span className="self-end pb-3 pr-1 text-[10px] font-bold uppercase tracking-widest text-white/30 whitespace-nowrap hidden lg:block">Career</span>
              <button
                onClick={() => setActiveTab("resume")}
                className={`px-3.5 py-3 font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap text-sm ${
                  activeTab === "resume" ? "text-white border-b-2 border-white bg-white/10" : "text-purple-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Resume
                <span className="text-[10px] bg-yellow-400/20 text-yellow-100 px-1.5 py-0.5 rounded-full">AI</span>
              </button>
              <button
                onClick={() => setActiveTab("jobtracker")}
                className={`px-3.5 py-3 font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap text-sm ${
                  activeTab === "jobtracker" ? "text-white border-b-2 border-white bg-white/10" : "text-purple-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                Job Tracker
                <span className="text-[10px] bg-rose-400/20 text-rose-100 px-1.5 py-0.5 rounded-full">NEW</span>
              </button>
            </div>

            {/* ── Learning ── */}
            <div className="flex gap-0.5 border-r border-white/20 pr-2 mr-1">
              <span className="self-end pb-3 pr-1 text-[10px] font-bold uppercase tracking-widest text-white/30 whitespace-nowrap hidden lg:block">Learn</span>
              <button
                onClick={() => setActiveTab("coursework")}
                className={`px-3.5 py-3 font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap text-sm ${
                  activeTab === "coursework" ? "text-white border-b-2 border-white bg-white/10" : "text-purple-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Coursework
                <span className="text-[10px] bg-blue-400/20 text-blue-100 px-1.5 py-0.5 rounded-full">AI</span>
              </button>
              <button
                onClick={() => setActiveTab("skillbuilder")}
                className={`px-3.5 py-3 font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap text-sm ${
                  activeTab === "skillbuilder" ? "text-white border-b-2 border-white bg-white/10" : "text-purple-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Skill Builder
                <span className="text-[10px] bg-green-400/20 text-green-100 px-1.5 py-0.5 rounded-full">Beta</span>
              </button>
            </div>

            {/* ── System ── */}
            <div className="flex gap-0.5">
              <span className="self-end pb-3 pr-1 text-[10px] font-bold uppercase tracking-widest text-white/30 whitespace-nowrap hidden lg:block">System</span>
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3.5 py-3 font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap text-sm ${
                  activeTab === "chat" ? "text-white border-b-2 border-white bg-white/10" : "text-purple-100 hover:text-white hover:bg-white/5"
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                Chat
                <span className="text-[10px] bg-indigo-400/20 text-indigo-100 px-1.5 py-0.5 rounded-full">Bot</span>
              </button>
              <button
                onClick={() => setActiveTab("system")}
                className={`px-3.5 py-3 font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap text-sm ${
                  activeTab === "system" ? "text-white border-b-2 border-white bg-white/10" : "text-purple-100 hover:text-white hover:bg-white/5"
                }`}
              >
                {apiKeyStatus === 'valid' ? <ShieldCheck className="w-3.5 h-3.5" /> : apiKeyStatus === 'invalid' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                System
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  apiKeyStatus === 'valid' ? 'bg-green-400/20 text-green-100'
                  : apiKeyStatus === 'invalid' ? 'bg-red-400/30 text-red-100 animate-pulse'
                  : 'bg-slate-400/20 text-slate-200'
                }`}>
                  {apiKeyStatus === 'valid' ? '✓' : apiKeyStatus === 'invalid' ? '!' : '?'}
                </span>
              </button>
            </div>

          </div>
        </div>

        {/* ── Mobile: Section sub-tabs ── */}
        <div className="md:hidden max-w-7xl mx-auto px-4 pb-0">
          {(() => {
            const group = tabGroups.find(g => g.tabs.some(t => t.id === activeTab));
            if (!group || group.tabs.length <= 1) return null;
            return (
              <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0">
                {group.tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-shrink-0 px-3 py-2.5 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? "text-white border-b-2 border-white/90 bg-white/10"
                        : "text-purple-200/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{tab.emoji}</span>
                    {tab.label}
                    {tab.badge && (
                      <span className={`text-[9px] px-1 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-8 section-enter">
        {/* Profile Tab */}
        {activeTab === "profile" && (
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
                  About & Tagline
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
                  <p className="text-xs text-slate-400 mt-1.5">A concise, impactful one-liner about what you do</p>
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
                    placeholder="Tell your story... What drives you? What are your key strengths? What problems do you solve?"
                  />
                  <p className="text-xs text-slate-400 mt-1.5">2–3 paragraphs recommended</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <div className="space-y-5">
            {/* Header with Add Button */}
            <div className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden admin-card">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center text-sm">🎯</span>
                    Skills & Expertise
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Technical, business, and tool proficiencies</p>
                </div>
                <button
                  onClick={addSkill}
                  className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition shadow-lg flex items-center gap-1.5 text-sm"
                >
                  <span>+</span>
                  Add Skill
                </button>
              </div>
            </div>

            {/* Skills by Category */}
            {["technical", "business", "tools"].map((category) => {
              const categorySkills = portfolioData.skills.filter((s: any) => s.category === category);
              const categoryColors: Record<string, { bg: string; border: string; icon: string; label: string }> = {
                technical: { bg: "bg-purple-50", border: "border-purple-100", icon: "💻", label: "Technical Skills" },
                business: { bg: "bg-green-50", border: "border-green-100", icon: "📊", label: "Business Skills" },
                tools: { bg: "bg-orange-50", border: "border-orange-100", icon: "🛠️", label: "Tools & Platforms" },
              };
              const { bg, border, icon, label } = categoryColors[category] || { bg: "bg-slate-50", border: "border-slate-100", icon: "❓", label: "Other" };

              return (
                <div key={category} className={`bg-white rounded-2xl shadow-sm border ${border} overflow-hidden admin-card`}>
                  <div className={`${bg} px-4 md:px-6 py-3.5 border-b ${border} flex items-center gap-2`}>
                    <span className="text-base">{icon}</span>
                    <h3 className="text-base font-bold text-slate-900">{label}</h3>
                    <span className="text-xs font-normal text-slate-400 ml-1">({categorySkills.length})</span>
                  </div>
                  <div className="p-4 md:p-5">
                    {categorySkills.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400 text-sm">No {category} skills yet</p>
                        <button onClick={addSkill} className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-semibold">
                          + Add {category} skill
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {categorySkills.map((skill: any) => {
                          const index = portfolioData.skills.indexOf(skill);
                          return (
                            <div key={index} className="flex gap-2 items-center p-3 border-2 border-slate-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/20 transition-all">
                              <input
                                type="text"
                                value={skill.name}
                                onChange={(e) => updateSkill(index, "name", e.target.value)}
                                className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-base min-w-0"
                                placeholder="Skill name"
                              />
                              <select
                                value={skill.category}
                                onChange={(e) => updateSkill(index, "category", e.target.value)}
                                className="px-2.5 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white text-sm flex-shrink-0"
                              >
                                <option value="technical">Tech</option>
                                <option value="business">Biz</option>
                                <option value="tools">Tools</option>
                              </select>
                              <button
                                onClick={() => deleteSkill(index)}
                                className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition flex-shrink-0 border border-red-200"
                                title="Delete skill"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === "certifications" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 overflow-hidden admin-card">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 bg-yellow-100 rounded-lg flex items-center justify-center text-sm">🏅</span>
                    Certifications
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Used by Resume AI when tailoring your resume</p>
                </div>
                <button
                  onClick={() => {
                    const certs = portfolioData.certifications || [];
                    setPortfolioData({
                      ...portfolioData,
                      certifications: [
                        ...certs,
                        { id: Date.now(), name: "", issuer: "", year: new Date().getFullYear().toString() }
                      ]
                    });
                  }}
                  className="flex-shrink-0 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-2.5 rounded-xl font-bold hover:from-yellow-600 hover:to-amber-600 transition shadow-lg flex items-center gap-1.5 text-sm"
                >
                  <span>+</span>
                  Add Cert
                </button>
              </div>
            </div>

            {/* Certifications List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden admin-card">
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50/50 px-4 md:px-6 py-3.5 border-b border-slate-200 flex items-center gap-2">
                <span>🏅</span>
                <h3 className="text-base font-bold text-slate-900">Your Certifications</h3>
                <span className="text-xs font-normal text-slate-400">({(portfolioData.certifications || []).length})</span>
              </div>
              <div className="p-4 md:p-5">
                {(!portfolioData.certifications || portfolioData.certifications.length === 0) ? (
                  <div className="text-center py-10 border-2 border-dashed border-yellow-200 rounded-xl">
                    <p className="text-slate-400">No certifications added yet</p>
                    <p className="text-slate-300 text-sm mt-1">Click &quot;Add Cert&quot; to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {portfolioData.certifications.map((cert: any, certIdx: number) => (
                      <div
                        key={cert.id ?? certIdx}
                        className="p-4 border-2 border-slate-100 rounded-xl hover:border-yellow-200 hover:bg-yellow-50/20 transition-all"
                      >
                        {/* Mobile: stacked layout */}
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={cert.name}
                            onChange={(e) => {
                              const updated = [...portfolioData.certifications];
                              updated[certIdx] = { ...updated[certIdx], name: e.target.value };
                              setPortfolioData({ ...portfolioData, certifications: updated });
                            }}
                            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white text-base font-medium min-w-0"
                            placeholder="Certification name"
                          />
                          <button
                            onClick={() => {
                              const updated = portfolioData.certifications.filter((_: any, i: number) => i !== certIdx);
                              setPortfolioData({ ...portfolioData, certifications: updated });
                            }}
                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition border border-red-200 flex-shrink-0"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input
                              type="text"
                              value={cert.issuer}
                              onChange={(e) => {
                                const updated = [...portfolioData.certifications];
                                updated[certIdx] = { ...updated[certIdx], issuer: e.target.value };
                                setPortfolioData({ ...portfolioData, certifications: updated });
                              }}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white text-base"
                              placeholder="Issuer (e.g. AWS)"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={cert.year}
                              onChange={(e) => {
                                const updated = [...portfolioData.certifications];
                                updated[certIdx] = { ...updated[certIdx], year: e.target.value };
                                setPortfolioData({ ...portfolioData, certifications: updated });
                              }}
                              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white text-base text-center"
                              placeholder="Year"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === "experience" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden admin-card">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center text-sm">💼</span>
                    Work Experience
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Professional journey and accomplishments</p>
                </div>
                <button
                  onClick={addExperience}
                  className="flex-shrink-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-emerald-700 hover:to-green-700 transition shadow-lg flex items-center gap-1.5 text-sm"
                >
                  <span>+</span>
                  Add
                </button>
              </div>
            </div>
            
            {/* Experience List */}
            <div className="space-y-5">{portfolioData.experience.map((exp: any, expIndex: number) => {
                // Handle both legacy single-role and new multi-position format
                const positions = exp.positions || (exp.role ? [{
                  role: exp.role,
                  period: exp.period,
                  description: exp.description,
                  tags: exp.tags || []
                }] : []);

                return (
                  <div key={expIndex} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow admin-card">
                    {/* Company Header */}
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 md:px-6 py-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        {exp.logo && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border-2 border-slate-200 p-1.5 flex-shrink-0 shadow-sm">
                            <img
                              src={exp.logo}
                              alt="Company logo"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'%3E✗%3C/text%3E%3C/svg%3E";
                              }}
                            />
                          </div>
                        )}
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => updateExperience(expIndex, "company", e.target.value)}
                          className="flex-1 px-3 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-base md:text-lg bg-white min-w-0 text-base"
                          placeholder="Company Name"
                        />
                        <button
                          onClick={() => deleteExperience(expIndex)}
                          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition border border-red-200"
                          title="Delete company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Company Details */}
                    <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Logo Upload */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company Logo</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={exp.logo || ""}
                              onChange={(e) => updateExperience(expIndex, "logo", e.target.value)}
                              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 text-base bg-white min-w-0"
                              placeholder="Logo path..."
                            />
                            <label className="cursor-pointer w-10 h-10 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex-shrink-0">
                              📤
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleCompanyLogoUpload(expIndex, file); }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {/* Website */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Website</label>
                          <input
                            type="url"
                            value={exp.website || ""}
                            onChange={(e) => updateExperience(expIndex, "website", e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-base"
                            placeholder="https://company.com"
                          />
                        </div>

                        {/* Location */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location</label>
                          <input
                            type="text"
                            value={exp.location || ""}
                            onChange={(e) => updateExperience(expIndex, "location", e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white text-base"
                            placeholder="City, State or Remote"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Positions */}
                    <div className="p-4 md:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                          <span>📝</span>
                          Positions
                          {positions.length > 0 && (
                            <span className="text-sm font-normal text-slate-400">({positions.length})</span>
                          )}
                        </h3>
                        <button
                          onClick={() => addPosition(expIndex)}
                          className="bg-emerald-500 text-white px-3 py-2 rounded-xl hover:bg-emerald-600 transition font-semibold text-sm flex items-center gap-1.5"
                        >
                          <span>+</span>
                          Add Position
                        </button>
                      </div>

                      {positions.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                          <p className="text-slate-400 text-sm mb-2">No positions added yet</p>
                          <button onClick={() => addPosition(expIndex)} className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold">
                            + Add your first position
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {positions.map((position: any, posIndex: number) => (
                            <div key={posIndex} className="p-4 border-2 border-slate-100 rounded-xl bg-white hover:border-emerald-200 transition-all">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-full">
                                  Position {posIndex + 1}{posIndex === 0 && positions.length > 1 && " · Current"}
                                </span>
                                <button
                                  onClick={() => deletePosition(expIndex, posIndex)}
                                  className="text-xs px-3 py-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition font-semibold border border-red-200"
                                >
                                  Remove
                                </button>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Job Title</label>
                                    <input
                                      type="text"
                                      value={position.role}
                                      onChange={(e) => updatePosition(expIndex, posIndex, "role", e.target.value)}
                                      className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                                      placeholder="e.g., Senior Business Specialist"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Period</label>
                                    <input
                                      type="text"
                                      value={position.period}
                                      onChange={(e) => updatePosition(expIndex, posIndex, "period", e.target.value)}
                                      className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                                      placeholder="Jan 2023 — Present"
                                    />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
                                  <textarea
                                    value={position.description}
                                    onChange={(e) => updatePosition(expIndex, posIndex, "description", e.target.value)}
                                    rows={4}
                                    className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none text-base"
                                    placeholder="Describe your responsibilities and achievements..."
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">Hidden</span>
                                    Technical / AI Details
                                  </label>
                                  <textarea
                                    value={position.technicalDetails || ""}
                                    onChange={(e) => updatePosition(expIndex, posIndex, "technicalDetails", e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2.5 border-2 border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30 resize-none text-base"
                                    placeholder="Technical details for AI context (not public)"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Skills/Tags (comma separated)</label>
                                  <input
                                    type="text"
                                    value={position.tags?.join(", ") || ""}
                                    onChange={(e) => updatePosition(expIndex, posIndex, "tags", e.target.value.split(",").map((t: string) => t.trim()))}
                                    className="w-full px-3 py-2.5 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                                    placeholder="Business Analysis, CRM, Strategy"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}</div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === "projects" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden admin-card">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center text-sm">🚀</span>
                    Projects & Portfolio
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Showcase your best work</p>
                </div>
                <button
                  onClick={addProject}
                  className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg flex items-center gap-1.5 text-sm"
                >
                  <span>+</span>
                  Add
                </button>
              </div>
            </div>

            {/* AI Data Processor Section */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-100 overflow-hidden mb-8">
              <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between cursor-pointer" onClick={() => setProcessorInput(processorInput ? "" : " ")}>
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
                      <select
                        value={processorCategory}
                        onChange={(e) => setProcessorCategory(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="auto">Auto-Detect</option>
                        <option value="project">Project</option>
                        <option value="experience">Experience (Job)</option>
                        <option value="skill">Skill</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Raw Information</label>
                      <textarea
                        value={processorInput}
                        onChange={(e) => setProcessorInput(e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                        placeholder="Paste project details, technical notes, job descriptions, or skills here..."
                      />
                    </div>

                    <button
                      onClick={handleProcessData}
                      disabled={processing || !processorInput.trim()}
                      className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Process with AI
                        </>
                      )}
                    </button>
                  </div>

                  <div className="border-l-2 border-slate-100 pl-6 flex flex-col">
                    <h4 className="font-bold text-slate-700 mb-4">Processed Result</h4>
                    {processorResult ? (
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-auto max-h-[200px] flex-1">
                          <pre className="text-xs text-slate-800 font-mono whitespace-pre-wrap">
                            {JSON.stringify(processorResult, null, 2)}
                          </pre>
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setProcessorResult(null);
                              setProcessorTarget(null);
                            }}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-semibold hover:bg-slate-50 transition"
                          >
                            Discard
                          </button>
                          <button
                            onClick={handleAddToPortfolio}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg"
                          >
                            {processorTarget ? "Update Project" : "Add to Portfolio"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                        <FileText className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">Processed data will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Projects List */}
            <div className="space-y-6">
              {portfolioData.projects.map((project: any, index: number) => (
                <div key={index} className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Project Header */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b-2 border-slate-200">
                    <input
                      type="text"
                      value={project.title}
                      onChange={(e) => updateProject(index, "title", e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-xl bg-white"
                      placeholder="Project Title"
                    />
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Public Description
                      </label>
                      <textarea
                        value={project.description}
                        onChange={(e) => updateProject(index, "description", e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                        placeholder="Describe what this project does and why it matters..."
                      />
                    </div>

                    {/* Technical Details (Hidden) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs uppercase font-bold tracking-wide">Hidden from Public</span>
                          Technical / AI Context
                        </label>
                        <button
                          onClick={() => {
                            // Pre-fill the processor with current details if empty
                            if (!processorInput && project.technicalDetails) {
                              setProcessorInput(project.technicalDetails);
                              setProcessorCategory("project");
                            }
                            // Set target specifically for this project
                            setProcessorTarget({ index, mode: 'update' });
                            // Scroll to top where processor is
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-800 font-semibold"
                        >
                          <Sparkles className="w-3 h-3" />
                          Process with AI
                        </button>
                      </div>
                      <textarea
                        value={project.technicalDetails || ""}
                        onChange={(e) => updateProject(index, "technicalDetails", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-50/30 resize-none"
                        placeholder="Add implementation details, architecture notes, or AI training context..."
                      />
                    </div>

                    {/* Tags and Link */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Technologies/Tags
                        </label>
                        <input
                          type="text"
                          value={project.tags.join(", ")}
                          onChange={(e) => updateProject(index, "tags", e.target.value.split(",").map((t: string) => t.trim()))}
                          className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="React, Node.js, Python"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                          Project Link/URL
                        </label>
                        <input
                          type="text"
                          value={project.link}
                          onChange={(e) => updateProject(index, "link", e.target.value)}
                          className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="https://github.com/..."
                        />
                      </div>
                    </div>
                    
                    {/* Project Images */}
                    <div className="space-y-3 border-t-2 border-slate-200 pt-6">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                          <span>🖼️</span>
                          Project Images
                          {project.images && project.images.length > 0 && (
                            <span className="text-xs font-normal text-slate-500">({project.images.length})</span>
                          )}
                        </label>
                        <div className="flex gap-2">
                          <label className="cursor-pointer text-xs bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold">
                            📤 Upload
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleFileInputChange(index, e)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => addProjectImage(index)}
                            className="text-xs bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold"
                          >
                            + Add URL
                          </button>
                        </div>
                      </div>
                      
                      {/* Drag and Drop */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(index, e)}
                        className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50/50 hover:bg-blue-100/50 transition cursor-pointer"
                      >
                        <p className="text-sm text-blue-700 font-semibold">
                          🖼️ Drag & drop an image here
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Supports: JPG, PNG, GIF, WebP (max 5MB)
                        </p>
                      </div>
                      
                      {/* Image List */}
                      {project.images && project.images.length > 0 ? (
                        <div className="grid md:grid-cols-2 gap-3">
                          {project.images.map((img: string, imgIdx: number) => (
                            <div key={imgIdx} className="flex gap-3 items-center p-3 border-2 border-slate-200 rounded-lg bg-slate-50 hover:border-indigo-300 transition">
                              <div className="flex-shrink-0">
                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 border-2 border-slate-200">
                                  {img ? (
                                    <img
                                      src={img}
                                      alt={`Preview ${imgIdx + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='12'%3E✗%3C/text%3E%3C/svg%3E";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                                      No URL
                                    </div>
                                  )}
                                </div>
                              </div>
                              <input
                                type="text"
                                value={img}
                                onChange={(e) => updateProjectImage(index, imgIdx, e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                placeholder="Image URL..."
                              />
                              <div className="flex flex-col gap-1">
                                <label className="cursor-pointer px-2 py-1 bg-blue-500 text-white rounded text-xs whitespace-nowrap hover:bg-blue-600 transition text-center">
                                  ↻
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleImageUpload(index, file, imgIdx);
                                      }
                                    }}
                                    className="hidden"
                                  />
                                </label>
                                <button
                                  type="button"
                                  onClick={() => deleteProjectImage(index, imgIdx)}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                          <p className="text-sm text-slate-500">No images added yet</p>
                        </div>
                      )}
                    </div>
                    
                    
                    {/* Options */}
                    <div className="flex items-center justify-between pt-6 border-t-2 border-slate-200">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`featured-${index}`}
                            checked={project.featured || false}
                            onChange={(e) => updateProject(index, "featured", e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor={`featured-${index}`} className="text-sm font-semibold text-slate-700 cursor-pointer">
                            ⭐ Featured Project
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`demo-${index}`}
                            checked={project.hasLiveDemo !== false}
                            onChange={(e) => updateProject(index, "hasLiveDemo", e.target.checked)}
                            className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <label htmlFor={`demo-${index}`} className="text-sm font-semibold text-slate-700 cursor-pointer">
                            🔗 Has Live Demo
                          </label>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteProject(index)}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <span>🗑️</span>
                        Delete Project
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links Tab */}
        {activeTab === "social" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-cyan-100 overflow-hidden admin-card">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 px-4 md:px-6 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 bg-cyan-100 rounded-lg flex items-center justify-center text-sm">🔗</span>
                    Social Links & Contact
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Professional social media and contact links</p>
                </div>
                <button
                  onClick={addSocialLink}
                  className="flex-shrink-0 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-cyan-700 hover:to-blue-700 transition shadow-lg flex items-center gap-1.5 text-sm"
                >
                  <span>+</span>
                  Add Link
                </button>
              </div>
            </div>

            {/* Social Links List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden admin-card">
              <div className="p-4 md:p-5">
                {portfolioData.socialLinks.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-slate-400 text-sm mb-2">No social links added yet</p>
                    <button onClick={addSocialLink} className="text-sm text-cyan-600 hover:text-cyan-700 font-semibold">
                      + Add your first link
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {portfolioData.socialLinks.map((link: any, index: number) => (
                      <div key={index} className="p-4 border-2 border-slate-100 rounded-xl hover:border-cyan-200 hover:bg-cyan-50/20 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <select
                            value={link.icon}
                            onChange={(e) => updateSocialLink(index, "icon", e.target.value)}
                            className="flex-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 font-semibold bg-white text-base"
                          >
                            <option value="github">🐙 GitHub</option>
                            <option value="linkedin">💼 LinkedIn</option>
                            <option value="twitter">🐦 Twitter</option>
                            <option value="globe">🌐 Website</option>
                            <option value="mail">✉️ Email</option>
                          </select>
                          <button
                            onClick={() => deleteSocialLink(index)}
                            className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition border border-red-200 flex-shrink-0"
                            title="Delete link"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateSocialLink(index, "label", e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 mb-2 text-base"
                          placeholder="Display Label"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono text-sm"
                          placeholder="https://..."
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Preview */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-lg p-5 md:p-6 text-white admin-card">
              <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                <span>👁️</span>
                Live Preview
              </h3>
              <div className="flex flex-wrap gap-2">
                {portfolioData.socialLinks.map((link: any, idx: number) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all text-sm font-semibold backdrop-blur-sm"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Coursework Analysis Tab */}
        {activeTab === "coursework" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg p-8 text-white">
              <h2 className="text-3xl font-bold mb-4">Coursework AI Analysis</h2>
              <p className="text-blue-100 text-lg">
                Upload your assignments, diagrams, or project files. 
                AI will analyze them and generate professional project descriptions for your portfolio.
              </p>
              <div className="mt-4 bg-blue-500/30 rounded-lg p-3 text-sm">
                <p className="font-semibold mb-1">💡 Tip: You can select multiple files at once!</p>
                <p className="text-blue-50">Hold Ctrl (Windows/Linux) or Cmd (Mac) to select multiple files, or click "Add More Files" after selecting.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              {/* Text Input Area */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Paste Text Content
                </label>
                <textarea
                  value={courseworkText}
                  onChange={(e) => setCourseworkText(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px]"
                  placeholder="Paste text from your assignment, project description, or notes here..."
                />
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="file"
                  id="coursework-upload"
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const currentFiles = [...courseworkFiles];
                    
                    if (currentFiles.length + files.length > 10) {
                      alert("Maximum 10 files allowed");
                      return;
                    }
                    
                    const validFiles = files.filter(file => {
                      if (file.size > 10 * 1024 * 1024) {
                        alert(`File ${file.name} is too large (max 10MB)`);
                        return false;
                      }
                      return true;
                    });
                    
                    if (validFiles.length > 0) {
                      setCourseworkFiles([...currentFiles, ...validFiles]);
                    }
                  }}
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
                />
                <label htmlFor="coursework-upload" className="cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-semibold text-slate-700 mb-2">
                    {courseworkFiles.length > 0
                      ? `${courseworkFiles.length} file${courseworkFiles.length > 1 ? "s" : ""} selected`
                      : "Click to select multiple files"}
                  </p>
                  <p className="text-sm text-slate-500 mb-3">
                    Supports PDF, DOCX, PNG, JPG (Max 10MB each, up to 10 files)
                  </p>
                  <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                    {courseworkFiles.length > 0 ? "Add More Files" : "Select Files"}
                  </div>
                </label>
              </div>

              {/* File List */}
              {courseworkFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700">Selected Files ({courseworkFiles.length}/10)</h4>
                    <button
                      onClick={() => setCourseworkFiles([])}
                      className="text-sm text-red-600 hover:text-red-700 font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {courseworkFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCourseworkFiles(courseworkFiles.filter((_, i) => i !== index));
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-semibold ml-3"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleCourseworkUpload}
                  disabled={(courseworkFiles.length === 0 && !courseworkText.trim()) || analyzingCoursework}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {analyzingCoursework ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {analysisResult && (
              <div className="bg-white rounded-xl shadow-sm p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b pb-4">
                  <h3 className="text-2xl font-bold text-slate-900">Analysis Result</h3>
                  <button
                    onClick={addAnalyzedProject}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Add to Projects
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={analysisResult.title}
                      readOnly
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      value={analysisResult.description}
                      readOnly
                      rows={6}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.tags?.map((tag: string, i: number) => (
                        <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {analysisResult.key_features && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Key Features</label>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 bg-slate-50 p-4 rounded-lg">
                        {analysisResult.key_features.map((feature: string, i: number) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Resume Tailoring Tab */}
        {activeTab === "resume" && (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg px-4 md:px-6 py-5 text-white admin-card">
              <div className="flex items-center gap-2.5 mb-2">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
                <h2 className="text-lg md:text-2xl font-bold">AI Resume Tailoring</h2>
              </div>
              <p className="text-purple-100 text-sm md:text-base leading-relaxed">
                Automatically tailor your resume to any job description using AI. 
                Paste a job posting below and get a perfectly optimized LaTeX resume.
              </p>
            </div>

            {/* Resume Template Section - LIVE EDITOR */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden admin-card">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 md:px-6 py-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Eye className="w-5 h-5 flex-shrink-0" />
                    <h3 className="text-base md:text-xl font-bold truncate">Resume Template Editor</h3>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={toggleEditMode}
                      className="bg-white text-blue-600 px-3 py-2 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-1.5 text-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {editMode ? "View" : "Edit"}
                    </button>
                    {templateData?.pdfExists && (
                      <button
                        onClick={() => downloadTexFile('resume_template.pdf')}
                        className="bg-green-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-600 transition flex items-center gap-1.5 text-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!editMode ? (
                /* VIEW MODE - PDF Preview */
                <div className="p-4 md:p-5">
                  {templateData?.pdfExists ? (
                    <div className="space-y-4">
                      {/* Status Bar */}
                      <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-green-700">Status:</span>
                            <span className="text-green-600">✓ Compiled</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-green-700">Size:</span>
                            <span className="text-green-600">
                              {(templateData.pdfSize / 1024).toFixed(2)} KB
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="font-medium text-green-700">Modified:</span>
                            <span className="text-green-600 text-xs">
                              {new Date(templateData.pdfModified).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* PDF Viewer */}
                      <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                        <iframe
                          key={pdfKey}
                          src={`/api/resume/download?file=resume_template.pdf#view=FitH`}
                          className="w-full h-[500px] md:h-[800px]"
                          title="Resume Preview"
                        />
                      </div>

                      <div className="text-center text-xs md:text-sm text-slate-500">
                        <p>👆 Live resume preview. Tap <strong>&quot;Edit&quot;</strong> to make changes.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-slate-700 mb-2">No PDF Available</h4>
                      <p className="text-slate-500 text-sm mb-4">Compile your template to see the preview</p>
                      <button
                        onClick={compileTemplate}
                        disabled={compilingTemplate}
                        className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 inline-flex items-center gap-2"
                      >
                        {compilingTemplate ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Compiling...
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5" />
                            Compile Now
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* EDIT MODE - Stacked on mobile, split on desktop */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-5">
                  {/* Code Editor */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">LaTeX Source Code</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="autoCompile"
                          checked={autoCompile}
                          onChange={(e) => setAutoCompile(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="autoCompile" className="text-xs text-slate-600 whitespace-nowrap">
                          Auto-compile
                        </label>
                      </div>
                    </div>
                    
                    <textarea
                      value={templateContent}
                      onChange={(e) => setTemplateContent(e.target.value)}
                      className="w-full h-[400px] md:h-[700px] px-3 py-3 border-2 border-slate-300 rounded-xl font-mono text-xs bg-slate-900 text-green-400 focus:ring-2 focus:ring-blue-500 resize-none"
                      spellCheck={false}
                      placeholder="LaTeX code will appear here..."
                    />

                    <button
                      onClick={() => saveTemplate(false)}
                      disabled={savingTemplate}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3.5 rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {savingTemplate ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving & Compiling...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save {autoCompile && "& Compile"}
                        </>
                      )}
                    </button>
                  </div>

                  {/* PDF Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Live Preview</h4>
                      {isAutoSaving && (
                        <span className="text-xs text-blue-600 flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Updating...
                        </span>
                      )}
                    </div>
                    
                    {templateData?.pdfExists ? (
                      <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-100">
                        <iframe
                          src={`/api/resume/download?file=resume_template.pdf&t=${pdfKey}#view=FitH`}
                          className="w-full h-[400px] md:h-[700px]"
                          title="Resume Preview"
                        />
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-xl h-[300px] md:h-[700px] flex items-center justify-center bg-slate-50">
                        <div className="text-center">
                          <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-600 font-medium text-sm">No preview yet</p>
                          <p className="text-xs text-slate-400 mt-1">Save with auto-compile enabled</p>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-slate-600 bg-blue-50 p-3 rounded-xl border border-blue-200">
                      <p><strong>💡 Tip:</strong> Edit the LaTeX on the left, then click &quot;Save &amp; Compile&quot; to see changes!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Section */}
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 admin-card">
              <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">Job Description</h3>
              
              <div className="space-y-4">
                {/* Company + Role */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 md:p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div>
                    <label className="block text-xs font-semibold text-purple-800 mb-1.5">
                      🏢 Company Name <span className="font-normal text-purple-500">(saved to Job Tracker)</span>
                    </label>
                    <input
                      type="text"
                      value={tailorCompany}
                      onChange={(e) => setTailorCompany(e.target.value)}
                      placeholder="e.g. Airbus, Google, McKinsey"
                      className="w-full px-3 py-2.5 border border-purple-300 rounded-lg text-base focus:ring-2 focus:ring-purple-500 bg-white"
                      disabled={tailoringInProgress}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-purple-800 mb-1.5">
                      💼 Job Title <span className="font-normal text-purple-500">(saved to Job Tracker)</span>
                    </label>
                    <input
                      type="text"
                      value={tailorRole}
                      onChange={(e) => setTailorRole(e.target.value)}
                      placeholder="e.g. Business Analyst, Software Engineer"
                      className="w-full px-3 py-2.5 border border-purple-300 rounded-lg text-base focus:ring-2 focus:ring-purple-500 bg-white"
                      disabled={tailoringInProgress}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Paste the full job description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                    placeholder="Paste the entire job posting here..."
                    disabled={tailoringInProgress}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Resume Filename (optional)
                  </label>
                  <input
                    type="text"
                    value={resumeFileName}
                    onChange={(e) => setResumeFileName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 text-base"
                    placeholder="e.g., Google_Software_Engineer (auto-generated if blank)"
                    disabled={tailoringInProgress}
                  />
                </div>

                <button
                  onClick={handleTailorResume}
                  disabled={tailoringInProgress || !jobDescription.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-4 rounded-xl font-bold text-base md:text-lg hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {tailoringInProgress ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      AI is tailoring your resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Tailor Resume with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Section */}
            {tailoringError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <h3 className="text-lg font-bold text-red-700 mb-2">⚠️ Tailoring Failed</h3>
                <p className="text-red-600 text-sm">{tailoringError}</p>
                <p className="text-red-500 text-xs mt-2">Check the server console for more details.</p>
              </div>
            )}

            {/* Results Section */}
            {tailoringResult && (
              <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 space-y-5 admin-card">
                {/* Success header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <h3 className="text-base md:text-xl font-bold text-green-600 flex items-center gap-2">
                    ✓ Resume{tailoringResult.coverLetterFilename ? ' & Cover Letter' : ''} Tailored!
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {tailoringResult.pdfCompiled && (
                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        Resume PDF ✓
                      </span>
                    )}
                    {tailoringResult.coverLetterPdfCompiled && (
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        Cover Letter PDF ✓
                      </span>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-1.5 text-sm">Tailoring Strategy:</h4>
                  <p className="text-purple-800 text-sm">
                    {tailoringResult.tailored_content?.tailoring_summary || "Resume optimized for the job requirements"}
                  </p>
                </div>

                {/* Job Analysis */}
                {tailoringResult.job_analysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-1 text-xs uppercase tracking-wide">Primary Focus</h4>
                      <p className="text-slate-700 text-sm">{tailoringResult.job_analysis.primary_focus}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-1 text-xs uppercase tracking-wide">Seniority Level</h4>
                      <p className="text-slate-700 text-sm capitalize">{tailoringResult.job_analysis.seniority_level}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wide">Key Skills Matched</h4>
                      <div className="flex flex-wrap gap-1">
                        {tailoringResult.job_analysis.technical_skills?.slice(0, 5).map((skill: string, idx: number) => (
                          <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <h4 className="font-bold text-slate-700 mb-1 text-xs uppercase tracking-wide">Content Selected</h4>
                      <p className="text-slate-700 text-sm">
                        {tailoringResult.tailored_content?.selected_work_experience?.reduce((sum: number, job: any) => sum + (job.bullets?.length || 0), 0) || 0} work bullets, {' '}
                        {tailoringResult.tailored_content?.selected_projects?.reduce((sum: number, proj: any) => sum + (proj.bullets?.length || 0), 0) || 0} project bullets
                      </p>
                    </div>
                  </div>
                )}

                {/* Debug Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800">
                  <strong>Debug:</strong> pdfCompiled={String(tailoringResult.pdfCompiled)}, pdfFilename={tailoringResult.pdfFilename || 'null'}
                </div>

                {/* Live PDF Previews */}
                <div className="space-y-5">
                  {/* Resume Preview */}
                  {tailoringResult.pdfCompiled && tailoringResult.pdfFilename ? (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm md:text-base">📄 Resume Preview</h4>
                      <div className="border-2 border-green-200 rounded-xl overflow-hidden bg-slate-100 shadow">
                        <iframe
                          src={`/api/resume/download?file=${encodeURIComponent(tailoringResult.pdfFilename)}&t=${Date.now()}#view=FitH`}
                          className="w-full h-[500px] md:h-[800px]"
                          title="Tailored Resume Preview"
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-center">✨ Your AI-tailored resume</p>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                      <p className="text-orange-800 text-sm">⏳ Resume PDF is being compiled... If this doesn&apos;t update, check the console logs.</p>
                    </div>
                  )}

                  {/* Cover Letter Preview */}
                  {tailoringResult.coverLetterPdfCompiled && tailoringResult.coverLetterPdfFilename && (
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm md:text-base">✉️ Cover Letter Preview</h4>
                      <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-slate-100 shadow">
                        <iframe
                          src={`/api/resume/download?file=${encodeURIComponent(tailoringResult.coverLetterPdfFilename)}&t=${Date.now()}#view=FitH`}
                          className="w-full h-[500px] md:h-[800px]"
                          title="Cover Letter Preview"
                        />
                      </div>
                      <p className="text-xs text-slate-500 text-center">✨ Your AI-generated cover letter</p>
                    </div>
                  )}
                </div>

                {/* Download Buttons */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm md:text-base">📥 Downloads</h4>
                  
                  {/* Resume Downloads */}
                  <div>
                    <h5 className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wide">Resume</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {tailoringResult.pdfCompiled && tailoringResult.pdfFilename && (
                        <button
                          onClick={() => downloadTexFile(tailoringResult.pdfFilename)}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition flex items-center justify-center gap-2 shadow text-sm"
                        >
                          <Download className="w-4 h-4" />
                          PDF Resume
                        </button>
                      )}
                      <button
                        onClick={() => downloadTexFile(tailoringResult.filename)}
                        className="bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        LaTeX Source
                      </button>
                      <button
                        onClick={() => downloadAnalysis(
                          { job_analysis: tailoringResult.job_analysis, tailored_content: tailoringResult.tailored_content },
                          tailoringResult.filename.replace('.tex', '_analysis.json')
                        )}
                        className="bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2 text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Analysis JSON
                      </button>
                    </div>
                  </div>

                  {/* Cover Letter Downloads */}
                  {tailoringResult.coverLetterFilename && (
                    <div>
                      <h5 className="font-semibold text-slate-600 mb-2 text-xs uppercase tracking-wide">Cover Letter</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tailoringResult.coverLetterPdfCompiled && tailoringResult.coverLetterPdfFilename && (
                          <button
                            onClick={() => downloadTexFile(tailoringResult.coverLetterPdfFilename)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 shadow text-sm"
                          >
                            <Download className="w-4 h-4" />
                            PDF Cover Letter
                          </button>
                        )}
                        <button
                          onClick={() => downloadTexFile(tailoringResult.coverLetterFilename)}
                          className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          LaTeX Cover Letter
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2 text-sm">
                    {tailoringResult.pdfCompiled ? '✅' : '📄'} Next Steps
                  </h4>
                  {tailoringResult.pdfCompiled ? (
                    <ol className="list-decimal list-inside space-y-1 text-green-800 text-sm">
                      <li><strong>Download the PDF Resume</strong> — ready to submit!</li>
                      {tailoringResult.coverLetterPdfCompiled && (
                        <li><strong>Download the PDF Cover Letter</strong> — personalized for this job!</li>
                      )}
                      <li>Review the tailored content for accuracy</li>
                      <li>Optional: Download LaTeX files for customization</li>
                    </ol>
                  ) : (
                    <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
                      <li>Download the LaTeX file above</li>
                      <li>Review the tailored content</li>
                      <li>Compile: <code className="bg-blue-100 px-1 rounded text-xs">xelatex {tailoringResult.filename}</code></li>
                    </ol>
                  )}
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-white rounded-2xl shadow-sm p-4 md:p-5 admin-card">
              <h3 className="text-base md:text-lg font-bold text-slate-900 mb-4">How It Works</h3>
              <div className="space-y-3 text-slate-700">
                {[
                  { n: "1", color: "purple", text: <><strong>AI analyzes</strong> the job description to extract required skills, keywords, and experience areas</> },
                  { n: "2", color: "purple", text: <><strong>Selects the most relevant</strong> experiences and projects from your resume database</> },
                  { n: "3", color: "purple", text: <><strong>Reframes bullet points</strong> to emphasize matching keywords while maintaining accuracy</> },
                  { n: "4", color: "purple", text: <><strong>Generates a professional</strong> LaTeX resume optimized for ATS and human reviewers</> },
                  { n: "5", color: "blue", text: <><strong>Creates a cover letter</strong> tailored to the job, highlighting your most relevant achievements</> },
                ].map(({ n, color, text }) => (
                  <div key={n} className="flex items-start gap-3">
                    <div className={`bg-${color}-100 text-${color}-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-xs`}>{n}</div>
                    <p className="text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── System Status Tab ─────────────────────────────────────────────── */}
        {activeTab === "system" && (
          <div className="space-y-6">

            {/* Header */}
            <div className={`rounded-xl shadow-lg p-8 text-white ${
              apiKeyStatus === 'valid'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                : apiKeyStatus === 'invalid'
                ? 'bg-gradient-to-r from-red-600 to-rose-600'
                : 'bg-gradient-to-r from-slate-600 to-slate-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {apiKeyStatus === 'valid'
                    ? <ShieldCheck className="w-8 h-8" />
                    : apiKeyStatus === 'invalid'
                    ? <ShieldAlert className="w-8 h-8" />
                    : <Activity className="w-8 h-8" />}
                  <div>
                    <h2 className="text-3xl font-bold">System Status</h2>
                    <p className="text-white/80 text-sm mt-1">
                      {apiKeyStatus === 'valid' && 'All systems operational — Gemini is connected and responding.'}
                      {apiKeyStatus === 'invalid' && 'Gemini API key is invalid or revoked. Follow the steps below to fix it.'}
                      {apiKeyStatus === 'checking' && 'Running diagnostics…'}
                      {apiKeyStatus === 'unknown' && 'Run a check to see the current API key status.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={checkApiKeyHealth}
                  disabled={checkingApiKey}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${checkingApiKey ? 'animate-spin' : ''}`} />
                  {checkingApiKey ? 'Checking…' : 'Re-check Now'}
                </button>
              </div>
            </div>

            {/* ── Diagnostic Cards ── */}
            {apiKeyDiag && (
              <div className="grid md:grid-cols-3 gap-4">
                {/* Gemini Test */}
                <div className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                  apiKeyDiag.gemini_test?.ok ? 'border-green-300' : 'border-red-300'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {apiKeyDiag.gemini_test?.ok
                      ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                      : <XCircle className="w-6 h-6 text-red-600" />}
                    <h3 className="font-bold text-slate-900">Gemini Connection</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status</span>
                      <span className={`font-semibold ${apiKeyDiag.gemini_test?.ok ? 'text-green-600' : 'text-red-600'}`}>
                        {apiKeyDiag.gemini_test?.ok ? `HTTP ${apiKeyDiag.gemini_test.status} OK` : `HTTP ${apiKeyDiag.gemini_test?.status ?? '—'} Error`}
                      </span>
                    </div>
                    {!apiKeyDiag.gemini_test?.ok && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <p className="text-red-700 text-xs font-medium">{apiKeyDiag.gemini_test?.error_code}</p>
                        <p className="text-red-600 text-xs mt-1">{apiKeyDiag.gemini_test?.error_message}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Details */}
                <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <KeyRound className="w-6 h-6 text-indigo-600" />
                    <h3 className="font-bold text-slate-900">Key Details</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {[
                      { label: 'Prefix', value: apiKeyDiag.key_diagnostics?.prefix_12 + '…' },
                      { label: 'Suffix', value: '…' + apiKeyDiag.key_diagnostics?.suffix_6 },
                      { label: 'Length', value: `${apiKeyDiag.key_diagnostics?.raw_length} chars` },
                      { label: 'Format', value: apiKeyDiag.key_diagnostics?.starts_with_AIza ? 'AIza* ✓' : 'Invalid ✗' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-mono text-slate-800 text-xs font-semibold">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source */}
                <div className={`bg-white rounded-xl shadow-sm p-6 border-2 ${
                  apiKeyDiag.env_source_clues?.loaded_from_env_local ? 'border-green-200' : 'border-amber-300'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    {apiKeyDiag.env_source_clues?.loaded_from_env_local
                      ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                      : <AlertTriangle className="w-6 h-6 text-amber-500" />}
                    <h3 className="font-bold text-slate-900">Key Source</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className={`p-3 rounded-lg text-xs font-medium ${
                      apiKeyDiag.env_source_clues?.loaded_from_env_local
                        ? 'bg-green-50 text-green-800'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {apiKeyDiag.env_source_clues?.likely_source}
                    </div>
                    <p className="text-slate-500 text-xs">
                      {apiKeyDiag.env_source_clues?.loaded_from_env_local
                        ? 'Great — .env.local is the active source.'
                        : '⚠️ A shell/system env var is overriding .env.local. See the fix guide below.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step-by-Step Fix Guide ── */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex items-center gap-3">
                <Terminal className="w-6 h-6" />
                <div>
                  <h3 className="text-xl font-bold">How to Change Your Gemini API Key</h3>
                  <p className="text-slate-300 text-sm mt-1">Follow these steps exactly — takes under 2 minutes.</p>
                </div>
              </div>

              <div className="p-6 space-y-5">

                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Get your new key from Google AI Studio</h4>
                    <p className="text-slate-600 text-sm mb-2">Go to Google AI Studio and create or copy a new API key.</p>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm underline underline-offset-2"
                    >
                      aistudio.google.com/app/apikey ↗
                    </a>
                  </div>
                </div>

                <div className="border-l-2 border-slate-200 ml-4 pl-0" />

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Update <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">.env.local</code></h4>
                    <p className="text-slate-600 text-sm mb-3">Open the file at the project root and replace the key value:</p>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-300">
                      <p className="text-slate-500 text-xs mb-2"># /Jawads Portfolio/.env.local</p>
                      <p>GEMINI_API_KEY=<span className="text-yellow-300">AIzaSy...YOUR_NEW_KEY</span></p>
                    </div>
                    {apiKeyDiag?.env_file_diagnostics?.path && (
                      <p className="text-xs text-slate-400 mt-2">
                        📁 Full path: <code className="bg-slate-100 px-1 rounded">{apiKeyDiag.env_file_diagnostics.path}</code>
                      </p>
                    )}
                  </div>
                </div>

                {/* Step 3 — Shell override warning */}
                <div className="border-l-2 border-slate-200 ml-4 pl-0" />
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">
                      ⚠️ Check your shell config for a conflicting export
                    </h4>
                    <p className="text-slate-600 text-sm mb-3">
                      If <code className="bg-slate-100 px-1 rounded text-xs">GEMINI_API_KEY</code> is exported in{' '}
                      <code className="bg-slate-100 px-1 rounded text-xs">~/.zshrc</code> or{' '}
                      <code className="bg-slate-100 px-1 rounded text-xs">~/.bash_profile</code>,
                      it <strong>overrides</strong> <code className="bg-slate-100 px-1 rounded text-xs">.env.local</code>.
                      Run this in your Terminal to check:
                    </p>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-300 space-y-1">
                      <p><span className="text-slate-500"># Check if a shell export is shadowing .env.local</span></p>
                      <p>grep -rn GEMINI_API_KEY ~/.zshrc ~/.zprofile ~/.bashrc ~/.bash_profile 2&gt;/dev/null</p>
                    </div>
                    <p className="text-slate-600 text-sm mt-3">
                      If a line appears, <strong>remove or update it</strong> with your new key so both are in sync.
                    </p>
                  </div>
                </div>

                <div className="border-l-2 border-slate-200 ml-4 pl-0" />

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 mb-1">Restart the dev server</h4>
                    <p className="text-slate-600 text-sm mb-3">
                      Stop the running server (<kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs border">Ctrl+C</kbd>),
                      then start fresh. If a shell export was shadowing things, use this command instead:
                    </p>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm space-y-2">
                      <p className="text-slate-500 text-xs"># Standard restart (works once .zshrc export is removed)</p>
                      <p className="text-green-300">npm run dev</p>
                      <p className="text-slate-500 text-xs mt-3"># Emergency restart — forces .env.local regardless of shell exports</p>
                      <p className="text-yellow-300">env -u GEMINI_API_KEY npm run dev</p>
                    </div>
                  </div>
                </div>

                <div className="border-l-2 border-slate-200 ml-4 pl-0" />

                {/* Step 5 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">5</div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Verify everything is working</h4>
                    <p className="text-slate-600 text-sm mb-3">Come back to this page and click the button below. You should see a green status.</p>
                    <button
                      onClick={checkApiKeyHealth}
                      disabled={checkingApiKey}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold transition disabled:opacity-50 shadow"
                    >
                      <RefreshCw className={`w-4 h-4 ${checkingApiKey ? 'animate-spin' : ''}`} />
                      {checkingApiKey ? 'Checking…' : 'Run System Check'}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ── Raw Diagnostics (collapsed) ── */}
            {apiKeyDiag && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <details className="group">
                  <summary className="cursor-pointer p-5 font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition list-none">
                    <Activity className="w-5 h-5 text-slate-400" />
                    <span>Raw Diagnostic Output</span>
                    <span className="ml-auto text-slate-400 text-sm font-normal group-open:hidden">Click to expand</span>
                  </summary>
                  <div className="border-t border-slate-100">
                    <pre className="p-5 text-xs bg-slate-900 text-green-300 overflow-x-auto font-mono leading-relaxed">
                      {JSON.stringify(apiKeyDiag, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

          </div>
        )}

        {/* AI Chat Tab */}
        {activeTab === "chat" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="w-8 h-8" />
                <h2 className="text-3xl font-bold">Portfolio AI Assistant</h2>
              </div>
              <p className="text-indigo-100 text-lg">
                Ask questions about your portfolio data, get help drafting content, or analyze your profile.
                This assistant has full access to your portfolio data.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <PortfolioChat embedded />
            </div>
          </div>
        )}

        {/* ── Job Tracker Tab ─────────────────────────────────────────────────── */}
        {activeTab === "jobtracker" && (
          <div className="space-y-6">

            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-8 h-8" />
                <h2 className="text-3xl font-bold">Job Application Tracker</h2>
              </div>
              <p className="text-rose-100 text-lg">
                Paste any job description and get a brutally honest AI analysis of how competitive you are.
                Track every application to identify skill gaps across industries.
              </p>
            </div>

            {/* Analyzer Form */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-rose-400" />
                  <h3 className="text-lg font-bold">Analyze a Job Description</h3>
                </div>
                <p className="text-slate-400 text-sm mt-1">The AI will compare this job against your full resume data and give you a critical, honest assessment.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Google, McKinsey, Goldman Sachs"
                      value={jobTrackerCompany}
                      onChange={(e) => setJobTrackerCompany(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Role / Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Software Engineer, Data Analyst"
                      value={jobTrackerRole}
                      onChange={(e) => setJobTrackerRole(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Job Description *</label>
                  <textarea
                    placeholder="Paste the full job description here..."
                    value={jobTrackerJD}
                    onChange={(e) => setJobTrackerJD(e.target.value)}
                    rows={10}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">{jobTrackerJD.length} characters pasted</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleAnalyzeJob(false)}
                    disabled={analyzingJob || !jobTrackerJD.trim()}
                    className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    {analyzingJob ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    {analyzingJob ? 'Analyzing…' : 'Analyze Only'}
                  </button>
                  <button
                    onClick={() => handleAnalyzeJob(true)}
                    disabled={analyzingJob || !jobTrackerJD.trim()}
                    className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:from-rose-700 hover:to-pink-700 transition disabled:opacity-50 shadow-lg"
                  >
                    {analyzingJob ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {analyzingJob ? (savingApplication ? 'Saving…' : 'Analyzing…') : 'Analyze & Save'}
                  </button>
                  {jobAnalysisResult && (
                    <button
                      onClick={() => { setJobAnalysisResult(null); setJobAnalysisError(null); }}
                      className="flex items-center gap-2 bg-slate-100 text-slate-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-200 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Error */}
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
              const scoreColor =
                score >= 75 ? 'text-green-600' :
                score >= 50 ? 'text-yellow-600' :
                'text-red-600';
              const scoreBg =
                score >= 75 ? 'bg-green-50 border-green-300' :
                score >= 50 ? 'bg-yellow-50 border-yellow-300' :
                'bg-red-50 border-red-300';
              const scoreRing =
                score >= 75 ? 'stroke-green-500' :
                score >= 50 ? 'stroke-yellow-500' :
                'stroke-red-500';
              const circumference = 2 * Math.PI * 40;

              return (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className={`p-5 border-b ${scoreBg}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        {/* Circular Score */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                            <circle
                              cx="50" cy="50" r="40" fill="none"
                              className={scoreRing}
                              strokeWidth="10"
                              strokeDasharray={circumference}
                              strokeDashoffset={circumference - (score / 100) * circumference}
                              strokeLinecap="round"
                            />
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
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                              <Briefcase className="w-3 h-3" /> {r.industry}
                            </span>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">{r.roleType}</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">{r.seniorityLevel}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Critical Verdict */}
                    <div className="bg-slate-900 rounded-xl p-5 text-white">
                      <h4 className="font-bold text-rose-400 flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4" /> AI Critical Verdict
                      </h4>
                      <p className="text-slate-200 text-sm leading-relaxed">{r.criticalVerdict}</p>
                    </div>

                    {/* Skills Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Present Skills */}
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          Skills You Have ({r.presentSkills?.length || 0})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {r.presentSkills?.map((s: string, i: number) => (
                            <span key={i} className="text-xs bg-green-100 text-green-800 border border-green-300 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> {s}
                            </span>
                          ))}
                          {(!r.presentSkills || r.presentSkills.length === 0) && (
                            <p className="text-sm text-slate-400 italic">No matching skills found</p>
                          )}
                        </div>
                      </div>

                      {/* Missing Skills */}
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                          <TrendingDown className="w-4 h-4 text-red-600" />
                          Skills You&apos;re Missing ({r.missingSkills?.length || 0})
                        </h4>
                        <div className="space-y-2">
                          {r.missingSkills?.map((ms: any, i: number) => (
                            <div key={i} className={`rounded-lg p-2.5 text-xs border flex items-start gap-2 ${
                              ms.importance === 'critical' ? 'bg-red-50 border-red-200' :
                              ms.importance === 'important' ? 'bg-orange-50 border-orange-200' :
                              'bg-yellow-50 border-yellow-200'
                            }`}>
                              <span className={`font-black uppercase text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
                                ms.importance === 'critical' ? 'bg-red-200 text-red-800' :
                                ms.importance === 'important' ? 'bg-orange-200 text-orange-800' :
                                'bg-yellow-200 text-yellow-800'
                              }`}>{ms.importance === 'nice-to-have' ? 'NICE' : ms.importance?.toUpperCase()}</span>
                              <div>
                                <p className="font-bold text-slate-800">{ms.skill}</p>
                                <p className="text-slate-600 mt-0.5">{ms.reason}</p>
                              </div>
                            </div>
                          ))}
                          {(!r.missingSkills || r.missingSkills.length === 0) && (
                            <p className="text-sm text-green-600 font-semibold">✓ No critical skill gaps detected!</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Experience Gaps */}
                    {r.experienceGaps?.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Experience Gaps
                        </h4>
                        <ul className="space-y-1.5">
                          {r.experienceGaps.map((gap: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="text-orange-500 mt-0.5 flex-shrink-0">▸</span>
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Improvement Plan + Market Skills */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-indigo-600" />
                          Your Improvement Plan
                        </h4>
                        <ol className="space-y-2">
                          {r.improvementPlan?.map((step: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="bg-indigo-100 text-indigo-700 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                          <BarChart2 className="w-4 h-4 text-purple-600" />
                          In-Demand Market Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {r.marketSkillsToLearn?.map((s: string, i: number) => (
                            <span key={i} className="text-xs bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-1 rounded-full font-semibold">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── Saved Applications ── */}
            {(() => {
              // Application stage config
              const STAGES = [
                { id: 'not_applied',   label: 'Not Applied',      emoji: '📋', color: 'bg-slate-100 text-slate-600 border-slate-300',      active: 'bg-slate-700 text-white border-slate-700' },
                { id: 'applied',       label: 'Applied',          emoji: '📤', color: 'bg-blue-50 text-blue-700 border-blue-300',           active: 'bg-blue-600 text-white border-blue-600' },
                { id: 'in_review',     label: 'In Review',        emoji: '👀', color: 'bg-indigo-50 text-indigo-700 border-indigo-300',     active: 'bg-indigo-600 text-white border-indigo-600' },
                { id: 'phone_screen',  label: 'Phone Screen',     emoji: '📞', color: 'bg-purple-50 text-purple-700 border-purple-300',     active: 'bg-purple-600 text-white border-purple-600' },
                { id: 'interview',     label: 'Interview',        emoji: '🤝', color: 'bg-yellow-50 text-yellow-800 border-yellow-300',     active: 'bg-yellow-500 text-white border-yellow-500' },
                { id: 'final_round',   label: 'Final Round',      emoji: '🏆', color: 'bg-orange-50 text-orange-700 border-orange-300',     active: 'bg-orange-500 text-white border-orange-500' },
                { id: 'offer',         label: 'Offer! 🎉',        emoji: '✅', color: 'bg-green-50 text-green-700 border-green-300',        active: 'bg-green-600 text-white border-green-600' },
                { id: 'declined',      label: 'Declined',         emoji: '❌', color: 'bg-red-50 text-red-700 border-red-300',              active: 'bg-red-600 text-white border-red-600' },
                { id: 'withdrawn',     label: 'Withdrawn',        emoji: '↩️', color: 'bg-slate-50 text-slate-500 border-slate-200',        active: 'bg-slate-500 text-white border-slate-500' },
              ];

              const getStage = (id: string) => STAGES.find(s => s.id === id) || STAGES[0];

              const filteredApps = appStatusFilter === 'all'
                ? savedApplications
                : savedApplications.filter(a => (a.applicationStatus || 'not_applied') === appStatusFilter);

              const statusCounts: Record<string, number> = { all: savedApplications.length };
              for (const app of savedApplications) {
                const s = app.applicationStatus || 'not_applied';
                statusCounts[s] = (statusCounts[s] || 0) + 1;
              }

              return (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-rose-400" />
                      <h3 className="text-lg font-bold">Application Pipeline</h3>
                      <span className="ml-2 text-xs bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-semibold">{savedApplications.length} total</span>
                    </div>
                    <button
                      onClick={fetchSavedApplications}
                      disabled={loadingApplications}
                      className="text-slate-300 hover:text-white transition"
                      title="Refresh"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingApplications ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {/* Status Filter Bar */}
                  {savedApplications.length > 0 && (
                    <div className="border-b border-slate-100 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
                      <button
                        onClick={() => setAppStatusFilter('all')}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition ${appStatusFilter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        All ({savedApplications.length})
                      </button>
                      {STAGES.filter(s => statusCounts[s.id]).map(stage => (
                        <button
                          key={stage.id}
                          onClick={() => setAppStatusFilter(stage.id)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1 ${appStatusFilter === stage.id ? stage.active : stage.color}`}
                        >
                          {stage.emoji} {stage.label} ({statusCounts[stage.id] || 0})
                        </button>
                      ))}
                    </div>
                  )}

                  {savedApplications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-semibold">No applications saved yet</p>
                      <p className="text-slate-400 text-sm mt-1">Paste a job above and click &quot;Analyze &amp; Save&quot; to start tracking.</p>
                    </div>
                  ) : filteredApps.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-slate-400 text-sm">No applications with this status.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredApps.map((app) => {
                        const score = app.compatibilityScore ?? 0;
                        const scoreColor = score >= 75 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600';
                        const scoreRingColor = score >= 75 ? 'stroke-green-500' : score >= 50 ? 'stroke-yellow-500' : 'stroke-red-500';
                        const isExpanded = expandedAppId === app.id;
                        const isJdOpen = jdOpenId === app.id;
                        const stage = getStage(app.applicationStatus || 'not_applied');
                        const circumference = 2 * Math.PI * 18;

                        return (
                          <div key={app.id} className="group">
                            {/* ── Collapsed Row ── */}
                            <div className="p-4 flex items-center gap-3 hover:bg-slate-50/80 transition">

                              {/* Mini score ring */}
                              <div className="flex-shrink-0 relative w-10 h-10">
                                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 44 44">
                                  <circle cx="22" cy="22" r="18" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                                  <circle cx="22" cy="22" r="18" fill="none"
                                    className={scoreRingColor}
                                    strokeWidth="5"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - (score / 100) * circumference}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-black ${scoreColor}`}>{score}</span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-bold text-slate-900 text-sm truncate">{app.company}</p>
                                  <span className="text-slate-300 text-sm">·</span>
                                  <p className="text-slate-600 text-sm truncate max-w-[200px]">{app.role}</p>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {/* Status badge */}
                                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${stage.active}`}>
                                    {stage.emoji} {stage.label}
                                  </span>
                                  {app.analysis?.industry && (
                                    <span className="text-[11px] text-slate-400">{app.analysis.industry}</span>
                                  )}
                                  <span className="text-[11px] text-slate-300">
                                    {new Date(app.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {app.resumeFilename && (
                                  <button
                                    onClick={() => window.open(`/api/resume/download?file=${encodeURIComponent(app.resumeFilename)}`, '_blank')}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-green-700 hover:bg-green-50 transition"
                                    title="Download Resume"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                )}
                                {app.coverLetterFilename && (
                                  <button
                                    onClick={() => window.open(`/api/resume/download?file=${encodeURIComponent(app.coverLetterFilename)}`, '_blank')}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-blue-50 transition"
                                    title="Download Cover Letter"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setExpandedAppId(isExpanded ? null : app.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                  title={isExpanded ? 'Collapse' : 'Expand details'}
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleDeleteApplication(app.id)}
                                  className="p-1.5 rounded-lg text-slate-200 hover:text-red-600 hover:bg-red-50 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* ── Expanded Panel ── */}
                            {isExpanded && (
                              <div className="border-t border-slate-100 bg-slate-50/60 p-5 space-y-5">

                                {/* ── Edit Name / Role ── */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Company</label>
                                    <input
                                      type="text"
                                      defaultValue={app.company}
                                      onBlur={(e) => {
                                        if (e.target.value !== app.company) {
                                          handleUpdateApplication(app.id, { company: e.target.value });
                                        }
                                      }}
                                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold bg-white focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Role / Job Title</label>
                                    <input
                                      type="text"
                                      defaultValue={app.role}
                                      onBlur={(e) => {
                                        if (e.target.value !== app.role) {
                                          handleUpdateApplication(app.id, { role: e.target.value });
                                        }
                                      }}
                                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                                    />
                                  </div>
                                </div>

                                {/* ── Application Stage Pipeline ── */}
                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Application Stage</label>
                                  <div className="flex flex-wrap gap-2">
                                    {STAGES.map(s => {
                                      const isCurrent = (app.applicationStatus || 'not_applied') === s.id;
                                      return (
                                        <button
                                          key={s.id}
                                          onClick={() => handleUpdateApplication(app.id, { applicationStatus: s.id })}
                                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${isCurrent ? s.active : s.color} hover:opacity-90`}
                                        >
                                          {s.emoji} {s.label}
                                          {isCurrent && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* ── Resume & Cover Letter ── */}
                                {(app.resumeFilename || app.coverLetterFilename) && (
                                  <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">Documents Used</label>
                                    <div className="flex flex-wrap gap-2">
                                      {app.resumeFilename && (
                                        <button
                                          onClick={() => window.open(`/api/resume/download?file=${encodeURIComponent(app.resumeFilename)}`, '_blank')}
                                          className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-semibold hover:bg-green-200 transition border border-green-300"
                                        >
                                          <FileText className="w-4 h-4" />
                                          {app.resumeFilename.endsWith('.pdf') ? '📄 View Resume PDF' : '📄 Download Resume'}
                                        </button>
                                      )}
                                      {app.coverLetterFilename && (
                                        <button
                                          onClick={() => window.open(`/api/resume/download?file=${encodeURIComponent(app.coverLetterFilename)}`, '_blank')}
                                          className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold hover:bg-blue-200 transition border border-blue-300"
                                        >
                                          <Download className="w-4 h-4" />
                                          {app.coverLetterFilename.endsWith('.pdf') ? '📝 View Cover Letter PDF' : '📝 Download Cover Letter'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* ── AI Verdict ── */}
                                {app.analysis?.criticalVerdict && (
                                  <div className="bg-slate-900 rounded-xl p-4 text-white">
                                    <p className="text-[11px] font-bold text-rose-400 uppercase mb-1.5 flex items-center gap-1"><Brain className="w-3 h-3" /> AI Verdict</p>
                                    <p className="text-slate-200 text-sm leading-relaxed">{app.analysis.criticalVerdict}</p>
                                  </div>
                                )}

                                {/* ── Skills ── */}
                                {app.analysis && (
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-[11px] font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Matching Skills</label>
                                      <div className="flex flex-wrap gap-1.5">
                                        {app.analysis.presentSkills?.map((s: string, i: number) => (
                                          <span key={i} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium border border-green-200">{s}</span>
                                        ))}
                                        {!app.analysis.presentSkills?.length && <p className="text-xs text-slate-400 italic">None identified</p>}
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-[11px] font-bold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Missing Skills</label>
                                      <div className="flex flex-wrap gap-1.5">
                                        {app.analysis.missingSkills?.map((ms: any, i: number) => (
                                          <span key={i} title={ms.reason} className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                                            ms.importance === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                                            ms.importance === 'important' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                            'bg-yellow-100 text-yellow-800 border-yellow-200'
                                          }`}>{ms.skill}</span>
                                        ))}
                                        {!app.analysis.missingSkills?.length && <p className="text-xs text-green-600 font-semibold">✓ No gaps</p>}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* ── Key Skills Required (from JD analysis) ── */}
                                {app.analysis?.marketSkillsToLearn?.length > 0 && (
                                  <div>
                                    <label className="text-[11px] font-bold text-purple-700 uppercase tracking-wide mb-2 flex items-center gap-1"><BarChart2 className="w-3 h-3" /> Market Skills to Learn</label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {app.analysis.marketSkillsToLearn.map((s: string, i: number) => (
                                        <span key={i} className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full font-medium">{s}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* ── Job Description Viewer ── */}
                                <div>
                                  <button
                                    onClick={() => setJdOpenId(isJdOpen ? null : app.id)}
                                    className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wide hover:text-slate-700 transition"
                                  >
                                    {isJdOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    {isJdOpen ? 'Hide' : 'View'} Full Job Description
                                  </button>
                                  {isJdOpen && (
                                    <div className="mt-2 bg-white border border-slate-200 rounded-xl p-4 max-h-72 overflow-y-auto">
                                      <pre className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans">{app.jobDescription}</pre>
                                    </div>
                                  )}
                                </div>

                                {/* ── Notes ── */}
                                <div>
                                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1 block">Notes / Reminders</label>
                                  <textarea
                                    rows={3}
                                    defaultValue={app.notes || ''}
                                    placeholder="e.g. Interviewer: John Smith · Follow up by March 1 · Salary range $85-95k"
                                    onBlur={(e) => {
                                      if (e.target.value !== (app.notes || '')) {
                                        handleUpdateApplication(app.id, { notes: e.target.value });
                                      }
                                    }}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-rose-400 focus:border-transparent resize-none placeholder:text-slate-300"
                                  />
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Aggregate Skill Gap Overview ── */}
            {savedApplications.length >= 2 && (() => {
              const skillTally: Record<string, { count: number; criticalCount: number }> = {};
              const industryTally: Record<string, number> = {};
              let totalScore = 0;
              let totalWithScore = 0;

              for (const app of savedApplications) {
                if (app.compatibilityScore != null) { totalScore += app.compatibilityScore; totalWithScore++; }
                if (app.analysis?.industry) industryTally[app.analysis.industry] = (industryTally[app.analysis.industry] || 0) + 1;
                for (const ms of (app.analysis?.missingSkills || [])) {
                  if (!skillTally[ms.skill]) skillTally[ms.skill] = { count: 0, criticalCount: 0 };
                  skillTally[ms.skill].count++;
                  if (ms.importance === 'critical') skillTally[ms.skill].criticalCount++;
                }
              }

              const avgScore = totalWithScore > 0 ? Math.round(totalScore / totalWithScore) : 0;
              const topMissingSkills = Object.entries(skillTally).sort((a, b) => b[1].count - a[1].count || b[1].criticalCount - a[1].criticalCount).slice(0, 15);
              const topIndustries = Object.entries(industryTally).sort((a, b) => b[1] - a[1]).slice(0, 5);
              const avgColor = avgScore >= 75 ? 'text-green-600' : avgScore >= 50 ? 'text-yellow-600' : 'text-red-600';
              const avgBg = avgScore >= 75 ? 'bg-green-50 border-green-300' : avgScore >= 50 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300';

              return (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-700 to-purple-700 p-5 text-white">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="w-5 h-5 text-indigo-200" />
                      <h3 className="text-lg font-bold">Skill Gap Overview</h3>
                      <span className="text-xs text-indigo-300 ml-1">across {savedApplications.length} tracked applications</span>
                    </div>
                    <p className="text-indigo-200 text-sm mt-1">Your recurring weak spots — skills that appear as gaps across multiple jobs you&apos;ve applied for.</p>
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
                          {topMissingSkills.map(([skill, data], i) => (
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
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${data.criticalCount > 0 ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${(data.count / savedApplications.length) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                          {topMissingSkills.length === 0 && <p className="text-slate-400 text-sm italic">Track more jobs to see patterns.</p>}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><Briefcase className="w-4 h-4 text-indigo-600" /> Industries You&apos;re Targeting</h4>
                        <div className="space-y-2">
                          {topIndustries.map(([industry, count]) => (
                            <div key={industry} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-sm font-semibold text-slate-800">{industry}</span>
                                  <span className="text-xs text-slate-500 font-medium">{count} job{count > 1 ? 's' : ''}</span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${(count / savedApplications.length) * 100}%` }} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><BarChart2 className="w-4 h-4 text-purple-600" /> Score Distribution</h4>
                          <div className="flex items-end gap-2 h-20">
                            {[{label:'0-29',min:0,max:29,color:'bg-red-500'},{label:'30-49',min:30,max:49,color:'bg-red-400'},{label:'50-69',min:50,max:69,color:'bg-yellow-500'},{label:'70-84',min:70,max:84,color:'bg-green-400'},{label:'85+',min:85,max:100,color:'bg-green-600'}].map(({label,min,max,color})=>{
                              const cnt = savedApplications.filter(a=>a.compatibilityScore!=null&&a.compatibilityScore>=min&&a.compatibilityScore<=max).length;
                              const maxCnt = Math.max(...savedApplications.map(a=>a.compatibilityScore||0).reduce((acc:number[],_,i,arr)=>{ if(i===0){acc.push(arr.filter((s:number)=>s>=0&&s<=29).length,arr.filter((s:number)=>s>=30&&s<=49).length,arr.filter((s:number)=>s>=50&&s<=69).length,arr.filter((s:number)=>s>=70&&s<=84).length,arr.filter((s:number)=>s>=85).length)};return acc;},[]),1);
                              return (<div key={label} className="flex-1 flex flex-col items-center gap-1"><span className="text-xs font-bold text-slate-700">{cnt}</span><div className={`w-full rounded-t ${color} transition-all`} style={{height:`${(cnt/maxCnt)*56+4}px`,minHeight:'4px'}}/><span className="text-[9px] text-slate-400 text-center leading-tight">{label}</span></div>);
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* Skill Builder Tab */}
        {activeTab === "skillbuilder" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg p-8 text-white">
              <div className="flex items-center gap-3 mb-4">
                <GraduationCap className="w-8 h-8" />
                <h2 className="text-3xl font-bold">Skill Builder Program</h2>
              </div>
              <p className="text-emerald-100 text-lg">
                Manage learning paths and structured projects for visitors.
                This feature helps users build skills based on your portfolio projects.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Skill Builder Preview</h3>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto">
                The Skill Builder is live on the public site. Access it directly to review content, track progress, and test the user experience.
              </p>
              
              <Link 
                href="/skill-builder" 
                target="_blank"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <Eye className="w-5 h-5" />
                Launch Skill Builder
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 transition group cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">Data Scientist</h3>
                <p className="text-sm text-slate-500 mb-4">Master data analysis, ML, and predictive modeling.</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">3 Levels</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">5 Projects</span>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 transition group cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💻</div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">Full Stack Dev</h3>
                <p className="text-sm text-slate-500 mb-4">Build modern web apps with React and Node.js.</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">3 Levels</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">5 Projects</span>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 transition group cursor-pointer">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🤖</div>
                <h3 className="font-bold text-lg mb-2 text-slate-900">AI Engineer</h3>
                <p className="text-sm text-slate-500 mb-4">Create intelligent systems and deploy ML models.</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">3 Levels</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">5 Projects</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Keyboard Shortcuts Help - Desktop only */}
      <div className="hidden md:block max-w-7xl mx-auto px-6 pb-6">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-4 text-white">
          <details className="group">
            <summary className="cursor-pointer font-bold flex items-center gap-2 list-none">
              <span className="text-lg">⌨️</span>
              <span>Keyboard Shortcuts</span>
              <span className="ml-auto text-slate-400 text-sm group-open:hidden">Click to expand</span>
            </summary>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs">Ctrl/⌘ + S</kbd>
                <p className="text-slate-300 mt-1">Save Changes</p>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs">Ctrl/⌘ + 1-9</kbd>
                <p className="text-slate-300 mt-1">Navigate Tabs</p>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs">Esc</kbd>
                <p className="text-slate-300 mt-1">Blur Input</p>
              </div>
              <div>
                <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20 text-xs">Tab</kbd>
                <p className="text-slate-300 mt-1">Navigate Fields</p>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden mobile-bottom-nav pb-safe">
        <div className="flex items-stretch px-2 pt-2 pb-1" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
          {tabGroups.map((group) => {
            const isActiveGroup = group.tabs.some(t => t.id === activeTab);
            const firstTab = group.tabs[0];
            return (
              <button
                key={group.label}
                onClick={() => {
                  if (group.tabs.length === 1) {
                    setActiveTab(firstTab.id);
                  } else if (isActiveGroup) {
                    // Cycle to next sub-tab in group
                    const currentIdx = group.tabs.findIndex(t => t.id === activeTab);
                    const nextTab = group.tabs[(currentIdx + 1) % group.tabs.length];
                    setActiveTab(nextTab.id);
                  } else {
                    setActiveTab(firstTab.id);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl transition-all ${
                  isActiveGroup
                    ? "bg-purple-600/10"
                    : "hover:bg-slate-100"
                }`}
              >
                <span className={`text-lg leading-none transition-transform ${isActiveGroup ? 'scale-110' : ''}`}>
                  {group.emoji}
                </span>
                <span className={`text-[10px] font-bold leading-none transition-colors ${
                  isActiveGroup ? 'text-purple-700' : 'text-slate-400'
                }`}>
                  {group.label}
                </span>
                {isActiveGroup && (
                  <span className="w-1 h-1 rounded-full bg-purple-600 mt-0.5" />
                )}
              </button>
            );
          })}

          {/* Divider + Save shortcut */}
          <div className="flex items-center justify-center px-1">
            <div className="w-px h-8 bg-slate-200 mx-1" />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all ${
              saveStatus.includes('✓') ? 'bg-green-50' : 'hover:bg-slate-100'
            } disabled:opacity-50`}
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
            ) : saveStatus.includes('✓') ? (
              <span className="text-lg">✅</span>
            ) : (
              <Save className="w-5 h-5 text-slate-500" />
            )}
            <span className={`text-[10px] font-bold leading-none ${saveStatus.includes('✓') ? 'text-green-600' : 'text-slate-400'}`}>
              {loading ? 'Saving' : saveStatus.includes('✓') ? 'Saved!' : 'Save'}
            </span>
          </button>
        </div>
      </div>

      <NewsletterButton />
      <PortfolioChat />
      <style jsx global>{scrollbarStyles}</style>
    </div>
  );
}
