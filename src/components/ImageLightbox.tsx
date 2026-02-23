"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import Image from "next/image";

interface ImageLightboxProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  projectTitle?: string;
  projectLink?: string;
}

export default function ImageLightbox({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  projectTitle,
  projectLink,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all hover:scale-110"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Project Title & Link */}
      {projectTitle && (
        <div className="absolute top-4 left-4 z-50 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-semibold">{projectTitle}</h3>
            {projectLink && projectLink !== "#" && (
              <a
                href={projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
          <p className="text-white text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </p>
        </div>
      )}

      {/* Main Image */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onClick={onClose}
      >
        <div
          className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex]}
            alt={`${projectTitle || "Project"} screenshot ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 flex gap-2 bg-white/10 backdrop-blur-sm p-2 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                index === currentIndex
                  ? "ring-2 ring-white scale-110"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
