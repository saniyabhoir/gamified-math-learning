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

// ── Utilities ─────────────────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const buildDeck = (terms) => {
  const deck = terms.flatMap((term, i) => [
    { uid: `${term.id}_a_${i}`, ...term },
    { uid: `${term.id}_b_${i}`, ...term },
  ]);
  return shuffle(deck);
};

const buildInitialCardStates = (deck) => {
  const states = {};
  deck.forEach((c) => { states[c.uid] = "hidden"; });
  return states;
};

// ── Sub-components ────────────────────────────────────────────────────────────
const Stars = ({ count }) => (
  <div className="ltmm-stars">
    {[1, 2, 3].map((n) => (
      <span key={n} className={n <= count ? "ltmm-star-on" : "ltmm-star-off"}>★</span>
    ))}
  </div>
);

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
          <span>Badge unlocked: <strong>{badge}</strong></span>
        </div>
      )}
      <div className="ltmm-summary-actions">
        <button className="ltmm-btn-secondary" onClick={onReplay}>Play Again</button>
        <button className="ltmm-btn-primary" onClick={onExit}>Back to Dashboard</button>
      </div>
    </div>
  );
};

const Card = ({ card, state, onClick }) => {
  const isFlipped = state === "flipped" || state === "matched";
  const isMatched = state === "matched";
  const isShaking = state === "shake";

  return (
    <div
      className={[
        "ltmm-card",
        isFlipped  ? "ltmm-card--flipped" : "",
        isMatched  ? "ltmm-card--matched" : "",
        isShaking  ? "ltmm-card--shake"   : "",
      ].filter(Boolean).join(" ")}
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

// ── Main Component ────────────────────────────────────────────────────────────
const LikeTermsMemoryMatch = ({ moduleId, userId, onComplete, onExit }) => {
  // ── phase: "playing" | "transition" | "summary"
  const [phase, setPhase]               = useState("playing");
  const [round, setRound]               = useState(1);
  const [deck, setDeck]                 = useState(() => buildDeck(ROUND_1_TERMS));
  const [cardStates, setCardStates]     = useState(() => buildInitialCardStates(buildDeck(ROUND_1_TERMS)));
  const [flippedUids, setFlippedUids]   = useState([]);
  const [mistakes, setMistakes]         = useState(0);
  const [roundMistakes, setRoundMistakes] = useState([]); // history array, one entry per round
  const [score, setScore]               = useState(0);
  const [hint, setHint]                 = useState("");
  const [elapsedTime, setElapsedTime]   = useState(0);
  const [timerRunning, setTimerRunning] = useState(true);
  const [roundStars, setRoundStars]     = useState([]);

  // FIX 1: lockRef prevents concurrent clicks during animations
  const lockRef = useRef(false);
  // FIX 2: endRoundFiredRef prevents endRound from firing twice in the same round
  const endRoundFiredRef = useRef(false);
  // FIX 3: Store current round's mistakes in a ref so endRound always reads fresh value
  const mistakesRef = useRef(0);

  // Keep mistakesRef in sync with mistakes state
  useEffect(() => {
    mistakesRef.current = mistakes;
  }, [mistakes]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // ── Re-initialise card states when deck changes (new round or replay) ──────
  // FIX 4: Synchronously initialise states (no queueMicrotask race), reset guards
  useEffect(() => {
    setCardStates(buildInitialCardStates(deck));
    setFlippedUids([]);
    lockRef.current = false;
    endRoundFiredRef.current = false;
  }, [deck]);

  // ── End of round ──────────────────────────────────────────────────────────
  // FIX 5: endRound reads mistakesRef.current (always fresh) not stale closure value
  const endRound = useCallback(() => {
    // FIX 6: Guard against double-fire
    if (endRoundFiredRef.current) return;
    endRoundFiredRef.current = true;

    setTimerRunning(false);
    const currentMistakes = mistakesRef.current;
    const stars = calcStarsMemoryMatch([currentMistakes]);

    setRoundStars((prev) => [...prev, stars]);
    setRoundMistakes((prev) => [...prev, currentMistakes]);
    setHint("");

    if (round === 1) {
      setPhase("transition");
    } else {
      setPhase("summary");
    }
  }, [round]); // FIX 7: Only depends on `round` — mistakes read from ref, not closure

  // ── Card click handler ────────────────────────────────────────────────────
  // FIX 8: handleCardClick is properly defined at component scope, with correct closure
  const handleCardClick = useCallback(
    (uid) => {
      if (lockRef.current) return;
      if (cardStates[uid] !== "hidden") return;

      const newFlipped = [...flippedUids, uid];
      setCardStates((prev) => ({ ...prev, [uid]: "flipped" }));
      setFlippedUids(newFlipped);

      // Wait for second card
      if (newFlipped.length < 2) return;

      // Two cards are now face-up — lock board immediately
      lockRef.current = true;

      const [uidA, uidB] = newFlipped;
      const cardA = deck.find((c) => c.uid === uidA);
      const cardB = deck.find((c) => c.uid === uidB);
      const isMatch = cardA.variable === cardB.variable;

      if (isMatch) {
        // ── MATCH ───────────────────────────────────────────────────────────
        setScore((s) => s + 15);
        setHint("");

        // FIX 9: Compute allMatched inside the functional updater (always fresh state)
        setCardStates((prev) => {
          const updated = { ...prev, [uidA]: "matched", [uidB]: "matched" };
          const allMatched = Object.values(updated).every((s) => s === "matched");

          if (allMatched) {
            // Trigger endRound after a brief visual pause — board stays locked
            setTimeout(() => endRound(), 300);
          } else {
            // More pairs remain — unlock the board
            lockRef.current = false;
          }

          return updated;
        });

        // Clear flipped tracker immediately (matched cards are off the "active" list)
        setFlippedUids([]);
        // NOTE: lockRef stays true if allMatched; gets set false inside updater if not

      } else {
        // ── MISMATCH ─────────────────────────────────────────────────────────
        const hintVar =
          cardA.variable === "constant" || cardB.variable === "constant"
            ? "constants must match constants"
            : `"${cardA.variable}" ≠ "${cardB.variable}" — variables must be the same`;

        setHint(`Hint: ${hintVar}`);
        setMistakes((m) => m + 1); // mistakesRef.current syncs via the useEffect above
        setScore((s) => Math.max(0, s - 5));

        setCardStates((prev) => ({
          ...prev,
          [uidA]: "shake",
          [uidB]: "shake",
        }));

        // FIX 10: After shake animation, flip cards back and unlock
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
    [cardStates, flippedUids, deck, endRound]
  );

  // ── Advance to round 2 ────────────────────────────────────────────────────
  // FIX 11: handleNextRound is at component scope (was incorrectly nested inside handleCardClick)
  const handleNextRound = useCallback(() => {
    setRound(2);
    setMistakes(0);
    mistakesRef.current = 0;
    setHint("");
    setTimerRunning(true);
    setPhase("playing");
    // Setting deck triggers the useEffect which resets cardStates + guards
    setDeck(buildDeck(ROUND_2_TERMS));
  }, []);

  // ── Replay ────────────────────────────────────────────────────────────────
  const handleReplay = useCallback(() => {
    setRound(1);
    setMistakes(0);
    mistakesRef.current = 0;
    setRoundMistakes([]);
    setScore(0);
    setHint("");
    setElapsedTime(0);
    setRoundStars([]);
    setTimerRunning(true);
    setPhase("playing");
    setDeck(buildDeck(ROUND_1_TERMS));
  }, []);

  // ── Final summary data ────────────────────────────────────────────────────
  // FIX 12: getFinalData is at component scope
  const getFinalData = useCallback(() => {
    const allMistakes = [...roundMistakes];
    const stars = calcStarsMemoryMatch(allMistakes.length > 0 ? allMistakes : [0]);
    const rp = calcRewardPoints(stars, 25);
    const badge = stars === 3 ? "Memory Match Master" : null;
    return { stars, rp, badge };
  }, [roundMistakes]);

  // ── Exit handler ──────────────────────────────────────────────────────────
  // FIX 13: handleExit is at component scope
  const handleExit = useCallback(() => {
    if (phase === "summary") {
      const { stars, rp, badge } = getFinalData();
      const totalPairs = ROUND_1_TERMS.length + ROUND_2_TERMS.length;
      const totalMistakesSum = roundMistakes.reduce((a, b) => a + b, 0);
      const correctPairs = totalPairs - totalMistakesSum;
      const accuracy = totalPairs > 0 ? (correctPairs / totalPairs) * 100 : 0;

      const result = buildGameResult({
        moduleId,
        gameId: "like-terms-memory-match",
        score,
        accuracy,
        mistakes: totalMistakesSum,
        completionTime: elapsedTime,
        stars,
        rewardPoints: rp,
        badgeUnlocked: badge,
        extraData: { roundMistakes, roundStars },
      });
      onComplete(result);
    } else {
      onExit();
    }
  }, [phase, getFinalData, roundMistakes, roundStars, score, elapsedTime, moduleId, onComplete, onExit]);

  // ── Derived display values ────────────────────────────────────────────────
  const matchedCount = Object.values(cardStates).filter((s) => s === "matched").length;
  const totalCards   = deck.length;
  const cols         = round === 1 ? 4 : 4;
  const minutes      = Math.floor(elapsedTime / 60);
  const seconds      = elapsedTime % 60;

  // ── Render: Transition ────────────────────────────────────────────────────
  if (phase === "transition") {
    const stars = calcStarsMemoryMatch([mistakesRef.current]);
    return (
      <div className="ltmm-root">
        <RoundTransition
          roundNum={1}
          stars={stars}
          mistakes={mistakesRef.current}
          onNext={handleNextRound}
        />
      </div>
    );
  }

  // ── Render: Summary ───────────────────────────────────────────────────────
  if (phase === "summary") {
    const { stars, rp, badge } = getFinalData();
    const totalMistakesSum = roundMistakes.reduce((a, b) => a + b, 0);
    return (
      <div className="ltmm-root">
        <Summary
          stars={stars}
          score={score}
          mistakes={totalMistakesSum}
          time={elapsedTime}
          badge={badge}
          onReplay={handleReplay}
          onExit={handleExit}
        />
      </div>
    );
  }

  // ── Render: Playing ───────────────────────────────────────────────────────
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
          <span className="ltmm-hud-val">{minutes}:{String(seconds).padStart(2, "0")}</span>
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
          <span className="ltmm-hud-val">{matchedCount / 2}/{totalCards / 2}</span>
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
      <div className="ltmm-grid" style={{ "--cols": cols }}>
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
