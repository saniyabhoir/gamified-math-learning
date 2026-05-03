// frontend/src/components/games/SimplificationShowdown.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Module 2 — Simplification Showdown
// Theme: Priya's Fruit Market — rapid-fire simplification quiz arena
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  buildGameResult,
  calcStarsQuiz,
  calcRewardPoints,
} from "../../utils/GameMatrics";
import "./SimplificationShowdown.css";

// ─── Question Banks ───────────────────────────────────────────────────────────
const QUESTIONS = {
  1: [
    {
      q: "3x + 2x",
      correct: "5x",
      options: ["5x", "6x", "5x²", "3x + 2"],
      hint: "Add the coefficients — same variable!",
    },
    {
      q: "7y − 3y",
      correct: "4y",
      options: ["4y", "10y", "4", "3y"],
      hint: "Subtract the numbers in front of y.",
    },
    {
      q: "4a + a",
      correct: "5a",
      options: ["5a", "4a + 1", "5", "4a²"],
      hint: "Remember: a alone means 1a.",
    },
    {
      q: "6b − 4b",
      correct: "2b",
      options: ["2b", "10b", "2", "6b"],
      hint: "Same variable — just subtract the coefficients.",
    },
    {
      q: "x + x + x",
      correct: "3x",
      options: ["3x", "x³", "3", "x + 3"],
      hint: "Three lots of x is 3x, not x cubed!",
    },
  ],
  2: [
    {
      q: "3x + 2y + x",
      correct: "4x + 2y",
      options: ["4x + 2y", "5xy", "3x + 3y", "6xy"],
      hint: "Group the x terms together — y terms stay separate.",
    },
    {
      q: "5a − 2a + 3b",
      correct: "3a + 3b",
      options: ["3a + 3b", "6ab", "5a + b", "3a − 3b"],
      hint: "Only combine terms with the same variable.",
    },
    {
      q: "4p + 2q − p + q",
      correct: "3p + 3q",
      options: ["3p + 3q", "4pq", "5p + q", "3p − 3q"],
      hint: "Collect all p's, then all q's separately.",
    },
    {
      q: "6m − m + 2n",
      correct: "5m + 2n",
      options: ["5m + 2n", "7mn", "5m − 2n", "6m + n"],
      hint: "6m minus 1m equals 5m. The 2n stays alone.",
    },
    {
      q: "2x + 3y − x + y",
      correct: "x + 4y",
      options: ["x + 4y", "2xy", "x + 2y", "3x + 4y"],
      hint: "x terms: 2x − x = x. y terms: 3y + y = 4y.",
    },
  ],
  3: [
    {
      q: "2x² + 3x − x²",
      correct: "x² + 3x",
      options: ["x² + 3x", "x² − 3x", "2x² + 2x", "3x³"],
      hint: "x² and x are DIFFERENT terms — don't mix them!",
    },
    {
      q: "4x + 3y − 2x + y",
      correct: "2x + 4y",
      options: ["2x + 4y", "6x + 4y", "2x + 2y", "4xy"],
      hint: "x terms: 4 − 2 = 2. y terms: 3 + 1 = 4.",
    },
    {
      q: "5m² − 2m + 3m²",
      correct: "8m² − 2m",
      options: ["8m² − 2m", "6m² − 2m", "8m³", "8m²"],
      hint: "5m² + 3m² = 8m². The −2m stays — m² ≠ m.",
    },
    {
      q: "3ab + 2a − ab",
      correct: "2ab + 2a",
      options: ["2ab + 2a", "4ab", "3ab − 2a", "5ab"],
      hint: "3ab − ab = 2ab. The 2a is a different term.",
    },
    {
      q: "2(x + 3) + x",
      correct: "3x + 6",
      options: ["3x + 6", "3x + 3", "2x + 6", "3x + 9"],
      hint: "Expand first: 2(x+3) = 2x + 6, then add the x.",
    },
  ],
};

const ROUND_CONFIG = {
  1: {
    label: "Stall Setup",
    emoji: "🥭",
    subtitle: "Warm-up round — basic like terms",
    color: "#10b981",
    bgGlow: "rgba(16, 185, 129, 0.15)",
    timePerQ: 15,
  },
  2: {
    label: "Market Rush",
    emoji: "🍊",
    subtitle: "Mixed expressions — stay sharp!",
    color: "#f59e0b",
    bgGlow: "rgba(245, 158, 11, 0.15)",
    timePerQ: 12,
  },
  3: {
    label: "Boss Round",
    emoji: "🔥",
    subtitle: "Advanced algebra — prove your skills!",
    color: "#ef4444",
    bgGlow: "rgba(239, 68, 68, 0.18)",
    timePerQ: 10,
  },
};

