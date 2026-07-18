// frontend/src/services/progressService.js
// ─── Shared Progress Persistence ──────────────────────────────────────────────
// Single source of truth for writing module progress to the backend.
// Both the "Learning" flow (ModulePage.jsx) and the "Arcade Game" flow
// (GamePage.jsx) call this same function so there is exactly one save
// path, one endpoint (POST /progress/save), and one MongoDB write shape.

import API from "./authService";

/**
 * Persist a module's progress to the backend.
 *
 * @param {object} progressData - matches the payload saveModuleProgress expects:
 *   { moduleId, moduleTitle, gameId, score, accuracy, mistakes,
 *     completionTime, stars, rewardPoints, completed, weakTopics, playedAt }
 * @returns {Promise<boolean>} true if the save succeeded, false otherwise.
 */
export const saveProgressToBackend = async (progressData) => {
  try {
    const res = await API.post("/progress/save", progressData);
    console.log("✅ Progress saved to backend:", res.data);
    return true;
  } catch (err) {
    console.error(
      "❌ Failed to save progress to backend:",
      err.response?.data || err.message
    );
    return false;
  }
};

export default saveProgressToBackend;
