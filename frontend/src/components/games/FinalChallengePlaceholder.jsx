// frontend/src/components/games/FinalChallengePlaceholder.jsx
import React, { useEffect, useState } from "react";
import "./FinalChallengePlaceholder.css";

/* Stat card sub-component */
const StatCard = ({ icon, label, value, accent }) => (
  <div className="fc-stat" style={{ "--accent": accent || "#e8a838" }}>
    <span className="fc-stat-icon" aria-hidden="true">{icon}</span>
    <span className="fc-stat-value">{value}</span>
    <span className="fc-stat-label">{label}</span>
  </div>
);

/* Concept tag chip */
const ConceptChip = ({ concept }) => (
  <span className="fc-concept-chip">
    📌 {concept.replace(/_/g, " ")}
  </span>
);

const FinalChallengePlaceholder = ({
  challengeData,
  totalPoints,
  mistakeLog,
  completionBadge,
  completionPoints,
  onComplete,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const totalMistakes = mistakeLog.length;
  const grandTotal    = totalPoints + completionPoints;
  const accuracy      = mistakeLog.length === 0
    ? 100
    : Math.max(0, Math.round(((mistakeLog.length === 0 ? 1 : 0)) * 100));

  const weakConcepts = [
    ...new Set(
      mistakeLog
        .map((m) => m.mistakeTracking?.concept_tag)
        .filter(Boolean)
    ),
  ];

  const performanceTier =
    totalMistakes === 0
      ? { label: "Perfect Run! 🌟", color: "#ffd700" }
      : totalMistakes <= 2
      ? { label: "Great Work! ✨", color: "#4ade80" }
      : totalMistakes <= 5
      ? { label: "Good Effort 💪", color: "#60a5fa" }
      : { label: "Keep Practising 🎯", color: "#f87171" };

  return (
    <div className={`fc-page ${visible ? "fc-page--in" : ""}`} aria-label="Module complete screen">

      {/* ── Background decoration ── */}
      <div className="fc-bg-orbs" aria-hidden="true">
        <div className="fc-orb fc-orb--1" />
        <div className="fc-orb fc-orb--2" />
        <div className="fc-orb fc-orb--3" />
      </div>

      {/* ── Content card ── */}
      <div className="fc-card">

        {/* ── Header ── */}
        <div className="fc-header">
          <div className="fc-module-tag">Module 1 Complete</div>
          <h1 className="fc-title">{challengeData?.title || "Algebra Detective Challenge"}</h1>
          <p className="fc-description">
            {challengeData?.description ||
              "You've mastered the foundations of algebra! Review your performance below."}
          </p>
        </div>

        {/* ── Performance tier banner ── */}
        <div
          className="fc-tier-banner"
          style={{ borderColor: `${performanceTier.color}40`, background: `${performanceTier.color}0f` }}
        >
          <span className="fc-tier-label" style={{ color: performanceTier.color }}>
            {performanceTier.label}
          </span>
          <span className="fc-tier-pts" aria-label={`Grand total: ${grandTotal} points`}>
            {grandTotal} pts total
          </span>
        </div>

        {/* ── Stats row ── */}
        <div className="fc-stats-row">
          <StatCard icon="⚡" label="Points Earned" value={totalPoints}      accent="#e8a838" />
          <StatCard icon="🏆" label="Bonus Points"  value={`+${completionPoints}`} accent="#a78bfa" />
          <StatCard icon="❌" label="Mistakes"      value={totalMistakes}    accent={totalMistakes === 0 ? "#4ade80" : "#f87171"} />
        </div>

        {/* ── Completion badge ── */}
        {completionBadge && (
          <div className="fc-badge-section">
            <div className="fc-badge-wrap">
              <span className="fc-badge-emoji">🎓</span>
              <div className="fc-badge-ring" />
            </div>
            <div className="fc-badge-info">
              <span className="fc-badge-acquired">Badge Acquired</span>
              <span className="fc-badge-name">{completionBadge}</span>
            </div>
          </div>
        )}

        {/* ── Weak concepts to review ── */}
        <div className="fc-review-section">
          <h2 className="fc-section-title">
            {weakConcepts.length > 0 ? "📖 Concepts to Review" : "✅ Mastery Check"}
          </h2>
          {weakConcepts.length > 0 ? (
            <>
              <p className="fc-review-hint">
                These topics tripped you up — worth revisiting before Module 2.
              </p>
              <div className="fc-concepts">
                {weakConcepts.map((c, i) => (
                  <ConceptChip key={i} concept={c} />
                ))}
              </div>
            </>
          ) : (
            <p className="fc-perfect-msg">
              🌟 Outstanding! You answered every question correctly. You're ready for Module 2!
            </p>
          )}
        </div>

        {/* ── Future challenge placeholder ── */}
        <div className="fc-future-game">
          <div className="fc-future-icon" aria-hidden="true">🕹️</div>
          <div className="fc-future-text">
            <h3>Final Challenge: {challengeData?.title}</h3>
            <p>
              An interactive algebra detective game is coming soon — you'll solve a real mystery
              using everything you've learned in this module!
            </p>
          </div>
          <span className="fc-coming-soon-pill">Coming Soon</span>
        </div>

        {/* ── CTA ── */}
        <button className="fc-complete-btn" onClick={onComplete} aria-label="Complete module">
          Complete Module  →
        </button>

        <p className="fc-note" aria-hidden="true">
          Your progress has been saved · Concepts logged for adaptive revision
        </p>
      </div>
    </div>
  );
};

export default FinalChallengePlaceholder;