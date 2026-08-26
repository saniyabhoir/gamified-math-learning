// frontend/src/components/learning/NotebookIntro.jsx
import React, { useEffect, useState, useCallback } from "react";
import "./NotebookIntro.css";

/* ── Phase 1A: first-time Notebook introduction ──
   Shown exactly once — right after the student finishes their very first
   Module 1 subsection — to explain what the Math Notebook is and how to
   reopen it later. Modelled on RewardPopup / MathNotebook's overlay+card
   pattern so it feels like part of the same family of popups. */
const NotebookIntro = ({ onOpenNotebook, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  const handleClose = useCallback((after) => {
    setLeaving(true);
    setTimeout(() => after?.(), 300);
  }, []);

  /* Escape key closes via onClose, same as clicking outside the card */
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Escape") handleClose(onClose);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, onClose]);

  return (
    <div
      className={`ni-overlay ${visible ? "ni-overlay--visible" : ""} ${leaving ? "ni-overlay--leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notebook-intro-title"
      onClick={(e) => e.target === e.currentTarget && handleClose(onClose)}
    >
      <div className={`ni-card ${visible ? "ni-card--in" : ""} ${leaving ? "ni-card--out" : ""}`}>
        <div className="ni-icon" aria-hidden="true">📓</div>

        <h2 id="notebook-intro-title" className="ni-title">You discovered something new!</h2>

        <p className="ni-text">
          Your <strong>Math Notebook</strong> keeps every important idea you
          learn along the way. It just added its first page.
        </p>

        <div className="ni-howto">
          <span className="ni-hamburger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="ni-howto-text">
            Open it anytime using the menu in the top-left corner.
          </span>
        </div>

        <div className="ni-actions">
          <button
            className="ni-btn ni-btn--ghost"
            onClick={() => handleClose(onOpenNotebook)}
          >
            📓 Show Me
          </button>
          <button
            className="ni-btn ni-btn--primary"
            onClick={() => handleClose(onClose)}
            autoFocus
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebookIntro;
