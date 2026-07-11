// frontend/src/components/games/Module2Game.jsx
// Module 2 · Expression Forge · Simplification Challenge
//
// Repair flow per combine (this is the core pedagogical fix over the prior
// version): 1) select two like terms, 2) press Combine, 3) a Forge Chamber
// panel opens and the student must CREATE the new energy cell by picking the
// correct simplified result from misconception-based distractors — the cell
// is never auto-generated. Hard levels add an interactive BODMAS layer:
// decide what to process first, then distribute the bracket term-by-term,
// before the normal combine flow continues.
//
// External contract (props / onComplete payload / GameRegistry / GamePage)
// is unchanged — only this file and its stylesheet are touched.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  buildGameResult,
  calcStarsQuiz,
  calcRewardPoints,
} from '../../utils/GameMatrics';
import './Module2Game.css';

// ═══════════════════════════════════════════════════════════════════════════
//  Misconception note text — shown only when a wrong option is tapped, so
//  the student sees exactly what mistake that option represents.
// ═══════════════════════════════════════════════════════════════════════════
const NOTE = {
  multiplied: "That's what you get by multiplying the coefficients instead of adding them.",
  droppedVar: "The variable got dropped along the way — keep it attached to the answer.",
  signDrop: "That adds the numbers as if both were positive — don't forget the negative sign.",
  subtracted: 'That subtracts instead of adds.',
  addedInstead: 'That adds the multiplier and the term instead of multiplying them.',
  forgotDistribute: "This term never got multiplied through the bracket — it's still unchanged.",
  droppedSign: 'The negative sign got lost after multiplying — double-check the sign.',
  boundaryCross: 'That reaches outside the parentheses — everything inside the brackets has to be processed together, first.',
};

