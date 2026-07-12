import React, { useState, useEffect, useRef } from 'react';
import { calcStarsQuiz, calcRewardPoints, buildGameResult } from '../../utils/GameMatrics';
import './Module3Game.css';

/* =====================================================================
   ALGEBRA ARCHITECT — Module 3
   Spatial "area model" construction game for multiplying algebraic
   expressions (monomial x monomial -> distribution -> binomial x binomial).

   10 curated, fixed levels (no random generation) for predictable
   demo/testing:
     Levels 1-3  : Easy   - 1x1 grid - monomial x monomial
     Levels 4-7  : Medium - 1x2 grid - distribution
     Levels 8-10 : Hard   - 2x2 grid - binomial x binomial + combine step
   ===================================================================== */

/* ---------------------------------------------------------------------
   Term + math helpers (reusable, not hardcoded per problem)
   A "term" is { coef, exp, label } where exp 0 = constant, exp 1 = "x".
   --------------------------------------------------------------------- */

const fmtTerm = (coef, exp) => {
  if (exp === 0) return `${coef}`;
  if (exp === 1) return `${coef === 1 ? '' : coef}x`;
  return `${coef === 1 ? '' : coef}x\u00B2`;
};

const term = (coef, exp) => ({ coef, exp, label: fmtTerm(coef, exp) });

const dedupeByLabel = (list, protectedLabel) => {
  const seen = new Set(protectedLabel ? [protectedLabel] : []);
  const out = [];
  list.forEach((item) => {
    if (!seen.has(item.label)) {
      seen.add(item.label);
      out.push(item);
    }
  });
  return out;
};

/**
 * Reusable distractor-generation function for any monomial x monomial
 * (or monomial x constant) tile. Implements the exact misconception
 * rules from the design spec:
 *  - var x var   -> added coefficients, forgot exponent, both mistakes
 *  - var x const -> added instead of multiplied, dropped variable, both
 *  - const x const -> added instead of multiplied, wrongly attached a
 *    variable from a neighboring cell
 */
const multiplyTerms = (a, b) => {
  const coefProduct = a.coef * b.coef;
  const coefSum = a.coef + b.coef;
  const totalExp = a.exp + b.exp;
  const correctLabel = fmtTerm(coefProduct, totalExp);

  let distractors;
  if (a.exp === 1 && b.exp === 1) {
    distractors = [
      { label: fmtTerm(coefSum, totalExp), note: 'Added the coefficients instead of multiplying them.' },
      { label: fmtTerm(coefProduct, 1), note: 'Forgot to add the exponents.' },
      { label: fmtTerm(coefSum, 1), note: 'Added the coefficients AND forgot to add the exponents.' },
    ];
  } else if (totalExp === 1) {
    distractors = [
      { label: fmtTerm(coefSum, 1), note: 'Added instead of multiplying the coefficients.' },
      { label: fmtTerm(coefProduct, 0), note: 'Dropped the variable from the answer.' },
      { label: fmtTerm(coefSum, 0), note: 'Added the coefficients AND dropped the variable.' },
    ];
  } else {
    distractors = [
      { label: fmtTerm(coefSum, 0), note: 'Added instead of multiplying.' },
      { label: fmtTerm(coefProduct, 1), note: "Attached a variable that doesn't belong in this tile." },
    ];
  }

  const uniqueDistractors = dedupeByLabel(distractors, correctLabel);

  return {
    coefProduct,
    totalExp,
    correctLabel,
    options: [
      { label: correctLabel, isCorrect: true, note: null },
      ...uniqueDistractors.map((d) => ({ ...d, isCorrect: false })),
    ],
  };
};

/**
 * Reusable distractor-generation function for the "combine like terms"
 * step (Hard tier only). Mirrors Module 2's misconception pattern:
 * correct = sum, distractors = subtracted / multiplied instead of added.
 */
