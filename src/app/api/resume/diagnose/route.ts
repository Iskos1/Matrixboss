import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/resume/diagnose
 *
 * Comprehensive key & environment diagnostic for Gemini.
 * Shows EXACTLY what process.env sees at runtime (never exposes the full key).
 */
export async function GET() {
  // ─── 1. Inspect the raw env var ────────────────────────────────────────────
  const raw = process.env.GEMINI_API_KEY ?? '';
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');

  // Character-level forensics (no full key ever returned)
  const charCodes = Array.from(raw.substring(0, 20)).map((c) => ({
    char: c === '\n' ? '\\n' : c === '\r' ? '\\r' : c === '\t' ? '\\t' : c,
    code: c.charCodeAt(0),
  }));

  const keyDiag = {
    exists: raw.length > 0,
    raw_length: raw.length,
    trimmed_length: trimmed.length,
    has_trim_diff: raw.length !== trimmed.length,
    starts_with_AIza: trimmed.startsWith('AIza'),
    prefix_12: trimmed.substring(0, 12),
    suffix_6: trimmed.slice(-6),
    first_20_char_codes: charCodes,
    has_newline: raw.includes('\n'),
    has_carriage_return: raw.includes('\r'),
    has_tab: raw.includes('\t'),
    has_quotes: raw.startsWith('"') || raw.startsWith("'"),
    has_spaces: raw !== raw.trim(),
  };

  // ─── 2. Inspect the .env.local file on disk ─────────────────────────────────
  let envFileDiag: Record<string, any> = { exists: false };
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      const keyLine = lines.find((l) => l.startsWith('GEMINI_API_KEY='));
      const fileKey = keyLine ? keyLine.replace('GEMINI_API_KEY=', '').trim() : '';
      envFileDiag = {
        exists: true,
        path: envPath,
        total_lines: lines.length,
        key_line_found: !!keyLine,
        file_key_length: fileKey.length,
        file_key_prefix_12: fileKey.substring(0, 12),
        file_key_suffix_6: fileKey.slice(-6),
        keys_match: fileKey === trimmed,
        env_key_suffix_matches_file: trimmed.slice(-6) === fileKey.slice(-6),
      };
    }
  } catch (e: any) {
    envFileDiag = { exists: false, error: e.message };
  }

  // ─── 3. Test Gemini connectivity with the runtime key ───────────────────────
  let geminiDiag: Record<string, any> = { tested: false };
  if (trimmed) {
    try {
      // Test by hitting the models list endpoint
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${trimmed}`);
      geminiDiag = {
        tested: true,
        status: resp.status,
        ok: resp.ok,
        status_text: resp.statusText,
      };
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        geminiDiag.error_code = body?.error?.code;
        geminiDiag.error_message = body?.error?.message?.substring(0, 120);
      }
    } catch (e: any) {
      geminiDiag = { tested: true, fetch_error: e.message };
    }
  }

  // ─── 4. Process environment source clues ───────────────────────────────────
  const envSourceClues = {
    node_env: process.env.NODE_ENV,
    next_public_app_url: process.env.NEXT_PUBLIC_APP_URL,
    cwd: process.cwd(),
    loaded_from_env_local: envFileDiag.exists && envFileDiag.env_key_suffix_matches_file,
    runtime_key_suffix_differs_from_file: !envFileDiag.env_key_suffix_matches_file,
    // If the runtime key differs from .env.local, a shell/system env var is winning
    likely_source:
      envFileDiag.env_key_suffix_matches_file
        ? '.env.local  ✅'
        : 'Shell / system environment variable  ⚠️  (overrides .env.local)',
  };

  return NextResponse.json({
    summary:
      geminiDiag.ok === true
        ? '✅ Gemini key is VALID and working'
        : `❌ Gemini key is INVALID — ${geminiDiag.error_code ?? geminiDiag.fetch_error ?? 'unknown error'}`,
    key_diagnostics: keyDiag,
    env_file_diagnostics: envFileDiag,
    gemini_test: geminiDiag,
    env_source_clues: envSourceClues,
  });
}
