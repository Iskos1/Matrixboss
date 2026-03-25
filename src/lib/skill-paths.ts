// ─────────────────────────────────────────────────────────────
// Skill Paths Configuration — Type-safe data loader
// ─────────────────────────────────────────────────────────────

import skillPathsData from "@/data/skill-paths.json";

export interface Step {
  id: number;
  title: string;
  description: string;
  content: string;
  codeSnippet?: string;
  resources?: Array<{ title: string; url: string }>;
}

export interface ProjectLevel {
  level: string;
  title: string;
  description: string;
  estimatedTime: string;
  skills?: string[];
  portfolioProjectId?: number;
  steps: Step[];
}

export interface SkillPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  levels: ProjectLevel[];
}

export interface SkillPathsData {
  paths: SkillPath[];
}

// Type assertion for the imported JSON
const typedData = skillPathsData as SkillPathsData;

// Export the paths
export const skillPaths: SkillPath[] = typedData.paths;
