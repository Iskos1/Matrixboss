"use client";

import { useState } from "react";
import { projects as defaultProjects } from "@/lib/data";
import { ProjectItem } from "@/lib/data";
import { ArrowUpRight, Image as ImageIcon, ExternalLink, Sparkles } from "lucide-react";
import ProjectEnhancer from "./ProjectEnhancer";
import AnimatedSection from "./AnimatedSection";
import ImageLightbox from "./ImageLightbox";

interface ProjectsProps {
  projects?: ProjectItem[];
}

export default function Projects({ projects = defaultProjects }: ProjectsProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Safe check
  if (!projects) return null;

  const openLightbox = (project: any, imageIndex: number = 0) => {
    setSelectedProject(project);
    setSelectedImageIndex(imageIndex);
    setLightboxOpen(true);
  };

  return (
    <section id="projects" className="py-32 px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
            <p className="text-sm font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Portfolio
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-purple-200 to-transparent" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-center bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
            Featured Projects
          </h2>
          <p className="text-center text-slate-600 max-w-2xl mx-auto mb-16">
            Explore my latest work and creative solutions
          </p>
        </AnimatedSection>

        {/* Enhanced Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {projects.map((project, idx) => (
            <AnimatedSection
              key={project.id}
              delay={idx * 0.1}
              className={project.featured ? "md:col-span-2" : ""}
            >
              <div className="group relative h-full rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-2">
                {/* Gradient Border Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500" />
                
                <div className="relative h-full p-7 sm:p-9 rounded-2xl border-2 border-slate-200 bg-white group-hover:border-transparent transition-all duration-300 hover:shadow-2xl">
                  {/* Project Header */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex-1">
                      {project.featured && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-green-500 px-3 py-1.5 rounded-full mb-4 shadow-lg shadow-emerald-500/25">
                          <Sparkles className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                      <h3 className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors leading-tight">
                        {project.title}
                      </h3>
                    </div>
                    
                    {/* External Link Icon */}
                    {project.link && project.link !== "#" && project.hasLiveDemo !== false && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 mt-1 p-2.5 rounded-xl bg-slate-100 text-slate-400 hover:bg-purple-100 hover:text-purple-600 transition-all"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={20} className="hover:scale-110 transition-transform" />
                      </a>
                    )}
                  </div>

                  {/* Image Gallery Preview */}
                  {project.images && project.images.length > 0 && (
                    <div className="mb-6">
                      {project.images.length === 1 ? (
                        // Single Image
                        <button
                          onClick={() => openLightbox(project, 0)}
                          className="relative w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 group/img cursor-pointer ring-2 ring-slate-200 hover:ring-purple-400 transition-all"
                        >
                          <img
                            src={project.images[0]}
                            alt={project.title}
                            className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 transform translate-y-4 group-hover/img:translate-y-0 transition-transform">
                              <ImageIcon className="w-6 h-6 text-purple-600" />
                            </div>
                          </div>
                        </button>
                      ) : (
                        // Multiple Images Grid
                        <div className="grid grid-cols-3 gap-3">
                          {project.images.slice(0, 3).map((image: string, imgIdx: number) => (
                            <button
                              key={imgIdx}
                              onClick={() => openLightbox(project, imgIdx)}
                              className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 group/img cursor-pointer ring-2 ring-slate-200 hover:ring-purple-400 transition-all"
                            >
                              <img
                                src={image}
                                alt={`${project.title} ${imgIdx + 1}`}
                                className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-white" />
                              </div>
                              {imgIdx === 2 && project.images && project.images.length > 3 && (
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-indigo-600/90 backdrop-blur-sm flex items-center justify-center">
                                  <span className="text-white font-bold text-xl">
                                    +{(project.images.length) - 3}
                                  </span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-base text-slate-600 leading-relaxed mb-6">
                    {project.description}
                  </p>

                  {/* AI Enhancer Button */}
                  <div className="mb-6">
                    <ProjectEnhancer project={project} />
                  </div>

                  {/* Tech Tags */}
                  <div className="flex flex-wrap gap-2.5 mb-5">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-100 hover:border-purple-300 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-6">
                    {project.images && project.images.length > 0 && (
                      <button
                        onClick={() => openLightbox(project, 0)}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-purple-600 hover:text-white bg-purple-50 hover:bg-gradient-to-r hover:from-purple-600 hover:to-indigo-600 px-5 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 group/btn border border-purple-100"
                      >
                        <ImageIcon size={18} className="group-hover/btn:scale-110 transition-transform" />
                        <span>View Gallery</span>
                      </button>
                    )}
                    
                    {project.link && project.link !== "#" && (project.hasLiveDemo !== false) && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-5 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 group/btn ${(!project.images || project.images.length === 0) ? "w-full" : ""}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={18} className="group-hover/btn:scale-110 transition-transform" />
                        <span>
                          {project.link.includes('/coursework/') || project.link.includes('/documents/') ? 'View Document' : 'View Project'}
                        </span>
                        <ArrowUpRight size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>

      {/* Image Lightbox */}
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