const combineLikeTerms = (coefA, coefB) => {
  const sum = coefA + coefB;
  const diff = Math.abs(coefA - coefB);
  const product = coefA * coefB;
  const correctLabel = fmtTerm(sum, 1);

  const raw = [
    { label: correctLabel, isCorrect: true, note: null },
    { label: fmtTerm(diff, 1), isCorrect: false, note: 'Subtracted the like terms instead of adding them.' },
    { label: fmtTerm(product, 1), isCorrect: false, note: 'Multiplied the coefficients instead of adding them.' },
  ];

  return dedupeByLabel(raw, null).filter((o, i, arr) => arr.findIndex((x) => x.label === o.label) === i);
};

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/* ---------------------------------------------------------------------
   10 curated, fixed levels
   --------------------------------------------------------------------- */

const LEVELS = [
  // ---------------- EASY: 1x1 monomial x monomial ----------------
  {
    id: 1, tier: 'easy', tierLabel: 'Easy', gridRows: 1, gridCols: 1,
    prompt: '2x \u00D7 3x',
    rowHeaders: ['2x'], colHeaders: ['3x'],
    tiles: [{ row: 0, col: 0, a: term(2, 1), b: term(3, 1) }],
    combine: null,
    finalExpression: '6x\u00B2',
  },
  {
    id: 2, tier: 'easy', tierLabel: 'Easy', gridRows: 1, gridCols: 1,
    prompt: '4x \u00D7 3x',
    rowHeaders: ['4x'], colHeaders: ['3x'],
    tiles: [{ row: 0, col: 0, a: term(4, 1), b: term(3, 1) }],
    combine: null,
    finalExpression: '12x\u00B2',
  },
  {
    id: 3, tier: 'easy', tierLabel: 'Easy', gridRows: 1, gridCols: 1,
    prompt: '5x \u00D7 4x',
    rowHeaders: ['5x'], colHeaders: ['4x'],
    tiles: [{ row: 0, col: 0, a: term(5, 1), b: term(4, 1) }],
    combine: null,
    finalExpression: '20x\u00B2',
  },

  // ---------------- MEDIUM: 1x2 distribution ----------------
  {
    id: 4, tier: 'medium', tierLabel: 'Medium', gridRows: 1, gridCols: 2,
    prompt: '3x(2x + 5)',
    rowHeaders: ['3x'], colHeaders: ['2x', '+ 5'],
    tiles: [
      { row: 0, col: 0, a: term(3, 1), b: term(2, 1) },
      { row: 0, col: 1, a: term(3, 1), b: term(5, 0) },
    ],
    combine: null,
    finalExpression: '6x\u00B2 + 15x',
  },
  {
    id: 5, tier: 'medium', tierLabel: 'Medium', gridRows: 1, gridCols: 2,
    prompt: '2x(4x + 3)',
    rowHeaders: ['2x'], colHeaders: ['4x', '+ 3'],
    tiles: [
      { row: 0, col: 0, a: term(2, 1), b: term(4, 1) },
      { row: 0, col: 1, a: term(2, 1), b: term(3, 0) },
    ],
    combine: null,
    finalExpression: '8x\u00B2 + 6x',
  },
  {
    id: 6, tier: 'medium', tierLabel: 'Medium', gridRows: 1, gridCols: 2,
    prompt: '4x(x + 6)',
    rowHeaders: ['4x'], colHeaders: ['x', '+ 6'],
    tiles: [
      { row: 0, col: 0, a: term(4, 1), b: term(1, 1) },
      { row: 0, col: 1, a: term(4, 1), b: term(6, 0) },
    ],
    combine: null,
    finalExpression: '4x\u00B2 + 24x',
  },
  {
    id: 7, tier: 'medium', tierLabel: 'Medium', gridRows: 1, gridCols: 2,
    prompt: '5x(3x + 2)',
    rowHeaders: ['5x'], colHeaders: ['3x', '+ 2'],
    tiles: [
      { row: 0, col: 0, a: term(5, 1), b: term(3, 1) },
      { row: 0, col: 1, a: term(5, 1), b: term(2, 0) },
    ],
    combine: null,
    finalExpression: '15x\u00B2 + 10x',
  },

  // ---------------- HARD: 2x2 binomial x binomial ----------------
  {
    id: 8, tier: 'hard', tierLabel: 'Hard', gridRows: 2, gridCols: 2,
    prompt: '(x + 2)(x + 3)',
    rowHeaders: ['x', '+ 2'], colHeaders: ['x', '+ 3'],
    tiles: [
      { row: 0, col: 0, a: term(1, 1), b: term(1, 1) },
      { row: 0, col: 1, a: term(1, 1), b: term(3, 0) },
      { row: 1, col: 0, a: term(2, 0), b: term(1, 1) },
      { row: 1, col: 1, a: term(2, 0), b: term(3, 0) },
    ],
    combine: { tileIndices: [1, 2] },
    finalExpression: 'x\u00B2 + 5x + 6',
  },
  {
    id: 9, tier: 'hard', tierLabel: 'Hard', gridRows: 2, gridCols: 2,
    prompt: '(x + 4)(x + 2)',
    rowHeaders: ['x', '+ 4'], colHeaders: ['x', '+ 2'],
    tiles: [
      { row: 0, col: 0, a: term(1, 1), b: term(1, 1) },
      { row: 0, col: 1, a: term(1, 1), b: term(2, 0) },
      { row: 1, col: 0, a: term(4, 0), b: term(1, 1) },
      { row: 1, col: 1, a: term(4, 0), b: term(2, 0) },
    ],
    combine: { tileIndices: [1, 2] },
    finalExpression: 'x\u00B2 + 6x + 8',
  },
  {
    id: 10, tier: 'hard', tierLabel: 'Hard', gridRows: 2, gridCols: 2,
    prompt: '(x + 5)(x + 6)',
    rowHeaders: ['x', '+ 5'], colHeaders: ['x', '+ 6'],
    tiles: [
      { row: 0, col: 0, a: term(1, 1), b: term(1, 1) },
      { row: 0, col: 1, a: term(1, 1), b: term(6, 0) },
      { row: 1, col: 0, a: term(5, 0), b: term(1, 1) },
      { row: 1, col: 1, a: term(5, 0), b: term(6, 0) },
    ],
    combine: { tileIndices: [1, 2] },
    finalExpression: 'x\u00B2 + 11x + 30',
  },
];