// ═══════════════════════════════════════════════════════════════════════════
//  Curated level bank — exactly 10 fixed levels, no random generation.
//  Levels 1-7 are plain combine levels (initialCards only). Levels 8-10 add
//  a `bracket` (multiplier + the two inner terms it multiplies), which must
//  be resolved via an interactive BODMAS + distribution flow before normal
//  combining continues. Every level teaches something the previous one
//  didn't — see each `focus` string.
// ═══════════════════════════════════════════════════════════════════════════
const LEVELS = [
  {
    id: 1,
    difficulty: 'easy',
    expression: '2x + 3x',
    result: '5x',
    focus: 'Combining two positive like terms',
    initialCards: [
      { coef: 2, variable: 'x' },
      { coef: 3, variable: 'x' },
    ],
    bracket: null,
  },
  {
    id: 2,
    difficulty: 'easy',
    expression: '4a + a',
    result: '5a',
    focus: "Implicit coefficient — 'a' alone means 1a",
    initialCards: [
      { coef: 4, variable: 'a' },
      { coef: 1, variable: 'a' },
    ],
    bracket: null,
  },
  {
    id: 3,
    difficulty: 'easy',
    expression: '9 + 6',
    result: '15',
    focus: 'Constants combine too — no variable needed',
    initialCards: [
      { coef: 9, variable: null },
      { coef: 6, variable: null },
    ],
    bracket: null,
  },
  {
    id: 4,
    difficulty: 'medium',
    expression: '5x + 6 + 2x + 8',
    result: '7x + 14',
    focus: 'Two groups — separate the variable terms from the constants',
    initialCards: [
      { coef: 5, variable: 'x' },
      { coef: 6, variable: null },
      { coef: 2, variable: 'x' },
      { coef: 8, variable: null },
    ],
    bracket: null,
  },
  {
    id: 5,
    difficulty: 'medium',
    expression: '2y + 6 + 3y + 4y',
    result: '9y + 6',
    focus: 'Three like terms in one group — chain your combines',
    initialCards: [
      { coef: 2, variable: 'y' },
      { coef: 6, variable: null },
      { coef: 3, variable: 'y' },
      { coef: 4, variable: 'y' },
    ],
    bracket: null,
  },
  {
    id: 6,
    difficulty: 'medium',
    expression: '4x + 3y + 2x + y',
    result: '6x + 4y',
    focus: 'Two variable groups — keep x and y from ever mixing',
    initialCards: [
      { coef: 4, variable: 'x' },
      { coef: 3, variable: 'y' },
      { coef: 2, variable: 'x' },
      { coef: 1, variable: 'y' },
    ],
    bracket: null,
  },
  {
    id: 7,
    difficulty: 'medium',
    expression: '10m + 5 - 3m + 2',
    result: '7m + 7',
    focus: 'Negative coefficients — the sign travels with its term',
    initialCards: [
      { coef: 10, variable: 'm' },
      { coef: 5, variable: null },
      { coef: -3, variable: 'm' },
      { coef: 2, variable: null },
    ],
    bracket: null,
  },
  {
    id: 8,
    difficulty: 'hard',
    expression: '2(3x + 4) + 5x',
    result: '11x + 8',
    focus: 'BODMAS — brackets are processed first, then distributed',
    initialCards: [{ bracket: true }, { coef: 5, variable: 'x' }],
    bracket: {
      multiplier: 2,
      innerTerms: [
        { coef: 3, variable: 'x' },
        { coef: 4, variable: null },
      ],
      label: '2(3x + 4)',
      orderOptions: [
        { label: '2 × (3x + 4)', note: '' },
        { label: '4 + 5x', note: NOTE.boundaryCross },
      ],
      orderCorrectIndex: 0,
    },
  },
  {
    id: 9,
    difficulty: 'hard',
    expression: '4(x - 3) + 5x',
    result: '9x - 12',
    focus: 'Distributing over subtraction — the sign travels through',
    initialCards: [{ bracket: true }, { coef: 5, variable: 'x' }],
    bracket: {
      multiplier: 4,
      innerTerms: [
        { coef: 1, variable: 'x' },
        { coef: -3, variable: null },
      ],
      label: '4(x - 3)',
      orderOptions: [
        { label: '-3 + 5x', note: NOTE.boundaryCross },
        { label: '4 × (x - 3)', note: '' },
      ],
      orderCorrectIndex: 1,
    },
  },
  {
    id: 10,
    difficulty: 'hard',
    expression: '2(3x + 5y) + 4x - 3y',
    result: '10x + 7y',
    focus: 'Capstone — brackets, distribution, negatives, two variable groups',
    initialCards: [{ bracket: true }, { coef: 4, variable: 'x' }, { coef: -3, variable: 'y' }],
    bracket: {
      multiplier: 2,
      innerTerms: [
        { coef: 3, variable: 'x' },
        { coef: 5, variable: 'y' },
      ],
      label: '2(3x + 5y)',
      orderOptions: [
        { label: '2 × (3x + 5y)', note: '' },
        { label: '5y + 4x', note: NOTE.boundaryCross },
      ],
      orderCorrectIndex: 0,
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════════
//  Config / scoring constants
// ═══════════════════════════════════════════════════════════════════════════
const POINTS_TERM_MATCH = 10;
const POINTS_ANSWER_CHOICE = 10;
const POINTS_ORDER_CHOICE = 10;
const POINTS_DISTRIBUTE = 10;
const WRONG_ATTEMPT_PENALTY = 5;
const LEVEL_BONUS = { easy: 10, medium: 20, hard: 30 };
const FLAWLESS_LEVEL_BONUS = 5;

const CORRECT_FLASH_MS = 500;
const WRONG_FLASH_MS = 1600;
const FORGE_DELAY_MS = 650;
const LEVEL_COMPLETE_DELAY_MS = 2200;

const DIFFICULTY_META = {
  easy: { label: 'Easy', color: '#4ade80', dot: '🟢' },
  medium: { label: 'Medium', color: '#f4a435', dot: '🟡' },
  hard: { label: 'Hard', color: '#ef4444', dot: '🔴' },
};

// ═══════════════════════════════════════════════════════════════════════════
//  Pure helpers (module scope — no React state, safe to call from anywhere)
// ═══════════════════════════════════════════════════════════════════════════

// formatTerm(5,'x')->"5x"  formatTerm(1,'a')->"a"  formatTerm(-3,'m')->"-3m"  formatTerm(-10,null)->"-10"
function formatTerm(coef, variable) {
  if (variable) {
    const abs = Math.abs(coef);
    const mag = abs === 1 ? '' : String(abs);
    return `${coef < 0 ? '-' : ''}${mag}${variable}`;
  }
  return `${coef}`;
}

function groupKeyOf(card) {
  return card.variable || 'const';
}

function hasCombinablePair(termCards) {
  return termCards.some((c1, i) =>
    termCards.some((c2, j) => i < j && groupKeyOf(c1) === groupKeyOf(c2))
  );
}

function buildCardsForLevel(levelIdx) {
  const lvl = LEVELS[levelIdx];
  return lvl.initialCards.map((c, i) => {
    if (c.bracket) {
      return { id: `L${lvl.id}-bracket`, kind: 'bracket', label: lvl.bracket.label };
    }
    return {
      id: `L${lvl.id}-c${i}`,
      kind: 'term',
      coef: c.coef,
      variable: c.variable,
      label: formatTerm(c.coef, c.variable),
    };
  });
}

function getMismatchReason(a, b) {
  if (a.variable && b.variable) {
    return `${a.label} and ${b.label} are not like terms — the variables (${a.variable} vs ${b.variable}) don't match.`;
  }
  return `${a.label} and ${b.label} are not like terms — a variable term can't combine with a plain number.`;
}

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// Places the correct label at `slot` (mod option count) and fills the rest
// with the given distractors, in order. Deterministic — no randomness.
function arrangeOptions(correctLabel, distractors, slot) {
  const n = distractors.length + 1;
  const correctSlot = ((slot % n) + n) % n;
  const opts = new Array(n);
  opts[correctSlot] = { label: correctLabel, note: '' };
  let di = 0;
  for (let i = 0; i < n; i += 1) {
    if (i === correctSlot) continue;
    opts[i] = distractors[di];
    di += 1;
  }
  return { options: opts, correctIndex: correctSlot };
}

// Builds the 3-option "combine two like terms" MCQ using misconception-based
// distractors (never generic ±1): multiplying instead of adding, ignoring a
// negative sign, dropping the variable, or subtracting instead of adding.
function buildCombineOptions(coefA, coefB, variable, slot) {
  const correctVal = coefA + coefB;
  const correctLabel = formatTerm(correctVal, variable);
  let distractors;

  if (variable) {
    const sameSign = (coefA >= 0) === (coefB >= 0);
    if (sameSign) {
      const productVal = coefA * coefB;
      distractors = [
        { label: formatTerm(productVal, variable), note: NOTE.multiplied },
        { label: `${correctVal}`, note: NOTE.droppedVar },
      ];
    } else {
      const signDropVal = Math.abs(coefA) + Math.abs(coefB);
      distractors = [
        { label: formatTerm(signDropVal, variable), note: NOTE.signDrop },
        { label: `${correctVal}`, note: NOTE.droppedVar },
      ];
    }
  } else {
    const productVal = coefA * coefB;
    const subtractedVal = coefA - coefB;
    distractors = [
      { label: `${productVal}`, note: NOTE.multiplied },
      { label: `${subtractedVal}`, note: NOTE.subtracted },
    ];
  }

  return arrangeOptions(correctLabel, distractors, slot);
}

// Builds the 3-option "distribute the multiplier" MCQ.
function buildDistributeOptions(multiplier, coef, variable, slot) {
  const correctVal = multiplier * coef;
  const correctLabel = formatTerm(correctVal, variable);
  const addedVal = multiplier + coef;
  const addedLabel = formatTerm(addedVal, variable);

  let secondDistractor;
  if (coef < 0) {
    const droppedSignVal = multiplier * Math.abs(coef);
    secondDistractor = { label: formatTerm(droppedSignVal, variable), note: NOTE.droppedSign };
  } else {
    secondDistractor = { label: formatTerm(coef, variable), note: NOTE.forgotDistribute };
  }

  const distractors = [
    { label: addedLabel, note: NOTE.addedInstead },
    secondDistractor,
  ];

  return arrangeOptions(correctLabel, distractors, slot);
}

function pickSlot(seedRef, n) {
  const s = seedRef.current % n;
  seedRef.current += 1;
  return s;
}

function buildOrderMcq(level) {
  return {
    kind: 'order',
    heading: 'What should be processed first? (BODMAS)',
    options: level.bracket.orderOptions,
    correctIndex: level.bracket.orderCorrectIndex,
    meta: {},
  };
}

function buildDistributeMcq(level, idx, seedRef) {
  const inner = level.bracket.innerTerms[idx];
  const slot = pickSlot(seedRef, 3);
  const { options, correctIndex } = buildDistributeOptions(
    level.bracket.multiplier,
    inner.coef,
    inner.variable,
    slot
  );
  const innerLabel = formatTerm(inner.coef, inner.variable);
  return {
    kind: 'distribute',
    heading: `Distribute: ${level.bracket.multiplier} × ${innerLabel} = ?`,
    options,
    correctIndex,
    meta: { distributeIndex: idx },
  };
}

// The final groups a level reduces to (used only for the checklist display).
// Groups with just one member never need combining and are left off the list.
function computeFinalGroups(level) {
  const allTerms = [];
  level.initialCards.forEach((c) => {
    if (c.bracket) {
      level.bracket.innerTerms.forEach((t) =>
        allTerms.push({ coef: level.bracket.multiplier * t.coef, variable: t.variable })
      );
    } else {
      allTerms.push(c);
    }
  });
  const groups = {};
  const order = [];
  allTerms.forEach((t) => {
    const key = t.variable || 'const';
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(t);
  });
  return order
    .filter((key) => groups[key].length >= 2)
    .map((key) => {
      const terms = groups[key];
      const variable = terms[0].variable;
      const label =
        terms.length === 2
          ? `${formatTerm(terms[0].coef, variable)} + ${formatTerm(terms[1].coef, variable)}`
          : `Combine the ${variable ? `${variable}-terms` : 'constants'} (${terms.length} cells)`;
      return { key, label };
    });
}

function buildStepsForLevel(level) {
  const steps = [];
  if (level.bracket) {
    steps.push({ key: 'order', kind: 'order', label: 'BODMAS — process the brackets first' });
    level.bracket.innerTerms.forEach((t, i) => {
      steps.push({
        key: `distribute-${i}`,
        kind: 'distribute',
        label: `Distribute ${level.bracket.multiplier} × ${formatTerm(t.coef, t.variable)}`,
      });
    });
  }
  computeFinalGroups(level).forEach((g) => steps.push({ key: g.key, kind: 'group', label: g.label }));
  return steps;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════════════════════════
const Module2Game = ({ moduleId, userId, onComplete, onExit }) => {
  // phase: 'intro' | 'playing' | 'levelComplete' | 'summary'
  const [phase, setPhase] = useState('intro');
  const [levelIndex, setLevelIndex] = useState(0);
  const [cards, setCards] = useState(() => buildCardsForLevel(0));

  // stage: 'selectTerms' | 'chooseAnswer' | 'order' | 'distribute' | 'forging'
  const [stage, setStage] = useState('selectTerms');
  const [currentMcq, setCurrentMcq] = useState(null);

  const [selected, setSelected] = useState([]);
  const [shakeIds, setShakeIds] = useState([]);
  const [forgingIds, setForgingIds] = useState([]);
  const [feedback, setFeedback] = useState(null); // term-pair mismatch only
  const [wrongOptionIndex, setWrongOptionIndex] = useState(null);
  const [wrongNote, setWrongNote] = useState('');
  const [correctOptionIndex, setCorrectOptionIndex] = useState(null);
  const [completedSteps, setCompletedSteps] = useState(() => new Set());
  const [powerPulse, setPowerPulse] = useState(false);

  const [levelCompleteInfo, setLevelCompleteInfo] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const metricsRef = useRef({
    score: 0,
    correctDecisions: 0,
    mistakes: 0,
    mistakesThisLevel: 0,
    mistakesByDiff: { easy: 0, medium: 0, hard: 0 },
    levelsCompleted: 0,
  });
  const sessionStartRef = useRef(Date.now());
  const levelCompleteHandledRef = useRef(false);
  const questionSeedRef = useRef(0);

  const level = LEVELS[levelIndex];

  // ── Live elapsed-time clock (stopwatch, no time pressure) ────────────────
  useEffect(() => {
    if (phase === 'intro' || phase === 'summary') return undefined;
    const iv = setInterval(() => {
      setElapsed(Math.round((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  // ── Finish game — builds the standardised result and hands off ──────────
  const handleFinish = useCallback(() => {
    const { score, correctDecisions, mistakes, mistakesByDiff, levelsCompleted } = metricsRef.current;
    const completionTime = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const totalAttempts = correctDecisions + mistakes;
    const accuracy = totalAttempts > 0 ? (correctDecisions / totalAttempts) * 100 : 100;
    const stars = calcStarsQuiz(correctDecisions, totalAttempts || 1);
    const rewardPoints = calcRewardPoints(stars, 30);
    const badgeUnlocked = stars === 3 ? 'Expression Forge Master' : null;

    const result = buildGameResult({
      moduleId,
      gameId: 'module-2-game',
      score,
      accuracy,
      mistakes,
      completionTime,
      stars,
      rewardPoints,
      badgeUnlocked,
      extraData: {
        correctDecisions,
        totalAttempts,
        levelsCompleted,
        mistakesByDifficulty: mistakesByDiff,
      },
    });

    setSummaryData(result);
    setPhase('summary');
    // Summary screen never auto-advances; onComplete only fires when the
    // student explicitly continues (see handleSummaryContinue below).
  }, [moduleId]);

  // ── Fires only when the student clicks through from the summary screen ───
  const handleSummaryContinue = useCallback(() => {
    if (typeof onComplete === 'function' && summaryData) {
      onComplete(summaryData);
    }
  }, [onComplete, summaryData]);

  // ── Move to the next level (or finish on level 10) ───────────────────────
  const advanceLevel = useCallback(() => {
    const nextIndex = levelIndex + 1;
    if (nextIndex >= LEVELS.length) {
      handleFinish();
      return;
    }
    const nextLevel = LEVELS[nextIndex];

    levelCompleteHandledRef.current = false;
    metricsRef.current.mistakesThisLevel = 0;

    setLevelIndex(nextIndex);
    setCards(buildCardsForLevel(nextIndex));
    setSelected([]);
    setShakeIds([]);
    setForgingIds([]);
    setFeedback(null);
    setCompletedSteps(new Set());
    setLevelCompleteInfo(null);
    setWrongOptionIndex(null);
    setWrongNote('');
    setCorrectOptionIndex(null);

    if (nextLevel.bracket) {
      setStage('order');
      setCurrentMcq(buildOrderMcq(nextLevel));
    } else {
      setStage('selectTerms');
      setCurrentMcq(null);
    }
    setPhase('playing');
  }, [levelIndex, handleFinish]);

  // ── Enter the "level complete" screen and award bonus points ─────────────
  const goToLevelComplete = useCallback(() => {
    if (stage === 'forging') return; // safety guard, shouldn't fire mid-animation
    const flawless = metricsRef.current.mistakesThisLevel === 0;
    const bonus = LEVEL_BONUS[level.difficulty] + (flawless ? FLAWLESS_LEVEL_BONUS : 0);
    metricsRef.current.score += bonus;
    metricsRef.current.levelsCompleted += 1;
    setDisplayScore(metricsRef.current.score);
    setLevelCompleteInfo({
      bonus,
      flawless,
      expression: level.expression,
      result: level.result,
    });
    setPhase('levelComplete');
  }, [stage, level]);

  // ── Watch the board: once no two term-cards can combine, the level is solved ─
  useEffect(() => {
    if (phase !== 'playing' || stage !== 'selectTerms') return undefined;
    if (levelCompleteHandledRef.current) return undefined;
    const termCards = cards.filter((c) => c.kind === 'term');
    if (termCards.length > 0 && !hasCombinablePair(termCards)) {
      levelCompleteHandledRef.current = true;
      const t = setTimeout(() => goToLevelComplete(), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [cards, stage, phase, goToLevelComplete]);

  // ── Auto-advance after the level-complete screen (Continue button also works) ─
  useEffect(() => {
    if (phase !== 'levelComplete') return undefined;
    const t = setTimeout(() => advanceLevel(), LEVEL_COMPLETE_DELAY_MS);
    return () => clearTimeout(t);
  }, [phase, advanceLevel]);

  // ── Auto-clear term-pair mismatch feedback ────────────────────────────────
  useEffect(() => {
    if (!feedback) return undefined;
    const t = setTimeout(() => {
      setFeedback(null);
      setSelected([]);
      setShakeIds([]);
    }, WRONG_FLASH_MS);
    return () => clearTimeout(t);
  }, [feedback]);

  // ── Auto-clear wrong-option flash on the Forge Chamber / BODMAS panels ───
  useEffect(() => {
    if (wrongOptionIndex === null) return undefined;
    const t = setTimeout(() => {
      setWrongOptionIndex(null);
      setWrongNote('');
    }, WRONG_FLASH_MS);
    return () => clearTimeout(t);
  }, [wrongOptionIndex]);

  // ── Card selection (click/tap only, select-terms stage only) ─────────────
  const handleCardClick = useCallback(
    (id) => {
      if (stage !== 'selectTerms') return;
      if (feedback && feedback.type === 'wrong') return;
      setSelected((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 2) return prev;
        return [...prev, id];
      });
    },
    [stage, feedback]
  );

  // ── Step 1: confirm the two selected cards are like terms, open the Forge Chamber ─
  const handleCombine = useCallback(() => {
    if (stage !== 'selectTerms' || selected.length !== 2) return;
    const [idA, idB] = selected;
    const cardA = cards.find((c) => c.id === idA);
    const cardB = cards.find((c) => c.id === idB);
    if (!cardA || !cardB) return;

    if (groupKeyOf(cardA) === groupKeyOf(cardB)) {
      metricsRef.current.score += POINTS_TERM_MATCH;
      metricsRef.current.correctDecisions += 1;
      setDisplayScore(metricsRef.current.score);

      const resultCoef = cardA.coef + cardB.coef;
      const resultVariable = cardA.variable;
      const slot = pickSlot(questionSeedRef, 3);
      const { options, correctIndex } = buildCombineOptions(cardA.coef, cardB.coef, cardA.variable, slot);

      setCurrentMcq({
        kind: 'answer',
        heading: `${cardA.label} + ${cardB.label} = ?`,
        options,
        correctIndex,
        meta: { idA, idB, groupKey: groupKeyOf(cardA), resultCoef, resultVariable },
      });
      setStage('chooseAnswer');
    } else {
      metricsRef.current.mistakes += 1;
      metricsRef.current.mistakesThisLevel += 1;
      metricsRef.current.mistakesByDiff[level.difficulty] += 1;
      metricsRef.current.score = Math.max(0, metricsRef.current.score - WRONG_ATTEMPT_PENALTY);
      setDisplayScore(metricsRef.current.score);
      setFeedback({ type: 'wrong', message: getMismatchReason(cardA, cardB) });
      setShakeIds([idA, idB]);
    }
  }, [stage, selected, cards, level]);

  // ── Step 2 (and the BODMAS order/distribute steps): resolve an MCQ pick ──
  const handleMcqPick = useCallback(
    (idx) => {
      if (!currentMcq) return;
      if (correctOptionIndex !== null || wrongOptionIndex !== null) return; // debounce mid-transition

      if (idx !== currentMcq.correctIndex) {
        metricsRef.current.mistakes += 1;
        metricsRef.current.mistakesThisLevel += 1;
        metricsRef.current.mistakesByDiff[level.difficulty] += 1;
        metricsRef.current.score = Math.max(0, metricsRef.current.score - WRONG_ATTEMPT_PENALTY);
        setDisplayScore(metricsRef.current.score);
        setWrongOptionIndex(idx);
        setWrongNote(currentMcq.options[idx].note || '');
        return;
      }

      const points =
        currentMcq.kind === 'order'
          ? POINTS_ORDER_CHOICE
          : currentMcq.kind === 'distribute'
          ? POINTS_DISTRIBUTE
          : POINTS_ANSWER_CHOICE;
      metricsRef.current.score += points;
      metricsRef.current.correctDecisions += 1;
      setDisplayScore(metricsRef.current.score);
      setCorrectOptionIndex(idx);

      const resolvedMcq = currentMcq;

      setTimeout(() => {
        setCorrectOptionIndex(null);

        if (resolvedMcq.kind === 'order') {
          setCompletedSteps((prev) => new Set(prev).add('order'));
          setCurrentMcq(buildDistributeMcq(level, 0, questionSeedRef));
          setStage('distribute');
          return;
        }

        if (resolvedMcq.kind === 'distribute') {
          const di = resolvedMcq.meta.distributeIndex;
          setCompletedSteps((prev) => new Set(prev).add(`distribute-${di}`));

          if (di === 0) {
            setCurrentMcq(buildDistributeMcq(level, 1, questionSeedRef));
            setStage('distribute');
            return;
          }

          // Both distribute answers solved — forge the two new energy cells.
          const [inner0, inner1] = level.bracket.innerTerms;
          const dCoef0 = level.bracket.multiplier * inner0.coef;
          const dCoef1 = level.bracket.multiplier * inner1.coef;
          const term0 = {
            id: `L${level.id}-d0`,
            kind: 'term',
            coef: dCoef0,
            variable: inner0.variable,
            label: formatTerm(dCoef0, inner0.variable),
          };
          const term1 = {
            id: `L${level.id}-d1`,
            kind: 'term',
            coef: dCoef1,
            variable: inner1.variable,
            label: formatTerm(dCoef1, inner1.variable),
          };
          setCards((prevCards) => {
            const bracketCard = prevCards.find((c) => c.kind === 'bracket');
            setForgingIds(bracketCard ? [bracketCard.id] : []);
            return prevCards;
          });
          setCurrentMcq(null);
          setStage('forging');

          setTimeout(() => {
            setCards((prevCards) => {
              const bIdx = prevCards.findIndex((c) => c.kind === 'bracket');
              const next = [...prevCards];
              if (bIdx !== -1) next.splice(bIdx, 1, term0, term1);
              // Keep variable terms before constants on-screen regardless of
              // where the bracket sat in the original written expression.
              next.sort((a, b) => (a.variable ? 0 : 1) - (b.variable ? 0 : 1));
              return next;
            });
            setForgingIds([]);
            setStage('selectTerms');
            setPowerPulse(true);
            setTimeout(() => setPowerPulse(false), 900);
          }, FORGE_DELAY_MS);
          return;
        }

        // kind === 'answer'
        const { idA, idB, resultCoef, resultVariable } = resolvedMcq.meta;
        setForgingIds([idA, idB]);
        setCurrentMcq(null);
        setStage('forging');

        setTimeout(() => {
          setCards((prevCards) => {
            const idxA = prevCards.findIndex((c) => c.id === idA);
            const idxB = prevCards.findIndex((c) => c.id === idB);
            if (idxA === -1 || idxB === -1) return prevCards;
            const insertPos = Math.min(idxA, idxB);
            const filtered = prevCards.filter((c) => c.id !== idA && c.id !== idB);
            const newCard = {
              id: `merged-${level.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              kind: 'term',
              coef: resultCoef,
              variable: resultVariable,
              label: formatTerm(resultCoef, resultVariable),
            };
            const next = [...filtered];
            next.splice(insertPos, 0, newCard);
            return next;
          });
          setSelected([]);
          setForgingIds([]);
          setStage('selectTerms');
          setPowerPulse(true);
          setTimeout(() => setPowerPulse(false), 900);
        }, FORGE_DELAY_MS);
      }, CORRECT_FLASH_MS);
    },
    [currentMcq, correctOptionIndex, wrongOptionIndex, level]
  );

  // ── Replay from scratch ────────────────────────────────────────────────────
  const handleReplay = useCallback(() => {
    metricsRef.current = {
      score: 0,
      correctDecisions: 0,
      mistakes: 0,
      mistakesThisLevel: 0,
      mistakesByDiff: { easy: 0, medium: 0, hard: 0 },
      levelsCompleted: 0,
    };
    questionSeedRef.current = 0;
    levelCompleteHandledRef.current = false;
    sessionStartRef.current = Date.now();

    setLevelIndex(0);
    setCards(buildCardsForLevel(0));
    setSelected([]);
    setShakeIds([]);
    setForgingIds([]);
    setFeedback(null);
    setCompletedSteps(new Set());
    setLevelCompleteInfo(null);
    setWrongOptionIndex(null);
    setWrongNote('');
    setCorrectOptionIndex(null);

    const lvl0 = LEVELS[0];
    if (lvl0.bracket) {
      setStage('order');
      setCurrentMcq(buildOrderMcq(lvl0));
    } else {
      setStage('selectTerms');
      setCurrentMcq(null);
    }

    setSummaryData(null);
    setDisplayScore(0);
    setElapsed(0);
    setPhase('playing');
  }, []);

  const startGame = useCallback(() => {
    sessionStartRef.current = Date.now();
    setPhase('playing');
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER: INTRO
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="ef-root" role="main">
        <div className="ef-intro-card">
          <div className="ef-intro-banner">
            <span className="ef-forge-icon" aria-hidden="true">⚒️</span>
            <span className="ef-module-pill">Module 2 · Algebra</span>
          </div>
          <h1 className="ef-intro-title">
            <span className="ef-title-line1">Expression Forge</span>
            <span className="ef-title-line2">Simplification Challenge</span>
          </h1>
          <p className="ef-intro-subtitle">
            Repair the machine cell by cell — select, then prove you can simplify.
          </p>
          <div className="ef-rules-board" role="list" aria-label="Game rules">
            <div className="ef-rule-item" role="listitem">
              <span className="ef-rule-icon" aria-hidden="true">👆</span>
              <span className="ef-rule-text">Tap two matching energy cells, then hit ⚙️ Combine</span>
            </div>
            <div className="ef-rule-item" role="listitem">
              <span className="ef-rule-icon" aria-hidden="true">🔥</span>
              <span className="ef-rule-text">In the Forge Chamber, choose the correct simplified result yourself</span>
            </div>
            <div className="ef-rule-item" role="listitem">
              <span className="ef-rule-icon" aria-hidden="true">🧠</span>
              <span className="ef-rule-text">Wrong pick? You'll see exactly why — then try again</span>
            </div>
            <div className="ef-rule-item" role="listitem">
              <span className="ef-rule-icon" aria-hidden="true">🧭</span>
              <span className="ef-rule-text">Hard levels add brackets — BODMAS decides what's processed first</span>
            </div>
          </div>
          <div className="ef-difficulty-spread" aria-label="Level difficulty split">
            <div className="ef-diff-chip ef-diff-chip--easy"><span>🟢</span><span>3 Easy</span></div>
            <div className="ef-diff-chip ef-diff-chip--medium"><span>🟡</span><span>4 Medium</span></div>
            <div className="ef-diff-chip ef-diff-chip--hard"><span>🔴</span><span>3 Hard</span></div>
          </div>
          <button className="ef-start-btn" onClick={startGame} aria-label="Start Expression Forge">
            ⚒️ Start Forging
          </button>
          {typeof onExit === 'function' && (
            <button type="button" className="ef-intro-exit-btn" onClick={onExit}>
              Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER: PLAYING
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'playing') {
    const diffMeta = DIFFICULTY_META[level.difficulty];
    const progressPct = Math.round((levelIndex / LEVELS.length) * 100);
    const canCombine = selected.length === 2;
    const steps = buildStepsForLevel(level);
    const bracketPending = Boolean(level.bracket) && (stage === 'order' || stage === 'distribute');
    const showMcqPanel = stage === 'order' || stage === 'distribute' || stage === 'chooseAnswer';
    const isForging = stage === 'forging';
    const lockedIds =
      currentMcq && currentMcq.kind === 'answer' ? [currentMcq.meta.idA, currentMcq.meta.idB] : [];

    return (
      <div className="ef-root" role="main">
        {/* ── Progress bar + level dots ── */}
        <div className="ef-progress-wrap" aria-label={`Forge power ${progressPct}%`}>
          <div className="ef-progress-head">
            <span className="ef-progress-label">⚡ Machine Power</span>
            <span className="ef-progress-pct">{progressPct}%</span>
          </div>
          <div className="ef-progress-track">
            <div
              className={`ef-progress-fill ${powerPulse ? 'ef-progress-fill--pulse' : ''}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="ef-level-dots" role="list" aria-label="Level progress">
            {LEVELS.map((lvl, i) => (
              <span
                key={lvl.id}
                role="listitem"
                className={[
                  'ef-level-dot',
                  i < levelIndex ? 'ef-level-dot--done' : '',
                  i === levelIndex ? 'ef-level-dot--current' : '',
                ].join(' ')}
                aria-label={`Level ${i + 1}${i < levelIndex ? ' complete' : i === levelIndex ? ' in progress' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* ── Stats HUD ── */}
        <div className="ef-hud" role="list" aria-label="Session stats">
          <div className="ef-hud-item" role="listitem">
            <span className="ef-hud-icon" aria-hidden="true">⚡</span>
            <span className="ef-hud-val">{displayScore}</span>
            <span className="ef-hud-lbl">Score</span>
          </div>
          <div className="ef-hud-item" role="listitem">
            <span className="ef-hud-icon" aria-hidden="true">❌</span>
            <span className="ef-hud-val">{metricsRef.current.mistakes}</span>
            <span className="ef-hud-lbl">Mistakes</span>
          </div>
          <div className="ef-hud-item" role="listitem">
            <span className="ef-hud-icon" aria-hidden="true">⏱</span>
            <span className="ef-hud-val">{formatClock(elapsed)}</span>
            <span className="ef-hud-lbl">Time</span>
          </div>
          {typeof onExit === 'function' && (
            <button type="button" className="ef-hud-exit" onClick={onExit} aria-label="Exit game">
              ✕
            </button>
          )}
        </div>

        {/* ── Level card ── */}
        <div className="ef-level-card">
          <div className="ef-level-meta">
            <span className="ef-level-tag">Level {levelIndex + 1} of {LEVELS.length}</span>
            <span
              className="ef-difficulty-badge"
              style={{ color: diffMeta.color, borderColor: `${diffMeta.color}55` }}
            >
              {diffMeta.dot} {diffMeta.label}
            </span>
          </div>

          <div className="ef-level-focus">🎯 {level.focus}</div>

          <div className="ef-expression-block">
            <span className="ef-expression-label">Broken Expression</span>
            <div className="ef-expression" aria-label={`Simplify the expression: ${level.expression}`}>
              {level.expression}
            </div>
          </div>

          {/* ── Steps checklist ── */}
          <div className="ef-steps" role="list" aria-label="Simplification steps">
            {steps.map((step) => {
              let done;
              if (step.kind === 'group') {
                done =
                  !bracketPending &&
                  cards.filter((c) => c.kind === 'term' && groupKeyOf(c) === step.key).length <= 1;
              } else {
                done = completedSteps.has(step.key);
              }
              return (
                <div key={step.key} className={`ef-step ${done ? 'ef-step--done' : ''}`} role="listitem">
                  <span className="ef-step-check" aria-hidden="true">{done ? '✓' : '○'}</span>
                  <span className="ef-step-text">{step.label}</span>
                </div>
              );
            })}
          </div>

          {/* ── Energy cells / term cards ── */}
          <div className="ef-cards-row" role="group" aria-label="Energy cells">
            {cards.map((card) => {
              const isBracket = card.kind === 'bracket';
              const isSelected = selected.includes(card.id);
              const isShaking = shakeIds.includes(card.id);
              const isForgingOut = forgingIds.includes(card.id);
              const isLocked = lockedIds.includes(card.id);
              const interactive = stage === 'selectTerms' && !isBracket;
              const isVar = !isBracket && Boolean(card.variable);
              const isNeg = !isBracket && card.coef < 0;
              return (
                <button
                  key={card.id}
                  type="button"
                  className={[
                    'ef-card',
                    isBracket ? 'ef-card--bracket' : isVar ? 'ef-card--var' : 'ef-card--const',
                    isNeg ? 'ef-card--neg' : '',
                    isSelected ? 'ef-card--selected' : '',
                    isLocked ? 'ef-card--locked' : '',
                    isShaking ? 'ef-card--shake' : '',
                    isForgingOut ? 'ef-card--forging' : '',
                  ].join(' ')}
                  onClick={interactive ? () => handleCardClick(card.id) : undefined}
                  disabled={!interactive}
                  aria-pressed={isSelected}
                  aria-label={`${isBracket ? 'Bracket group' : 'Term'} ${card.label}${isSelected ? ', selected' : ''}`}
                >
                  {card.label}
                </button>
              );
            })}
          </div>

          {/* ── Forging animation ── */}
          {isForging && (
            <div className="ef-forge-banner" aria-live="polite">
              <span className="ef-forge-spinner" aria-hidden="true">⚒️</span>
              <span>Forging new energy cell…</span>
            </div>
          )}

          {/* ── Select-terms mode: feedback strip + Combine button ── */}
          {stage === 'selectTerms' && (
            <>
              <div className="ef-feedback-slot" aria-live="assertive">
                {feedback && (
                  <div className="ef-feedback-strip ef-feedback-strip--err">{feedback.message}</div>
                )}
              </div>
              <button
                className="ef-combine-btn"
                onClick={handleCombine}
                disabled={!canCombine}
                aria-label="Combine the two selected terms"
              >
                ⚙️ Combine
              </button>
            </>
          )}

          {/* ── Forge Chamber / BODMAS Check MCQ panel ── */}
          {showMcqPanel && currentMcq && (
            <div className="ef-mcq" aria-live="assertive">
              {currentMcq.kind === 'order' && <div className="ef-mcq-tag ef-mcq-tag--bodmas">🧭 BODMAS Check</div>}
              {(currentMcq.kind === 'distribute' || currentMcq.kind === 'answer') && (
                <div className="ef-mcq-tag ef-mcq-tag--chamber">🔥 Forge Chamber</div>
              )}
              <div className="ef-mcq-heading">{currentMcq.heading}</div>
              <div className="ef-mcq-options">
                {currentMcq.options.map((opt, idx) => {
                  const isWrong = wrongOptionIndex === idx;
                  const isRight = correctOptionIndex === idx;
                  return (
                    <button
                      key={`${currentMcq.kind}-${idx}-${opt.label}`}
                      type="button"
                      className={[
                        'ef-mcq-option',
                        isWrong ? 'ef-mcq-option--wrong' : '',
                        isRight ? 'ef-mcq-option--correct' : '',
                      ].join(' ')}
                      onClick={() => handleMcqPick(idx)}
                      disabled={correctOptionIndex !== null}
                      aria-label={`Answer option: ${opt.label}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <div className="ef-mcq-note">{wrongNote}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER: LEVEL COMPLETE
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'levelComplete' && levelCompleteInfo) {
    const isLastLevel = levelIndex + 1 >= LEVELS.length;
    return (
      <div className="ef-root" role="main">
        <div className="ef-levelcomplete-card">
          <span className="ef-lc-icon" aria-hidden="true">✨</span>
          <h2 className="ef-lc-title">Level {levelIndex + 1} Complete!</h2>
          <div className="ef-lc-equation">
            <span className="ef-lc-from">{levelCompleteInfo.expression}</span>
            <span className="ef-lc-arrow" aria-hidden="true">→</span>
            <span className="ef-lc-to">{levelCompleteInfo.result}</span>
          </div>
          <div className="ef-lc-bonus">
            <span>+{levelCompleteInfo.bonus} pts</span>
            {levelCompleteInfo.flawless && <span className="ef-lc-flawless">🌟 Flawless bonus!</span>}
          </div>
          <button className="ef-continue-btn" onClick={advanceLevel} aria-label="Continue to next level">
            {isLastLevel ? 'See Results →' : 'Continue →'}
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER: SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'summary' && summaryData) {
    const { score, accuracy, stars, rewardPoints, badgeUnlocked, completionTime, extraData } = summaryData;
    const mistakesByDifficulty = extraData?.mistakesByDifficulty || { easy: 0, medium: 0, hard: 0 };
    const levelsCompleted = extraData?.levelsCompleted ?? LEVELS.length;
    const headline =
      stars === 3 ? '🏆 Forge Master!' : stars === 2 ? '⚡ Well Forged!' : '🔧 Keep Practising!';

    return (
      <div className="ef-root" role="main">
        <div className="ef-summary-card" role="region" aria-label="Game summary">
          <div className="ef-summary-header">
            <span className="ef-module-pill">Module 2 Complete</span>
            <h1 className="ef-summary-headline">{headline}</h1>
            <div className="ef-stars-row" aria-label={`${stars} out of 3 stars earned`}>
              {[1, 2, 3].map((s) => (
                <span
                  key={s}
                  className={`ef-star ${s <= stars ? 'ef-star--lit' : 'ef-star--dim'}`}
                  aria-hidden="true"
                  style={{ animationDelay: `${(s - 1) * 0.15}s` }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="ef-stats-grid" role="list" aria-label="Your statistics">
            {[
              { icon: '⚡', val: score, lbl: 'Score', accent: '#f4a435' },
              { icon: '🎯', val: `${accuracy}%`, lbl: 'Accuracy', accent: '#34d399' },
              { icon: '🧩', val: `${levelsCompleted}/${LEVELS.length}`, lbl: 'Levels', accent: '#4fd1ff' },
              { icon: '⏱', val: formatClock(completionTime), lbl: 'Time', accent: '#60a5fa' },
            ].map(({ icon, val, lbl, accent }) => (
              <div key={lbl} className="ef-sstat" role="listitem" style={{ '--accent': accent }}>
                <span className="ef-sstat-icon" aria-hidden="true">{icon}</span>
                <span className="ef-sstat-val">{val}</span>
                <span className="ef-sstat-lbl">{lbl}</span>
              </div>
            ))}
          </div>

          <div className="ef-rp-banner" aria-label={`${rewardPoints} reward points earned`}>
            <span className="ef-rp-label">Reward Points Earned</span>
            <span className="ef-rp-val">+{rewardPoints} RP</span>
          </div>

          {badgeUnlocked && (
            <div className="ef-badge-row" role="region" aria-label="Badge unlocked">
              <div className="ef-badge-icon-wrap">
                <span className="ef-badge-emoji" aria-hidden="true">🏆</span>
              </div>
              <div className="ef-badge-text">
                <span className="ef-badge-acquired">Badge Unlocked!</span>
                <span className="ef-badge-name">{badgeUnlocked}</span>
              </div>
            </div>
          )}

          <div className="ef-breakdown-section" role="region" aria-label="Performance by difficulty">
            <h2 className="ef-breakdown-title">Mistakes by Difficulty</h2>
            {['easy', 'medium', 'hard'].map((diff) => {
              const m = mistakesByDifficulty[diff] || 0;
              const meta = DIFFICULTY_META[diff];
              return (
                <div key={diff} className="ef-breakdown-row">
                  <span className="ef-bd-label">{meta.dot} {meta.label}</span>
                  <div className="ef-bd-bar-track">
                    <div
                      className="ef-bd-bar-fill"
                      style={{
                        width: m === 0 ? '100%' : `${Math.max(10, 100 - m * 25)}%`,
                        background: m === 0 ? '#34d399' : m <= 1 ? '#f4a435' : '#ef4444',
                      }}
                    />
                  </div>
                  <span className="ef-bd-mistakes">{m === 0 ? '✓ Perfect' : `${m} mistake${m !== 1 ? 's' : ''}`}</span>
                </div>
              );
            })}
          </div>

          <div className="ef-summary-actions">
            <button className="ef-replay-btn" onClick={handleReplay} aria-label="Play again">
              🔄 Play Again
            </button>
            <button className="ef-dash-btn" onClick={handleSummaryContinue} aria-label="Save result and return to dashboard">
              🏠 Dashboard
            </button>
          </div>
          <p className="ef-save-note" aria-hidden="true">Progress saved · Performance logged for revision</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Module2Game;