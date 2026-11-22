/**
 * Application and Database Timezone Configuration
 */

export const APP_TIMEZONE =
  process.env.APP_TIMEZONE?.trim() || process.env.TZ?.trim() || 'Asia/Jakarta';

// Ensure the Node/Bun runtime environment adopts the configured timezone
if (!process.env.TZ) {
  process.env.TZ = APP_TIMEZONE;
}

/**
 * Converts a timezone name (e.g., 'Asia/Jakarta') or offset string (e.g., '+07:00', '+07')
 * to a standardized MySQL offset string in '+HH:MM' or '-HH:MM' format.
 * MySQL reliably accepts offset strings without requiring MySQL tz system tables.
 */
export function getDbTimezoneOffset(
  tz: string = APP_TIMEZONE,
  date: Date = new Date(),
): string {
  if (!tz) return '+07:00';
  const trimmed = tz.trim();

  if (trimmed.toUpperCase() === 'UTC' || trimmed.toUpperCase() === 'Z') {
    return '+00:00';
  }

  // Handle direct offsets like +07, +07:00, +0700, -05:00
  const offsetRegex = /^([+-])(\d{1,2})(?::?(\d{2}))?$/;
  const match = trimmed.match(offsetRegex);
  if (match) {
    const sign = match[1];
    const hours = match[2].padStart(2, '0');
    const mins = (match[3] || '00').padStart(2, '0');
    return `${sign}${hours}:${mins}`;
  }

  // Compute offset for IANA timezone names (e.g., 'Asia/Jakarta') using Intl.DateTimeFormat
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: trimmed,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart?.value) {
      const gmtMatch = tzPart.value.match(/GMT([+-]\d{2}:\d{2})/);
      if (gmtMatch) return gmtMatch[1];
      if (tzPart.value === 'GMT' || tzPart.value === 'UTC') return '+00:00';
    }
  } catch {
    // If invalid IANA name, fallback
  }

  return '+07:00';
}

export const DB_TIMEZONE_OFFSET = getDbTimezoneOffset(APP_TIMEZONE);

/** Restore the session offset Drizzle discards when mapping MySQL TIMESTAMP. */
export function fromDrizzleTimestamp(
  value: Date,
  offset: string = DB_TIMEZONE_OFFSET,
): Date {
  return new Date(`${value.toISOString().slice(0, -1)}${offset}`);
}

/**
 * Returns date formatted as YYYY-MM-DD in the configured timezone.
 */
export function getTodayDateString(
  date: Date = new Date(),
  tz: string = APP_TIMEZONE,
): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Returns current time formatted as HH:mm:ss (24-hour) in the configured timezone.
 */
export function getCurrentTimeString(
  date: Date = new Date(),
  tz: string = APP_TIMEZONE,
): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}

/**
 * Returns formatted timestamp as YYYY-MM-DD HH:mm:ss in the configured timezone.
 */
export function formatDateTimeString(
  date: Date = new Date(),
  tz: string = APP_TIMEZONE,
): string {
  return `${getTodayDateString(date, tz)} ${getCurrentTimeString(date, tz)}`;
}

/**
 * Formats a Date object or timestamp into an ISO 8601 string with the configured timezone offset.
 * Example: '2026-10-23T08:30:00.000+07:00'
 */
export function toIsoStringWithTimezone(dateInput: Date, tz?: string): string;
export function toIsoStringWithTimezone(
  dateInput: null | undefined,
  tz?: string,
): null;
export function toIsoStringWithTimezone(
  dateInput: Date | string | number | null | undefined,
  tz?: string,
): string | null;
export function toIsoStringWithTimezone(
  dateInput: Date | string | number | null | undefined,
  tz: string = APP_TIMEZONE,
): string | null {
  if (dateInput === null || dateInput === undefined) return null;
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;

  const offset = getDbTimezoneOffset(tz, date);
  const dateStr = getTodayDateString(date, tz);
  const timeStr = getCurrentTimeString(date, tz);
  const ms = String(date.getMilliseconds()).padStart(3, '0');

  return `${dateStr}T${timeStr}.${ms}${offset}`;
}
