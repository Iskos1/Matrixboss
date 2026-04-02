import type { ExperienceItem } from "./types";

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parses a date string like "Sept 2021", "Dec 2025", "Mar 2023" into a timestamp.
 * Returns 0 if parsing fails.
 */
function parsePeriodDate(dateStr: string): number {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim().toLowerCase();
  if (trimmed === "present") return Date.now();

  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return 0;

  const monthKey = parts[0].substring(0, 3);
  const month = MONTH_MAP[monthKey];
  const year = parseInt(parts[1], 10);

  if (month === undefined || isNaN(year)) return 0;
  return new Date(year, month, 1).getTime();
}

/**
 * Returns a numeric timestamp for the start date of an ExperienceItem,
 * used for sorting by date.
 */
export function getExperienceStartDate(item: ExperienceItem): number {
  // Try the first position's period
  if (item.positions && item.positions.length > 0) {
    const period = item.positions[0].period || "";
    const startPart = period.split(/\s*--\s*/)[0];
    const ts = parsePeriodDate(startPart);
    if (ts > 0) return ts;
  }

  // Fall back to top-level period
  if (item.period) {
    const startPart = item.period.split(/\s*--\s*/)[0];
    const ts = parsePeriodDate(startPart);
    if (ts > 0) return ts;
  }

  return 0;
}
