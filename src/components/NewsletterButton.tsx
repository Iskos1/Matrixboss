"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import { motion } from "framer-motion";

export default function NewsletterButton() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
      className="fixed bottom-6 right-24 z-40"
    >
      <Link href="/newsletter" passHref>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-4 rounded-full bg-white text-slate-700 shadow-lg border border-slate-200 hover:text-purple-600 hover:border-purple-200 transition-colors flex items-center justify-center group relative"
          aria-label="Latest News"
        >
          <Newspaper size={24} />
          
          {/* Tooltip */}
          <span className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Latest News
          </span>
        </motion.button>
      </Link>
    </motion.div>
  );
}
