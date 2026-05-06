// frontend/src/backend/revisionEngine.js
// FIX: Was completely empty. Determines which modules/topics need revision.

import { getWeakTopics } from "./mistakeLogger";

/**
 * Determine whether a student should be prompted to revise a module.
 * @param {Object} moduleProgress - Progress record for a specific module
 * @returns {boolean}
 */
export const needsRevision = (moduleProgress) => {
  if (!moduleProgress) return false;
  // Needs revision if completed but scored below 70%
  return moduleProgress.completed && moduleProgress.score < 70;
};

/**
 * Generate a revision plan for a student based on their progress.
 * @param {Array} modules - Array of module progress objects
 * @returns {Array} - Sorted list of modules needing revision with reason
 */
export const generateRevisionPlan = (modules = []) => {
  const plan = [];

  for (const m of modules) {
    if (!m.completed) continue;

    if (m.score < 50) {
      plan.push({ ...m, priority: "high",   reason: "Score critically low (<50%)"     });
    } else if (m.score < 70) {
      plan.push({ ...m, priority: "medium", reason: "Score below mastery threshold"   });
    } else if (m.attempts > 3) {
      plan.push({ ...m, priority: "low",    reason: "Needed many attempts to complete" });
    }
  }

  // Sort: high → medium → low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  plan.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return plan;
};

/**
 * Get the current session's weak topics that should be revised.
 * Combines module-level weak topics with session mistakes.
 * @param {Array} moduleProgress - Array of all module progress records
 * @returns {string[]} - Unique list of weak topic names
 */
export const getRevisionTopics = (moduleProgress = []) => {
  const fromModules = moduleProgress
    .filter((m) => m.completed && m.score < 70)
    .flatMap((m) => m.weakTopics || []);

  const fromSession = getWeakTopics(5);

  // Unique merge
  return [...new Set([...fromModules, ...fromSession])];
};