const TOTAL_QUESTIONS = 15; // 5 per round × 3 rounds
const BASE_POINTS = 100;
const TIME_BONUS_PER_SEC = 5;
const STREAK_BONUS = 50;

// ─── Utility: shuffle array ────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const Stars = ({ count, size = "md" }) => (
  <div className={`ss-stars ss-stars--${size}`}>
    {[1, 2, 3].map((n) => (
      <span key={n} className={n <= count ? "ss-star ss-star--on" : "ss-star ss-star--off"}>
        ★
      </span>
    ))}
  </div>
);

const TimerBar = ({ timeLeft, maxTime, color }) => {
  const pct = Math.max(0, (timeLeft / maxTime) * 100);
  const danger = pct < 30;
  return (
    <div className="ss-timer-track">
      <div
        className={["ss-timer-fill", danger ? "ss-timer-fill--danger" : ""].join(" ")}
        style={{
          width: `${pct}%`,
          background: danger ? "#ef4444" : color,
          boxShadow: `0 0 12px ${danger ? "#ef4444" : color}`,
        }}
      />
    </div>
  );
};

const StreakBadge = ({ streak }) => {
  if (streak < 2) return null;
  return (
    <div className="ss-streak">
      🔥 {streak} streak{streak >= 3 ? " +" + STREAK_BONUS + "pts!" : ""}
    </div>
  );
};

const RoundIntro = ({ round, onStart }) => {
  const cfg = ROUND_CONFIG[round];
  return (
    <div className="ss-round-intro" style={{ "--round-color": cfg.color }}>
      <div className="ss-round-intro-emoji">{cfg.emoji}</div>
      <div className="ss-round-intro-label">Round {round}</div>
      <h2 className="ss-round-intro-title">{cfg.label}</h2>
      <p className="ss-round-intro-sub">{cfg.subtitle}</p>
      <div className="ss-round-intro-meta">
        <span>⏱ {ROUND_CONFIG[round].timePerQ}s per question</span>
        <span>•</span>
        <span>5 questions</span>
      </div>
      <button className="ss-btn-start" onClick={onStart}>
        {round === 1 ? "Start Game" : "Start Round " + round}
      </button>
    </div>
  );
};

const RoundComplete = ({ round, correct, total, onNext }) => {
  const cfg = ROUND_CONFIG[round];
  const accuracy = Math.round((correct / total) * 100);
  useEffect(() => {
    if (round < 3) {
      const t = setTimeout(onNext, 2800);
      return () => clearTimeout(t);
    }
  }, [round, onNext]);

  return (
    <div className="ss-round-complete" style={{ "--round-color": cfg.color }}>
      <div className="ss-round-complete-icon">{cfg.emoji}</div>
      <h2 className="ss-round-complete-title">Round {round} Complete!</h2>
      <div className="ss-round-complete-stat">
        <span className="ss-rcs-num" style={{ color: cfg.color }}>
          {correct}/{total}
        </span>
        <span className="ss-rcs-lbl">Correct</span>
      </div>
      <div className="ss-round-complete-stat">
        <span className="ss-rcs-num" style={{ color: cfg.color }}>
          {accuracy}%
        </span>
        <span className="ss-rcs-lbl">Accuracy</span>
      </div>
      {round < 3 ? (
        <p className="ss-round-complete-next">
          Get ready for Round {round + 1}: {ROUND_CONFIG[round + 1].label}…
        </p>
      ) : (
        <button className="ss-btn-start" onClick={onNext}>
          See Final Results →
        </button>
      )}
    </div>
  );
};

