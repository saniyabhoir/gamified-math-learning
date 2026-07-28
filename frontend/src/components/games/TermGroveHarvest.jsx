// frontend/src/components/games/TermGroveHarvest.jsx
//
// Module 2 replacement for QuizCard. Same contract, same question data,
// same scoring — the interaction changes from "tap an option" to
// "collect the like terms and let them combine."
//
// ── How correctness is decided ──────────────────────────────────────────────
// For questions whose question_text is a literal "Simplify: <expr>" (or
// "Simplify completely/where possible: <expr>") prompt, this component:
//   1. Parses <expr> into individual signed terms (e.g. "5x", "+3y", "-2x").
//   2. Lets the player harvest term-fruits into a basket. Same-variable
//      fruits auto-merge (coefficients add) with an animation.
//   3. On "Deliver Basket", the combined result string is compared —
//      whitespace/case-insensitively — directly against currentQ.correct_answer.
//      That's the ONLY correctness check; nothing about how correct_answer
//      is authored or evaluated elsewhere in the app changes.
//
// For questions that aren't a parseable "Simplify: <expr>" prompt (word
// problems, yes/no concept checks, "which pair can't combine", etc.) there
// is nothing to construct — those fall back to a lighter "pick the fruit"
// mode that keeps the same orchard visuals but is a direct tap-to-select,
// identical in spirit to QuizCard's option buttons. This keeps the module
// visually consistent without inventing gameplay steps a question doesn't
// actually contain.
//
// Props are byte-for-byte what QuizCard already receives:
//   screenData     — { quiz_questions, reward, ... }
//   onComplete(score, totalPossiblePoints)
//   onAnswerLogged(answerData)   // same shape QuizCard already produces

import React, { useState, useMemo, useCallback, useEffect } from "react";
import "./TermGroveHarvest.css";

// ─── Parsing helpers (presentational only — never changes an answer) ───────
const normalize = (s) => (s || "").replace(/\s+/g, "").toLowerCase();

