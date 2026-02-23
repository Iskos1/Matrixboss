"use client";

import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import { profile as defaultProfile } from "@/lib/data";
import { Profile } from "@/lib/data";

interface HeroProps {
  profile?: Profile;
}

export default function Hero({ profile = defaultProfile }: HeroProps) {
  // Safe check if profile is somehow undefined (though defaultProfile handles it)
  if (!profile) return null;

  return (
    <section
      id="about"
      className="relative min-h-screen flex items-center justify-center px-6 pt-16 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-indigo-200/10 via-purple-200/10 to-pink-200/10 rounded-full blur-3xl" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Availability Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/60 text-sm font-semibold text-emerald-700 mb-8 shadow-sm backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {profile.availability}
          </span>
        </motion.div>

        {/* Headline with Enhanced Gradient */}
        <motion.h1
          className="text-5xl sm:text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.1] mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <span className="block text-slate-900 mb-2">Hi, I'm</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 animate-gradient bg-[length:200%_auto]">
            {profile.name}
          </span>
        </motion.h1>

        {/* Role with Icon */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-300" />
          <p className="text-xl sm:text-2xl md:text-3xl text-slate-600 font-medium flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {profile.role}
          </p>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-300" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {profile.tagline}
        </motion.p>

        {/* Enhanced CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
        >
          <a
            href="#projects"
            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-base font-semibold rounded-xl hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              View My Work
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="#contact"
            className="group px-8 py-4 bg-white border-2 border-slate-200 text-slate-700 text-base font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2">
              Get in Touch
              <svg className="w-4 h-4 group-hover:rotate-45 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </a>
        </motion.div>

        {/* Stats or Quick Info */}
        <motion.div
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="font-medium">Building innovative solutions</span>
          </div>
          <div className="w-px h-4 bg-slate-300" />
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="font-medium">{profile.location}</span>
          </div>
        </motion.div>
      </div>

    </section>
  );
}
