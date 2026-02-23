import { profile as defaultProfile } from "@/lib/data";
import { Profile } from "@/lib/data";
import { Heart, Code } from "lucide-react";

interface FooterProps {
  profile?: Profile;
}

export default function Footer({ profile = defaultProfile }: FooterProps) {
  const year = new Date().getFullYear();

  if (!profile) return null;

  return (
    <footer className="relative py-12 px-6 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
      
      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-6 text-slate-600">
          {/* Brand */}
          <div className="text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              {profile.name}
            </p>
            <p className="text-sm text-slate-500">
              Building the future, one line at a time
            </p>
          </div>

          {/* Divider */}
          <div className="w-full max-w-xs h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />

          {/* Footer Info */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm">
            <p className="flex items-center gap-2">
              &copy; {year} {profile.name}
            </p>
            <span className="hidden sm:block text-slate-300">•</span>
            <p className="flex items-center gap-2">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" /> and <Code className="w-4 h-4 text-purple-600" />
            </p>
          </div>

          {/* Tech Stack */}
          <p className="text-xs text-slate-400">
            Built with Next.js, React & Tailwind CSS
          </p>
        </div>
      </div>
    </footer>
  );
}