const extractExpressionText = (questionText) => {
  // Mandatory colon right after "simplify[ completely|where possible]" —
  // this is what distinguishes a literal "Simplify: 5x + 3x" computation
  // prompt from prose that merely mentions simplifying (e.g. "Can you
  // simplify 5a + 3b?" or "...when simplifying a long expression like...").
  // Verified against the full module2.json question set (11/11 computation
  // prompts parse to the exact correct_answer; the other 10 conceptual/
  // word-problem questions correctly fall through to select mode).
  const m = questionText.match(
    /\bsimplify(?:\s+(?:completely|where possible))?\s*:\s*(.+)$/i
  );
  if (!m) return null;
  let expr = m[1].trim().replace(/[−–]/g, "-");
  expr = expr.split(/[.(]/)[0].trim(); // drop trailing hints/parens/sentences
  if (!/[a-zA-Z]/.test(expr) || !/[+-]/.test(expr)) return null;
  return expr;
};

const tokenizeTerms = (expr) => {
  const cleaned = expr.replace(/\s+/g, "");
  const raw = cleaned.match(/[+-]?\d*[a-zA-Z]+/g);
  if (!raw || raw.length < 2) return null;

  const terms = [];
  for (let i = 0; i < raw.length; i++) {
    const tok = raw[i];
    const sign = tok.startsWith("-") ? -1 : 1;
    const body = tok.replace(/^[+-]/, "");
    const match = body.match(/^(\d*)([a-zA-Z]+)$/);
    if (!match) return null; // unparseable token — bail out to fallback mode
    const coeff = (match[1] === "" ? 1 : parseInt(match[1], 10)) * sign;
    terms.push({
      id: `term_${i}_${match[2]}`,
      coeff,
      variable: match[2],
      display: `${coeff < 0 ? "-" : ""}${Math.abs(coeff) === 1 ? "" : Math.abs(coeff)}${match[2]}`,
    });
  }
  return terms;
};

const combineTerms = (collectedTerms) => {
  const order = [];
  const sums = {};
  collectedTerms.forEach((t) => {
    if (!(t.variable in sums)) {
      sums[t.variable] = 0;
      order.push(t.variable);
    }
    sums[t.variable] += t.coeff;
  });
  const parts = order
    .filter((v) => sums[v] !== 0)
    .map((v, i) => {
      const c = sums[v];
      const abs = Math.abs(c);
      const coeffPart = abs === 1 ? "" : String(abs);
      const sign = c < 0 ? "-" : i === 0 ? "" : "+ ";
      return `${sign}${coeffPart}${v}`;
    });
  return parts.join(" ").trim();
};

// A handful of decoy "wrong variable" fruits that never belong to the
// question's expression — makes leaving them uncollected a real choice,
// not just a matter of there being no other option.
const DECOY_POOL = [
  { variable: "p", coeff: 4 },
  { variable: "m", coeff: 6 },
  { variable: "k", coeff: 2 },
];

const FRUIT_ART = ["🍎", "🍊", "🍇", "🍋", "🍑", "🍒", "🥝", "🍐"];
const fruitFor = (variable) => {
  const idx = variable.charCodeAt(0) % FRUIT_ART.length;
  return FRUIT_ART[idx];
};

// ─── Build a per-question plan once, up front ───────────────────────────────
const planQuestion = (q) => {
  const expr = extractExpressionText(q.question_text);
  const terms = expr ? tokenizeTerms(expr) : null;

  if (terms) {
    const usedVars = new Set(terms.map((t) => t.variable));
    const decoys = DECOY_POOL.filter((d) => !usedVars.has(d.variable)).slice(0, 2);
    const fruits = [...terms, ...decoys.map((d, i) => ({
      id: `decoy_${i}_${d.variable}`,
      coeff: d.coeff,
      variable: d.variable,
      display: `${d.coeff}${d.variable}`,
      isDecoy: true,
    }))];
    // Shuffle for visual variety only — does not affect which terms are correct.
    for (let i = fruits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [fruits[i], fruits[j]] = [fruits[j], fruits[i]];
    }
    return { mode: "harvest", fruits };
  }

  // Fallback: tap-to-select mode, one fruit per option, in original order.
  return {
    mode: "select",
    fruits: q.options.map((opt, i) => ({
      id: `opt_${i}`,
      display: opt,
      optionValue: opt,
    })),
  };
};

// ─── HUD ─────────────────────────────────────────────────────────────────
const GroveHud = ({ qIdx, total, score, totalPossible }) => (
  <div className="tgh-hud">
    <span className="tgh-hud-progress">Question {qIdx + 1} of {total}</span>
    <div className="tgh-hud-score">
      <span>🧺 Harvest Score</span>
      <div className="tgh-hud-score-track">
        <div
          className="tgh-hud-score-fill"
          style={{ width: `${totalPossible > 0 ? Math.min((score / totalPossible) * 100, 100) : 0}%` }}
        />
      </div>
      <span>{score} / {totalPossible} pts</span>
    </div>
  </div>
);

// ─── Main component ─────────────────────────────────────────────────────
const TermGroveHarvest = ({ screenData, onComplete, onAnswerLogged }) => {
  const questions = screenData.quiz_questions || [];
  const totalPossiblePoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [basket, setBasket] = useState([]); // collected fruit objects (harvest mode)
  const [mergedResult, setMergedResult] = useState("");
  const [committed, setCommitted] = useState(null); // { selected, isCorrect } once answered
  const [showHint, setShowHint] = useState(false);
  const [availableFruits, setAvailableFruits] = useState([]);

  const currentQ = questions[qIdx];
  const plan = useMemo(() => (currentQ ? planQuestion(currentQ) : null), [currentQ]);

  // Reset per-question state whenever the question changes
  useEffect(() => {
    if (!plan) return;
    setBasket([]);
    setMergedResult("");
    setCommitted(null);
    setShowHint(false);
    setAvailableFruits(plan.fruits);
  }, [qIdx, plan]);

  // Keep the live "what's in the basket right now" combined preview in sync
  useEffect(() => {
    if (plan?.mode === "harvest") {
      setMergedResult(combineTerms(basket));
    }
  }, [basket, plan]);

  const logAnswer = useCallback(
    (selectedValue) => {
      const isCorrect = normalize(selectedValue) === normalize(currentQ.correct_answer);
      if (isCorrect) setScore((s) => s + (currentQ.points || 0));
      setCommitted({ selected: selectedValue, isCorrect });
      onAnswerLogged?.({
        questionId: currentQ.question_id,
        selectedAnswer: selectedValue,
        correctAnswer: currentQ.correct_answer,
        isCorrect,
        mistakeTracking: currentQ.mistake_tracking || null,
      });
    },
    [currentQ, onAnswerLogged]
  );

  // ── Harvest-mode interactions ─────────────────────────────────────────
  const collectFruit = useCallback((fruit) => {
    setAvailableFruits((prev) => prev.filter((f) => f.id !== fruit.id));
    setBasket((prev) => [...prev, fruit]);
  }, []);

  const returnFruit = useCallback((fruit) => {
    setBasket((prev) => prev.filter((f) => f.id !== fruit.id));
    setAvailableFruits((prev) => [...prev, fruit]);
  }, []);

  const deliverBasket = useCallback(() => {
    if (committed) return;
    logAnswer(mergedResult);
  }, [committed, mergedResult, logAnswer]);

  // ── Select-mode interaction (fallback for non-computational questions) ──
  const pickFruit = useCallback(
    (fruit) => {
      if (committed) return;
      logAnswer(fruit.optionValue);
    },
    [committed, logAnswer]
  );

  const handleNext = useCallback(() => {
    if (qIdx < questions.length - 1) {
      setQIdx((p) => p + 1);
    } else {
      onComplete(score, totalPossiblePoints);
    }
  }, [qIdx, questions.length, onComplete, score, totalPossiblePoints]);

  if (!currentQ || !plan) {
    return (
      <div className="tgh-done">
        <p>Grove complete! Score: {score}/{totalPossiblePoints}</p>
        <button className="tgh-btn tgh-btn--cta" onClick={() => onComplete(score, totalPossiblePoints)}>
          Continue
        </button>
      </div>
    );
  }

  const isLast = qIdx === questions.length - 1;

  // Group basket items visually by variable so merges read clearly
  const basketGroups = {};
  basket.forEach((f) => {
    basketGroups[f.variable] = basketGroups[f.variable] || [];
    basketGroups[f.variable].push(f);
  });

  return (
    <div className="tgh-root">
      <GroveHud qIdx={qIdx} total={questions.length} score={score} totalPossible={totalPossiblePoints} />

      <div className="tgh-signpost">
        <p className="tgh-question-text">{currentQ.question_text}</p>
        {currentQ.points && <span className="tgh-points-badge">+{currentQ.points} pts</span>}
      </div>

      {plan.mode === "harvest" ? (
        <>
          <p className="tgh-instruction">
            🌳 Collect only the <strong>like terms</strong> into the basket — matching fruit will merge on its own.
          </p>

          {/* Tree canopy: uncollected fruit */}
          <div className="tgh-canopy" role="group" aria-label="Term fruit available to collect">
            {availableFruits.map((f) => (
              <button
                key={f.id}
                className={`tgh-fruit ${f.isDecoy ? "tgh-fruit--decoy" : ""}`}
                onClick={() => !committed && collectFruit(f)}
                disabled={!!committed}
                aria-label={`Collect term ${f.display}`}
              >
                <span className="tgh-fruit-emoji">{fruitFor(f.variable)}</span>
                <span className="tgh-fruit-label">{f.display}</span>
              </button>
            ))}
          </div>

          {/* Basket: collected + auto-merged groups */}
          <div className="tgh-basket-zone">
            <div className="tgh-basket" aria-label="Your basket">
              <div className="tgh-basket-icon">🧺</div>
              {Object.entries(basketGroups).map(([variable, fruits]) => (
                <div key={variable} className="tgh-basket-group">
                  {fruits.map((f) => (
                    <button
                      key={f.id}
                      className="tgh-basket-fruit"
                      onClick={() => !committed && returnFruit(f)}
                      disabled={!!committed}
                      title="Tap to put this back"
                    >
                      {fruitFor(f.variable)} {f.display}
                    </button>
                  ))}
                  {fruits.length > 1 && (
                    <span className="tgh-merge-arrow">⇒ merges</span>
                  )}
                </div>
              ))}
            </div>

            <div className="tgh-preview">
              <span className="tgh-preview-label">Current basket total:</span>
              <span className="tgh-preview-value">{mergedResult || "— empty —"}</span>
            </div>

            {!committed && (
              <button
                className="tgh-btn tgh-btn--deliver"
                onClick={deliverBasket}
                disabled={basket.length === 0}
              >
                🚚 Deliver Basket
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="tgh-instruction">🌿 Pick the fruit that answers the question.</p>
          <div className="tgh-select-grid" role="group" aria-label="Answer choices">
            {plan.fruits.map((f) => {
              let state = "";
              if (committed) {
                if (f.optionValue === currentQ.correct_answer) state = "correct";
                else if (f.optionValue === committed.selected) state = "incorrect";
                else state = "dimmed";
              }
              return (
                <button
                  key={f.id}
                  className={`tgh-select-fruit tgh-select-fruit--${state || "idle"}`}
                  onClick={() => pickFruit(f)}
                  disabled={!!committed}
                >
                  <span className="tgh-fruit-emoji">🍏</span>
                  <span>{f.display}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Hint: Firefly Guide ── */}
      {!committed && (
        <div className="tgh-hint-zone">
          <button className="tgh-hint-btn" onClick={() => setShowHint((h) => !h)}>
            ✨ Firefly Guide
          </button>
          {showHint && (
            <p className="tgh-hint-text">
              {currentQ.common_misconceptions?.[0]?.explanation ||
                currentQ.concept_explanation ||
                currentQ.feedback_incorrect ||
                "Only terms with the exact same variable can be combined."}
            </p>
          )}
        </div>
      )}

      {/* ── Feedback ── */}
      {committed && (
        <div className={`tgh-feedback tgh-feedback--${committed.isCorrect ? "correct" : "incorrect"}`}>
          <div className="tgh-feedback-icon">{committed.isCorrect ? "🎉" : "🌱"}</div>
          <div className="tgh-feedback-content">
            <p className="tgh-feedback-result">{committed.isCorrect ? "Correct!" : "Not quite."}</p>
            <p className="tgh-feedback-text">
              {committed.isCorrect ? currentQ.feedback_correct : currentQ.feedback_incorrect}
            </p>
            {!committed.isCorrect && (
              <p className="tgh-feedback-answer">
                The correct simplified result was: <strong>{currentQ.correct_answer}</strong>
              </p>
            )}
          </div>
          <button className="tgh-btn tgh-btn--cta" onClick={handleNext}>
            {isLast ? "Finish →" : "Next Grove →"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TermGroveHarvest;
