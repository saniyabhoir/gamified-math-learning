// frontend/src/utils/analyticsHelpers.js
// FIX: This file was completely empty. Added all analytics utility functions.

/**
 * Calculate the average of an array of numbers.
 * Returns 0 for empty arrays.
 */
export const average = (arr) => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
};

/**
 * Determine score color based on thresholds.
 * >= 80 → green, >= 60 → amber, < 60 → red
 */
export const getScoreColor = (score) => {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#F59E0B";
  return "#EF4444";
};

/**
 * Determine completion color based on thresholds.
 * >= 70 → teal, >= 40 → amber, < 40 → red
 */
export const getCompletionColor = (rate) => {
  if (rate >= 70) return "#14B8A6";
  if (rate >= 40) return "#F59E0B";
  return "#EF4444";
};

/**
 * Format minutes into a human-readable duration string.
 * e.g. 90 → "1h 30m", 45 → "45m"
 */
export const formatDuration = (minutes) => {
  if (minutes == null || isNaN(minutes)) return "—";
  const m = Math.round(minutes);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

/**
 * Get student initials from full name.
 * "Arjun Sharma" → "AS"
 */
export const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
};

/**
 * Derive the weakest topic for a student from their module progress.
 * Accepts an array of module objects: [{ title, score, weakTopics }]
 * Returns a string (topic name) or null.
 */
export const deriveWeakTopic = (modules = []) => {
  const completed = modules.filter((m) => m.completed);
  if (completed.length === 0) return null;

  // Prefer explicit weakTopics tags
  for (const m of completed) {
    if (m.weakTopics && m.weakTopics.length > 0) return m.weakTopics[0];
  }

  // Fall back to lowest-scoring module title
  const weakest = completed.reduce((min, m) => (m.score < min.score ? m : min));
  return weakest.score < 60 ? weakest.title || null : null;
};

/**
 * Compute class-wide overview stats from arrays of student progress.
 * @param {Array} progressList - Array of Progress documents
 * @param {number} totalStudents - Total enrolled students
 */
export const computeOverviewStats = (progressList = [], totalStudents = 0) => {
  const allScores = progressList.flatMap((p) =>
    (p.modules || []).filter((m) => m.completed).map((m) => m.score)
  );
  const averageScore = Math.round(average(allScores));

  const totalPossible = totalStudents * 5;
  const totalCompleted = progressList.reduce(
    (sum, p) => sum + (p.modules || []).filter((m) => m.completed).length,
    0
  );
  const modulesCompleted = totalPossible > 0
    ? Math.round((totalCompleted / totalPossible) * 100)
    : 0;

  const allTimes = progressList.map((p) => p.totalTimeSpent || 0);
  const avgTimeSpent = Math.round(average(allTimes));

  return { totalStudents, averageScore, modulesCompleted, avgTimeSpent };
};

/**
 * Check whether a student was active within the last N days.
 */
export const isActiveRecently = (lastActiveAt, days = 7) => {
  if (!lastActiveAt) return false;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return new Date(lastActiveAt) > cutoff;
};
