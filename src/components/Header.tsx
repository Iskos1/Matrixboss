"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { profile as defaultProfile } from "@/lib/data";
import { Profile, SocialLink } from "@/lib/data";

interface HeaderProps {
  profile?: Profile;
  socialLinks?: SocialLink[];
}

const NAV = [
  { label: "About",      href: "/#about" },
  { label: "Skills",     href: "/#skills" },
  { label: "Experience", href: "/#experience" },
  { label: "Projects",   href: "/#projects" },
  { label: "Contact",    href: "/#contact" },
];

export default function Header({ profile = defaultProfile }: HeaderProps) {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!profile) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-sm border-b border-slate-200" : "border-b border-transparent"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="text-sm font-bold text-slate-900 tracking-tight hover:text-blue-600 transition-colors">
          {profile.name.split(" ")[0]}<span className="text-blue-600">.</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`mailto:${profile.email}`}
            className="ml-3 px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            Hire Me
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`mailto:${profile.email}`}
              className="mt-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md text-center transition-colors"
            >
              Hire Me
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
