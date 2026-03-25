"use client";

import { Settings } from "lucide-react";
import Link from "next/link";

export default function AdminButton() {
  return (
    <Link
      href="/admin"
      title="Admin Settings"
      className="fixed bottom-[8.5rem] right-5 z-40 group w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all duration-200"
    >
      <Settings size={17} className="group-hover:rotate-90 transition-transform duration-300" />
      <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-slate-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
        Admin Settings
      </span>
    </Link>
  );
}
