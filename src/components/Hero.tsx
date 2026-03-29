"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import portfolioData from "@/data/portfolio.json";
import type { Profile } from "@/lib/portfolio/types";
const defaultProfile = portfolioData.profile as Profile;
import { MapPin, ArrowRight, Github, Linkedin, Mail } from "lucide-react";

interface HeroProps {
  profile?: Profile;
}

export default function Hero({ profile = defaultProfile }: HeroProps) {
  const [imgError, setImgError] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string>("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio_avatar");
      if (saved) setLocalAvatar(saved);
    } catch { /* localStorage unavailable */ }
  }, []);

  if (!profile) return null;

  const firstName = profile.name.split(" ")[0];
  const lastName = profile.name.split(" ").slice(1).join(" ");
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc = profile.avatar || localAvatar;
  const hasAvatar = avatarSrc && avatarSrc.length > 0 && !imgError;
  const isDataUrl = avatarSrc?.startsWith("data:");

  return (
    <section
      id="about"
      className="relative pt-24 pb-20 px-6 overflow-hidden bg-white"
    >
      {/* Subtle dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Ambient glow — top right */}
      <div
        className="absolute -top-48 -right-48 w-[640px] h-[640px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.1) 0%, rgba(124,58,237,0.06) 45%, transparent 70%)",
        }}
      />

      {/* Ambient glow — bottom left */}
      <div
        className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto">
        {/* ── Two-column layout ── */}
        <div className="flex flex-col-reverse lg:flex-row lg:items-center lg:justify-between gap-10 lg:gap-16">

          {/* ─── LEFT: Content ─── */}
          <div className="flex-1 max-w-xl">

            {/* Availability pill */}
            <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold text-emerald-700 tracking-wide">
                {profile.availability}
              </span>
            </div>

            {/* Name */}
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.04] tracking-tighter mb-5">
              <span className="text-slate-900">{firstName} </span>
              <span
                style={{
                  background: "linear-gradient(125deg, #2563eb 0%, #7c3aed 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {lastName}
              </span>
            </h1>

            {/* Role */}
            <div className="flex items-center gap-3 mb-5">
              <div
                className="h-[3px] w-8 rounded-full flex-shrink-0"
                style={{ background: "linear-gradient(90deg, #2563eb, #7c3aed)" }}
              />
              <p className="text-base sm:text-lg font-semibold text-slate-600 leading-snug">
                {profile.role}
              </p>
            </div>

            {/* Tagline */}
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed mb-7 max-w-md">
              {profile.tagline}
            </p>

            {/* Location */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400 mb-9">
              <MapPin size={13} className="flex-shrink-0" />
              <span>{profile.location}</span>
              <span className="text-slate-300">·</span>
              <span>U.S. Citizen</span>
              <span className="text-slate-300">·</span>
              <span>Security Clearance Eligible</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <a
                href="/#projects"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                style={{
                  background: "linear-gradient(125deg, #2563eb 0%, #7c3aed 100%)",
                  boxShadow: "0 4px 14px 0 rgba(37,99,235,0.3)",
                }}
              >
                View My Work
                <ArrowRight size={14} />
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Mail size={14} />
                Get in Touch
              </a>
              <a
                href="https://linkedin.com/in/jawad-iskandar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Linkedin size={14} />
                LinkedIn
              </a>
              <a
                href="https://github.com/Iskos1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                <Github size={14} />
                GitHub
              </a>
            </div>
          </div>

          {/* ─── RIGHT: Profile Photo ─── */}
          <div className="flex-shrink-0 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Soft glow behind the photo */}
              <div
                className="absolute inset-0 rounded-full scale-[1.15] pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(124,58,237,0.14))",
                  filter: "blur(24px)",
                }}
              />

              {/* Gradient border ring */}
              <div
                className="relative w-52 h-52 sm:w-60 sm:h-60 lg:w-64 lg:h-64 rounded-full p-[3px]"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                }}
              >
                {/* Inner white gap */}
                <div className="w-full h-full rounded-full p-[3px] bg-white">
                  <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
                    {hasAvatar ? (
                      isDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarSrc}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                      <Image
                        src={avatarSrc!}
                        alt={profile.name}
                        width={256}
                        height={256}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                        priority
                      />
                      )
                    ) : (
                      /* Initials placeholder */
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-1"
                        style={{
                          background: "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)",
                        }}
                      >
                        <span
                          className="text-5xl font-extrabold tracking-tight select-none"
                          style={{
                            background: "linear-gradient(125deg, #2563eb, #7c3aed)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {initials}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 tracking-widest uppercase">
                          Add photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="mt-14 pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Orders Analyzed", value: "100k+" },
            { label: "Years Experience", value: "3+" },
            { label: "Skills", value: "27" },
            { label: "Projects Built", value: "6+" },
          ].map((s) => (
            <div key={s.label}>
              <p
                className="text-2xl font-extrabold tracking-tight"
                style={{
                  background: "linear-gradient(125deg, #2563eb 0%, #7c3aed 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {s.value}
              </p>
              <p className="text-sm text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
