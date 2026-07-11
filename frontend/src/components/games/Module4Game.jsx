import React, { useState, useEffect, useRef } from 'react';
import { calcStarsQuiz, calcRewardPoints, buildGameResult } from '../../utils/GameMatrics';
import './Module4Game.css';

/* =====================================================================
   BLUEPRINT DETECTIVE — Module 4
   Inverse of Module 3's Algebra Architect: the student is handed a
   finished structure (an expanded expression) and must reverse-engineer
   the factors that built it. Same grid visual grammar as Module 3,
   opposite direction of reasoning.

   10 curated, fixed cases (no random generation), split as required:
     Cases 1-3  : Easy   - single row, shared GCF slot
     Cases 4-7  : Medium - 2x2 grid, open constant headers (trinomial)
     Cases 8-10 : Hard   - chained: GCF extraction, then the reduced
                  trinomial (case 10 uses a GCF of 1 on purpose, so
                  "always extract" can't be pattern-matched)
   ===================================================================== */

/* ---------------------------------------------------------------------
   Micro-copy (verbatim from the approved design's Mistake Tracking table)
   --------------------------------------------------------------------- */
const MSG_INVALID_FACTOR = "doesn't split evenly";
const MSG_NON_MAXIMAL = 'this works \u2014 can you go bigger?';
const MSG_SIGN_ERROR = 'Size is right \u2014 check your signs';
const MSG_MULTIPLY_CONFUSION = 'these two need to multiply to the constant, and add to the middle term';
const MSG_THERE_IS_MORE_INSIDE = "There's more inside \u2014 a second clue is hiding in what's left.";
const MSG_GENERIC_MISMATCH = 'Not quite \u2014 check the highlighted part';

/* ---------------------------------------------------------------------
   Formatting helpers
   --------------------------------------------------------------------- */

// Format a coefficient + exponent pair as a term label, e.g. (-2, 1, 'x') -> "\u22122x"
const fmtVarTerm = (coef, exp, variable) => {
  if (exp === 0) return `${coef}`;
  const abs = Math.abs(coef);
  const sign = coef < 0 ? '\u2212' : '';
  const coefPart = abs === 1 ? '' : `${abs}`;
  const varPart = exp === 2 ? `${variable}\u00B2` : variable;
  return `${sign}${coefPart}${varPart}`;
};

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/* ---------------------------------------------------------------------
   10 curated, fixed cases. Every number here is original (not lifted
   from the design doc's illustrative examples), with varied GCFs,
   variables, signs, and factor pairs per the requirements.
   --------------------------------------------------------------------- */

const LEVELS = [
  // ----------------- EASY: common-factor extraction (1 row) -----------------
  {
    id: 1, tier: 'easy', tierLabel: 'Easy', variable: 'x',
    caseLabel: '8x + 12',
    terms: [
      { label: '8x', coef: 8, exp: 1 },
      { label: '12', coef: 12, exp: 0 },
    ],
    correctGCF: 4,
    finalExpression: '4(2x + 3)',
  },
  {
    id: 2, tier: 'easy', tierLabel: 'Easy', variable: 'y',
    caseLabel: '15y \u2212 10',
    terms: [
      { label: '15y', coef: 15, exp: 1 },
      { label: '\u221210', coef: -10, exp: 0 },
    ],
    correctGCF: 5,
    finalExpression: '5(3y \u2212 2)',
  },
  {
    id: 3, tier: 'easy', tierLabel: 'Easy', variable: 'm',
    caseLabel: '9m + 27',
    terms: [
      { label: '9m', coef: 9, exp: 1 },
      { label: '27', coef: 27, exp: 0 },
    ],
    correctGCF: 9,
    finalExpression: '9(m + 3)',
  },

  // ----------------- MEDIUM: monic trinomial (2x2 grid) -----------------
  {
    id: 4, tier: 'medium', tierLabel: 'Medium', variable: 'x',
    caseLabel: 'x\u00B2 + 7x + 12',
    b: 7, c: 12, correctPair: [3, 4],
    finalExpression: '(x + 3)(x + 4)',
  },
  {
    id: 5, tier: 'medium', tierLabel: 'Medium', variable: 'x',
    caseLabel: 'x\u00B2 + 6x \u2212 7',
    b: 6, c: -7, correctPair: [7, -1],
    finalExpression: '(x + 7)(x \u2212 1)',
  },
  {
    id: 6, tier: 'medium', tierLabel: 'Medium', variable: 'y',
    caseLabel: 'y\u00B2 \u2212 8y + 15',
    b: -8, c: 15, correctPair: [-3, -5],
    finalExpression: '(y \u2212 3)(y \u2212 5)',
  },
  {
    id: 7, tier: 'medium', tierLabel: 'Medium', variable: 'n',
    caseLabel: 'n\u00B2 \u2212 n \u2212 20',
    b: -1, c: -20, correctPair: [-5, 4],
    finalExpression: '(n \u2212 5)(n + 4)',
  },

  // ----------------- HARD: chained GCF extraction + trinomial -----------------
  {
    id: 8, tier: 'hard', tierLabel: 'Hard', variable: 'x',
    caseLabel: '3x\u00B2 + 21x + 30',
    terms: [
      { label: '3x\u00B2', coef: 3, exp: 2 },
      { label: '21x', coef: 21, exp: 1 },
      { label: '30', coef: 30, exp: 0 },
    ],
    correctGCF: 3,
    b: 7, c: 10, correctPair: [2, 5],
    finalExpression: '3(x + 2)(x + 5)',
  },
  {
    id: 9, tier: 'hard', tierLabel: 'Hard', variable: 'y',
    caseLabel: '4y\u00B2 \u2212 12y \u2212 40',
    terms: [
      { label: '4y\u00B2', coef: 4, exp: 2 },
      { label: '\u221212y', coef: -12, exp: 1 },
      { label: '\u221240', coef: -40, exp: 0 },
    ],
    correctGCF: 4,
    b: -3, c: -10, correctPair: [-5, 2],
    finalExpression: '4(y \u2212 5)(y + 2)',
  },
  {
    // GCF is deliberately 1 here so students can't assume "there's always
    // an extraction step" without actually checking.
    id: 10, tier: 'hard', tierLabel: 'Hard', variable: 'm',
    caseLabel: 'm\u00B2 + 5m \u2212 14',
    terms: [
      { label: 'm\u00B2', coef: 1, exp: 2 },
      { label: '5m', coef: 5, exp: 1 },
      { label: '\u221214', coef: -14, exp: 0 },
    ],
    correctGCF: 1,
    b: 5, c: -14, correctPair: [7, -2],
    finalExpression: '(m + 7)(m \u2212 2)',
  },
];

