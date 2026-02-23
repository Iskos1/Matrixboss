"use client";

import { Settings } from "lucide-react";
import Link from "next/link";

export default function AdminButton() {
  return (
    <Link
      href="/admin"
      className="fixed bottom-6 right-6 bg-purple-600 text-white p-4 rounded-full shadow-2xl hover:bg-purple-700 transition-all hover:scale-110 z-50 group"
      title="Admin Dashboard"
    >
      <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Open Admin Dashboard
      </span>
    </Link>
  );
}
