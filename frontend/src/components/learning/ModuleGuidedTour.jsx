// frontend/src/components/learning/ModuleGuidedTour.jsx
import React from "react";
import GuidedTour from "../common/GuidedTour";

/* ── Interactive guided tour for Module 1's learning interface.
   Replaces the old static ModuleOnboarding slideshow, which explained
   everything up front in a generic centered modal. This version spotlights
   the REAL, live UI elements as it explains them — the actual story
   card, the actual quiz once it appears, the existing Notebook toggle —
   so it reads as a walkthrough of the interface rather than a slideshow.

   Shown once, the first time a student reaches Module 1 (screen 0, story
   phase) — see ModulePage.jsx for the trigger/persistence logic.

   The Quiz and Hint steps target real elements that don't exist until
   the student finishes reading the current story segment (the quiz only
   mounts once StoryCard calls onComplete). Rather than guessing or
   showing an unanchored box, those two steps fall back to spotlighting
   the story's own visible "Next"/"Start Quiz" button and explain that
   the quiz is coming — GuidedTour then swaps to the real target
   automatically, with no extra tap needed, the moment it mounts.

   Phase 1B note: the Hint step points at `.qc-hint-slot`, a purely
   visual placeholder already reserved in QuizCard for the future Hint
   button (see QuizCard.jsx). No Hint behavior is implemented here —
   this step is informational only, and is written so Phase 1B can wire
   real functionality into that same slot later without requiring the
   tour itself to be rewritten. ── */
const STEPS = [
  {
    id: "story",
    selector: ".story-card",
    title: "The Story",
    body:
      "This is where the story and learning content are presented. Follow along as it plays out — tap Next (or press Space/Enter) to keep reading.",
  },
  {
    id: "quiz",
    selector: ".qc-page",
    fallbackSelector: ".sc-btn-row .sc-btn:not(:disabled)",
    title: "Quiz Time",
    body:
      "Questions like this will appear as you learn. Pick the answer you think is right, then submit it to continue.",
    fallbackBody:
      "Finish this part of the story first — a quiz will appear right here as soon as you continue.",
  },
  {
    id: "hint",
    selector: ".qc-hint-slot",
    fallbackSelector: ".qc-page",
    title: "Help When You're Stuck",
    body:
      "Optional hints will be available here to guide you if a question stumps you. The full hint feature is coming soon!",
    fallbackBody:
      "Optional hints will be available in the quiz to guide you if a question stumps you. Coming soon!",
  },
  {
    id: "notebook",
    selector: ".mp-notebook-toggle",
    title: "Your Math Notebook",
    body:
      "Everything important you learn gets saved here as you go. Tap this anytime to open your notebook.",
  },
];

const ModuleGuidedTour = ({ onClose }) => (
  <GuidedTour steps={STEPS} onFinish={onClose} onSkip={onClose} />
);

export default ModuleGuidedTour;