const Summary = ({ stars, score, correct, mistakes, time, badge, rewardPoints, onReplay, onExit }) => {
  const mins = Math.floor(time / 60);
  const secs = time % 60;
  const accuracy = Math.round((correct / TOTAL_QUESTIONS) * 100);

  return (
    <div className="ss-summary">
      <div className="ss-summary-icon">🍎</div>
      <h2 className="ss-summary-title">Showdown Complete!</h2>
      <p className="ss-summary-sub">Priya's Market is proud of you!</p>
      <Stars count={stars} size="lg" />

      <div className="ss-summary-grid">
        <div className="ss-summary-stat">
          <span className="ss-summary-val">{score}</span>
          <span className="ss-summary-lbl">Score</span>
        </div>
        <div className="ss-summary-stat">
          <span className="ss-summary-val">{accuracy}%</span>
          <span className="ss-summary-lbl">Accuracy</span>
        </div>
        <div className="ss-summary-stat">
          <span className="ss-summary-val">{correct}/{TOTAL_QUESTIONS}</span>
          <span className="ss-summary-lbl">Correct</span>
        </div>
        <div className="ss-summary-stat">
          <span className="ss-summary-val">
            {mins}:{String(secs).padStart(2, "0")}
          </span>
          <span className="ss-summary-lbl">Time</span>
        </div>
      </div>

      <div className="ss-summary-reward">
        <span className="ss-reward-icon">⚡</span>
        <span>+{rewardPoints} reward points earned!</span>
      </div>

      {badge && (
        <div className="ss-badge-unlock">
          <span className="ss-badge-icon">🏅</span>
          <span>
            Badge unlocked: <strong>{badge}</strong>
          </span>
        </div>
      )}

      {stars < 3 && (
        <p className="ss-summary-nudge">
          {stars === 2
            ? "So close! Replay to hit 80% accuracy for 3 stars. 🌟"
            : "Keep practising — you can reach 3 stars! 💪"}
        </p>
      )}

      <div className="ss-summary-actions">
        <button className="ss-btn-secondary" onClick={onReplay}>
          Play Again
        </button>
        <button className="ss-btn-primary" onClick={onExit}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// ─── Main Game Component ───────────────────────────────────────────────────────
const SimplificationShowdown = ({ moduleId, userId, onComplete, onExit }) => {
  // ── Phase management ─────────────────────────────────────────────────────────
  // Phases: "roundIntro" | "playing" | "answerReveal" | "roundComplete" | "summary"
  const [phase, setPhase] = useState("roundIntro");

  // ── Progress ─────────────────────────────────────────────────────────────────
  const [currentRound, setCurrentRound] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0); // 0-4 within round
  const [shuffledOptions, setShuffledOptions] = useState([]);

  // ── Stats ────────────────────────────────────────────────────────────────────
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // ── Per-round stats ──────────────────────────────────────────────────────────
  const [roundCorrect, setRoundCorrect] = useState(0);

  // ── Answer state ─────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(ROUND_CONFIG[1].timePerQ);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // string | null
  const [answerResult, setAnswerResult] = useState(null); // "correct" | "wrong" | null
  const [showHint, setShowHint] = useState(false);
  const [timeBonusFlash, setTimeBonusFlash] = useState(null); // "+150pts!" flash string

  const timerRef = useRef(null);
  const globalTimerRef = useRef(null);

  // ── Derived current question ─────────────────────────────────────────────────
  const currentQuestion = QUESTIONS[currentRound][questionIndex];

  // ── Shuffle options when question changes ────────────────────────────────────
  useEffect(() => {
    if (currentQuestion) {
      setShuffledOptions(shuffle([...currentQuestion.options]));
    }
  }, [currentRound, questionIndex]);

  // ── Global elapsed timer ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "playing" || phase === "answerReveal") {
      globalTimerRef.current = setInterval(
        () => setElapsedTime((t) => t + 1),
        1000
      );
    }
    return () => clearInterval(globalTimerRef.current);
  }, [phase]);

  // ── Per-question countdown timer ─────────────────────────────────────────────
