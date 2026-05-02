// frontend/src/components/learning/QuizCard.jsx
import React, { useState, useEffect, useCallback } from "react";
import "./QuizCard.css";

const OPTION_LABELS = ["A", "B", "C", "D"];

/* Tiny XP bar for the running score */
const XpBar = ({ current, total }) => {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  return (
    <div className="qc-xp-wrap" aria-label={`Score: ${current} of ${total} points`}>
      <div className="qc-xp-label">
        <span>⚡ Score</span>
        <span>{current} / {total} pts</span>
      </div>
      <div className="qc-xp-track">
        <div className="qc-xp-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const QuizCard = ({ screenData, onComplete, onAnswerLogged }) => {
  const questions = screenData.quiz_questions || [];
  const totalPossiblePoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const [qIdx, setQIdx]               = useState(0);
  const [selected, setSelected]       = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore]             = useState(0);
  const [animateOptions, setAnimateOptions] = useState(false);

  const currentQ = questions[qIdx];

  /* Animate options in when question changes */
  useEffect(() => {
    setAnimateOptions(false);
    const t = setTimeout(() => setAnimateOptions(true), 60);
    return () => clearTimeout(t);
  }, [qIdx]);

  const handleSelect = useCallback((option) => {
    if (showFeedback) return;
    setSelected(option);
    setShowFeedback(true);

    const isCorrect = option === currentQ.correct_answer;
    if (isCorrect) setScore((p) => p + (currentQ.points || 0));

    onAnswerLogged?.({
      questionId: currentQ.question_id,
      selectedAnswer: option,
      correctAnswer: currentQ.correct_answer,
      isCorrect,
      mistakeTracking: currentQ.mistake_tracking || null,
    });
  }, [showFeedback, currentQ, onAnswerLogged]);

  const handleNext = useCallback(() => {
    setSelected(null);
    setShowFeedback(false);
    if (qIdx < questions.length - 1) {
      setQIdx((p) => p + 1);
    } else {
      onComplete(score, totalPossiblePoints);
    }
  }, [qIdx, questions.length, onComplete, score, totalPossiblePoints]);

  /* Keyboard shortcut: 1-4 to pick option, Enter to advance */
  useEffect(() => {
    const onKey = (e) => {
      if (!showFeedback && currentQ) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= currentQ.options.length) {
          handleSelect(currentQ.options[num - 1]);
        }
      }
      if (showFeedback && (e.code === "Enter" || e.code === "Space")) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showFeedback, currentQ, handleSelect, handleNext]);

  /* ── No more questions (shouldn't normally reach here) ── */
  if (!currentQ) {
    return (
      <div className="qc-done">
        <p>Quiz complete! Score: {score}/{totalPossiblePoints}</p>
        <button className="qc-btn qc-btn--cta" onClick={() => onComplete(score, totalPossiblePoints)}>
          Continue
        </button>
      </div>
    );
  }

  const isCorrect = selected === currentQ.correct_answer;
  const isLast    = qIdx === questions.length - 1;
  const progress  = ((qIdx) / questions.length) * 100;

  return (
    <div className="qc-page" aria-label="Quiz">
      {/* ── Quiz wrapper ── */}
      <div className="qc-card">

        {/* ── Header strip ── */}
        <div className="qc-header">
          <div className="qc-meta">
            <span className="qc-q-counter">Question {qIdx + 1} <span className="qc-q-of">of {questions.length}</span></span>
            {currentQ.points && (
              <span className="qc-points-badge">+{currentQ.points} pts</span>
            )}
          </div>
          {/* Question progress bar */}
          <div className="qc-q-track" aria-hidden="true">
            <div className="qc-q-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* ── Question text ── */}
        <div className="qc-question" aria-live="polite">
          <p className="qc-question-text">{currentQ.question_text}</p>
        </div>

        {/* ── Answer options ── */}
        <div
          className={`qc-options ${animateOptions ? "qc-options--in" : ""}`}
          role="group"
          aria-label="Answer choices"
        >
          {currentQ.options.map((option, i) => {
            let state = "";
            if (showFeedback) {
              if (option === currentQ.correct_answer) state = "correct";
              else if (option === selected)           state = "incorrect";
              else                                    state = "dimmed";
            }
            return (
              <button
                key={i}
                className={`qc-option qc-option--${state || "idle"}`}
                onClick={() => handleSelect(option)}
                disabled={showFeedback}
                style={{ animationDelay: animateOptions ? `${i * 70}ms` : "0ms" }}
                aria-label={`Option ${OPTION_LABELS[i]}: ${option}`}
                aria-pressed={selected === option}
              >
                <span className="qc-option-label">{OPTION_LABELS[i]}</span>
                <span className="qc-option-text">{option}</span>
                {showFeedback && option === currentQ.correct_answer && (
                  <span className="qc-icon" aria-hidden="true">✓</span>
                )}
                {showFeedback && option === selected && option !== currentQ.correct_answer && (
                  <span className="qc-icon" aria-hidden="true">✗</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Feedback panel ── */}
        {showFeedback && (
          <div className={`qc-feedback qc-feedback--${isCorrect ? "correct" : "incorrect"}`} aria-live="assertive">
            <div className="qc-feedback-icon">{isCorrect ? "🎉" : "💡"}</div>
            <div className="qc-feedback-content">
              <p className="qc-feedback-result">{isCorrect ? "Correct!" : "Not quite."}</p>
              <p className="qc-feedback-text">
                {isCorrect ? currentQ.feedback_correct : currentQ.feedback_incorrect}
              </p>
              {!isCorrect && currentQ.concept_explanation && (
                <div className="qc-hint">
                  <span className="qc-hint-label">Hint:</span>
                  {currentQ.concept_explanation}
                </div>
              )}
            </div>
            <button className="qc-btn qc-btn--cta" onClick={handleNext} aria-label={isLast ? "Finish quiz" : "Next question"}>
              {isLast ? "Finish →" : "Next →"}
            </button>
          </div>
        )}

        {/* ── Score XP bar ── */}
        <XpBar current={score} total={totalPossiblePoints} />

        {/* ── Keyboard hint ── */}
        <p className="qc-keyboard-hint" aria-hidden="true">
          {showFeedback
            ? "Press Enter to continue"
            : "Press 1–4 to select an answer"}
        </p>
      </div>
    </div>
  );
};

export default QuizCard;