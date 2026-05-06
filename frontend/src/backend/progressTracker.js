// frontend/src/backend/progressTracker.js
// FIX: Was completely empty. Provides functions to save student progress to the backend.

import API from "../services/authService";

/**
 * Save progress for a single module attempt.
 * @param {Object} params
 * @param {string} params.moduleId     - e.g. "module1"
 * @param {number} params.moduleOrder  - 1–5
 * @param {string} params.title        - Module display name
 * @param {boolean} params.completed   - Whether the module is done
 * @param {number} params.score        - Score percentage (0–100)
 * @param {number} params.timeSpent    - Minutes spent on this attempt
 * @param {string[]} params.weakTopics - Tags for weak areas identified
 */
export const saveModuleProgress = async ({
  moduleId,
  moduleOrder,
  title,
  completed,
  score,
  timeSpent = 0,
  weakTopics = [],
}) => {
  try {
    const res = await API.post("/progress/module", {
      moduleId,
      moduleOrder,
      title,
      completed,
      score,
      timeSpent,
      weakTopics,
    });
    return res.data;
  } catch (err) {
    console.error("[progressTracker] saveModuleProgress failed:", err.message);
    throw err;
  }
};

/**
 * Fetch the current student's full progress record.
 */
export const fetchProgress = async () => {
  try {
    const res = await API.get("/progress");
    return res.data.data;
  } catch (err) {
    console.error("[progressTracker] fetchProgress failed:", err.message);
    throw err;
  }
};
