// backend/utils/progressMath.js
// ─── Shared Progress Math Helpers ─────────────────────────────────────────────
// CLEANUP: clampPercentage/safeNumber (progressController.js) and
// clampScore/clampStars/avg (routes/analytics.js) were independently
// reimplementing the same handful of small numeric helpers. Both places read
// from the same Progress collection and need to agree on what counts as a
// valid score/star value, so a single source of truth here removes the risk
// of the two ever drifting apart.

/**
 * Clamp a percentage-style value (score, accuracy, completion rate) to 0-100.
 * Defensive: also handles non-numeric/undefined input by treating it as 0.
 */
const clampPercentage = (value) => {
  const num = Number(value) || 0;
  return Math.min(100, Math.max(0, num));
};

/**
 * Clamp a star rating to the 0-3 range used throughout the app
 * (see ModulePage.jsx: finalPoints >= 80 ? 3 : finalPoints >= 50 ? 2 : 1).
 */
const clampStars = (value) => {
  const num = Number(value) || 0;
  return Math.min(3, Math.max(0, num));
};

/**
 * Coerce a value to a safe non-negative-or-as-given number, defaulting to 0
 * for anything that isn't a valid number (mistakes, completionTime, etc.).
 */
const safeNumber = (value) => Number(value) || 0;

/**
 * Arithmetic mean of a numeric array. Returns 0 for an empty array instead
 * of NaN.
 */
const average = (arr) =>
  Array.isArray(arr) && arr.length
    ? arr.reduce((sum, v) => sum + v, 0) / arr.length
    : 0;

module.exports = {
  clampPercentage,
  clampStars,
  safeNumber,
  average,
};