// One "action" = one gradeable stage. Easy/Medium cases have 1 stage each;
// Hard cases chain 2 stages (GCF extraction + trinomial).
const TOTAL_ACTIONS = LEVELS.reduce((sum, lvl) => sum + (lvl.tier === 'hard' ? 2 : 1), 0);

const TIER_META = {
  easy: {
    icon: '\uD83E\uDDF5',
    heading: 'Case Type: Common Factor',
    instructions: 'Find the greatest common factor shared by every term \u2014 not just any factor that works.',
  },
  medium: {
    icon: '\uD83D\uDCD0',
    heading: 'New Case Type: The Trinomial Files',
    instructions: 'Find the two numbers that multiply to the constant and add to the middle coefficient.',
  },
  hard: {
    icon: '\uD83D\uDD75\uFE0F',
    heading: 'Final Cases: Chained Clues',
    instructions: 'Pull out the common factor first, then crack the trinomial hiding underneath.',
  },
};

// GCF slot: convention keeps the shared factor positive.
const GCF_PALETTE = Array.from({ length: 9 }, (_, i) => i + 1); // 1..9
// Trinomial slots: factors can be negative.
const SIGNED_PALETTE = Array.from({ length: 19 }, (_, i) => i - 9); // -9..9

/* ---------------------------------------------------------------------
   Grading logic (pure functions, no side effects)
   --------------------------------------------------------------------- */

// Any common divisor of a set of integers must divide their GCD, so a
// candidate that divides every term evenly is either the GCF itself or
// strictly smaller than it \u2014 never larger. That makes the "smaller than
// the true GCF" check below safe.
const evaluateGcf = (level, value) => {
  const failing = [];
  level.terms.forEach((t, i) => {
    if (t.coef % value !== 0) failing.push(i);
  });
  if (failing.length > 0) return { status: 'invalid', failing };
  if (value === level.correctGCF) return { status: 'correct', failing: [] };
  return { status: 'nonmax', failing: [] };
};

const evaluateTrinomial = (level, p, q) => {
  const { b, c, correctPair } = level;
  if (p * q === c && p + q === b) return { status: 'correct' };
  if (p * q === b && p + q === c) return { status: 'multiplyConfusion' };

  const enteredMags = [Math.abs(p), Math.abs(q)].sort().join(',');
  const correctMags = [Math.abs(correctPair[0]), Math.abs(correctPair[1])].sort().join(',');
  if (enteredMags === correctMags) return { status: 'signError' };

  return { status: 'mismatch', crossOk: p + q === b, bottomRightOk: p * q === c };
};

/* ---------------------------------------------------------------------
   Fresh per-case state
   --------------------------------------------------------------------- */

const prepareCase = (level) => ({
  stage: level.tier === 'medium' ? 'trinomial' : 'gcf', // easy & hard both start with a GCF stage
  activeSlot: null,
  gcfValue: null,
  gcfAttempts: 0,
  gcfResolved: level.tier === 'medium', // medium has no GCF stage at all
  gcfFeedback: null,
  p: null,
  q: null,
  trinomialAttempts: 0,
  trinomialResolved: false,
  trinomialFeedback: null,
});

