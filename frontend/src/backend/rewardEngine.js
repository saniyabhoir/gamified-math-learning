// frontend/src/backend/rewardEngine.js
// FIX: Was completely empty. Handles badge and XP reward logic.

/**
 * Calculate XP earned for completing a module.
 * @param {number} score     - Score percentage (0–100)
 * @param {number} attempts  - Number of attempts taken
 * @param {boolean} firstTry - Whether it was completed on first attempt
 * @returns {number} - XP points earned
 */
export const calculateXP = (score, attempts = 1, firstTry = false) => {
  let xp = 0;

  // Base XP from score
  if (score >= 90) xp += 100;
  else if (score >= 70) xp += 75;
  else if (score >= 50) xp += 50;
  else xp += 25;

  // First-try bonus
  if (firstTry || attempts === 1) xp += 25;

  // Perfection bonus
  if (score === 100) xp += 50;

  return xp;
};

/**
 * Determine which badges should be awarded after a module completion.
 * @param {Object} params
 * @param {number}  params.score
 * @param {number}  params.attempts
 * @param {number}  params.modulesCompleted - Total modules completed including this one
 * @returns {string[]} - List of badge IDs earned
 */
export const checkBadges = ({ score, attempts, modulesCompleted }) => {
  const earned = [];

  if (score === 100)            earned.push("perfect_score");
  if (attempts === 1)           earned.push("first_try");
  if (modulesCompleted === 1)   earned.push("first_module");
  if (modulesCompleted === 5)   earned.push("all_modules");
  if (score >= 90)              earned.push("high_achiever");

  return earned;
};

/**
 * Get a human-readable reward message for display.
 * @param {number} xp       - XP earned
 * @param {string[]} badges - Badge IDs earned
 * @returns {string}
 */
export const getRewardMessage = (xp, badges = []) => {
  let message = `+${xp} XP earned!`;
  if (badges.includes("perfect_score")) message += " 🏆 Perfect score!";
  if (badges.includes("first_try"))     message += " ⚡ First try bonus!";
  if (badges.includes("all_modules"))   message += " 🎓 All modules complete!";
  return message;
};
