import { format } from "date-fns";

/**
 * Formats a date string with the given format.
 * Returns null if the input is falsy; returns the raw string if unparseable.
 */
export function safeFormat(dateStr, fmt = "MMM d, yyyy") {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : format(d, fmt);
}

/**
 * Formats a date_committed value that may contain multiple dates joined by " + ".
 * Each date is formatted individually and re-joined with " + ".
 * Returns "—" for falsy input.
 *
 * e.g. "2026-02-04 + 2026-02-05" → "02-04-2026 + 02-05-2026"
 */
export function formatMultiDates(dateStr, fmt = "MM-dd-yyyy") {
    if (!dateStr) return "—";
    return String(dateStr)
        .split("+")
        .map((s) => safeFormat(s.trim(), fmt) ?? s.trim())
        .join(" + ");
}

/**
 * Extracts the first date from a " + "-joined date_committed string.
 * Useful for cleansing-date and suspension calculations that need a single date.
 */
export function firstDate(dateStr) {
    if (!dateStr) return null;
    return String(dateStr).split("+")[0].trim() || null;
}

/**
 * Formats a date string; appends time (h:mm a) when a non-midnight time is present.
 * Returns null if the input is falsy.
 *
 * @param {string} dateStr
 * @param {string} baseFormat  - date portion format (default MM/dd/yyyy)
 * @param {boolean} lowercase  - whether to lowercase the AM/PM suffix (for print)
 */

export function safeFormatDT(dateStr, lowercase = false) {
    if (!dateStr) return null;

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const result = format(d, "MMMM d, yyyy 'at' hh:mm a");

    return lowercase ? result.toLowerCase() : result;
}