/* ---------------------------------------------------------------------
   Small presentational sub-components (no local state \u2014 everything
   lives in Module4Game, per the technical requirements)
   --------------------------------------------------------------------- */

const StarsRow = ({ stars }) => (
  <div className="bd-stars-row" aria-label={`${stars} out of 3 stars`}>
    {[1, 2, 3].map((n) => (
      <span key={n} className={`bd-star ${n <= stars ? 'bd-star--filled' : ''}`}>&#9733;</span>
    ))}
  </div>
);

const CaseProgress = ({ caseIdx, totalCases, tierIcon }) => (
  <div className="bd-progress">
    <div className="bd-progress-row">
      <span className="bd-progress-label">
        <span className="bd-progress-icon" aria-hidden="true">{tierIcon}</span>
        Case {caseIdx + 1} of {totalCases}
      </span>
    </div>
    <div className="bd-case-track" aria-hidden="true">
      {Array.from({ length: totalCases }).map((_, i) => (
        <div
          key={i}
          className={
            'bd-case-dot'
            + (i < caseIdx ? ' bd-case-dot--done' : '')
            + (i === caseIdx ? ' bd-case-dot--active' : '')
          }
        />
      ))}
    </div>
  </div>
);

const NumberPalette = ({ options, selected, heading, onSelect }) => (
  <div className="bd-palette-wrap">
    <div className="bd-palette-caret" aria-hidden="true" />
    <div className="bd-palette" role="group" aria-label={heading}>
      <div className="bd-palette-heading">{heading}</div>
      <div className="bd-palette-grid">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className={`bd-palette-chip ${selected === n ? 'bd-palette-chip--selected' : ''}`}
            onClick={() => onSelect(n)}
          >
            {n > 0 ? `+${n}` : n}
          </button>
        ))}
      </div>
    </div>
  </div>
);

