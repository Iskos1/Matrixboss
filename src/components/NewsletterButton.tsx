"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";

export default function NewsletterButton() {
  return (
    <Link
      href="/newsletter"
      title="Tech News"
      className="fixed bottom-[5.75rem] right-5 z-40 group w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all duration-200"
    >
      <Newspaper size={17} />
      <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
        Tech News Feed
      </span>
    </Link>
  );
}
