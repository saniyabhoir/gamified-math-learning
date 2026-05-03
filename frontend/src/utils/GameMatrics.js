// frontend/src/utils/gameMetrics.js
// ─── Standardised Game Metrics Utility ───────────────────────────────────────
// All games write results through this module so:
//  - Dashboard stats stay consistent
//  - Future analytics hooks have a single injection point
//  - Teacher dashboard can read a predictable schema

// ── Schema ────────────────────────────────────────────────────────────────────
/**
 * GameResult schema (all games must produce this shape):
 * {
 *   moduleId:       number,
 *   gameId:         string,
 *   completedAt:    ISO string,
 *   score:          number,
 *   accuracy:       number,       // 0–100 (%)
 *   mistakes:       number,
 *   completionTime: number,       // seconds
 *   stars:          number,       // 1–3
 *   rewardPoints:   number,
 *   badgeUnlocked:  string|null,
 *   extraData:      object,       // game-specific extras
 * }
 */

// ── Storage key generators ─────────────────────────────────────────────────────
export const getGameResultKey = (userId, moduleId) =>
  `mq_game_result_u${userId}_m${moduleId}`;

export const getGameBestKey = (userId, moduleId) =>
  `mq_game_best_u${userId}_m${moduleId}`;

// ── Save result ────────────────────────────────────────────────────────────────
export const saveGameResult = (userId, result) => {
  if (!userId || !result?.moduleId) return;

  const resultKey = getGameResultKey(userId, result.moduleId);
  const bestKey = getGameBestKey(userId, result.moduleId);

  // Always save the latest result
  try {
    localStorage.setItem(resultKey, JSON.stringify(result));
  } catch {
    /* storage full */
  }

  // Update best-ever stats (highest score wins)
  try {
    const rawBest = localStorage.getItem(bestKey);
    const best = rawBest ? JSON.parse(rawBest) : null;
    if (!best || result.score > best.score) {
      localStorage.setItem(bestKey, JSON.stringify(result));
    }
  } catch {
    /* ignore */
  }
};

// ── Load result ────────────────────────────────────────────────────────────────
export const loadGameResult = (userId, moduleId) => {
  try {
    const raw = localStorage.getItem(getGameResultKey(userId, moduleId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const loadGameBest = (userId, moduleId) => {
  try {
    const raw = localStorage.getItem(getGameBestKey(userId, moduleId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ── Star calculators ──────────────────────────────────────────────────────────
// Module 1 — Like Terms Memory Match
export const calcStarsMemoryMatch = (mistakesPerRound) => {
  // mistakesPerRound: [round1Mistakes, round2Mistakes]
  const avg =
    mistakesPerRound.reduce((a, b) => a + b, 0) / mistakesPerRound.length;
  if (avg <= 2) return 3;
  if (avg <= 5) return 2;
  return 1;
};

// Generic quiz star calc (shared across Modules 2, 3, 5)
export const calcStarsQuiz = (correctCount, totalCount) => {
  const pct = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  if (pct >= 80) return 3;
  if (pct >= 60) return 2;
  return 1;
};

// ── Reward point calculators ──────────────────────────────────────────────────
export const calcRewardPoints = (stars, baseMultiplier = 25) =>
  stars * baseMultiplier;

// ── Build a complete result object ────────────────────────────────────────────
export const buildGameResult = ({
  moduleId,
  gameId,
  score,
  accuracy,
  mistakes,
  completionTime,
  stars,
  rewardPoints,
  badgeUnlocked = null,
  extraData = {},
}) => ({
  moduleId,
  gameId,
  completedAt: new Date().toISOString(),
  score,
  accuracy: Math.round(accuracy),
  mistakes,
  completionTime: Math.round(completionTime),
  stars,
  rewardPoints,
  badgeUnlocked,
  extraData,
});

// ── Dashboard-compatible stat summary ────────────────────────────────────────
export const getGameStatSummary = (userId, moduleId) => {
  const best = loadGameBest(userId, moduleId);
  if (!best) return null;
  return {
    stars: best.stars,
    score: best.score,
    accuracy: best.accuracy,
    badge: best.badgeUnlocked,
    hasPlayed: true,
  };
};

