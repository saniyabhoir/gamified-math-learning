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

/**
 * Fetch the logged-in student's full progress document from MongoDB.
 * This is the single read path the Student Dashboard uses so that
 * MongoDB — not localStorage — is the source of truth for progress.
 *
 * Backend note: GET /progress/student/:studentId is protected and always
 * resolves the student from the JWT (req.user._id), so the :studentId
 * param is only used for route readability — it does not let a student
 * read someone else's progress.
 *
 * @param {string} studentId - the logged-in student's id (from AuthContext)
 * @returns {Promise<object>} the progress document
 *   { modules, modulesCompleted, averageScore, overallAccuracy,
 *     totalTimeSpent, totalRewardPoints, weakTopics }
 * @throws Re-throws the axios error so callers can distinguish "network/
 *   server error" (show retry) from "no data yet" (empty modules array,
 *   which is a valid 200 response, not an error).
 */
export const getMyProgress = async (studentId) => {
  const res = await API.get(`/progress/student/${studentId}`);
  return res.data?.data;
};

export default saveProgressToBackend;
