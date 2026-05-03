// frontend/src/components/games/LikeTermsMemoryMatch.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  buildGameResult,
  calcStarsMemoryMatch,
  calcRewardPoints,
} from "../../utils/GameMatrics";
import "./LikeTermsMemoryMatch.css";

// ── Term data ─────────────────────────────────────────────────────────────────
const ROUND_1_TERMS = [
  { id: "3x",  display: "3x",  variable: "x" },
  { id: "7x",  display: "7x",  variable: "x" },
  { id: "9x",  display: "9x",  variable: "x" },
  { id: "2y",  display: "2y",  variable: "y" },
  { id: "5y",  display: "5y",  variable: "y" },
  { id: "4y",  display: "4y",  variable: "y" },
];

const ROUND_2_TERMS = [
  { id: "8x",  display: "8x",  variable: "x" },
  { id: "6x",  display: "6x",  variable: "x" },
  { id: "3y",  display: "3y",  variable: "y" },
  { id: "7y",  display: "7y",  variable: "y" },
  { id: "5c",  display: "5",   variable: "constant" },
  { id: "11c", display: "11",  variable: "constant" },
  { id: "4a",  display: "4a",  variable: "a" },
  { id: "9a",  display: "9a",  variable: "a" },
];

// ── Utility: shuffle array ────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ── Build card deck from term pairs ──────────────────────────────────────────
const buildDeck = (terms) => {
  // Each term appears twice (pair to find)
  const deck = terms.flatMap((term, i) => [
    { uid: `${term.id}_a_${i}`, ...term },
    { uid: `${term.id}_b_${i}`, ...term },
  ]);
  return shuffle(deck);
};

// ── Star badge display ────────────────────────────────────────────────────────
const Stars = ({ count }) => (
  <div className="ltmm-stars">
    {[1, 2, 3].map((n) => (
      <span key={n} className={n <= count ? "ltmm-star-on" : "ltmm-star-off"}>
        ★
      </span>
    ))}
  </div>
);

// ── Round transition card ─────────────────────────────────────────────────────
const RoundTransition = ({ roundNum, stars, mistakes, onNext }) => {
  useEffect(() => {
    const t = setTimeout(onNext, 2500);
    return () => clearTimeout(t);
  }, [onNext]);

  return (
    <div className="ltmm-transition">
      <div className="ltmm-transition-badge">Round {roundNum} Complete!</div>
      <Stars count={stars} />
      <p className="ltmm-transition-stat">
        Mistakes this round: <strong>{mistakes}</strong>
      </p>
      <p className="ltmm-transition-hint">Get ready for Round {roundNum + 1}…</p>
    </div>
  );
};

