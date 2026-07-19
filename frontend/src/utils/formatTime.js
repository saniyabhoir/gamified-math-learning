// frontend/src/utils/formatTime.js
// Reusable time formatting utility for the Teacher Dashboard.
//
// The dashboard has two different time units floating around the data
// model: `Progress.totalTimeSpent` / `module.completionTime` are stored in
// SECONDS, while a few older UI spots (StudentsTable, StudentModal) were
// working off of a value already divided down to whole MINUTES. Rather than
// have every component re-implement its own rounding/pluralization, this
// file centralizes both directions so the whole app renders time
// consistently (e.g. "4m 28s" / "1h 12m" instead of a bare "4m").

/**
 * Format a duration given in SECONDS into a human-readable string.
 *  - < 60s        -> "42s"
 *  - < 1h         -> "4m 28s"
 *  - >= 1h        -> "1h 12m" (seconds dropped once we're in hour territory)
 *
 * @param {number} totalSeconds
 * @param {{ compact?: boolean }} [opts] compact=true omits the seconds part
 *   for minute-scale durations too (e.g. "4m" instead of "4m 28s").
 */
export const formatSeconds = (totalSeconds, opts = {}) => {
  const { compact = false } = opts;
  const s = Math.max(0, Math.round(Number(totalSeconds) || 0));

  if (s < 60) return `${s}s`;

  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (compact || seconds === 0) return `${minutes}m`;
  return `${minutes}m ${seconds}s`;
};

/**
 * Format a duration given in MINUTES (e.g. Progress.totalTimeSpent already
 * converted to minutes by the API) into the same "1h 12m" style output.
 * Accepts a fractional minute value so partial minutes still show seconds.
 *
 * @param {number} totalMinutes
 */
export const formatMinutes = (totalMinutes) => {
  if (totalMinutes == null || isNaN(totalMinutes)) return '—';
  return formatSeconds(Number(totalMinutes) * 60);
};

/**
 * Format an ISO date / Date into a short relative-or-absolute string used
 * for "Completed Date" fields, e.g. "Jul 12, 2026".
 */
export const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Format an ISO date / Date into a relative "time ago" string, e.g.
 * "3h ago", "2d ago", "just now". Used by Recent Activity style widgets.
 */
export const formatRelativeTime = (date) => {
  if (!date) return '—';
  const then = new Date(date).getTime();
  if (isNaN(then)) return '—';
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
};
