"use client";

import { Bot } from "lucide-react";
import PortfolioChat from "@/components/PortfolioChat";

export default function ChatTab() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-8 h-8" />
          <h2 className="text-3xl font-bold">Portfolio AI Assistant</h2>
        </div>
        <p className="text-indigo-100 text-lg">
          Ask questions about your portfolio data, get help drafting content, or analyze your profile.
          This assistant has full access to your portfolio data.
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <PortfolioChat embedded />
      </div>
    </div>
  );
}
