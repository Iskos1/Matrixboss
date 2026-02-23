"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navItems as defaultNavItems, profile as defaultProfile } from "@/lib/data";
import { Profile, SocialLink } from "@/lib/data";

interface HeaderProps {
  profile?: Profile;
  socialLinks?: SocialLink[];
}

export default function Header({ profile = defaultProfile }: HeaderProps) {
  // Use default navItems as they are usually static, but could be passed as prop if needed
  const navItems = defaultNavItems;
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!profile) return null;

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm" 
        : "bg-transparent"
    }`}>
      <nav className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        {/* Logo / Name - Enhanced */}
        <Link
          href="/"
          className="group relative text-base font-bold tracking-tight"
        >
          <span className="relative z-10 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {profile.name.split(" ")[0]}
          </span>
          <span className="text-slate-300 font-light">.</span>
          <div className="absolute -inset-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
        </Link>

        {/* Desktop Nav - Enhanced */}
        <ul className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="relative px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-200 group"
              >
                {item.label}
                <span className="absolute inset-x-4 bottom-1 h-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile Toggle - Enhanced */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden relative p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={22} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={22} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* Mobile Menu - Enhanced */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 overflow-hidden"
          >
            <motion.ul 
              className="flex flex-col px-6 py-6 gap-2"
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: {
                  transition: { staggerChildren: 0.07, delayChildren: 0.1 }
                },
                closed: {
                  transition: { staggerChildren: 0.05, staggerDirection: -1 }
                }
              }}
            >
              {navItems.map((item, idx) => (
                <motion.li 
                  key={item.href}
                  variants={{
                    open: {
                      y: 0,
                      opacity: 1,
                      transition: {
                        y: { stiffness: 1000, velocity: -100 }
                      }
                    },
                    closed: {
                      y: 20,
                      opacity: 0,
                      transition: {
                        y: { stiffness: 1000 }
                      }
                    }
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-base font-medium text-slate-700 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                      {item.label}
                    </span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
