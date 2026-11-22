/**
 * Asia/Manila (UTC+8, no DST) date and time utilities.
 * All "today", school-day weekday checks, and Philippine formatted dates
 * go through this module so Vercel (running in UTC) never drifts from PH time.
 */

export const MANILA_TIME_ZONE = "Asia/Manila" as const;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function extractManilaParts(instant: Date): {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(instant);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
  };
}

/**
 * Converts a Date instant into a `YYYY-MM-DD` date string in `Asia/Manila`.
 */
export function toManilaDateString(instant: Date = new Date()): string {
  const { year, month, day } = extractManilaParts(instant);
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date in `Asia/Manila` as `YYYY-MM-DD`.
 */
export function getManilaToday(now: Date = new Date()): string {
  return toManilaDateString(now);
}

/**
 * Parses a strict `YYYY-MM-DD` calendar date string and returns a UTC Date
 * anchored at 00:00:00Z of that calendar day for safe calendar arithmetic.
 * Throws if the format or calendar date is invalid (e.g. 2026-02-30).
 */
export function parseSchoolDate(dateStr: string): Date {
  const match = ISO_DATE_RE.exec(dateStr);
  if (!match) {
    throw new Error(`Invalid school date format "${dateStr}". Expected YYYY-MM-DD.`);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date "${dateStr}".`);
  }
  return dt;
}

/**
 * Returns the day of the week (`0` = Sunday .. `6` = Saturday) for a `YYYY-MM-DD` date.
 */
export function getWeekdayIndex(dateStr: string): number {
  return parseSchoolDate(dateStr).getUTCDay();
}

/**
 * Returns true if the given `YYYY-MM-DD` date is a Saturday or Sunday.
 */
export function isWeekend(dateStr: string): boolean {
  const day = getWeekdayIndex(dateStr);
  return day === 0 || day === 6;
}

/**
 * Returns true if the given `YYYY-MM-DD` date is Monday through Friday (v1 school days).
 */
export function isSchoolWeekday(dateStr: string): boolean {
  return !isWeekend(dateStr);
}

/**
 * Formats a `YYYY-MM-DD` school date for display in Filipino (`fil-PH`) or English (`en-PH`).
 */
export function formatManilaSchoolDate(
  dateStr: string,
  locale: "fil" | "en" = "fil"
): string {
  const dt = parseSchoolDate(dateStr);
  const bcp47 = locale === "fil" ? "fil-PH" : "en-PH";
  return new Intl.DateTimeFormat(bcp47, {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(dt);
}

/**
 * Formats an instant (`Date` or ISO timestamp) in `Asia/Manila` for logs and exports.
 */
export function formatManilaTimestamp(
  instant: Date | string,
  locale: "fil" | "en" = "fil"
): string {
  const dt = typeof instant === "string" ? new Date(instant) : instant;
  const bcp47 = locale === "fil" ? "fil-PH" : "en-PH";
  return new Intl.DateTimeFormat(bcp47, {
    timeZone: MANILA_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dt);
}
