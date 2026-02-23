"use client";

import { profile as defaultProfile, socialLinks as defaultSocialLinks } from "@/lib/data";
import { Profile, SocialLink } from "@/lib/data";
import { Github, Linkedin, Twitter, Globe, Mail, MapPin, Send, Sparkles } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface ContactProps {
  profile?: Profile;
  socialLinks?: SocialLink[];
}

const iconMap = {
  github: Github,
  linkedin: Linkedin,
  twitter: Twitter,
  globe: Globe,
  mail: Mail,
};

export default function Contact({ profile = defaultProfile, socialLinks = defaultSocialLinks }: ContactProps) {
  if (!profile || !socialLinks) return null;

  return (
    <section id="contact" className="py-32 px-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      <div className="max-w-4xl mx-auto">
        <AnimatedSection>
          <div className="flex items-center gap-3 mb-4 justify-center">
            <div className="h-px flex-1 max-w-xs bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
            <p className="text-sm font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Contact
            </p>
            <div className="h-px flex-1 max-w-xs bg-gradient-to-l from-transparent via-purple-200 to-transparent" />
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-center bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6">
            Let's Work Together
          </h2>
          <p className="text-slate-600 text-lg text-center max-w-2xl mx-auto mb-12 leading-relaxed">
            {profile.bio}
          </p>
        </AnimatedSection>

        {/* Main CTA Card */}
        <AnimatedSection delay={0.15}>
          <div className="relative mb-12">
            {/* Gradient border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-75 transition duration-500" />
            
            <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 rounded-3xl border-2 border-slate-200 p-10 backdrop-blur-sm">
              <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                  </div>
                  Available for opportunities
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Ready to start a project?
                </h3>
                
                <p className="text-slate-600 max-w-xl mx-auto">
                  I'm currently open to new opportunities and exciting projects. Let's discuss how we can work together!
                </p>

                <a
                  href={`mailto:${profile.email}`}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-base font-bold rounded-xl hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <Mail size={20} />
                  {profile.email}
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>

                {/* Location */}
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mt-4">
                  <MapPin size={16} />
                  <span>{profile.location}</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Social Links */}
        <AnimatedSection delay={0.3}>
          <div className="text-center space-y-6">
            <h4 className="text-lg font-semibold text-slate-700">
              Connect with me
            </h4>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {socialLinks.map((link) => {
                const Icon = iconMap[link.icon];
                return (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="group relative"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                    <div className="relative w-12 h-12 flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-600 hover:text-white hover:bg-gradient-to-br hover:from-purple-600 hover:to-indigo-600 hover:border-transparent transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                      <Icon size={20} />
                    </div>
                  </a>
                );
              })}
            </div>

            {/* Link labels */}
            <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-slate-400">
              {socialLinks.map((link, idx) => (
                <span key={link.id}>
                  {link.label}
                  {idx < socialLinks.length - 1 && <span className="ml-3">•</span>}
                </span>
              ))}
            </div>
          </div>
        </AnimatedSection>

        {/* Decorative Quote */}
        <AnimatedSection delay={0.4}>
          <div className="mt-16 text-center">
            <blockquote className="text-slate-500 italic text-base max-w-2xl mx-auto">
              "The only way to do great work is to love what you do."
              <footer className="mt-2 text-sm font-semibold text-slate-600">— Steve Jobs</footer>
            </blockquote>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
