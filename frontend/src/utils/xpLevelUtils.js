// frontend/src/utils/xpLevelUtils.js
//
// Pure, additive helper for the progression layer. Takes XP the app has
// ALREADY computed (via rewardEngine.calculateXP, summed across the
// player's saved module attempts) and maps it to a level + progress bar.
// This file does not compute, award, or store XP — it only presents totals
// that already exist. Nothing here touches rewardEngine.js, progressTracker.js,
// or the backend.

// Simple, tunable level curve: each level needs a bit more XP than the last.
// Feel free to retune LEVEL_BASE/LEVEL_GROWTH — this is presentation-only,
// changing it never changes anyone's actual earned XP.
const LEVEL_BASE = 100;
const LEVEL_GROWTH = 1.15;

const xpRequiredForLevel = (level) =>
  Math.round(LEVEL_BASE * Math.pow(LEVEL_GROWTH, level - 1));

/**
 * @param {number} totalXp - sum of calculateXP() across the player's saved attempts
 * @returns {{ level: number, xpIntoLevel: number, xpForNextLevel: number, progressPct: number }}
 */
export const getLevelProgress = (totalXp = 0) => {
  let level = 1;
  let remaining = totalXp;
  let needed = xpRequiredForLevel(level);

  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpRequiredForLevel(level);
  }

  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: needed,
    progressPct: needed > 0 ? Math.min((remaining / needed) * 100, 100) : 0,
  };
};

// Existing badge IDs already produced by rewardEngine.checkBadges() —
// mapped to a cosmetic unlock id. Purely a lookup table for rendering;
// award logic itself is untouched.
export const BADGE_TO_COSMETIC = {
  perfect_score: "cosmetic_golden_crown",
  first_try: "cosmetic_lightning_cape",
  first_module: "cosmetic_explorer_hat",
  all_modules: "cosmetic_champion_medal",
  high_achiever: "cosmetic_star_pin",
};