useEffect(() => {
  if (phase !== "playing") return;

  clearInterval(timerRef.current);

  const maxTime = ROUND_CONFIG[currentRound].timePerQ;
  setTimeLeft(maxTime);

  timerRef.current = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(timerRef.current);
        handleTimeout();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timerRef.current);
}, [phase, currentRound, questionIndex, handleTimeout]);

  // ── Timeout (ran out of time) ─────────────────────────────────────────────────
  const handleTimeout = useCallback(() => {
  clearInterval(timerRef.current);

  setSelectedAnswer("__timeout__");
  setAnswerResult("wrong");
  setShowHint(true);

  setStreak(0);
  setTotalMistakes((m) => m + 1);

  setPhase("answerReveal");

  setTimeout(() => {
    advanceQuestion();
  }, 2000);
}, [advanceQuestion]);

  // ── Answer selected ───────────────────────────────────────────────────────────
  const handleAnswer = useCallback(
  (answer) => {
    if (phase !== "playing") return;

    clearInterval(timerRef.current);

    const isCorrect = answer === currentQuestion.correct;

    setSelectedAnswer(answer);
    setPhase("answerReveal");

    if (isCorrect) {
      setStreak((prevStreak) => {
        const newStreak = prevStreak + 1;

        const timeBonus = timeLeft * TIME_BONUS_PER_SEC;
        const streakBonus =
          newStreak % 3 === 0 ? STREAK_BONUS : 0;

        const pts = BASE_POINTS + timeBonus + streakBonus;

        setScore((s) => s + pts);
        setTotalCorrect((c) => c + 1);
        setRoundCorrect((c) => c + 1);

        setAnswerResult("correct");
        setShowHint(false);

        const flashParts = [`+${BASE_POINTS}`];
        if (timeBonus > 0) flashParts.push(`+${timeBonus} time`);
        if (streakBonus > 0) flashParts.push(`+${streakBonus} streak!`);

        setTimeBonusFlash(flashParts.join("  "));
        setTimeout(() => setTimeBonusFlash(null), 1800);

        return newStreak;
      });
    } else {
      setAnswerResult("wrong");
      setStreak(0);
      setTotalMistakes((m) => m + 1);
      setShowHint(true);
    }

    setTimeout(() => {
      advanceQuestion();
    }, isCorrect ? 1400 : 2000);
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, currentQuestion, timeLeft, streak]
  );

  // ── Advance to next question or end round ────────────────────────────────────
  const advanceQuestion = useCallback(() => {
    const nextIndex = questionIndex + 1;
    setSelectedAnswer(null);
    setAnswerResult(null);
    setShowHint(false);

    if (nextIndex >= QUESTIONS[currentRound].length) {
      // End of round
      setPhase("roundComplete");
    } else {
      setQuestionIndex(nextIndex);
      setPhase("playing");
    }
  }, [questionIndex, currentRound]);

  // ── Advance to next round ─────────────────────────────────────────────────────
  const handleNextRound = useCallback(() => {
    if (currentRound >= 3) {
      setPhase("summary");
    } else {
      const nextRound = currentRound + 1;
      setCurrentRound(nextRound);
      setQuestionIndex(0);
      setRoundCorrect(0);
      setPhase("roundIntro");
    }
  }, [currentRound]);

  // ── Start round ───────────────────────────────────────────────────────────────
  const handleStartRound = useCallback(() => {
    setPhase("playing");
  }, []);

  // ── Replay ────────────────────────────────────────────────────────────────────
  const handleReplay = useCallback(() => {
    setPhase("roundIntro");
    setCurrentRound(1);
    setQuestionIndex(0);
    setScore(0);
    setTotalCorrect(0);
    setTotalMistakes(0);
    setStreak(0);
    setElapsedTime(0);
    setRoundCorrect(0);
    setSelectedAnswer(null);
    setAnswerResult(null);
    setShowHint(false);
  }, []);

  // ── Exit / Complete ───────────────────────────────────────────────────────────
  const handleExit = useCallback(() => {
    if (phase === "summary") {
      const stars = calcStarsQuiz(totalCorrect, TOTAL_QUESTIONS);
      const rp = calcRewardPoints(stars, 30);
      const badge = stars === 3 ? "Simplification Ace" : null;
      const accuracy = (totalCorrect / TOTAL_QUESTIONS) * 100;

      const result = buildGameResult({
        moduleId: moduleId || 2,
        gameId: "simplification-showdown",
        score,
        accuracy,
        mistakes: totalMistakes,
        completionTime: elapsedTime,
        stars,
        rewardPoints: rp,
        badgeUnlocked: badge,
        extraData: {
          totalCorrect,
          totalQuestions: TOTAL_QUESTIONS,
          streakBest: streak,
        },
      });
      onComplete(result);
    } else {
      onExit();
    }
  }, [phase, score, totalCorrect, totalMistakes, elapsedTime, streak, moduleId, onComplete, onExit]);

  // ── Progress bar (global across all 15 questions) ────────────────────────────
  const globalProgress =
    (currentRound - 1) * 5 + questionIndex + (phase === "roundComplete" ? 5 : 0);
  const progressPct = Math.round((globalProgress / TOTAL_QUESTIONS) * 100);

  const cfg = ROUND_CONFIG[currentRound];

  // ─────────────────────────────────────────────────────────────────────────────
  // ── Render phases ─────────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────────

  if (phase === "roundIntro") {
    return (
      <div className="ss-root">
        <div className="ss-ambient" style={{ background: cfg.bgGlow }} />
        <RoundIntro round={currentRound} onStart={handleStartRound} />
      </div>
    );
  }

  if (phase === "roundComplete") {
    return (
      <div className="ss-root">
        <div className="ss-ambient" style={{ background: cfg.bgGlow }} />
        <RoundComplete
          round={currentRound}
          correct={roundCorrect}
          total={5}
          onNext={handleNextRound}
        />
      </div>
    );
  }

  if (phase === "summary") {
    const stars = calcStarsQuiz(totalCorrect, TOTAL_QUESTIONS);
    const rp = calcRewardPoints(stars, 30);
    const badge = stars === 3 ? "Simplification Ace" : null;
    return (
      <div className="ss-root">
        <div className="ss-ambient ss-ambient--gold" />
        <Summary
          stars={stars}
          score={score}
          correct={totalCorrect}
          mistakes={totalMistakes}
          time={elapsedTime}
          badge={badge}
          rewardPoints={rp}
          onReplay={handleReplay}
          onExit={handleExit}
        />
      </div>
    );
  }

  // ── Playing / Answer Reveal ───────────────────────────────────────────────────
  return (
    <div className="ss-root" style={{ "--round-color": cfg.color, "--round-glow": cfg.bgGlow }}>
      <div className="ss-ambient" style={{ background: cfg.bgGlow }} />

      {/* ── HUD ── */}
      <div className="ss-hud">
        <div className="ss-hud-left">
          <span className="ss-hud-round" style={{ color: cfg.color }}>
            {cfg.emoji} {cfg.label}
          </span>
          <span className="ss-hud-qcount">
            Q{questionIndex + 1}/5
          </span>
        </div>
        <div className="ss-hud-center">
          <div className="ss-global-progress-track">
            <div
              className="ss-global-progress-fill"
              style={{ width: `${progressPct}%`, background: cfg.color }}
            />
          </div>
          <span className="ss-hud-progress-label">{progressPct}% complete</span>
        </div>
        <div className="ss-hud-right">
          <span className="ss-hud-score">⚡ {score}</span>
          <button className="ss-btn-exit" onClick={onExit} title="Exit game">
            ✕
          </button>
        </div>
      </div>

      {/* ── Streak + Time Bonus Flash ── */}
      <div className="ss-feedback-row">
        <StreakBadge streak={streak} />
        {timeBonusFlash && (
          <div className="ss-timebonus-flash">{timeBonusFlash}</div>
        )}
      </div>

      {/* ── Timer bar ── */}
      <div className="ss-timer-wrapper">
        <TimerBar
          timeLeft={timeLeft}
          maxTime={cfg.timePerQ}
          color={cfg.color}
        />
        <span
          className={["ss-timer-num", timeLeft <= 4 ? "ss-timer-num--danger" : ""].join(" ")}
        >
          {timeLeft}s
        </span>
      </div>

      {/* ── Question card ── */}
      <div className={["ss-question-card", answerResult === "correct" ? "ss-question-card--correct" : answerResult === "wrong" ? "ss-question-card--wrong" : ""].join(" ")}>
        <div className="ss-question-number">
          Question {(currentRound - 1) * 5 + questionIndex + 1} of {TOTAL_QUESTIONS}
        </div>
        <div className="ss-question-label">Simplify:</div>
        <div className="ss-question-expr">{currentQuestion.q}</div>

        {answerResult === "correct" && (
          <div className="ss-answer-feedback ss-answer-feedback--correct">
            ✓ Correct!
          </div>
        )}
        {answerResult === "wrong" && selectedAnswer !== "__timeout__" && (
          <div className="ss-answer-feedback ss-answer-feedback--wrong">
            ✗ Not quite — the answer was{" "}
            <strong>{currentQuestion.correct}</strong>
          </div>
        )}
        {answerResult === "wrong" && selectedAnswer === "__timeout__" && (
          <div className="ss-answer-feedback ss-answer-feedback--wrong">
            ⏰ Time's up! Answer:{" "}
            <strong>{currentQuestion.correct}</strong>
          </div>
        )}
      </div>

      {/* ── Answer options ── */}
      <div className="ss-options">
        {shuffledOptions.map((opt) => {
          const isSelected = selectedAnswer === opt;
          const isCorrectOpt = opt === currentQuestion.correct;
          const revealed = phase === "answerReveal";

          let stateClass = "";
          if (revealed) {
            if (isCorrectOpt) stateClass = "ss-option--correct";
            else if (isSelected && !isCorrectOpt) stateClass = "ss-option--wrong";
            else stateClass = "ss-option--dim";
          }

          return (
            <button
              key={opt}
              className={["ss-option", stateClass].join(" ")}
              onClick={() => handleAnswer(opt)}
              disabled={phase === "answerReveal"}
              style={revealed && isCorrectOpt ? { "--opt-color": cfg.color } : {}}
            >
              <span className="ss-option-text">{opt}</span>
              {revealed && isCorrectOpt && (
                <span className="ss-option-tick">✓</span>
              )}
              {revealed && isSelected && !isCorrectOpt && (
                <span className="ss-option-cross">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Hint ── */}
      {showHint && (
        <div className="ss-hint">
          💡 <em>{currentQuestion.hint}</em>
        </div>
      )}
    </div>
  );
};

export default SimplificationShowdown;
