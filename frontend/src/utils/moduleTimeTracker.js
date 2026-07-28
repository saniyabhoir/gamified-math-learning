// frontend/src/utils/moduleTimeTracker.js
// ─── Module Learning Time Analytics (research metric) ─────────────────────────
// This is NOT the game timer. It measures the total time a student spends in
// a module's learning flow — story screens, examples, quizzes, feedback, and
// navigation between them — from the moment they enter the module until it
// is successfully completed.
//
// It is tracked completely separately from `completionTime`/the arcade game
// timer (see GameMatrics.js and GamePage.jsx), which is left untouched.
// Both values are saved to the backend side-by-side:
//   moduleTime = total learning time (this utility)
//   gameTime   = final game duration (existing completionTime flow)
//
// Design notes for future researchers (mirrors backend/models/Progress.js
// modules[].moduleTime):
//  - Time only accumulates while the tab is in the foreground. When the tab
//    is backgrounded (document.visibilitychange -> "hidden"), the timer
//    pauses; it resumes the moment the tab becomes visible again. This keeps
//    idle/backgrounded time out of the research metric.
//  - The running total is persisted to localStorage so a student who
//    reloads the page, or leaves an incomplete module and comes back later,
//    continues timing from where they left off instead of restarting.
//  - Once a module is marked complete, the timer is created already paused
//    on future visits (review mode), so revisiting a finished module never
//    adds more time to the research metric or produces duplicate records.

/**
 * Create a pausable elapsed-time accumulator.
 *
 * @param {number} initialAccumulatedMs - elapsed ms carried over from a
 *   previous session (e.g. loaded from localStorage), so resuming an
 *   incomplete module continues timing rather than restarting.
 * @param {boolean} startPaused - if true, the timer starts frozen at
 *   `initialAccumulatedMs` and never accumulates further. Used when a
 *   module was already completed, so reviewing it doesn't add more time.
 */
export const createModuleTimer = (initialAccumulatedMs = 0, startPaused = false) => {
  let accumulatedMs = Math.max(0, initialAccumulatedMs || 0);
  let segmentStart = Date.now();
  let paused = !!startPaused;

  const pause = () => {
    if (paused) return;
    accumulatedMs += Date.now() - segmentStart;
    paused = true;
  };

  const resume = () => {
    if (!paused) return;
    segmentStart = Date.now();
    paused = false;
  };

  const getElapsedMs = () =>
    accumulatedMs + (paused ? 0 : Date.now() - segmentStart);

  const getElapsedSeconds = () => Math.round(getElapsedMs() / 1000);

  return { pause, resume, getElapsedMs, getElapsedSeconds };
};

/** Format seconds as e.g. "4m 12s" (or just "38s" under a minute). */
export const formatDuration = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m <= 0) return `${rem}s`;
  return `${m}m ${rem}s`;
};

/** Format seconds as mm:ss, e.g. "04:12". */
export const formatDurationClock = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
};
