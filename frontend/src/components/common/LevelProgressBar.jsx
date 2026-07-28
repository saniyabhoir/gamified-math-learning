// frontend/src/components/common/LevelProgressBar.jsx
//
// Drop into Dashboard.jsx as the first piece of the progression layer.
// It reads totalXp (already derivable from the player's saved module
// attempts — sum calculateXP(score, attempts, firstTry) for each saved
// attempt, e.g. in Dashboard's existing data-fetch effect) and renders a
// level badge + progress bar. No new backend call is required to ship
// this first slice; totalXp can be computed client-side from data
// Dashboard.jsx is already fetching.

import React from "react";
import { getLevelProgress } from "../../utils/xpLevelUtils";
import "./LevelProgressBar.css";

const LevelProgressBar = ({ totalXp = 0 }) => {
  const { level, xpIntoLevel, xpForNextLevel, progressPct } = getLevelProgress(totalXp);

  return (
    <div className="lpb-root" aria-label={`Level ${level}, ${xpIntoLevel} of ${xpForNextLevel} XP to next level`}>
      <div className="lpb-badge">
        <span className="lpb-badge-level">Lv {level}</span>
      </div>
      <div className="lpb-track-wrap">
        <div className="lpb-track">
          <div className="lpb-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="lpb-label">{xpIntoLevel} / {xpForNextLevel} XP to Level {level + 1}</span>
      </div>
    </div>
  );
};

export default LevelProgressBar;
