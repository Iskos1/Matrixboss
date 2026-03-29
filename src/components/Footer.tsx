import portfolioData from "@/data/portfolio.json";
import type { Profile } from "@/lib/portfolio/types";
const defaultProfile = portfolioData.profile as Profile;

interface FooterProps {
  profile?: Profile;
}

export default function Footer({ profile = defaultProfile }: FooterProps) {
  if (!profile) return null;

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-400">
        <span>© {new Date().getFullYear()} {profile.name}</span>
        <span>Built with Next.js · Tailwind CSS</span>
      </div>
    </footer>
  );
}
