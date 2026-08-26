// frontend/src/components/learning/ModuleOnboarding.jsx
import React, { useState, useCallback, useEffect } from "react";
import "./ModuleOnboarding.css";

/* ── Phase 1A: short guided introduction shown once, before the student
   starts Module 1's story. Explains the story screen, quizzes, the
   (not-yet-interactive) hint concept, and the Notebook. Purely
   informational — no quiz/hint behavior is implemented here. ── */
const STEPS = [
  {
    icon: "📖",
    title: "The Story",
    body:
      "Each part of Module 1 tells a short story. Read the dialogue, then tap Next (or press Space/Enter) to keep going.",
  },
  {
    icon: "📝",
    title: "Quiz Questions",
    body:
      "Every so often, a quick question will pop up. Tap the answer you think is right, then continue to see how you did.",
  },
  {
    icon: "💡",
    title: "Hints & Help",
    body:
      "Stuck on a question? Hint and help buttons are coming soon to guide you — for now, just do your best and learn from the feedback.",
  },
  {
    icon: "📓",
    title: "Your Math Notebook",
    body:
      "As you finish each part of the story, the key idea gets added to your Math Notebook. Open it anytime from the ☰ menu on the left.",
  },
];

const ModuleOnboarding = ({ onClose }) => {
  const [stepIdx, setStepIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  const isLast = stepIdx === STEPS.length - 1;
  const step = STEPS[stepIdx];

  const handleClose = useCallback(() => {
    setLeaving(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleClose();
    } else {
      setStepIdx((i) => i + 1);
    }
  }, [isLast, handleClose]);

  const handleBack = useCallback(() => {
    setStepIdx((i) => Math.max(0, i - 1));
  }, []);

  return (
    <div
      className={`mo-overlay ${visible ? "mo-overlay--visible" : ""} ${leaving ? "mo-overlay--leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className={`mo-card ${visible ? "mo-card--in" : ""} ${leaving ? "mo-card--out" : ""}`}>
        <span className="mo-kicker">Before you begin</span>

        <div className="mo-icon" aria-hidden="true">{step.icon}</div>
        <h2 id="onboarding-title" className="mo-title">{step.title}</h2>
        <p className="mo-body">{step.body}</p>

        <div className="mo-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`mo-dot ${i === stepIdx ? "mo-dot--active" : ""}`} />
          ))}
        </div>

        <div className="mo-actions">
          {stepIdx > 0 ? (
            <button className="mo-btn mo-btn--ghost" onClick={handleBack}>
              ← Back
            </button>
          ) : (
            <button className="mo-btn mo-btn--ghost" onClick={handleClose}>
              Skip
            </button>
          )}
          <button className="mo-btn mo-btn--primary" onClick={handleNext} autoFocus>
            {isLast ? "Let's Begin! →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleOnboarding;
