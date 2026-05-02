// frontend/src/components/common/ProgressBar.jsx
import React from "react";
import "./ProgressBar.css";

/* Icons for each screen milestone */
const MILESTONE_ICONS = ["🔍", "📝", "🔢", "📋", "🔗", "🏆"];

const ProgressBar = ({ current, total, screens = [], totalPoints = 0, currentPhase, moduleTitle }) => {
  const pct = Math.min((current / total) * 100, 100);

  return (
    <header className="pb-wrapper" role="banner" aria-label="Module progress">
      {/* ── Left: module title ── */}
      <div className="pb-left">
        <span className="pb-module-icon" aria-hidden="true">📚</span>
        <span className="pb-module-title">{moduleTitle || "Module"}</span>
      </div>

      {/* ── Centre: milestone progress ── */}
      <div className="pb-centre" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
        {/* Track fill */}
        <div className="pb-track" aria-hidden="true">
          <div className="pb-fill" style={{ width: `${pct}%` }} />
        </div>

        {/* Milestone dots */}
        <div className="pb-milestones" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => {
            const screenTitle = screens[i]?.title || `Screen ${i + 1}`;
            const isDone    = i < current;
            const isActive  = i === current && currentPhase !== "final_challenge";
            const icon      = MILESTONE_ICONS[i] || "⭐";

            return (
              <div
                key={i}
                className={`pb-dot
                  ${isDone   ? "pb-dot--done"   : ""}
                  ${isActive ? "pb-dot--active" : ""}`}
                title={screenTitle}
              >
                <span className="pb-dot-icon">{isDone ? "✓" : icon}</span>
                <span className="pb-dot-label">{screenTitle}</span>
              </div>
            );
          })}

          {/* Final challenge dot */}
          <div
            className={`pb-dot pb-dot--final
              ${currentPhase === "final_challenge" ? "pb-dot--active" : ""}
              ${current >= total ? "pb-dot--done" : ""}`}
            title="Final Challenge"
          >
            <span className="pb-dot-icon">{current >= total ? "✓" : "🏆"}</span>
            <span className="pb-dot-label">Final</span>
          </div>
        </div>
      </div>

      {/* ── Right: points + percentage ── */}
      <div className="pb-right">
        <span className="pb-points" aria-label={`${totalPoints} points`}>
          ⚡ {totalPoints}
        </span>
        <span className="pb-pct" aria-label={`${Math.round(pct)}% complete`}>
          {Math.round(pct)}%
        </span>
      </div>
    </header>
  );
};

export default ProgressBar;