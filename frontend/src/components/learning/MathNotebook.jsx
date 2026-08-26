// frontend/src/components/learning/MathNotebook.jsx
import React, { useEffect, useState } from "react";
import "./MathNotebook.css";

const STORAGE_PREFIX = "mq_notebook_u";

/* ── Persistence helpers (exported so any module page can reuse) ──
   Notebook entries accumulate across modules: calling mergeNotebookConcepts
   after Module 2, 3, etc. just appends/updates by concept slug — it never
   wipes what a previous module already added. Mirrors the same
   userId-scoped localStorage pattern ModulePage.jsx already uses for
   progress, so there's no new persistence approach to learn. */
export const getStoredNotebookConcepts = (userId) => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const mergeNotebookConcepts = (userId, moduleId, moduleTitle, newConcepts) => {
  const existing = getStoredNotebookConcepts(userId);
  const bySlug = new Map(existing.map((c) => [c.slug, c]));

  newConcepts.forEach((c) => {
    bySlug.set(c.slug, { ...c, moduleId, moduleTitle });
  });

  const merged = Array.from(bySlug.values());
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(merged));
  } catch {
    /* non-fatal — notebook just won't persist this session */
  }
  return merged;
};

/* Build a single notebook-ready entry from one screen's
   concept_explanation (title / main_rule / examples). Returns null when
   the screen has no concept_explanation to add. Used both for the
   whole-module extraction below and for Phase 1A's progressive,
   subsection-by-subsection Notebook updates (see ModulePage.jsx). */
export const extractConceptFromScreen = (screen) => {
  if (!screen?.concept_explanation) return null;
  return {
    slug: (screen.concept_tags && screen.concept_tags[0]) || screen.screen_id,
    title: screen.concept_explanation.title,
    main_rule: screen.concept_explanation.main_rule,
    examples: screen.concept_explanation.examples || [],
  };
};

/* Build notebook-ready entries straight from a module's screens.
   concept_explanation (title / main_rule / examples) already exists on
   every screen in module1-5.json — no separate content to author, and
   any future module JSON that follows the same shape works automatically. */
export const extractConceptsFromModule = (moduleData) => {
  const screens = moduleData?.screens || [];
  return screens.map(extractConceptFromScreen).filter(Boolean);
};

/* ── Component ──
   Parent conditionally mounts/unmounts this (same pattern as RewardPopup:
   `{showReward && pendingReward && <RewardPopup ... />}`), rather than an
   internal isOpen prop. */
const MathNotebook = ({ concepts = [], onClose }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  /* Entrance */
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(onClose, 320);
  };

  /* Escape key closes, same as clicking outside the card */
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className={`mn-overlay ${visible ? "mn-overlay--visible" : ""} ${leaving ? "mn-overlay--leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notebook-title"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className={`mn-card ${visible ? "mn-card--in" : ""} ${leaving ? "mn-card--out" : ""}`}>
        <button className="mn-close" onClick={handleClose} aria-label="Close Math Notebook">
          ✕
        </button>

        <div className="mn-header">
          <span className="mn-header-icon" aria-hidden="true">📓</span>
          <h2 id="notebook-title" className="mn-title">Math Notebook</h2>
          <p className="mn-subtitle">Every concept you've unlocked so far</p>
        </div>

        <div className="mn-list">
          {concepts.length === 0 && (
            <p className="mn-empty">No concepts saved yet — complete a module to add some!</p>
          )}

          {concepts.map((c) => (
            <div className="mn-entry" key={c.slug}>
              <h3 className="mn-entry-title">{c.title}</h3>
              <p className="mn-entry-rule">{c.main_rule}</p>

              {c.examples.length > 0 && (
                <div className="mn-examples">
                  {c.examples.map((ex, i) => (
                    <div className="mn-example" key={i}>
                      <span className="mn-example-expr">{ex.expression}</span>
                      <span className="mn-example-arrow" aria-hidden="true">→</span>
                      <span className="mn-example-sol">{ex.solution}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button className="mn-btn" onClick={handleClose} autoFocus>
          Close Notebook
        </button>
      </div>
    </div>
  );
};

export default MathNotebook;