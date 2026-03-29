"use client";

import { ShieldCheck, ShieldAlert, Activity, CheckCircle2, XCircle, AlertTriangle, Terminal, KeyRound, RefreshCw } from "lucide-react";

interface SystemTabProps {
  apiKeyStatus: "checking" | "valid" | "invalid" | "unknown";
  apiKeyDiag: any;
  checkingApiKey: boolean;
  onCheckHealth: () => void;
}

export default function SystemTab({ apiKeyStatus, apiKeyDiag, checkingApiKey, onCheckHealth }: SystemTabProps) {
  const headerBg =
    apiKeyStatus === "valid" ? "bg-gradient-to-r from-green-600 to-emerald-600" :
    apiKeyStatus === "invalid" ? "bg-gradient-to-r from-red-600 to-rose-600" :
    "bg-gradient-to-r from-slate-600 to-slate-700";

  const headerMsg =
    apiKeyStatus === "valid" ? "All systems operational — Anthropic Claude is connected and responding." :
    apiKeyStatus === "invalid" ? "Anthropic API key is invalid or revoked. Follow the steps below to fix it." :
    apiKeyStatus === "checking" ? "Running diagnostics…" :
    "Run a check to see the current API key status.";

  return (
    <div className="space-y-6">
      <div className={`${headerBg} rounded-xl shadow-lg p-8 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {apiKeyStatus === "valid" ? <ShieldCheck className="w-8 h-8" /> : apiKeyStatus === "invalid" ? <ShieldAlert className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
            <div>
              <h2 className="text-3xl font-bold">System Status</h2>
              <p className="text-white/80 text-sm mt-1">{headerMsg}</p>
            </div>
          </div>
          <button onClick={onCheckHealth} disabled={checkingApiKey} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-lg font-semibold transition disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${checkingApiKey ? "animate-spin" : ""}`} />
            {checkingApiKey ? "Checking…" : "Re-check Now"}
          </button>
        </div>
      </div>

      {apiKeyDiag && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className={`bg-white rounded-xl shadow-sm p-6 border-2 ${apiKeyDiag.anthropic_test?.ok ? "border-green-300" : "border-red-300"}`}>
            <div className="flex items-center gap-3 mb-4">
              {apiKeyDiag.anthropic_test?.ok ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
              <h3 className="font-bold text-slate-900">Anthropic Claude Connection</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <span className={`font-semibold ${apiKeyDiag.anthropic_test?.ok ? "text-green-600" : "text-red-600"}`}>
                  {apiKeyDiag.anthropic_test?.ok
                    ? `HTTP ${apiKeyDiag.anthropic_test.status} OK`
                    : apiKeyDiag.anthropic_test?.status
                      ? `HTTP ${apiKeyDiag.anthropic_test.status} Error`
                      : apiKeyDiag.anthropic_test?.tested === false
                        ? "No API key configured"
                        : "Connection failed"}
                </span>
              </div>
              {!apiKeyDiag.anthropic_test?.ok && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg space-y-1">
                  {apiKeyDiag.anthropic_test?.tested === false && (
                    <p className="text-amber-700 text-xs font-medium">
                      ANTHROPIC_API_KEY is not set. Add it to your .env.local file and restart the dev server.
                    </p>
                  )}
                  {apiKeyDiag.anthropic_test?.fetch_error && (
                    <p className="text-red-700 text-xs font-medium">
                      Network error: {apiKeyDiag.anthropic_test.fetch_error}
                    </p>
                  )}
                  {apiKeyDiag.anthropic_test?.error_type && (
                    <p className="text-red-700 text-xs font-medium">{apiKeyDiag.anthropic_test.error_type}</p>
                  )}
                  {apiKeyDiag.anthropic_test?.error_message && (
                    <p className="text-red-600 text-xs">{apiKeyDiag.anthropic_test.error_message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <KeyRound className="w-6 h-6 text-indigo-600" />
              <h3 className="font-bold text-slate-900">Key Details</h3>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: "Prefix", value: (apiKeyDiag.key_diagnostics?.prefix_12 || "—") + "…" },
                { label: "Suffix", value: "…" + (apiKeyDiag.key_diagnostics?.suffix_6 || "—") },
                { label: "Length", value: `${apiKeyDiag.key_diagnostics?.raw_length || 0} chars` },
                { label: "Format", value: apiKeyDiag.key_diagnostics?.starts_with_sk_ant ? "sk-ant-* ✓" : "Invalid ✗" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-mono text-slate-800 text-xs font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`bg-white rounded-xl shadow-sm p-6 border-2 ${apiKeyDiag.env_source_clues?.loaded_from_env_local ? "border-green-200" : "border-amber-300"}`}>
            <div className="flex items-center gap-3 mb-4">
              {apiKeyDiag.env_source_clues?.loaded_from_env_local ? <CheckCircle2 className="w-6 h-6 text-green-600" /> : <AlertTriangle className="w-6 h-6 text-amber-500" />}
              <h3 className="font-bold text-slate-900">Key Source</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className={`p-3 rounded-lg text-xs font-medium ${apiKeyDiag.env_source_clues?.loaded_from_env_local ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
                {apiKeyDiag.env_source_clues?.likely_source}
              </div>
              <p className="text-slate-500 text-xs">
                {apiKeyDiag.env_source_clues?.loaded_from_env_local ? "Great — .env.local is the active source." : "⚠️ A shell/system env var may be overriding .env.local."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 text-white flex items-center gap-3">
          <Terminal className="w-6 h-6" />
          <div>
            <h3 className="text-xl font-bold">How to Change Your Anthropic API Key</h3>
            <p className="text-slate-300 text-sm mt-1">Follow these steps exactly — takes under 2 minutes.</p>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {[
            {
              num: "1", color: "bg-indigo-600",
              title: "Get your new key from Anthropic Console",
              content: (
                <>
                  <p className="text-slate-600 text-sm mb-2">Go to the Anthropic Console and create or copy a new API key.</p>
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm underline underline-offset-2">console.anthropic.com/settings/keys ↗</a>
                </>
              ),
            },
            {
              num: "2", color: "bg-indigo-600",
              title: <>Update <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">.env.local</code></>,
              content: (
                <>
                  <p className="text-slate-600 text-sm mb-3">Open the file at the project root and replace the key value:</p>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-300">
                    <p className="text-slate-500 text-xs mb-2"># /Jawads Portfolio/.env.local</p>
                    <p>ANTHROPIC_API_KEY=<span className="text-yellow-300">sk-ant-...YOUR_NEW_KEY</span></p>
                  </div>
                  {apiKeyDiag?.env_file_diagnostics?.path && (
                    <p className="text-xs text-slate-400 mt-2">📁 Full path: <code className="bg-slate-100 px-1 rounded">{apiKeyDiag.env_file_diagnostics.path}</code></p>
                  )}
                </>
              ),
            },
            {
              num: "3", color: "bg-amber-500",
              title: "⚠️ Check your shell config for a conflicting export",
              content: (
                <>
                  <p className="text-slate-600 text-sm mb-3">If <code className="bg-slate-100 px-1 rounded text-xs">ANTHROPIC_API_KEY</code> is exported in <code className="bg-slate-100 px-1 rounded text-xs">~/.zshrc</code>, it overrides <code className="bg-slate-100 px-1 rounded text-xs">.env.local</code>. Run this to check:</p>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-300">
                    <p>grep -rn ANTHROPIC_API_KEY ~/.zshrc ~/.zprofile ~/.bashrc ~/.bash_profile 2&gt;/dev/null</p>
                  </div>
                </>
              ),
            },
            {
              num: "4", color: "bg-indigo-600",
              title: "Restart the dev server",
              content: (
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm space-y-2">
                  <p className="text-slate-500 text-xs"># Standard restart</p>
                  <p className="text-green-300">npm run dev</p>
                  <p className="text-slate-500 text-xs mt-3"># Force .env.local regardless of shell exports</p>
                  <p className="text-yellow-300">env -u ANTHROPIC_API_KEY npm run dev</p>
                </div>
              ),
            },
            {
              num: "5", color: "bg-green-600",
              title: "Verify everything is working",
              content: (
                <>
                  <p className="text-slate-600 text-sm mb-3">Come back here and click the button below. You should see a green status.</p>
                  <button onClick={onCheckHealth} disabled={checkingApiKey} className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-bold transition disabled:opacity-50 shadow">
                    <RefreshCw className={`w-4 h-4 ${checkingApiKey ? "animate-spin" : ""}`} />
                    {checkingApiKey ? "Checking…" : "Run System Check"}
                  </button>
                </>
              ),
            },
          ].map(({ num, color, title, content }) => (
            <div key={num} className="flex gap-4">
              <div className={`flex-shrink-0 w-8 h-8 ${color} text-white rounded-full flex items-center justify-center font-bold text-sm`}>{num}</div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
                {content}
              </div>
            </div>
          ))}
        </div>
      </div>

      {apiKeyDiag && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <details className="group">
            <summary className="cursor-pointer p-5 font-bold text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition list-none">
              <Activity className="w-5 h-5 text-slate-400" />
              <span>Raw Diagnostic Output</span>
              <span className="ml-auto text-slate-400 text-sm font-normal group-open:hidden">Click to expand</span>
            </summary>
            <div className="border-t border-slate-100">
              <pre className="p-5 text-xs bg-slate-900 text-green-300 overflow-x-auto font-mono leading-relaxed">
                {JSON.stringify(apiKeyDiag, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
