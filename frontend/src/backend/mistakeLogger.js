// frontend/src/backend/mistakeLogger.js
// FIX: Was completely empty. Tracks incorrect answers for weak-topic detection.

/**
 * In-memory log of mistakes during a session.
 * Shape: [{ moduleId, questionId, concept, userAnswer, correctAnswer, timestamp }]
 */
let sessionMistakes = [];

/**
 * Record a mistake.
 * @param {Object} params
 * @param {string} params.moduleId      - Which module the mistake happened in
 * @param {string} params.questionId    - Question identifier
 * @param {string} params.concept       - Concept/topic tag (e.g. "like terms")
 * @param {*}      params.userAnswer    - What the student answered
 * @param {*}      params.correctAnswer - The correct answer
 */
export const logMistake = ({ moduleId, questionId, concept, userAnswer, correctAnswer }) => {
  sessionMistakes.push({
    moduleId,
    questionId,
    concept: concept || "unknown",
    userAnswer,
    correctAnswer,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Get all mistakes logged so far in this session.
 */
export const getSessionMistakes = () => [...sessionMistakes];

/**
 * Get the top N weak topics (concepts with the most mistakes).
 * @param {number} topN - How many topics to return (default 3)
 * @returns {string[]} - Array of concept names, sorted by mistake count
 */
export const getWeakTopics = (topN = 3) => {
  const counts = {};
  for (const m of sessionMistakes) {
    counts[m.concept] = (counts[m.concept] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([concept]) => concept);
};

/**
 * Clear session mistakes (call at start of each module attempt).
 */
export const clearSessionMistakes = () => {
  sessionMistakes = [];
};
