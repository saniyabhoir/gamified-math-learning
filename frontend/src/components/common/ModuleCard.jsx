// frontend/src/components/common/ModuleCard.jsx
import React, { useState, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../App";
import { getGameForModule, isGameAvailable } from "../../utils/GameRegistry";
import { getGameStatSummary } from "../../utils/GameMatrics";
import "./ModuleCard.css";

// ── Module theme config ────────────────────────────────────────────────────────
const MODULE_THEMES = {
  1: {
    grad: "linear-gradient(145deg, #1a0f2e 0%, #2d1a0e 50%, #1a0f2e 100%)",
    accent: "#e8a838",
    glow: "rgba(232,168,56,0.18)",
    icon: "🔢",
    difficulty: "Beginner",
    diffColor: "#4ade80",
    estTime: "45–60 min",
  },
  2: {
    grad: "linear-gradient(145deg, #0a1f0f 0%, #0d2a1a 50%, #0a1f0f 100%)",
    accent: "#2D8C4E",
    glow: "rgba(45,140,78,0.18)",
    icon: "🍎",
    difficulty: "Intermediate",
    diffColor: "#f59e0b",
    estTime: "50–65 min",
  },
  3: {
    grad: "linear-gradient(145deg, #0d0f1a 0%, #1a1d2e 50%, #0d0f1a 100%)",
    accent: "#00E676",
    glow: "rgba(0,230,118,0.15)",
    icon: "⚙️",
    difficulty: "Intermediate",
    diffColor: "#f59e0b",
    estTime: "55–70 min",
  },
  4: {
    grad: "linear-gradient(145deg, #1a1000 0%, #2a1e00 50%, #1a1000 100%)",
    accent: "#F4A435",
    glow: "rgba(244,164,53,0.15)",
    icon: "🔍",
    difficulty: "Advanced",
    diffColor: "#f87171",
    estTime: "60–75 min",
  },
  5: {
    grad: "linear-gradient(145deg, #0f0f1a 0%, #1a0a2a 50%, #0f0f1a 100%)",
    accent: "#a855f7",
    glow: "rgba(168,85,247,0.15)",
    icon: "🏆",
    difficulty: "Advanced",
    diffColor: "#f87171",
    estTime: "60–80 min",
  },
};

const DEFAULT_THEME = MODULE_THEMES[1];

// ── Star display ───────────────────────────────────────────────────────────────
const StarRow = ({ count }) => (
  <div className="mc-stars">
    {[1, 2, 3].map((n) => (
      <span key={n} className={n <= count ? "mc-star-on" : "mc-star-off"}>
        ★
      </span>
    ))}
  </div>
);

// ── ModuleCard ─────────────────────────────────────────────────────────────────
const ModuleCard = ({ moduleData = {}, moduleId, progressData = {} }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [hovered, setHovered] = useState(false);

  const theme = MODULE_THEMES[moduleId] || DEFAULT_THEME;
  const gameEntry = getGameForModule(moduleId);
  const gameAvailable = isGameAvailable(moduleId);
  const gameStat = user ? getGameStatSummary(user.id, moduleId) : null;

  // ── Data with safe fallbacks ────────────────────────────────────────────────
  const safeData = {
    module_title: moduleData.module_title || `Module ${moduleId}`,
    module_description:
      moduleData.module_description || "Content coming soon…",
    screens: moduleData.screens || [],
    total_screens: moduleData.total_screens || 0,
    module_rewards: moduleData.module_rewards || {
      completion_points: 0,
      completion_badge: "Locked",
    },
    estimated_completion_time:
      moduleData.estimated_completion_time || theme.estTime,
    _placeholder: moduleData._placeholder || false,
  };

  const totalScreens = safeData.total_screens || safeData.screens.length || 0;
  const completedScreens = Math.min(
    progressData.completedScreens || 0,
    totalScreens
  );
  const progressPct =
    totalScreens > 0
      ? Math.round((completedScreens / totalScreens) * 100)
      : 0;
  const isComplete = progressPct >= 100;
  const hasStarted = completedScreens > 0;
  const totalPoints = progressData.totalPoints || 0;

  // ── Quiz accuracy from progressData ────────────────────────────────────────
  const quizAccuracy = progressData.quizAccuracy || null;
  const mistakeCount = progressData.mistakeLog?.length || 0;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenModule = useCallback(
    (e) => {
      e.stopPropagation();
      navigate(`/module/${moduleId}`);
    },
    [navigate, moduleId]
  );

  const handlePlayGame = useCallback(
    (e) => {
      e.stopPropagation();
      navigate(`/module/${moduleId}/game`);
    },
    [navigate, moduleId]
  );

  return (
    <div
      className={[
        "mc-card",
        hovered ? "mc-card--hover" : "",
        isComplete ? "mc-card--complete" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        "--theme-grad": theme.grad,
        "--theme-accent": theme.accent,
        "--theme-glow": theme.glow,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="article"
      aria-label={`Module ${moduleId}: ${safeData.module_title}`}
    >
      {/* Decorative elements */}
      <div className="mc-watermark">{moduleId}</div>
      <div className="mc-glow-orb" />

      {/* ── Ribbon ── */}
      <div className="mc-ribbon">
        <div className="mc-module-num">
          <span className="mc-num-label">Module</span>
          <span className="mc-num-val">{String(moduleId).padStart(2, "0")}</span>
        </div>
        <div className="mc-ribbon-right">
          <span
            className="mc-diff-pill"
            style={{
              color: theme.diffColor,
              borderColor: `${theme.diffColor}44`,
            }}
          >
            {theme.difficulty}
          </span>
          {isComplete && (
            <span className="mc-badge-pill mc-badge-pill--done">✓ Done</span>
          )}
        </div>
      </div>

      {/* ── Title block ── */}
      <div className="mc-title-block">
        <span className="mc-module-icon">{theme.icon}</span>
        <div>
          <h3 className="mc-title">{safeData.module_title}</h3>
          <p className="mc-desc">{safeData.module_description}</p>
        </div>
      </div>

      {/* ── Progress ── */}
      <div className="mc-progress-section">
        <div className="mc-progress-row">
          <span className="mc-progress-label">Progress</span>
          <span
            className="mc-progress-pct"
            style={{ color: theme.accent }}
          >
            {progressPct}%
          </span>
        </div>
        <div className="mc-bar-track">
          <div
            className="mc-bar-fill"
            style={{
              width: `${progressPct}%`,
              background: theme.accent,
              color: theme.accent,
            }}
          />
        </div>
        <span className="mc-progress-sub">
          {completedScreens} / {totalScreens} screens · ⏱ {safeData.estimated_completion_time}
        </span>
      </div>

      {/* ── Stats grid ── */}
      <div className="mc-stats-grid">
        <div className="mc-stat">
          <span className="mc-stat-icon">⭐</span>
          <div className="mc-stat-body">
            <span className="mc-stat-val" style={{ color: theme.accent }}>
              {totalPoints.toLocaleString()} XP
            </span>
            <span className="mc-stat-lbl">Earned</span>
          </div>
        </div>
        <div className="mc-stat">
          <span className="mc-stat-icon">🎯</span>
          <div className="mc-stat-body">
            <span className="mc-stat-val" style={{ color: theme.accent }}>
              {quizAccuracy !== null ? `${quizAccuracy}%` : "—"}
            </span>
            <span className="mc-stat-lbl">Quiz Acc.</span>
          </div>
        </div>

        {/* Game stats or reward preview */}
        {gameStat ? (
          <>
            <div className="mc-stat">
              <span className="mc-stat-icon">🃏</span>
              <div className="mc-stat-body">
                <StarRow count={gameStat.stars} />
                <span className="mc-stat-lbl">Game Stars</span>
              </div>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-icon">🏆</span>
              <div className="mc-stat-body">
                <span className="mc-stat-val" style={{ color: theme.accent }}>
                  {gameStat.score}
                </span>
                <span className="mc-stat-lbl">Best Score</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mc-stat">
              <span className="mc-stat-icon">🏅</span>
              <div className="mc-stat-body">
                <span className="mc-stat-val" style={{ color: theme.accent }}>
                  {safeData.module_rewards.completion_badge}
                </span>
                <span className="mc-stat-lbl">Badge</span>
              </div>
            </div>
            <div className="mc-stat">
              <span className="mc-stat-icon">💎</span>
              <div className="mc-stat-body">
                <span className="mc-stat-val" style={{ color: theme.accent }}>
                  +{safeData.module_rewards.completion_points}
                </span>
                <span className="mc-stat-lbl">Reward XP</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Game preview (if played) ── */}
      {gameStat?.badge && (
        <div className="mc-game-badge">
          <span>🏅</span>
          <span>
            Game badge: <strong>{gameStat.badge}</strong>
          </span>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="mc-actions">
        {/* Module CTA */}
        <button
          className="mc-btn mc-btn--primary"
          style={{
            background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}11)`,
            borderColor: `${theme.accent}55`,
            color: theme.accent,
          }}
          onClick={handleOpenModule}
        >
          {isComplete ? "✓ Review Module" : hasStarted ? "▶ Continue" : "Start Module"}
        </button>

        {/* Game CTA */}
        {gameAvailable ? (
          <button
            className="mc-btn mc-btn--game"
            onClick={handlePlayGame}
            style={{
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}bb)`,
              color: "#0d0a00",
            }}
          >
            🎮 {gameStat?.hasPlayed ? "Replay Game" : "Play Game"}
          </button>
        ) : (
          <button
            className="mc-btn mc-btn--coming-soon"
            disabled
          >
            🔒 Game Coming Soon
          </button>
        )}
      </div>
    </div>
  );
};

export default ModuleCard;
