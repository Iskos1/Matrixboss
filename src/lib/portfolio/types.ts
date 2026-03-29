export interface Profile {
  name: string;
  role: string;
  tagline: string;
  bio: string;
  email: string;
  location: string;
  availability: string;
  avatar?: string;
}

export interface Position {
  role: string;
  period: string;
  description: string;
  tags: string[];
  technicalDetails?: string;
}

export interface ExperienceItem {
  id: number;
  company: string;
  logo?: string;
  website?: string;
  location?: string;
  role?: string;
  period?: string;
  description?: string;
  tags?: string[];
  positions?: Position[];
}

export interface ProjectItem {
  id: number;
  title: string;
  description: string;
  tags: string[];
  link: string;
  featured?: boolean;
  images?: string[];
  hasLiveDemo?: boolean;
  technicalDetails?: string;
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