const TOTAL_ACTIONS = LEVELS.reduce(
  (sum, lvl) => sum + lvl.tiles.length + (lvl.combine ? 1 : 0),
  0,
);

const TIER_META = {
  easy: {
    icon: '\uD83E\uDDF1',
    heading: 'Blueprint Type: Monomial \u00D7 Monomial',
    instructions: 'Multiply the two terms to fill the tile.',
  },
  medium: {
    icon: '\uD83D\uDCD0',
    heading: 'New Blueprint: Distribution',
    instructions: 'Multiply the outside term across every part of the bracket.',
  },
  hard: {
    icon: '\uD83C\uDFD7\uFE0F',
    heading: 'Final Blueprints: Binomial Expansion',
    instructions: 'Fill all four tiles, then combine the matching like terms.',
  },
};

/* ---------------------------------------------------------------------
   Level state preparation
   --------------------------------------------------------------------- */

const prepareLevel = (level) => {
  const tiles = level.tiles.map((t) => {
    const result = multiplyTerms(t.a, t.b);
    return {
      row: t.row,
      col: t.col,
      correctLabel: result.correctLabel,
      coefProduct: result.coefProduct,
      totalExp: result.totalExp,
      options: shuffle(result.options),
      status: 'locked',
      wrongAttempts: 0,
    };
  });
  tiles[0].status = 'active';

  let combine = null;
  if (level.combine) {
    const [i1, i2] = level.combine.tileIndices;
    const coefA = tiles[i1].coefProduct;
    const coefB = tiles[i2].coefProduct;
    combine = {
      tileIndices: [i1, i2],
      options: shuffle(combineLikeTerms(coefA, coefB)),
      selected: [],
      resolved: false,
      wrongFlash: false,
      attemptedWrong: false,
    };
  }

  return { tiles, combine, allFilled: false };
};

/* ---------------------------------------------------------------------
   Small presentational sub-components
   --------------------------------------------------------------------- */