// ── Session Summary ───────────────────────────────────────────────────────────
const Summary = ({ stars, score, mistakes, time, badge, onReplay, onExit }) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return (
    <div className="ltmm-summary">
      <div className="ltmm-summary-icon">🍬</div>
      <h2 className="ltmm-summary-title">Sweet Shop Complete!</h2>
      <Stars count={stars} />

      <div className="ltmm-summary-grid">
        <div className="ltmm-summary-stat">
          <span className="ltmm-summary-val">{score}</span>
          <span className="ltmm-summary-lbl">Score</span>
        </div>
        <div className="ltmm-summary-stat">
          <span className="ltmm-summary-val">{mistakes}</span>
          <span className="ltmm-summary-lbl">Mistakes</span>
        </div>
        <div className="ltmm-summary-stat">
          <span className="ltmm-summary-val">
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="ltmm-summary-lbl">Time</span>
        </div>
        <div className="ltmm-summary-stat">
          <span className="ltmm-summary-val">{stars}★</span>
          <span className="ltmm-summary-lbl">Stars</span>
        </div>
      </div>

      {badge && (
        <div className="ltmm-badge-unlock">
          <span className="ltmm-badge-icon">🏅</span>
          <span>
            Badge unlocked: <strong>{badge}</strong>
          </span>
        </div>
      )}

      <div className="ltmm-summary-actions">
        <button className="ltmm-btn-secondary" onClick={onReplay}>
          Play Again
        </button>
        <button className="ltmm-btn-primary" onClick={onExit}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// ── Card Component ────────────────────────────────────────────────────────────
const Card = ({ card, state, onClick }) => {
  const isFlipped = state === "flipped" || state === "matched";
  const isMatched = state === "matched";
  const isShaking = state === "shake";

  return (
    <div
      className={[
        "ltmm-card",
        isFlipped ? "ltmm-card--flipped" : "",
        isMatched ? "ltmm-card--matched" : "",
        isShaking ? "ltmm-card--shake" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => !isFlipped && onClick(card.uid)}
      role="button"
      aria-label={isFlipped ? card.display : "Hidden term"}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && !isFlipped && onClick(card.uid)}
    >
      <div className="ltmm-card-inner">
        <div className="ltmm-card-back">?</div>
        <div className="ltmm-card-front">{card.display}</div>
      </div>
    </div>
  );
};

// ── Main Game Component ───────────────────────────────────────────────────────
const LikeTermsMemoryMatch = ({ moduleId, userId, onComplete, onExit }) => {
  const [phase, setPhase] = useState("playing"); // playing | transition | summary
  const [round, setRound] = useState(1);
  const [deck, setDeck] = useState(() => buildDeck(ROUND_1_TERMS));
  const [cardStates, setCardStates] = useState({}); // uid → "hidden"|"flipped"|"matched"|"shake"
  const [flippedUids, setFlippedUids] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [roundMistakes, setRoundMistakes] = useState([]);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [hint, setHint] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [roundStars, setRoundStars] = useState([]);
  const lockRef = useRef(false);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // ── Initialise card states when deck changes ──────────────────────────────
  useEffect(() => {
    const initial = {};
    deck.forEach((c) => (initial[c.uid] = "hidden"));
    setCardStates(initial);
    setFlippedUids([]);
    lockRef.current = false;
  }, [deck]);

  // ── Card click handler ────────────────────────────────────────────────────
  const handleCardClick = useCallback(
    (uid) => {
      if (lockRef.current) return;
      if (cardStates[uid] !== "hidden") return;

      const newFlipped = [...flippedUids, uid];

      setCardStates((prev) => ({ ...prev, [uid]: "flipped" }));
      setFlippedUids(newFlipped);

      if (newFlipped.length < 2) return;

      // Two cards flipped — evaluate match
      lockRef.current = true;
      const [uidA, uidB] = newFlipped;
      const cardA = deck.find((c) => c.uid === uidA);
      const cardB = deck.find((c) => c.uid === uidB);
      const isMatch = cardA.variable === cardB.variable;

      if (isMatch) {
        // ✅ Match
        setCardStates((prev) => ({
          ...prev,
          [uidA]: "matched",
          [uidB]: "matched",
        }));
        setScore((s) => s + 15);
        setHint("");
        setFlippedUids([]);
        lockRef.current = false;

        // Check if all cards matched
        setTimeout(() => {
          setCardStates((prev) => {
            const allMatched = Object.values({ ...prev, [uidA]: "matched", [uidB]: "matched" }).every(
              (s) => s === "matched"
            );
            if (allMatched) endRound();
            return prev;
          });
        }, 50);
      } else {
        // ❌ Mismatch
        const hintVar =
          cardA.variable === "constant" || cardB.variable === "constant"
            ? "constants must match constants"
            : `"${cardA.variable}" ≠ "${cardB.variable}" — variables must be the same`;
        setHint(`Hint: ${hintVar}`);
        setMistakes((m) => m + 1);
        setScore((s) => Math.max(0, s - 5));
        setCardStates((prev) => ({
          ...prev,
          [uidA]: "shake",
          [uidB]: "shake",
        }));

        setTimeout(() => {
          setCardStates((prev) => ({
            ...prev,
            [uidA]: "hidden",
            [uidB]: "hidden",
          }));
          setFlippedUids([]);
          lockRef.current = false;
        }, 900);
      }
    },
    [cardStates, flippedUids, deck]
  );

  // ── End of round ──────────────────────────────────────────────────────────
  const endRound = useCallback(() => {
    setTimerRunning(false);
    const stars = calcStarsMemoryMatch([mistakes]);
    setRoundStars((prev) => [...prev, stars]);
    setRoundMistakes((prev) => [...prev, mistakes]);
    setTotalMistakes((prev) => prev + mistakes);
    setHint("");

    if (round === 1) {
      setPhase("transition");
    } else {
      setPhase("summary");
    }
  }, [mistakes, round]);

  // ── Advance to round 2 ─────────────────────────────────────────────────────
  const handleNextRound = useCallback(() => {
    setRound(2);
    setDeck(buildDeck(ROUND_2_TERMS));
    setMistakes(0);
    setHint("");
    setTimerRunning(true);
    setPhase("playing");
  }, []);

  // ── Final summary data ────────────────────────────────────────────────────
  const getFinalData = () => {
    const allMistakes = [...roundMistakes, mistakes];
    const stars = calcStarsMemoryMatch(allMistakes);
    const rp = calcRewardPoints(stars, 25);
    const badge = stars === 3 ? "Memory Match Master" : null;
    return { stars, rp, badge };
  };

  // ── On complete — send result upstream ────────────────────────────────────
  const handleExit = () => {
    if (phase === "summary") {
      const { stars, rp, badge } = getFinalData();
      const allMistakes = [...roundMistakes, mistakes];
      const totalAttempts = deck.length / 2 + (ROUND_1_TERMS.length);
      const correctPairs = totalAttempts - totalMistakes;
      const accuracy =
        totalAttempts > 0 ? (correctPairs / totalAttempts) * 100 : 0;

      const result = buildGameResult({
        moduleId,
        gameId: "like-terms-memory-match",
        score,
        accuracy,
        mistakes: totalMistakes,
        completionTime: elapsedTime,
        stars,
        rewardPoints: rp,
        badgeUnlocked: badge,
        extraData: { roundMistakes: allMistakes, roundStars },
      });
      onComplete(result);
    } else {
      onExit();
    }
  };

  // ── Check board completion inside render ───────────────────────────────────
  const matchedCount = Object.values(cardStates).filter(
    (s) => s === "matched"
  ).length;
  const totalCards = deck.length;

  useEffect(() => {
    if (matchedCount > 0 && matchedCount === totalCards && phase === "playing") {
      endRound();
    }
  }, [matchedCount, totalCards, phase, endRound]);

  // ── Column count based on round ───────────────────────────────────────────
  const cols = round === 1 ? 4 : 4; // round1: 3×4, round2: 4×4

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === "transition") {
    const stars = calcStarsMemoryMatch([mistakes]);
    return (
      <div className="ltmm-root">
        <RoundTransition
          roundNum={1}
          stars={stars}
          mistakes={mistakes}
          onNext={handleNextRound}
        />
      </div>
    );
  }

  if (phase === "summary") {
    const allMistakes = [...roundMistakes, mistakes];
    const { stars, rp, badge } = getFinalData();
    return (
      <div className="ltmm-root">
        <Summary
          stars={stars}
          score={score}
          mistakes={allMistakes.reduce((a, b) => a + b, 0)}
          time={elapsedTime}
          badge={badge}
          onReplay={() => {
            setRound(1);
            setDeck(buildDeck(ROUND_1_TERMS));
            setMistakes(0);
            setRoundMistakes([]);
            setTotalMistakes(0);
            setScore(0);
            setHint("");
            setElapsedTime(0);
            setRoundStars([]);
            setTimerRunning(true);
            setPhase("playing");
          }}
          onExit={handleExit}
        />
      </div>
    );
  }

  // Playing phase
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;

  return (
    <div className="ltmm-root">
      {/* Header */}
      <div className="ltmm-header">
        <div className="ltmm-header-shop">🍭 Meena Aunty's Sweet Shop</div>
        <div className="ltmm-header-round">Round {round} / 2</div>
      </div>

      {/* HUD */}
      <div className="ltmm-hud">
        <div className="ltmm-hud-item">
          <span className="ltmm-hud-icon">⏱</span>
          <span className="ltmm-hud-val">
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
          <span className="ltmm-hud-lbl">Time</span>
        </div>
        <div className="ltmm-hud-item">
          <span className="ltmm-hud-icon">❌</span>
          <span className="ltmm-hud-val">{mistakes}</span>
          <span className="ltmm-hud-lbl">Mistakes</span>
        </div>
        <div className="ltmm-hud-item">
          <span className="ltmm-hud-icon">⭐</span>
          <span className="ltmm-hud-val">{score}</span>
          <span className="ltmm-hud-lbl">Score</span>
        </div>
        <div className="ltmm-hud-item">
          <span className="ltmm-hud-icon">🃏</span>
          <span className="ltmm-hud-val">
            {matchedCount / 2}/{totalCards / 2}
          </span>
          <span className="ltmm-hud-lbl">Pairs</span>
        </div>
      </div>

      {/* Instruction */}
      <p className="ltmm-instruction">
        {round === 1
          ? "Flip cards to find matching like terms! (same variable)"
          : "Mixed variables + constants — stay sharp! 🧠"}
      </p>

      {/* Card grid */}
      <div
        className="ltmm-grid"
        style={{ "--cols": cols }}
      >
        {deck.map((card) => (
          <Card
            key={card.uid}
            card={card}
            state={cardStates[card.uid] || "hidden"}
            onClick={handleCardClick}
          />
        ))}
      </div>

      {/* Hint */}
      <div className={`ltmm-hint ${hint ? "ltmm-hint--visible" : ""}`}>
        {hint || " "}
      </div>
    </div>
  );
};

export default LikeTermsMemoryMatch;
