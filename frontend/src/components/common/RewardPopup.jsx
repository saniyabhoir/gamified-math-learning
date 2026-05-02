// frontend/src/components/common/RewardPopup.jsx
import React, { useEffect, useState } from "react";
import "./RewardPopup.css";

/* Badge icon mapping by keyword in badge name */
const BADGE_ICONS = {
  "Mystery Solver":    "🔍",
  "Variable Explorer": "📝",
  "Constant Collector":"🔢",
  "Term Tracker":      "📋",
  "Like Term Master":  "🔗",
  "Algebra Explorer":  "🎓",
  default:             "⭐",
};

const getBadgeIcon = (badgeName) => {
  if (!badgeName) return BADGE_ICONS.default;
  return (
    Object.entries(BADGE_ICONS).find(([key]) => badgeName.includes(key.split(" ")[0]))?.[1]
    ?? BADGE_ICONS.default
  );
};

const RewardPopup = ({ badge, points, quizScore, totalQuizPoints, onClose }) => {
  const [animPts, setAnimPts]     = useState(0);
  const [visible, setVisible]     = useState(false);
  const [leaving, setLeaving]     = useState(false);
  const badgeIcon = getBadgeIcon(badge);

  /* Entrance */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  /* Animated point counter */
  useEffect(() => {
    if (!visible || !points) return;
    let frame;
    let current = 0;
    const step = () => {
      current = Math.min(current + Math.ceil(points / 25), points);
      setAnimPts(current);
      if (current < points) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [visible, points]);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(onClose, 340);
  };

  const hasQuizScore = quizScore !== null && quizScore !== undefined;
  const isPerfect    = hasQuizScore && quizScore === totalQuizPoints;

  return (
    <div
      className={`rp-overlay ${visible ? "rp-overlay--visible" : ""} ${leaving ? "rp-overlay--leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reward-title"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className={`rp-card ${visible ? "rp-card--in" : ""} ${leaving ? "rp-card--out" : ""}`}>

        {/* ── Sparkle decorations ── */}
        <div className="rp-sparkles" aria-hidden="true">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="rp-sparkle" style={{ "--i": i }} />
          ))}
        </div>

        {/* ── Badge icon ── */}
        <div className="rp-badge-wrap" aria-hidden="true">
          <div className="rp-badge-ring" />
          <div className="rp-badge-ring rp-badge-ring--2" />
          <span className="rp-badge-icon">{badgeIcon}</span>
        </div>

        {/* ── Badge name ── */}
        {badge && (
          <div className="rp-badge-name" id="reward-title">
            <span className="rp-badge-label">Badge Earned</span>
            <span className="rp-badge-title">{badge}</span>
          </div>
        )}

        {/* ── Quiz score (if applicable) ── */}
        {hasQuizScore && (
          <div className="rp-score-row">
            <div className="rp-score-block">
              <span className="rp-score-value">{quizScore}</span>
              <span className="rp-score-sep">/</span>
              <span className="rp-score-total">{totalQuizPoints}</span>
              <span className="rp-score-label">quiz pts</span>
            </div>
            {isPerfect && (
              <span className="rp-perfect-badge">🌟 Perfect!</span>
            )}
          </div>
        )}

        {/* ── Points earned ── */}
        <div className="rp-points-earned" aria-live="polite" aria-label={`${points} bonus points earned`}>
          <span className="rp-plus">+</span>
          <span className="rp-pts-num">{animPts}</span>
          <span className="rp-pts-label">bonus points</span>
        </div>

        {/* ── Continue button ── */}
        <button
          className="rp-btn"
          onClick={handleClose}
          autoFocus
          aria-label="Continue to next screen"
        >
          Continue  →
        </button>

        <p className="rp-hint" aria-hidden="true">Press Enter or tap to continue</p>
      </div>
    </div>
  );
};

export default RewardPopup;