const Tile = ({ tileState, isCombineTappable, isCombineSelected, isCombineDim, isFlashing, onClick }) => {
  const stateClass =
    tileState.status === 'filled' ? 'aa-tile--filled'
      : tileState.status === 'active' ? 'aa-tile--active'
        : 'aa-tile--locked';

  const classes = [
    'aa-tile',
    stateClass,
    isCombineTappable ? 'aa-tile--combine-target' : '',
    isCombineSelected ? 'aa-tile--combine-selected' : '',
    isCombineDim ? 'aa-tile--dim' : '',
    isFlashing ? 'aa-tile--shake' : '',
  ].filter(Boolean).join(' ');

  const clickable = tileState.status === 'active' || isCombineTappable;

  let content;
  if (tileState.status === 'filled') {
    content = (
      <>
        <span className="aa-tile-value">{tileState.correctLabel}</span>
        {!isCombineTappable && !isCombineSelected && (
          <span className="aa-tile-check" aria-hidden="true">&#10003;</span>
        )}
      </>
    );
  } else if (tileState.status === 'active') {
    content = <span className="aa-tile-q">?</span>;
  } else {
    content = <span className="aa-tile-lock" aria-hidden="true">&#9633;</span>;
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      aria-label={
        tileState.status === 'filled'
          ? `Tile complete: ${tileState.correctLabel}`
          : tileState.status === 'active'
            ? 'Active tile, tap to choose an answer'
            : 'Locked tile'
      }
    >
      {content}
    </button>
  );
};

const BlueprintGrid = ({ level, levelState, phase, flashTileIdx, onTileClick, onCombineTileClick }) => {
  const { gridRows, gridCols, rowHeaders, colHeaders } = level;
  const { tiles, combine } = levelState;

  const rows = [];
  for (let r = 0; r < gridRows; r += 1) {
    const cells = [];
    for (let c = 0; c < gridCols; c += 1) {
      const tileIdx = tiles.findIndex((t) => t.row === r && t.col === c);
      const tileState = tiles[tileIdx];
      const isCombineTarget = !!combine && combine.tileIndices.includes(tileIdx);
      const isCombineSelected = !!combine && combine.selected.includes(tileIdx);
      const isCombineTappable = phase === 'combineSelect' && isCombineTarget && !isCombineSelected;
      const isCombineDim = (phase === 'combineSelect' || phase === 'combinePanel') && !isCombineTarget;

      cells.push(
        <Tile
          key={`tile-${r}-${c}`}
          tileState={tileState}
          isCombineTappable={isCombineTappable}
          isCombineSelected={isCombineSelected}
          isCombineDim={isCombineDim}
          isFlashing={flashTileIdx === tileIdx}
          onClick={() => {
            if (phase === 'playing' && tileState.status === 'active') {
              onTileClick(tileIdx);
            } else if (phase === 'combineSelect' && isCombineTappable) {
              onCombineTileClick(tileIdx);
            }
          }}
        />,
      );
    }
    rows.push(
      <div className="aa-grid-row" key={`row-${r}`}>
        <div className="aa-row-header">{rowHeaders[r]}</div>
        <div className="aa-grid-cells" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {cells}
        </div>
      </div>,
    );
  }

  return (
    <div className="aa-grid-wrap">
      <div className="aa-col-headers" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
        {colHeaders.map((h, i) => (
          <div className="aa-col-header" key={`col-${i}`}>{h}</div>
        ))}
      </div>
      <div className="aa-grid-body">
        <div className="aa-corner" aria-hidden="true">&#215;</div>
        <div className="aa-grid-rows">{rows}</div>
      </div>
    </div>
  );
};

