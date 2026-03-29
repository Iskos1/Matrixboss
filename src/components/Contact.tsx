"use client";

import portfolioData from "@/data/portfolio.json";
import type { Profile, SocialLink } from "@/lib/portfolio/types";
const defaultProfile = portfolioData.profile as Profile;
const defaultSocialLinks = portfolioData.socialLinks as SocialLink[];
import { Github, Linkedin, Twitter, Globe, Mail } from "lucide-react";

interface ContactProps {
  profile?: Profile;
  socialLinks?: SocialLink[];
}

const iconMap = {
  github:   Github,
  linkedin: Linkedin,
  twitter:  Twitter,
  globe:    Globe,
  mail:     Mail,
};

export default function Contact({ profile = defaultProfile, socialLinks = defaultSocialLinks }: ContactProps) {
  if (!profile || !socialLinks) return null;

  return (
    <section id="contact" className="py-16 px-6 bg-white">
      <div className="max-w-5xl mx-auto">

        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Contact</p>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Get in Touch</h2>
        <p className="text-sm text-slate-600 mb-8 max-w-xl">
          I'm open to full-time opportunities, internships, and project collaborations.
          If you have a role that fits my background, I'd love to talk.
        </p>

        {/* Email CTA */}
        <a
          href={`mailto:${profile.email}`}
          className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors mb-8"
        >
          <Mail size={16} />
          {profile.email}
        </a>

        {/* Social links */}
        <div className="flex flex-wrap gap-3 mt-2">
          {socialLinks.map((link) => {
            const Icon = iconMap[link.icon as keyof typeof iconMap];
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
              >
                {Icon && <Icon size={15} />}
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
