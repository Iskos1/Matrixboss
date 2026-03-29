"use client";

import { useState } from "react";
import portfolioData from "@/data/portfolio.json";
import type { ProjectItem } from "@/lib/portfolio/types";
const defaultProjects = portfolioData.projects as ProjectItem[];
import { ExternalLink, FileText } from "lucide-react";
import ImageLightbox from "./ImageLightbox";

interface ProjectsProps {
  projects?: ProjectItem[];
}

export default function Projects({ projects = defaultProjects }: ProjectsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!projects) return null;

  // Remove the Brazilian E-Commerce project (featured separately) and placeholder
  const displayProjects = projects.filter(
    (p) => p.id !== 9 && !(p.description === "Project description...")
  );

  const openLightbox = (project: any, imageIndex = 0) => {
    setSelectedProject(project);
    setSelectedImageIndex(imageIndex);
    setLightboxOpen(true);
  };

  const isDocLink = (link: string) =>
    link.includes("/coursework/") || link.includes("/documents/");

  return (
    <section id="projects" className="py-16 px-6 bg-slate-50 border-b border-slate-200">
      <div className="max-w-5xl mx-auto">

        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Projects</p>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Other Work</h2>
        <p className="text-sm text-slate-500 mb-8">
          Engineering, cloud, strategy, and full-stack projects from academic and professional work.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {displayProjects.map((project) => (
            <div
              key={`${project.id}-${project.title}`}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col hover:border-slate-300 hover:shadow-sm transition-all"
            >
              {/* Image thumbnail */}
              {project.images && project.images.length > 0 && (
                <button
                  onClick={() => openLightbox(project, 0)}
                  className="block w-full h-40 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mb-4 flex-shrink-0 cursor-pointer"
                >
                  <img
                    src={project.images[0]}
                    alt={project.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  />
                </button>
              )}

              {/* Title */}
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                {project.title}
              </h3>

              {/* Description — truncated */}
              <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                {project.description}
              </p>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 5 && (
                    <span className="text-xs text-slate-400">+{project.tags.length - 5} more</span>
                  )}
                </div>
              )}

              {/* Action */}
              {project.link && project.link !== "#" && project.hasLiveDemo !== false && (
                <a
                  href={project.link}
                  target={project.link.startsWith("http") ? "_blank" : undefined}
                  rel={project.link.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {isDocLink(project.link) ? (
                    <><FileText size={14} /> View Document</>
                  ) : (
                    <><ExternalLink size={14} /> View Project</>
                  )}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedProject && selectedProject.images && (
        <ImageLightbox
          images={selectedProject.images}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          initialIndex={selectedImageIndex}
          projectTitle={selectedProject.title}
          projectLink={selectedProject.link}
        />
      )}
    </section>
  );
}