const OptionPanel = ({ options, numCols, colIndex, onSelect, heading, wrongFlash }) => {
  const leftPct = numCols > 0 ? ((colIndex + 0.5) / numCols) * 100 : 50;
  return (
    <div className={`aa-option-panel-wrap ${wrongFlash ? 'aa-option-panel-wrap--wrong' : ''}`}>
      <div className="aa-option-caret" style={{ left: `${leftPct}%` }} aria-hidden="true" />
      <div className="aa-option-panel" role="group" aria-label={heading || 'Choose the answer for this tile'}>
        {heading && <div className="aa-option-heading">{heading}</div>}
        <div className="aa-option-list">
          {options.map((opt) => (
            <button
              key={opt.label}
              type="button"
              className="aa-option-btn"
              onClick={() => onSelect(opt)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const BuildProgress = ({ levelIdx, totalLevels, stepsDone, totalSteps, tierIcon }) => (
  <div className="aa-progress">
    <div className="aa-progress-row">
      <span className="aa-progress-label">
        <span className="aa-progress-icon" aria-hidden="true">{tierIcon}</span>
        Blueprint {levelIdx + 1} of {totalLevels}
      </span>
      <span className="aa-progress-tiles">{stepsDone} of {totalSteps} tiles placed</span>
    </div>
    <div className="aa-skyline" aria-hidden="true">
      {Array.from({ length: totalLevels }).map((_, i) => (
        <div
          key={i}
          className={
            'aa-skyline-block'
            + (i < levelIdx ? ' aa-skyline-block--done' : '')
            + (i === levelIdx ? ' aa-skyline-block--active' : '')
          }
        />
      ))}
    </div>
  </div>
);

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const StarsRow = ({ stars }) => (
  <div className="aa-stars-row" aria-label={`${stars} out of 3 stars`}>
    {[1, 2, 3].map((n) => (
      <span key={n} className={`aa-star ${n <= stars ? 'aa-star--filled' : ''}`}>&#9733;</span>
    ))}
  </div>
);

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */

const Module3Game = ({ moduleId, userId, onComplete, onExit }) => {
  const [phase, setPhase] = useState('intro');
  const [levelIdx, setLevelIdx] = useState(0);
  const [levelState, setLevelState] = useState(() => prepareLevel(LEVELS[0]));

  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [mistakesByTier, setMistakesByTier] = useState({ easy: 0, medium: 0, hard: 0 });
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [flashTileIdx, setFlashTileIdx] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const sessionStartRef = useRef(null);
  const tickRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const combineFlashTimeoutRef = useRef(null);

  const level = LEVELS[levelIdx];
  const activeTileIdx = levelState.tiles.findIndex((t) => t.status === 'active');
  const activeTile = activeTileIdx !== -1 ? levelState.tiles[activeTileIdx] : null;

  // Close the option panel whenever a new tile becomes active or a new level loads
  useEffect(() => {
    setOptionsOpen(false);
  }, [activeTileIdx, levelIdx]);

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    if (combineFlashTimeoutRef.current) clearTimeout(combineFlashTimeoutRef.current);
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

  useEffect(() => {
    if (phase !== 'tierIntro') return undefined;
    const tid = setTimeout(() => setPhase('playing'), 1800);
    return () => clearTimeout(tid);
  }, [phase]);

  // Watch for grid completion -> route to combine step or level-complete
  useEffect(() => {
    if (phase !== 'playing') return;
    if (levelState.allFilled) {
      if (level.combine) {
        setPhase('combineSelect');
      } else {
        setPhase('levelComplete');
      }
    }
    
  }, [levelState.allFilled, phase]);

  // Watch for both combine tiles selected -> open combine panel
  useEffect(() => {
    if (phase !== 'combineSelect') return;
    if (levelState.combine && levelState.combine.selected.length === 2) {
      setPhase('combinePanel');
    }
    
  }, [phase, levelState.combine && levelState.combine.selected.length]);

  const finishGame = (finalScore, finalMistakes, finalCorrectFirstTry, finalTime, finalMistakesByTier, finalTotalActions) => {
    stopClock();

    const accuracyDenominator = finalTotalActions + finalMistakes;
    const accuracy = accuracyDenominator > 0
      ? Math.round((finalTotalActions / accuracyDenominator) * 100)
      : 100;

    const stars = calcStarsQuiz(finalCorrectFirstTry, TOTAL_ACTIONS);
    const rewardPoints = calcRewardPoints(stars, 30);
    const badgeUnlocked = stars === 3 ? 'Junior Engineer Champion' : null;

    const result = buildGameResult({
      moduleId,
      gameId: 'multiplication-arena',
      score: finalScore,
      accuracy,
      mistakes: finalMistakes,
      completionTime: finalTime,
      stars,
      rewardPoints,
      badgeUnlocked,
      extraData: {
        levelsCompleted: LEVELS.length,
        mistakesByTier: finalMistakesByTier,
        correctFirstTry: finalCorrectFirstTry,
        totalActions: finalTotalActions,
      },
    });

    setSummaryData(result);
    setPhase('summary');
  };

  // Advance to next level (or finish) after a "level complete" pause
  useEffect(() => {
    if (phase !== 'levelComplete') return undefined;
    const tid = setTimeout(() => {
      const nextIdx = levelIdx + 1;
      if (nextIdx >= LEVELS.length) {
        finishGame(score, totalMistakes, correctFirstTry, elapsedTime, mistakesByTier, totalActions);
      } else {
        const nextLevel = LEVELS[nextIdx];
        setLevelIdx(nextIdx);
        setLevelState(prepareLevel(nextLevel));
        setPhase(nextLevel.tier !== level.tier ? 'tierIntro' : 'playing');
      }
    }, 1600);
    return () => clearTimeout(tid);
    
  }, [phase]);

  const handleTileOptionSelect = (tileIdx, option) => {
    const tileState = levelState.tiles[tileIdx];
    if (!tileState || tileState.status !== 'active') return;

    if (!option.isCorrect) {
      setTotalMistakes((m) => m + 1);
      setMistakesByTier((prev) => ({ ...prev, [level.tier]: prev[level.tier] + 1 }));
      setLevelState((prev) => ({
        ...prev,
        tiles: prev.tiles.map((t, i) => (i === tileIdx ? { ...t, wrongAttempts: t.wrongAttempts + 1 } : t)),
      }));
      setFlashTileIdx(tileIdx);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlashTileIdx(null), 450);
      return;
    }

    const wasFirstTry = tileState.wrongAttempts === 0;
    setScore((s) => s + (wasFirstTry ? 15 : 8));
    if (wasFirstTry) setCorrectFirstTry((c) => c + 1);
    setTotalActions((a) => a + 1);

    setLevelState((prev) => {
      const tiles = prev.tiles.map((t, i) => (i === tileIdx ? { ...t, status: 'filled' } : t));
      const nextLockedIdx = tiles.findIndex((t) => t.status === 'locked');
      if (nextLockedIdx !== -1) {
        tiles[nextLockedIdx] = { ...tiles[nextLockedIdx], status: 'active' };
      }
      const allFilled = tiles.every((t) => t.status === 'filled');
      return { ...prev, tiles, allFilled };
    });
  };

  const handleCombineTileTap = (tileIdx) => {
    setLevelState((prev) => {
      if (!prev.combine || prev.combine.selected.includes(tileIdx)) return prev;
      return { ...prev, combine: { ...prev.combine, selected: [...prev.combine.selected, tileIdx] } };
    });
  };

  const handleCombineOptionSelect = (option) => {
    if (!levelState.combine) return;

    if (!option.isCorrect) {
      setTotalMistakes((m) => m + 1);
      setMistakesByTier((prev) => ({ ...prev, [level.tier]: prev[level.tier] + 1 }));
      setLevelState((prev) => ({
        ...prev,
        combine: { ...prev.combine, attemptedWrong: true, wrongFlash: true },
      }));
      if (combineFlashTimeoutRef.current) clearTimeout(combineFlashTimeoutRef.current);
      combineFlashTimeoutRef.current = setTimeout(() => {
        setLevelState((prev) => ({ ...prev, combine: { ...prev.combine, wrongFlash: false } }));
      }, 450);
      return;
    }

    const wasFirstTry = !levelState.combine.attemptedWrong;
    setScore((s) => s + (wasFirstTry ? 15 : 8));
    if (wasFirstTry) setCorrectFirstTry((c) => c + 1);
    setTotalActions((a) => a + 1);

    setLevelState((prev) => ({ ...prev, combine: { ...prev.combine, resolved: true } }));
    setPhase('levelComplete');
  };

  const handleReplay = () => {
    stopClock();
    setLevelIdx(0);
    setLevelState(prepareLevel(LEVELS[0]));
    setScore(0);
    setTotalMistakes(0);
    setMistakesByTier({ easy: 0, medium: 0, hard: 0 });
    setCorrectFirstTry(0);
    setTotalActions(0);
    setElapsedTime(0);
    setSummaryData(null);
    setFlashTileIdx(null);
    setPhase('intro');
  };

  const handleSummaryContinue = () => {
    if (typeof onComplete === 'function' && summaryData) {
      onComplete(summaryData);
    }
  };

  /* --------------------------- RENDER: INTRO --------------------------- */

  if (phase === 'intro') {
    return (
      <div className="aa-game">
        <div className="aa-intro">
          <div className="aa-intro-icon" aria-hidden="true">&#127959;&#65039;</div>
          <h1 className="aa-intro-title">Algebra Architect</h1>
          <p className="aa-intro-subtitle">Build blueprints by multiplying algebraic terms, tile by tile.</p>

          <div className="aa-intro-rules">
            <div className="aa-rule">
              <span className="aa-rule-icon" aria-hidden="true">&#129513;</span>
              <span>Tap the active tile, then choose the correct product from the options.</span>
            </div>
            <div className="aa-rule">
              <span className="aa-rule-icon" aria-hidden="true">&#10060;</span>
              <span>Wrong picks don&rsquo;t cost you the level &mdash; just try again.</span>
            </div>
            <div className="aa-rule">
              <span className="aa-rule-icon" aria-hidden="true">&#128279;</span>
              <span>On hard blueprints, combine the like terms once the grid is full.</span>
            </div>
          </div>

          <div className="aa-intro-tiers">
            <div className="aa-intro-tier">
              <span className="aa-intro-tier-icon" aria-hidden="true">{TIER_META.easy.icon}</span>
              <span>Easy &middot; 3 blueprints &middot; monomial &times; monomial</span>
            </div>
            <div className="aa-intro-tier">
              <span className="aa-intro-tier-icon" aria-hidden="true">{TIER_META.medium.icon}</span>
              <span>Medium &middot; 4 blueprints &middot; distribution</span>
            </div>
            <div className="aa-intro-tier">
              <span className="aa-intro-tier-icon" aria-hidden="true">{TIER_META.hard.icon}</span>
              <span>Hard &middot; 3 blueprints &middot; binomial expansion</span>
            </div>
          </div>

          <button type="button" className="aa-btn aa-btn--primary aa-btn--large" onClick={handleStart}>
            Start Building
          </button>
          {typeof onExit === 'function' && (
            <button type="button" className="aa-btn aa-btn--ghost" onClick={onExit}>
              Back to Dashboard
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
      <div className="aa-game">
        <div className="aa-tier-intro">
          <div className="aa-tier-intro-icon" aria-hidden="true">{meta.icon}</div>
          <h2 className="aa-tier-intro-heading">{meta.heading}</h2>
          <p className="aa-tier-intro-text">{meta.instructions}</p>
        </div>
      </div>
    );
  }

  /* -------------------------- RENDER: SUMMARY --------------------------- */

  if (phase === 'summary' && summaryData) {
    return (
      <div className="aa-game">
        <div className="aa-summary">
          <div className="aa-summary-icon" aria-hidden="true">&#127959;&#65039;</div>
          <h1 className="aa-summary-title">All Blueprints Complete!</h1>

          <StarsRow stars={summaryData.stars} />

          <div className="aa-summary-grid">
            <div className="aa-summary-stat">
              <span className="aa-summary-stat-label">Score</span>
              <span className="aa-summary-stat-value">{summaryData.score}</span>
            </div>
            <div className="aa-summary-stat">
              <span className="aa-summary-stat-label">Accuracy</span>
              <span className="aa-summary-stat-value">{summaryData.accuracy}%</span>
            </div>
            <div className="aa-summary-stat">
              <span className="aa-summary-stat-label">Mistakes</span>
              <span className="aa-summary-stat-value">{summaryData.mistakes}</span>
            </div>
            <div className="aa-summary-stat">
              <span className="aa-summary-stat-label">Time</span>
              <span className="aa-summary-stat-value">{formatTime(summaryData.completionTime)}</span>
            </div>
          </div>

          <div className="aa-summary-reward">
            <span className="aa-summary-reward-icon" aria-hidden="true">&#128142;</span>
            <span>+{summaryData.rewardPoints} reward points</span>
          </div>

          {summaryData.badgeUnlocked && (
            <div className="aa-summary-badge">
              <span className="aa-summary-badge-icon" aria-hidden="true">&#127942;</span>
              <span>Badge unlocked: {summaryData.badgeUnlocked}</span>
            </div>
          )}

          <div className="aa-summary-actions">
            <button type="button" className="aa-btn aa-btn--primary" onClick={handleReplay}>
              Play Again
            </button>
            {typeof onExit === 'function' && (
              <button type="button" className="aa-btn aa-btn--ghost" onClick={handleSummaryContinue}>
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- RENDER: PLAYING / COMBINE / LEVEL-COMPLETE --------- */

  const tilesFilled = levelState.tiles.filter((t) => t.status === 'filled').length;
  const totalStepsThisLevel = level.tiles.length + (level.combine ? 1 : 0);
  const stepsDoneThisLevel = tilesFilled + (levelState.combine && levelState.combine.resolved ? 1 : 0);

  return (
    <div className="aa-game">
      <div className="aa-hud">
        <div className="aa-hud-stat">
          <span className="aa-hud-label">Score</span>
          <span className="aa-hud-value">{score}</span>
        </div>
        <div className="aa-hud-stat">
          <span className="aa-hud-label">Mistakes</span>
          <span className="aa-hud-value">{totalMistakes}</span>
        </div>
        <div className="aa-hud-stat">
          <span className="aa-hud-label">Time</span>
          <span className="aa-hud-value">{formatTime(elapsedTime)}</span>
        </div>
        {typeof onExit === 'function' && (
          <button type="button" className="aa-hud-exit" onClick={onExit} aria-label="Exit game">
            &#10005;
          </button>
        )}
      </div>

      <BuildProgress
        levelIdx={levelIdx}
        totalLevels={LEVELS.length}
        stepsDone={stepsDoneThisLevel}
        totalSteps={totalStepsThisLevel}
        tierIcon={TIER_META[level.tier].icon}
      />

      <div className="aa-tier-badge">
        <span className="aa-tier-badge-icon" aria-hidden="true">{TIER_META[level.tier].icon}</span>
        <span>{level.tierLabel}</span>
        <span className="aa-tier-badge-prompt">{level.prompt}</span>
      </div>

      {phase === 'combineSelect' && (
        <div className="aa-combine-banner">
          <span aria-hidden="true">&#128279;</span> These are like terms &mdash; tap both to combine them!
        </div>
      )}

      {(phase === 'levelComplete') && (
        <div className="aa-combine-banner aa-combine-banner--success">
          <span aria-hidden="true">&#9989;</span> Blueprint complete: {level.finalExpression}
        </div>
      )}

      {phase === 'playing' && activeTile && !optionsOpen && (
        <div className="aa-tap-hint">
          <span aria-hidden="true">&#128070;</span> Tap the glowing tile to answer
        </div>
      )}

      <BlueprintGrid
        level={level}
        levelState={levelState}
        phase={phase}
        flashTileIdx={flashTileIdx}
        onTileClick={() => setOptionsOpen(true)}
        onCombineTileClick={handleCombineTileTap}
      />

      {phase === 'playing' && activeTile && optionsOpen && (
        <OptionPanel
          options={activeTile.options}
          numCols={level.gridCols}
          colIndex={activeTile.col}
          heading={null}
          onSelect={(opt) => handleTileOptionSelect(activeTileIdx, opt)}
        />
      )}

      {phase === 'combinePanel' && levelState.combine && (
        <OptionPanel
          options={levelState.combine.options}
          numCols={level.gridCols}
          colIndex={(level.gridCols - 1) / 2}
          heading={'These are like terms \u2014 combine them!'}
          wrongFlash={levelState.combine.wrongFlash}
          onSelect={handleCombineOptionSelect}
        />
      )}
    </div>
  );
};

export default Module3Game;