// Easy / Hard-stage-1: a row of term tiles sharing one open factor slot.
const GcfRow = ({ level, caseState, onOpenSlot }) => {
  const { gcfValue, gcfFeedback, gcfResolved, activeSlot } = caseState;

  const previewFor = (term) => {
    if (gcfValue == null) return null;
    if (term.coef % gcfValue !== 0) return '\u2014';
    return fmtVarTerm(term.coef / gcfValue, term.exp, level.variable);
  };

  return (
    <div className="bd-gcf-board">
      <div className="bd-gcf-tiles">
        {level.terms.map((term, i) => {
          const flagged = gcfFeedback && gcfFeedback.tone === 'invalid' && gcfFeedback.failing.includes(i);
          const okFlag = gcfValue != null && !flagged && (gcfResolved || gcfFeedback);
          return (
            <React.Fragment key={i}>
              {i > 0 && <span className="bd-gcf-plus" aria-hidden="true">{term.coef < 0 ? '' : '+'}</span>}
              <div
                className={
                  'bd-gcf-tile'
                  + (flagged ? ' bd-gcf-tile--flag-red' : '')
                  + (okFlag ? ' bd-gcf-tile--flag-green' : '')
                }
              >
                <span className="bd-gcf-tile-term">{term.label}</span>
                <span className="bd-gcf-tile-divider" aria-hidden="true" />
                <span className="bd-gcf-tile-quotient">{previewFor(term) ?? '?'}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="bd-gcf-slot-row">
        <span className="bd-gcf-slot-label">Shared factor</span>
        <button
          type="button"
          className={
            'bd-slot-btn'
            + (gcfValue != null ? ' bd-slot-btn--filled' : ' bd-slot-btn--empty')
            + (activeSlot === 'gcf' ? ' bd-slot-btn--active' : '')
            + (gcfResolved ? ' bd-slot-btn--locked' : '')
          }
          onClick={() => !gcfResolved && onOpenSlot('gcf')}
          disabled={gcfResolved}
        >
          {gcfValue != null ? gcfValue : '?'}
        </button>
      </div>
    </div>
  );
};

// Medium / Hard-stage-2: the 2x2 grid, mirroring Module 3's visual grammar
// exactly, but with the constant headers as the open slots to be solved.
const SlotHeader = ({ slotId, value, activeSlot, resolved, variable, onOpenSlot }) => (
  <button
    type="button"
    className={
      'bd-slot-btn bd-col-header--open'
      + (value != null ? ' bd-slot-btn--filled' : ' bd-slot-btn--empty')
      + (activeSlot === slotId ? ' bd-slot-btn--active' : '')
      + (resolved ? ' bd-slot-btn--locked' : '')
    }
    onClick={() => !resolved && onOpenSlot(slotId)}
    disabled={resolved}
  >
    {value != null ? fmtVarTerm(value, 0, variable) : '?'}
  </button>
);

const TrinomialGrid = ({ level, caseState, onOpenSlot }) => {
  const { p, q, trinomialFeedback, trinomialResolved, activeSlot } = caseState;
  const v = level.variable;

  const crossVal = p != null && q != null ? p + q : null;
  // These already include the variable letter (fmtVarTerm with exp=1) \u2014
  // do not append `v` again when rendering them.
  const cellQ = q != null ? fmtVarTerm(q, 1, v) : '?';
  const cellP = p != null ? fmtVarTerm(p, 1, v) : '?';
  const cellCross = crossVal != null ? fmtVarTerm(crossVal, 1, v) : '?';
  const cellProduct = p != null && q != null ? `${p * q}` : '?';

  const crossFlag = trinomialFeedback
    ? (trinomialFeedback.tone === 'sign' || trinomialFeedback.tone === 'multiply'
      ? 'amber'
      : (trinomialFeedback.crossOk === false ? 'red' : (trinomialFeedback.crossOk === true ? 'green' : null)))
    : null;
  const bottomFlag = trinomialFeedback
    ? (trinomialFeedback.tone === 'sign' || trinomialFeedback.tone === 'multiply'
      ? 'amber'
      : (trinomialFeedback.bottomRightOk === false ? 'red' : (trinomialFeedback.bottomRightOk === true ? 'green' : null)))
    : null;

  const flagClass = (flag) => (flag ? ` bd-cell--flag-${flag}` : '');

  return (
    <div className="bd-grid-wrap">
      <div className="bd-col-headers">
        <div className="bd-col-header bd-col-header--locked">{v}</div>
        <div className="bd-col-header">
          <SlotHeader
            slotId="q"
            value={q}
            activeSlot={activeSlot}
            resolved={trinomialResolved}
            variable={v}
            onOpenSlot={onOpenSlot}
          />
        </div>
      </div>
      <div className="bd-grid-body">
        <div className="bd-corner" aria-hidden="true">&#215;</div>
        <div className="bd-grid-rows">
          <div className="bd-grid-row">
            <div className="bd-row-header bd-row-header--locked">{v}</div>
            <div className="bd-grid-cells">
              <div className="bd-cell bd-cell--locked">{v}{'\u00B2'}</div>
              <div className={`bd-cell${flagClass(crossFlag)}`}>{cellQ}</div>
            </div>
          </div>
          <div className="bd-grid-row">
            <div className="bd-row-header">
              <SlotHeader
                slotId="p"
                value={p}
                activeSlot={activeSlot}
                resolved={trinomialResolved}
                variable={v}
                onOpenSlot={onOpenSlot}
              />
            </div>
            <div className="bd-grid-cells">
              <div className={`bd-cell${flagClass(crossFlag)}`}>{cellP}</div>
              <div className={`bd-cell${flagClass(bottomFlag)}`}>{cellProduct}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="bd-grid-total">
        <span className="bd-grid-total-label">Combined middle term:</span>
        <span className="bd-grid-total-value">{cellCross}</span>
      </div>
    </div>
  );
};

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */

const Module4Game = ({ moduleId, userId, onComplete, onExit }) => {
  const [phase, setPhase] = useState('intro'); // intro | tierIntro | playing | caseComplete | tierSummary | summary
  const [levelIdx, setLevelIdx] = useState(0);
  const [caseState, setCaseState] = useState(() => prepareCase(LEVELS[0]));

  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [nonMaximalCount, setNonMaximalCount] = useState(0);
  const [mistakesByTier, setMistakesByTier] = useState({ easy: 0, medium: 0, hard: 0 });
  const [mistakesByType, setMistakesByType] = useState({
    invalidFactor: 0, signError: 0, multiplyConfusion: 0, other: 0,
  });
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [shake, setShake] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [tierSummaryData, setTierSummaryData] = useState(null);

  // Per-tier running stats, snapshotted at tier boundaries for the Tier
  // Summary screen (score/accuracy/mistakes stay standardised through the
  // same helpers used for the final summary).
  const tierSnapshotRef = useRef({ score: 0, actions: 0, mistakes: 0 });

  const sessionStartRef = useRef(null);
  const tickRef = useRef(null);
  const shakeTimeoutRef = useRef(null);

  const level = LEVELS[levelIdx];

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
  }, []);

  const startClock = () => {
    sessionStartRef.current = Date.now();
    tickRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
  };

  const stopClock = () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const handleStart = () => {
    startClock();
    setPhase('tierIntro');
  };

  // Tier intro is a brief orientation banner, same convention as Module 3.
  useEffect(() => {
    if (phase !== 'tierIntro') return undefined;
    const tid = setTimeout(() => setPhase('playing'), 1800);
    return () => clearTimeout(tid);
  }, [phase]);

  // Hard tier's "transition beat": once the GCF is locked in, pause briefly
  // on a banner before the reduced trinomial appears underneath.
  useEffect(() => {
    if (phase !== 'playing' || level.tier !== 'hard' || caseState.stage !== 'gcf-resolved') return undefined;
    const tid = setTimeout(() => {
      setCaseState((prev) => ({ ...prev, stage: 'trinomial' }));
    }, 1500);
    return () => clearTimeout(tid);
  }, [phase, caseState.stage, level.tier]);

  const registerMistake = (type) => {
    setTotalMistakes((m) => m + 1);
    setMistakesByTier((prev) => ({ ...prev, [level.tier]: prev[level.tier] + 1 }));
    setMistakesByType((prev) => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const applySuccess = (wasFirstTry) => {
    setScore((s) => s + (wasFirstTry ? 15 : 8));
    if (wasFirstTry) setCorrectFirstTry((c) => c + 1);
    setTotalActions((a) => a + 1);
  };

  const triggerShake = () => {
    setShake(true);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => setShake(false), 450);
  };

  const finishGame = (finalScore, finalMistakes, finalCorrectFirstTry, finalTime, finalMistakesByTier, finalMistakesByType, finalNonMaximal, finalTotalActions) => {
    stopClock();

    const accuracyDenominator = finalTotalActions + finalMistakes;
    const accuracy = accuracyDenominator > 0
      ? Math.round((finalTotalActions / accuracyDenominator) * 100)
      : 100;

    const stars = calcStarsQuiz(finalCorrectFirstTry, TOTAL_ACTIONS);
    const rewardPoints = calcRewardPoints(stars, 30);
    const badgeUnlocked = stars === 3 ? 'Master Detective' : null;

    const result = buildGameResult({
      moduleId,
      gameId: 'blueprint-detective',
      score: finalScore,
      accuracy,
      mistakes: finalMistakes,
      completionTime: finalTime,
      stars,
      rewardPoints,
      badgeUnlocked,
      extraData: {
        casesCompleted: LEVELS.length,
        mistakesByTier: finalMistakesByTier,
        mistakesByType: finalMistakesByType,
        nonMaximalFlags: finalNonMaximal,
        correctFirstTry: finalCorrectFirstTry,
        totalActions: finalTotalActions,
      },
    });

    setSummaryData(result);
    setPhase('summary');
  };

  const showTierSummary = (finishedTier) => {
    const snap = tierSnapshotRef.current;
    const tierActions = totalActions - snap.actions;
    const tierMistakesCount = totalMistakes - snap.mistakes;
    const tierScoreGained = score - snap.score;
    const denom = tierActions + tierMistakesCount;
    const tierAccuracy = denom > 0 ? Math.round((tierActions / denom) * 100) : 100;

    setTierSummaryData({
      tier: finishedTier,
      tierLabel: TIER_META[finishedTier] ? finishedTier[0].toUpperCase() + finishedTier.slice(1) : finishedTier,
      score: tierScoreGained,
      accuracy: tierAccuracy,
      mistakes: tierMistakesCount,
    });
    tierSnapshotRef.current = { score, actions: totalActions, mistakes: totalMistakes };
    setPhase('tierSummary');
  };

  // Advance to the next case (or tier summary, or final summary) after a
  // brief "case closed" pause.
  useEffect(() => {
    if (phase !== 'caseComplete') return undefined;
    const tid = setTimeout(() => {
      const nextIdx = levelIdx + 1;
      if (nextIdx >= LEVELS.length) {
        finishGame(score, totalMistakes, correctFirstTry, elapsedTime, mistakesByTier, mistakesByType, nonMaximalCount, totalActions);
        return;
      }
      const nextLevel = LEVELS[nextIdx];
      if (nextLevel.tier !== level.tier) {
        showTierSummary(level.tier);
        setLevelIdx(nextIdx);
        setCaseState(prepareCase(nextLevel));
        return;
      }
      setLevelIdx(nextIdx);
      setCaseState(prepareCase(nextLevel));
      setPhase('playing');
    }, 1600);
    return () => clearTimeout(tid);
  }, [phase]);

  const handleTierSummaryContinue = () => {
    setPhase('tierIntro');
  };

  const handleOpenSlot = (slotId) => {
    setCaseState((prev) => ({ ...prev, activeSlot: prev.activeSlot === slotId ? null : slotId }));
  };

  const handlePaletteSelect = (slotId, value) => {
    setCaseState((prev) => {
      if (slotId === 'gcf') {
        return { ...prev, gcfValue: value, gcfFeedback: null, activeSlot: null };
      }
      return { ...prev, [slotId]: value, trinomialFeedback: null, activeSlot: null };
    });
  };

  const handleTestBlueprint = () => {
    if (caseState.stage === 'gcf') {
      if (caseState.gcfValue == null) return;
      const result = evaluateGcf(level, caseState.gcfValue);

      if (result.status === 'correct') {
        const wasFirstTry = caseState.gcfAttempts === 0;
        applySuccess(wasFirstTry);
        if (level.tier === 'hard') {
          setCaseState((prev) => ({
            ...prev, gcfResolved: true, gcfFeedback: { tone: 'correct' }, stage: 'gcf-resolved', activeSlot: null,
          }));
        } else {
          setCaseState((prev) => ({
            ...prev, gcfResolved: true, gcfFeedback: { tone: 'correct' }, activeSlot: null,
          }));
          setPhase('caseComplete');
        }
        return;
      }

      if (result.status === 'nonmax') {
        setNonMaximalCount((n) => n + 1);
        setCaseState((prev) => ({
          ...prev,
          gcfAttempts: prev.gcfAttempts + 1,
          gcfFeedback: { tone: 'nonmax', failing: [], message: MSG_NON_MAXIMAL },
        }));
        return;
      }

      registerMistake('invalidFactor');
      setCaseState((prev) => ({
        ...prev,
        gcfAttempts: prev.gcfAttempts + 1,
        gcfFeedback: { tone: 'invalid', failing: result.failing, message: MSG_INVALID_FACTOR },
      }));
      triggerShake();
      return;
    }

    if (caseState.stage === 'trinomial') {
      if (caseState.p == null || caseState.q == null) return;
      const result = evaluateTrinomial(level, caseState.p, caseState.q);

      if (result.status === 'correct') {
        const wasFirstTry = caseState.trinomialAttempts === 0;
        applySuccess(wasFirstTry);
        setCaseState((prev) => ({
          ...prev, trinomialResolved: true, trinomialFeedback: { tone: 'correct', crossOk: true, bottomRightOk: true }, activeSlot: null,
        }));
        setPhase('caseComplete');
        return;
      }

      if (result.status === 'multiplyConfusion') {
        registerMistake('multiplyConfusion');
        setCaseState((prev) => ({
          ...prev,
          trinomialAttempts: prev.trinomialAttempts + 1,
          trinomialFeedback: { tone: 'multiply', message: MSG_MULTIPLY_CONFUSION },
        }));
        triggerShake();
        return;
      }

      if (result.status === 'signError') {
        registerMistake('signError');
        setCaseState((prev) => ({
          ...prev,
          trinomialAttempts: prev.trinomialAttempts + 1,
          trinomialFeedback: { tone: 'sign', message: MSG_SIGN_ERROR },
        }));
        triggerShake();
        return;
      }

      registerMistake('other');
      setCaseState((prev) => ({
        ...prev,
        trinomialAttempts: prev.trinomialAttempts + 1,
        trinomialFeedback: {
          tone: 'mismatch', crossOk: result.crossOk, bottomRightOk: result.bottomRightOk, message: MSG_GENERIC_MISMATCH,
        },
      }));
      triggerShake();
    }
  };

  const handleReplay = () => {
    stopClock();
    setLevelIdx(0);
    setCaseState(prepareCase(LEVELS[0]));
    setScore(0);
    setTotalMistakes(0);
    setNonMaximalCount(0);
    setMistakesByTier({ easy: 0, medium: 0, hard: 0 });
    setMistakesByType({ invalidFactor: 0, signError: 0, multiplyConfusion: 0, other: 0 });
    setCorrectFirstTry(0);
    setTotalActions(0);
    setElapsedTime(0);
    setSummaryData(null);
    setTierSummaryData(null);
    tierSnapshotRef.current = { score: 0, actions: 0, mistakes: 0 };
    setPhase('intro');
  };

  // Summary screen never auto-advances; onComplete only fires from here.
  const handleBackToDashboard = () => {
    if (typeof onComplete === 'function' && summaryData) {
      onComplete(summaryData);
    }
  };

  /* --------------------------- RENDER: INTRO --------------------------- */

  if (phase === 'intro') {
    return (
      <div className="bd-game">
        <div className="bd-intro">
          <div className="bd-intro-icon" aria-hidden="true">&#128269;</div>
          <h1 className="bd-intro-title">Blueprint Detective</h1>
          <p className="bd-intro-subtitle">
            A finished structure just turned up with no blueprint on file. Work backward from the
            expression to the factors that must have built it.
          </p>

          <div className="bd-intro-rules">
            <div className="bd-rule">
              <span className="bd-rule-icon" aria-hidden="true">&#128073;</span>
              <span>Tap a slot, choose a number from the palette{' \u2014 '}explore freely, nothing costs you anything yet.</span>
            </div>
            <div className="bd-rule">
              <span className="bd-rule-icon" aria-hidden="true">&#128269;</span>
              <span>When you&rsquo;re confident, tap <strong>Test Blueprint</strong> to lock in your guess.</span>
            </div>
            <div className="bd-rule">
              <span className="bd-rule-icon" aria-hidden="true">&#128279;</span>
              <span>On hard cases, crack the shared factor first{' \u2014 '}a second clue is hiding underneath.</span>
            </div>
          </div>

          <div className="bd-intro-tiers">
            <div className="bd-intro-tier">
              <span className="bd-intro-tier-icon" aria-hidden="true">{TIER_META.easy.icon}</span>
              <span>Easy &middot; 3 cases &middot; common factor</span>
            </div>
            <div className="bd-intro-tier">
              <span className="bd-intro-tier-icon" aria-hidden="true">{TIER_META.medium.icon}</span>
              <span>Medium &middot; 4 cases &middot; trinomial factoring</span>
            </div>
            <div className="bd-intro-tier">
              <span className="bd-intro-tier-icon" aria-hidden="true">{TIER_META.hard.icon}</span>
              <span>Hard &middot; 3 cases &middot; chained clues</span>
            </div>
          </div>

          <button type="button" className="bd-btn bd-btn--primary bd-btn--large" onClick={handleStart}>
            Open the Case File
          </button>
          {typeof onExit === 'function' && (
            <button type="button" className="bd-btn bd-btn--ghost" onClick={onExit}>
              &larr; Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------- RENDER: TIER INTRO ------------------------ */

  if (phase === 'tierIntro') {
    const meta = TIER_META[level.tier];
    return (
      <div className="bd-game">
        <div className="bd-tier-intro">
          <div className="bd-tier-intro-icon" aria-hidden="true">{meta.icon}</div>
          <h2 className="bd-tier-intro-heading">{meta.heading}</h2>
          <p className="bd-tier-intro-text">{meta.instructions}</p>
        </div>
      </div>
    );
  }

  /* ------------------------ RENDER: TIER SUMMARY ------------------------ */

  if (phase === 'tierSummary' && tierSummaryData) {
    return (
      <div className="bd-game">
        <div className="bd-tier-summary">
          <div className="bd-tier-summary-icon" aria-hidden="true">{TIER_META[tierSummaryData.tier].icon}</div>
          <h2 className="bd-tier-summary-title">{tierSummaryData.tierLabel} Cases Closed</h2>
          <div className="bd-tier-summary-grid">
            <div className="bd-summary-stat">
              <span className="bd-summary-stat-label">Score</span>
              <span className="bd-summary-stat-value">+{tierSummaryData.score}</span>
            </div>
            <div className="bd-summary-stat">
              <span className="bd-summary-stat-label">Accuracy</span>
              <span className="bd-summary-stat-value">{tierSummaryData.accuracy}%</span>
            </div>
            <div className="bd-summary-stat">
              <span className="bd-summary-stat-label">Mistakes</span>
              <span className="bd-summary-stat-value">{tierSummaryData.mistakes}</span>
            </div>
          </div>
          <button type="button" className="bd-btn bd-btn--primary" onClick={handleTierSummaryContinue}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------- RENDER: SUMMARY --------------------------- */

  if (phase === 'summary' && summaryData) {
    const { mistakesByType: mt, nonMaximalFlags } = summaryData.extraData;
    return (
      <div className="bd-game">
        <div className="bd-summary">
          <div className="bd-summary-icon" aria-hidden="true">&#127891;</div>
          <h1 className="bd-summary-title">Case File Closed</h1>
          <p className="bd-summary-flavor">Every blueprint recovered. The precinct owes you one, Detective.</p>

          <StarsRow stars={summaryData.stars} />

          <div className="bd-summary-grid">
            <div className="bd-summary-stat">
              <span className="bd-summary-stat-label">Score</span>
              <span className="bd-summary-stat-value">{summaryData.score}</span>
            </div>
            <div className="bd-summary-stat">
              <span className="bd-summary-stat-label">Accuracy</span>
              <span className="bd-summary-stat-value">{summaryData.accuracy}%</span>
            </div>
            <div className="bd-summary-stat">
              <span className="bd-summary-stat-label">Mistakes</span>
              <span className="bd-summary-stat-value">{summaryData.mistakes}</span>
            </div>
            <div className="bd-summary-stat">
              <span className="bd-summary-stat-label">Time</span>
              <span className="bd-summary-stat-value">{formatTime(summaryData.completionTime)}</span>
            </div>
          </div>

          <div className="bd-summary-breakdown">
            <div className="bd-summary-breakdown-title">Mistakes by type</div>
            <div className="bd-summary-breakdown-row"><span>Invalid common factor</span><span>{mt.invalidFactor}</span></div>
            <div className="bd-summary-breakdown-row"><span>Sign errors</span><span>{mt.signError}</span></div>
            <div className="bd-summary-breakdown-row"><span>Multiply/factor mix-ups</span><span>{mt.multiplyConfusion}</span></div>
            <div className="bd-summary-breakdown-row"><span>Other mismatches</span><span>{mt.other}</span></div>
            <div className="bd-summary-breakdown-row bd-summary-breakdown-row--soft">
              <span>Non-maximal factor (not an error)</span><span>{nonMaximalFlags}</span>
            </div>
          </div>

          <div className="bd-summary-reward">
            <span className="bd-summary-reward-icon" aria-hidden="true">&#128142;</span>
            <span>+{summaryData.rewardPoints} reward points</span>
          </div>

          {summaryData.badgeUnlocked && (
            <div className="bd-summary-badge">
              <span className="bd-summary-badge-icon" aria-hidden="true">&#127942;</span>
              <span>Badge unlocked: {summaryData.badgeUnlocked}</span>
            </div>
          )}

          <div className="bd-summary-actions">
            <button type="button" className="bd-btn bd-btn--primary" onClick={handleReplay}>
              Play Again
            </button>
            {typeof onExit === 'function' && (
              <button type="button" className="bd-btn bd-btn--ghost" onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ------------------- RENDER: PLAYING / CASE COMPLETE ------------------- */

  const isHardTransition = level.tier === 'hard' && caseState.stage === 'gcf-resolved';
  const stageResolved = caseState.stage === 'gcf'
    ? caseState.gcfResolved
    : caseState.trinomialResolved;

  const activeFeedback = caseState.stage === 'gcf' ? caseState.gcfFeedback : caseState.trinomialFeedback;
  const feedbackTone = activeFeedback ? activeFeedback.tone : null;

  const canTest = caseState.stage === 'gcf'
    ? caseState.gcfValue != null && !caseState.gcfResolved
    : caseState.p != null && caseState.q != null && !caseState.trinomialResolved;

  const paletteOptions = caseState.activeSlot === 'gcf' ? GCF_PALETTE : SIGNED_PALETTE;
  const paletteHeading = caseState.activeSlot === 'gcf'
    ? 'Choose the shared factor'
    : caseState.activeSlot === 'p'
      ? 'Choose the first factor'
      : 'Choose the second factor';
  const paletteSelected = caseState.activeSlot === 'gcf'
    ? caseState.gcfValue
    : caseState.activeSlot === 'p' ? caseState.p : caseState.q;

  return (
    <div className="bd-game">
      <div className="bd-hud">
        <div className="bd-hud-stat">
          <span className="bd-hud-label">Score</span>
          <span className="bd-hud-value">{score}</span>
        </div>
        <div className="bd-hud-stat">
          <span className="bd-hud-label">Mistakes</span>
          <span className="bd-hud-value">{totalMistakes}</span>
        </div>
        <div className="bd-hud-stat">
          <span className="bd-hud-label">Time</span>
          <span className="bd-hud-value">{formatTime(elapsedTime)}</span>
        </div>
        {typeof onExit === 'function' && (
          <button type="button" className="bd-hud-exit" onClick={onExit} aria-label="Exit game">
            &#10005;
          </button>
        )}
      </div>

      <CaseProgress caseIdx={levelIdx} totalCases={LEVELS.length} tierIcon={TIER_META[level.tier].icon} />

      <div className="bd-case-badge">
        <span className="bd-case-badge-icon" aria-hidden="true">{TIER_META[level.tier].icon}</span>
        <span>{level.tierLabel}</span>
        <span className="bd-case-badge-file">Case file: {level.caseLabel}</span>
      </div>

      {level.tier === 'hard' && (
        <div className="bd-hard-steps">
          <span className={`bd-hard-step ${caseState.gcfResolved ? 'bd-hard-step--done' : 'bd-hard-step--active'}`}>
            1. Shared factor
          </span>
          <span className="bd-hard-step-arrow" aria-hidden="true">&#8594;</span>
          <span className={`bd-hard-step ${caseState.trinomialResolved ? 'bd-hard-step--done' : (caseState.gcfResolved ? 'bd-hard-step--active' : '')}`}>
            2. Remaining trinomial
          </span>
        </div>
      )}

      {isHardTransition && (
        <div className="bd-transition-banner">
          <span aria-hidden="true">&#128270;</span> {MSG_THERE_IS_MORE_INSIDE}
        </div>
      )}

      {phase === 'caseComplete' && (
        <div className="bd-case-complete-banner">
          <span aria-hidden="true">&#9989;</span> Case closed: {level.finalExpression}
        </div>
      )}

      {!isHardTransition && phase === 'playing' && (
        <div className={`bd-board ${shake ? 'bd-board--shake' : ''}`}>
          {caseState.stage === 'gcf' && (
            <GcfRow level={level} caseState={caseState} onOpenSlot={handleOpenSlot} />
          )}
          {caseState.stage === 'trinomial' && (
            <TrinomialGrid level={level} caseState={caseState} onOpenSlot={handleOpenSlot} />
          )}

          {activeFeedback && activeFeedback.message && (
            <div
              className={
                'bd-feedback'
                + (feedbackTone === 'invalid' ? ' bd-feedback--error' : '')
                + (feedbackTone === 'nonmax' ? ' bd-feedback--nudge' : '')
                + (feedbackTone === 'sign' ? ' bd-feedback--sign' : '')
                + (feedbackTone === 'multiply' ? ' bd-feedback--multiply' : '')
                + (feedbackTone === 'mismatch' ? ' bd-feedback--error' : '')
              }
            >
              {activeFeedback.message}
            </div>
          )}

          {caseState.activeSlot && (
            <NumberPalette
              options={paletteOptions}
              selected={paletteSelected}
              heading={paletteHeading}
              onSelect={(v) => handlePaletteSelect(caseState.activeSlot, v)}
            />
          )}

          {!stageResolved && (
            <div className="bd-test-btn-row">
              <button
                type="button"
                className="bd-btn bd-btn--primary bd-btn--test"
                disabled={!canTest}
                onClick={handleTestBlueprint}
              >
                Test Blueprint
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Module4Game;