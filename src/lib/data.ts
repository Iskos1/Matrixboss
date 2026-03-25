// ─────────────────────────────────────────────────────────────
// Portfolio Configuration — Now powered by JSON for easy editing
// ─────────────────────────────────────────────────────────────

import portfolioData from "@/data/portfolio.json";

export interface Profile {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  email: string;
  location: string;
  availability: string;
  avatar?: string; // Path to profile photo, e.g. "/profile.jpg"
}

export interface Position {
  role: string;
  period: string;
  description: string;
  tags: string[];
  technicalDetails?: string; // Hidden technical details for AI/Admin context
}

export interface ExperienceItem {
  id: number;
  company: string;
  logo?: string; // Company logo URL/path
  website?: string; // Company website URL
  location?: string; // Company location
  // Legacy single role fields (for backwards compatibility)
  role?: string;
  period?: string;
  description?: string;
  tags?: string[];
  // New multi-position support
  positions?: Position[];
}

export interface ProjectItem {
  id: number;
  title: string;
  description: string;
  tags: string[];
  link: string;
  featured?: boolean;
  images?: string[]; // Array of image URLs/paths
  hasLiveDemo?: boolean; // Whether project has a live demo/link
  technicalDetails?: string; // Hidden technical details for AI/Admin context
}

export interface SocialLink {
  id: number;
  label: string;
  url: string;
  icon: "github" | "linkedin" | "twitter" | "globe" | "mail";
}

export interface Skill {
  id: number;
  name: string;
  category: "technical" | "business" | "tools";
}

// Export data from JSON file
export const profile: Profile = portfolioData.profile;
export const skills: Skill[] = portfolioData.skills as any;
export const experience: ExperienceItem[] = portfolioData.experience as any;
export const projects: ProjectItem[] = portfolioData.projects as any;
export const socialLinks: SocialLink[] = portfolioData.socialLinks as any;
export const navItems = portfolioData.navItems;
export const siteMetadata = portfolioData.siteMetadata;
