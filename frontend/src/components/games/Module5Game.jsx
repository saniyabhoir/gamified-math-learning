import React, { useState, useEffect, useRef } from 'react';
import { calcStarsQuiz, calcRewardPoints, buildGameResult } from '../../utils/GameMatrics';
import './Module5Game.css';

/* =====================================================================
   ALGEBRA SUMMIT — Module 5
   The capstone "Live Expression Workbench": unlike Modules 1-4, the full
   messy expression is rendered live and the student must find where an
   operation is legal, choose the right technique (distribute / combine /
   factor), execute it via the same sub-interactions earlier modules
   already taught, and declare the climb finished themselves.

   10 curated, fixed camps (no random generation):
     Camps 1-3  : Easy   - one bracket, one combine, single variable
     Camps 4-7  : Medium - two brackets (one subtracted), 4x + 1 combine,
                  one camp introduces a second variable
     Camps 8-10 : Hard   - nested brackets / negative coefficients /
                  two variables; camps 8 & 9 end in required factoring
                  (chained GCF + trinomial, tying back to Module 4),
                  camp 10 is a pure-simplification nested-bracket finale
   ===================================================================== */

/* ---------------------------------------------------------------------
   Micro-copy — specific, named reasons, never a bare "wrong"
   --------------------------------------------------------------------- */
const MSG_BRACKET_FIRST = "There's nothing to combine with yet \u2014 try opening the bracket first.";
const MSG_INNER_FIRST = "There's more inside \u2014 resolve the inner bracket before you can open this one.";
const MSG_NOT_YET_DONE_BRACKET = "Not yet \u2014 there's still a bracket to open.";
const MSG_NOT_YET_DONE_COMBINE = "There are still like terms to combine here.";
const MSG_NOT_YET_DONE_FACTOR = "This can still be factored further \u2014 give it a try.";
const MSG_ALREADY_SIMPLE = "That's already fully simplified \u2014 no further factoring needed here.";
const MSG_TILE_WRONG = "Not quite \u2014 check the sign and the exponent.";
const MSG_COMBINE_WRONG = "Not quite \u2014 check how the signs combine.";
const MSG_INVALID_FACTOR = "doesn't split evenly";
const MSG_NON_MAXIMAL = 'this works \u2014 can you go bigger?';
const MSG_SIGN_ERROR = 'Size is right \u2014 check your signs';
const MSG_MULTIPLY_CONFUSION = 'these two need to multiply to the constant, and add to the middle term';
const MSG_GENERIC_MISMATCH = 'Not quite \u2014 check the highlighted part';

/* ---------------------------------------------------------------------
   Formatting helpers (supports up to two variables: x and y)
   --------------------------------------------------------------------- */
const fmtVarPart = (exp, letter) => {
  if (exp === 0) return '';
  if (exp === 1) return letter;
  return `${letter}\u00B2`;
};

const fmtTerm = (coef, xExp = 0, yExp = 0) => {
  const varPart = `${fmtVarPart(xExp, 'x')}${fmtVarPart(yExp, 'y')}`;
  if (varPart === '') return `${coef}`;
  const abs = Math.abs(coef);
  const coefPart = abs === 1 ? '' : `${abs}`;
  return `${coefPart}${varPart}`;
};

// Standalone signed label, e.g. -2 -> "\u22122x", 5 -> "5y". Used for any
// label presented on its own (option/tile/combine buttons) rather than as
// part of a "+ / \u2212"-joined flowing sequence.
const fmtStandalone = (coef, xExp, yExp) => {
  const body = fmtTerm(Math.abs(coef), xExp, yExp);
  return coef < 0 ? `\u2212${body}` : body;
};

// Signed label for chips within a flowing sequence, e.g. (-2,1,0) -> "\u2212 2x",
// (5,0,1) -> "+ 5y". isFirst drops the leading "+" (and the space before "\u2212").
const fmtSigned = (coef, xExp, yExp, isFirst) => {
  if (isFirst) return fmtStandalone(coef, xExp, yExp);
  const body = fmtTerm(Math.abs(coef), xExp, yExp);
  return coef < 0 ? `\u2212 ${body}` : `+ ${body}`;
};

const varKey = (xExp, yExp) => `${xExp}:${yExp}`;

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

let uidCounter = 0;
const nextId = () => {
  uidCounter += 1;
  return `blk${uidCounter}`;
};

/* ---------------------------------------------------------------------
   Distractor / option builders
   --------------------------------------------------------------------- */

// One tile = multiplying one inner term by the bracket's (signed) multiplier.
const buildTileOptions = (mult, inner, leadingSign) => {
  const signMul = leadingSign === '-' ? -1 : 1;
  const trueCoef = mult.coef * inner.coef * signMul;
  const trueX = mult.xExp + inner.xExp;
  const trueY = mult.yExp + inner.yExp;
  const correctLabel = fmtStandalone(trueCoef, trueX, trueY);

  const raw = [];
  if (leadingSign === '-') {
    const forgotSign = mult.coef * inner.coef;
    raw.push({ label: fmtStandalone(forgotSign, trueX, trueY), note: 'sign' });
  }
  const added = mult.coef * signMul + inner.coef;
  raw.push({ label: fmtStandalone(added, trueX, trueY), note: 'added' });
  raw.push({ label: fmtStandalone(trueCoef, inner.xExp, inner.yExp), note: 'exponent' });

  const seen = new Set([correctLabel]);
  const distractors = [];
  raw.forEach((d) => {
    if (!seen.has(d.label)) {
      seen.add(d.label);
      distractors.push(d);
    }
  });

  return {
    correctLabel,
    correctTerm: { coef: trueCoef, xExp: trueX, yExp: trueY },
    options: shuffle([
      { label: correctLabel, isCorrect: true },
      ...distractors.slice(0, 2).map((d) => ({ label: d.label, isCorrect: false })),
    ]),
  };
};

const buildCombineOptions = (a, b) => {
  const sum = a.coef + b.coef;
  const diff = a.coef - b.coef;
  const correctLabel = fmtStandalone(sum, a.xExp, a.yExp);
  const raw = [
    { label: correctLabel, isCorrect: true },
    { label: fmtStandalone(diff, a.xExp, a.yExp), isCorrect: false },
    { label: fmtStandalone(-sum, a.xExp, a.yExp), isCorrect: false },
  ];
  const seen = new Set();
  const out = [];
  raw.forEach((o) => {
    if (!seen.has(o.label)) {
      seen.add(o.label);
      out.push(o);
    }
  });
  return { correctLabel, correctTerm: { coef: sum, xExp: a.xExp, yExp: a.yExp }, options: shuffle(out) };
};

/* ---------------------------------------------------------------------
   Factor-stage evaluation — same grading logic as Module 4's Blueprint
   Detective, reused so the capstone's factor step feels identical.
   --------------------------------------------------------------------- */
const evaluateGcf = (factorSpec, value) => {
  const failing = [];
  factorSpec.terms.forEach((t, i) => {
    if (t.coef % value !== 0) failing.push(i);
  });
  if (failing.length > 0) return { status: 'invalid', failing };
  if (value === factorSpec.gcf) return { status: 'correct', failing: [] };
  return { status: 'nonmax', failing: [] };
};

const evaluateTrinomial = (factorSpec, p, q) => {
  const { b, c, correctPair } = factorSpec;
  if (p * q === c && p + q === b) return { status: 'correct' };
  if (p * q === b && p + q === c) return { status: 'multiplyConfusion' };
  const enteredMags = [Math.abs(p), Math.abs(q)].sort().join(',');
  const correctMags = [Math.abs(correctPair[0]), Math.abs(correctPair[1])].sort().join(',');
  if (enteredMags === correctMags) return { status: 'signError' };
  return { status: 'mismatch', crossOk: p + q === b, bottomRightOk: p * q === c };
};

const GCF_PALETTE = Array.from({ length: 9 }, (_, i) => i + 1);
const SIGNED_PALETTE = Array.from({ length: 19 }, (_, i) => i - 9);

/* ---------------------------------------------------------------------
   Level builders — a "term" is {coef, xExp, yExp}. A simple bracket has
   one multiplier and a flat list of inner terms. A nested bracket has an
   inner multiplier applied first, then an outer multiplier wraps that
   result plus one extra loose term already sitting inside the brackets.
   --------------------------------------------------------------------- */
const t = (coef, xExp = 0, yExp = 0) => ({ coef, xExp, yExp });

const bracket = (leadingSign, mult, inner) => ({
  kind: 'bracket', leadingSign, mult, inner,
});

const nestedBracket = (outerMult, innerMult, innerTerms, extra) => ({
  kind: 'nested', outerMult, innerMult, innerTerms, extra,
});

const term = (coef, xExp = 0, yExp = 0) => ({ kind: 'term', coef, xExp, yExp });

const LEVELS = [
  // ----------------------------- EASY (3) -----------------------------
  {
    id: 1, tier: 'easy', tierLabel: 'Easy', vars: ['x'],
    prompt: '3(x + 4) + 2x',
    seq: [bracket('+', t(3), [t(1, 1), t(4)]), term(2, 1)],
    finalExpression: '5x + 12',
  },
  {
    id: 2, tier: 'easy', tierLabel: 'Easy', vars: ['x'],
    prompt: '5(x + 1) + 3x',
    seq: [bracket('+', t(5), [t(1, 1), t(1)]), term(3, 1)],
    finalExpression: '8x + 5',
  },
  {
    id: 3, tier: 'easy', tierLabel: 'Easy', vars: ['x'],
    prompt: '2(x + 6) + 5x',
    seq: [bracket('+', t(2), [t(1, 1), t(6)]), term(5, 1)],
    finalExpression: '7x + 12',
  },

  // ---------------------------- MEDIUM (4) ----------------------------
  {
    id: 4, tier: 'medium', tierLabel: 'Medium', vars: ['x'],
    prompt: '4(x + 3) \u2212 2(x \u2212 1)',
    seq: [bracket('+', t(4), [t(1, 1), t(3)]), bracket('-', t(2), [t(1, 1), t(-1)])],
    finalExpression: '2x + 14',
  },
  {
    id: 5, tier: 'medium', tierLabel: 'Medium', vars: ['x'],
    prompt: '3x(x + 2) \u2212 4(x \u2212 3)',
    seq: [bracket('+', t(3, 1), [t(1, 1), t(2)]), bracket('-', t(4), [t(1, 1), t(-3)])],
    finalExpression: '3x\u00B2 + 2x + 12',
  },
  {
    id: 6, tier: 'medium', tierLabel: 'Medium', vars: ['x'],
    prompt: '2x(x + 4) \u2212 3(x \u2212 2)',
    seq: [bracket('+', t(2, 1), [t(1, 1), t(4)]), bracket('-', t(3), [t(1, 1), t(-2)])],
    finalExpression: '2x\u00B2 + 5x + 6',
  },
  {
    id: 7, tier: 'medium', tierLabel: 'Medium', vars: ['x', 'y'],
    prompt: '3x(x + y) \u2212 y(x \u2212 2)',
    seq: [bracket('+', t(3, 1), [t(1, 1), t(1, 0, 1)]), bracket('-', t(1, 0, 1), [t(1, 1), t(-2)])],
    finalExpression: '3x\u00B2 + 2xy + 2y',
  },

  // ----------------------------- HARD (3) ------------------------------
  {
    id: 8, tier: 'hard', tierLabel: 'Hard', vars: ['x'],
    prompt: '2x(x + 6) \u2212 (x\u00B2 + 3x \u2212 20)',
    seq: [bracket('+', t(2, 1), [t(1, 1), t(6)]), bracket('-', t(1), [t(1, 2), t(3, 1), t(-20)])],
    finalExpression: '(x + 4)(x + 5)',
    factor: { gcf: 1, terms: [{ coef: 1, exp: 2 }, { coef: 9, exp: 1 }, { coef: 20, exp: 0 }], b: 9, c: 20, correctPair: [4, 5] },
  },
  {
    id: 9, tier: 'hard', tierLabel: 'Hard', vars: ['x'],
    prompt: '5x(x + 6) \u2212 (x\u00B2 + 2x \u2212 24)',
    seq: [bracket('+', t(5, 1), [t(1, 1), t(6)]), bracket('-', t(1), [t(1, 2), t(2, 1), t(-24)])],
    finalExpression: '4(x + 1)(x + 6)',
    factor: { gcf: 4, terms: [{ coef: 4, exp: 2 }, { coef: 28, exp: 1 }, { coef: 24, exp: 0 }], b: 7, c: 6, correctPair: [1, 6] },
  },
  {
    id: 10, tier: 'hard', tierLabel: 'Hard', vars: ['x', 'y'],
    prompt: '2[3(x + 2) \u2212 y] + 4x \u2212 y',
    seq: [nestedBracket(t(2), t(3), [t(1, 1), t(2)], t(-1, 0, 1)), term(4, 1), term(-1, 0, 1)],
    finalExpression: '10x + 12 \u2212 3y',
  },
];

// One "action" = one gradeable decision: each distribute tile, each
// combine, and each factor stage (1 or 2 depending on whether a GCF
// extraction is needed first).
const countActionsForLevel = (level) => {
  let n = 0;
  level.seq.forEach((block) => {
    if (block.kind === 'bracket') n += block.inner.length;
    if (block.kind === 'nested') n += block.innerTerms.length + (block.innerTerms.length + 1);
  });
  // combine steps: derive from how many terms share a varKey once fully expanded
  const flat = expandLevelFully(level);
  const groups = {};
  flat.forEach((tm) => {
    const k = varKey(tm.xExp, tm.yExp);
    groups[k] = (groups[k] || 0) + 1;
  });
  Object.values(groups).forEach((count) => { n += Math.max(0, count - 1); });
  if (level.factor) n += level.factor.gcf > 1 ? 2 : 1;
  return n;
};

// Fully expand a level's blocks into a flat term list (used only to
// count actions and to pre-verify the curated bank resolves cleanly).
const expandLevelFully = (level) => {
  const out = [];
  level.seq.forEach((block) => {
    if (block.kind === 'term') {
      out.push({ coef: block.coef, xExp: block.xExp, yExp: block.yExp });
    } else if (block.kind === 'bracket') {
      const signMul = block.leadingSign === '-' ? -1 : 1;
      block.inner.forEach((inner) => {
        out.push({
          coef: block.mult.coef * inner.coef * signMul,
          xExp: block.mult.xExp + inner.xExp,
          yExp: block.mult.yExp + inner.yExp,
        });
      });
    } else if (block.kind === 'nested') {
      const innerResolved = block.innerTerms.map((inner) => ({
        coef: block.innerMult.coef * inner.coef,
        xExp: block.innerMult.xExp + inner.xExp,
        yExp: block.innerMult.yExp + inner.yExp,
      }));
      const allInner = [...innerResolved, block.extra];
      allInner.forEach((inner) => {
        out.push({
          coef: block.outerMult.coef * inner.coef,
          xExp: block.outerMult.xExp + inner.xExp,
          yExp: block.outerMult.yExp + inner.yExp,
        });
      });
    }
  });
  const merged = {};
  const order = [];
  out.forEach((tm) => {
    const k = varKey(tm.xExp, tm.yExp);
    if (!(k in merged)) { merged[k] = { ...tm }; order.push(k); } else { merged[k].coef += tm.coef; }
  });
  return order.map((k) => merged[k]).filter((tm) => tm.coef !== 0);
};

const TOTAL_ACTIONS = LEVELS.reduce((sum, lvl) => sum + countActionsForLevel(lvl), 0);

const TIER_META = {
  easy: {
    icon: '\u26FA',
    heading: 'Camp Type: First Ascent',
    instructions: 'Open the bracket, then combine the like terms \u2014 get used to tapping straight into a live expression.',
  },
  medium: {
    icon: '\uD83E\uDDF3',
    heading: 'New Camp Type: Two Brackets',
    instructions: 'Watch the sign when a bracket is being subtracted, then combine everything that matches.',
  },
  hard: {
    icon: '\uD83C\uDFD4\uFE0F',
    heading: 'Final Camps: The Summit Push',
    instructions: 'Nested brackets, negatives, and multiple variables \u2014 simplify fully, then factor where it\u2019s needed.',
  },
};

/* ---------------------------------------------------------------------
   Runtime state builder: converts a level's static seq into live blocks
   with ids, ready to render and mutate.
   --------------------------------------------------------------------- */
const prepareCamp = (level) => {
  const blocks = level.seq.map((block) => {
    if (block.kind === 'term') {
      return { id: nextId(), type: 'term', coef: block.coef, xExp: block.xExp, yExp: block.yExp };
    }
    if (block.kind === 'bracket') {
      return {
        id: nextId(), type: 'bracket', leadingSign: block.leadingSign, mult: block.mult,
        inner: block.inner, opened: false,
        tiles: block.inner.map((inner) => {
          const built = buildTileOptions(block.mult, inner, block.leadingSign);
          return { correctLabel: built.correctLabel, correctTerm: built.correctTerm, options: built.options, filled: null, status: null };
        }),
      };
    }
    // nested
    const innerTileBuilt = block.innerTerms.map((inner) => {
      const built = buildTileOptions(block.innerMult, inner, '+');
      return { correctLabel: built.correctLabel, correctTerm: built.correctTerm, options: built.options, filled: null, status: null };
    });
    return {
      id: nextId(), type: 'nested', outerMult: block.outerMult, innerMult: block.innerMult,
      innerTerms: block.innerTerms, extra: block.extra, stage: 'inner',
      innerTiles: innerTileBuilt, outerTiles: null,
    };
  });
  return {
    blocks,
    active: null,          // { blockId, kind: 'tile'|'nestedInner'|'nestedOuter', tileIdx }
    selectedForCombine: [], // array of term block ids
    combineOptions: null,
    factorStage: level.factor ? (level.factor.gcf > 1 ? 'gcf' : 'trinomial') : null,
    factorResolved: !level.factor,
    gcfValue: null, gcfAttempts: 0, gcfFeedback: null,
    p: null, q: null, trinomialAttempts: 0, trinomialFeedback: null,
    factorActive: false,
    trail: [],
    feedback: null,
  };
};

const isFullySimplified = (camp) => {
  const hasUnopenedBracket = camp.blocks.some(
    (b) => (b.type === 'bracket' && !b.opened) || (b.type === 'nested' && b.stage !== 'resolved'),
  );
  if (hasUnopenedBracket) return false;
  const counts = {};
  camp.blocks.forEach((b) => {
    if (b.type === 'term') {
      const k = varKey(b.xExp, b.yExp);
      counts[k] = (counts[k] || 0) + 1;
    }
  });
  return Object.values(counts).every((c) => c === 1);
};

const findCombinablePair = (camp) => {
  const counts = {};
  camp.blocks.forEach((b) => {
    if (b.type === 'term') {
      const k = varKey(b.xExp, b.yExp);
      (counts[k] = counts[k] || []).push(b.id);
    }
  });
  return Object.values(counts).find((ids) => ids.length >= 2) || null;
};

/* ---------------------------------------------------------------------
   Presentational sub-components
   --------------------------------------------------------------------- */

const StarsRow = ({ stars }) => (
  <div className="as-stars-row" aria-label={`${stars} out of 3 stars`}>
    {[1, 2, 3].map((n) => (
      <span key={n} className={`as-star ${n <= stars ? 'as-star--filled' : ''}`}>&#9733;</span>
    ))}
  </div>
);

const CampProgress = ({ campIdx, totalCamps, tierIcon }) => (
  <div className="as-progress">
    <div className="as-progress-row">
      <span className="as-progress-label">
        <span className="as-progress-icon" aria-hidden="true">{tierIcon}</span>
        Camp {campIdx + 1} of {totalCamps}
      </span>
    </div>
    <div className="as-trail-track" aria-hidden="true">
      {Array.from({ length: totalCamps }).map((_, i) => (
        <div
          key={i}
          className={
            'as-trail-dot'
            + (i < campIdx ? ' as-trail-dot--done' : '')
            + (i === campIdx ? ' as-trail-dot--active' : '')
          }
        />
      ))}
    </div>
  </div>
);

const AscentTrailStrip = ({ trail }) => {
  if (!trail || trail.length === 0) return null;
  return (
    <div className="as-ascent-strip" aria-label="Steps taken so far this camp">
      {trail.map((entry, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="as-ascent-arrow" aria-hidden="true">&#8594;</span>}
          <span className="as-ascent-chip">{entry}</span>
        </React.Fragment>
      ))}
    </div>
  );
};

const OptionsPanel = ({ options, heading, onSelect, wrongFlash }) => (
  <div className={`as-panel-wrap ${wrongFlash ? 'as-panel-wrap--wrong' : ''}`}>
    <div className="as-panel-caret" aria-hidden="true" />
    <div className="as-panel" role="group" aria-label={heading || 'Choose an answer'}>
      {heading && <div className="as-panel-heading">{heading}</div>}
      <div className="as-panel-list">
        {options.map((opt) => (
          <button key={opt.label} type="button" className="as-panel-btn" onClick={() => onSelect(opt)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

const NumberPalette = ({ options, selected, heading, onSelect }) => (
  <div className="as-panel-wrap">
    <div className="as-panel-caret" aria-hidden="true" />
    <div className="as-panel" role="group" aria-label={heading}>
      <div className="as-panel-heading">{heading}</div>
      <div className="as-palette-grid">
        {options.map((n) => (
          <button
            key={n}
            type="button"
            className={`as-palette-chip ${selected === n ? 'as-palette-chip--selected' : ''}`}
            onClick={() => onSelect(n)}
          >
            {n > 0 ? `+${n}` : n}
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ---------------------------------------------------------------------
   The live expression board — renders every block as a tappable chip,
   with actionable parts highlighted and inert parts neutral.
   --------------------------------------------------------------------- */
const ExpressionBoard = ({
  level, camp, shakeId, onTapBracket, onTapNestedInner, onTapNestedOuter, onTapTerm, factorEligible, factorActive, onTapFactorArea,
}) => {
  const combineGroups = {};
  camp.blocks.forEach((b) => {
    if (b.type === 'term') {
      const k = varKey(b.xExp, b.yExp);
      (combineGroups[k] = combineGroups[k] || []).push(b.id);
    }
  });
  const colorForKey = (k) => {
    const keys = Object.keys(combineGroups).filter((kk) => combineGroups[kk].length >= 2);
    const idx = keys.indexOf(k);
    return idx >= 0 ? idx % 4 : -1;
  };

  const chips = [];
  camp.blocks.forEach((block, idx) => {
    const isFirst = idx === 0;

    if (block.type === 'term') {
      const k = varKey(block.xExp, block.yExp);
      const groupIds = combineGroups[k] || [];
      const isActionable = groupIds.length >= 2;
      const isSelected = camp.selectedForCombine.includes(block.id);
      const colorIdx = colorForKey(k);
      chips.push(
        <button
          key={block.id}
          type="button"
          className={
            'as-chip as-chip--term'
            + (isActionable ? ` as-chip--actionable as-chip--color-${colorIdx}` : ' as-chip--inert')
            + (isSelected ? ' as-chip--selected' : '')
            + (shakeId === block.id ? ' as-chip--shake' : '')
          }
          onClick={() => onTapTerm(block)}
        >
          {fmtSigned(block.coef, block.xExp, block.yExp, isFirst)}
        </button>,
      );
      return;
    }

    if (block.type === 'bracket') {
      const label = `${block.leadingSign === '-' ? (isFirst ? '\u2212' : '\u2212 ') : (isFirst ? '' : '+ ')}${fmtTerm(block.mult.coef, block.mult.xExp, block.mult.yExp)}(${block.inner.map((tm, i) => (i === 0 ? fmtTerm(tm.coef, tm.xExp, tm.yExp) : fmtSigned(tm.coef, tm.xExp, tm.yExp, false))).join(' ')})`;
      chips.push(
        <button
          key={block.id}
          type="button"
          className={`as-chip as-chip--bracket as-chip--actionable${shakeId === block.id ? ' as-chip--shake' : ''}`}
          onClick={() => onTapBracket(block)}
        >
          {label}
        </button>,
      );
      return;
    }

    // nested
    const innerText = block.innerTerms.map((tm, i) => (i === 0 ? fmtTerm(tm.coef, tm.xExp, tm.yExp) : fmtSigned(tm.coef, tm.xExp, tm.yExp, false))).join(' ');
    const extraText = fmtSigned(block.extra.coef, block.extra.xExp, block.extra.yExp, false);
    const innerMultLabel = fmtTerm(block.innerMult.coef, block.innerMult.xExp, block.innerMult.yExp);
    const outerMultLabel = fmtTerm(block.outerMult.coef, block.outerMult.xExp, block.outerMult.yExp);

    if (block.stage === 'inner') {
      chips.push(
        <span key={block.id} className="as-chip as-chip--nested-wrap">
          {`${isFirst ? '' : '+ '}${outerMultLabel}[ `}
          <button
            type="button"
            className={`as-chip as-chip--bracket as-chip--actionable as-chip--nested-inner${shakeId === block.id ? ' as-chip--shake' : ''}`}
            onClick={() => onTapNestedInner(block)}
          >
            {`${innerMultLabel}(${innerText})`}
          </button>
          {` ${extraText} ]`}
        </span>,
      );
      return;
    }
    if (block.stage === 'outer') {
      const resolvedInnerText = block.innerTiles.map((tile, i) => (i === 0 ? tile.correctLabel : fmtSigned(tile.correctTerm.coef, tile.correctTerm.xExp, tile.correctTerm.yExp, false))).join(' ');
      chips.push(
        <button
          key={block.id}
          type="button"
          className={`as-chip as-chip--bracket as-chip--actionable${shakeId === block.id ? ' as-chip--shake' : ''}`}
          onClick={() => onTapNestedOuter(block)}
        >
          {`${isFirst ? '' : '+ '}${outerMultLabel}[ ${resolvedInnerText} ${extraText} ]`}
        </button>,
      );
      return;
    }
    return; // resolved nested blocks disappear
  });

  return (
    <div className="as-board">
      <div
        className={`as-expr${factorEligible ? ' as-expr--factorable' : ''}${factorActive ? ' as-expr--factor-active' : ''}`}
        onClick={factorEligible ? onTapFactorArea : undefined}
        role={factorEligible ? 'button' : undefined}
        tabIndex={factorEligible ? 0 : undefined}
      >
        {chips}
      </div>
      {factorEligible && !factorActive && (
        <div className="as-factor-hint">
          <span aria-hidden="true">&#9968;</span> Tap the expression to try factoring it
        </div>
      )}
    </div>
  );
};

/* =====================================================================
   MAIN COMPONENT
   ===================================================================== */
const Module5Game = ({ moduleId, userId, onComplete, onExit }) => {
  const [phase, setPhase] = useState('intro'); // intro | tierIntro | playing | campComplete | tierSummary | summary
  const [levelIdx, setLevelIdx] = useState(0);
  const [camp, setCamp] = useState(() => prepareCamp(LEVELS[0]));

  const [elapsedTime, setElapsedTime] = useState(0);
  const [score, setScore] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [softFlags, setSoftFlags] = useState({ nonMaximal: 0, unnecessaryOperation: 0 });
  const [mistakesByTier, setMistakesByTier] = useState({ easy: 0, medium: 0, hard: 0 });
  const [mistakesByType, setMistakesByType] = useState({
    premature: 0, tileError: 0, combineError: 0, invalidFactor: 0, signError: 0, multiplyConfusion: 0, other: 0, declaredEarly: 0,
  });
  const [correctFirstTry, setCorrectFirstTry] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [shakeId, setShakeId] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [tierSummaryData, setTierSummaryData] = useState(null);
  const [hardestTrail, setHardestTrail] = useState([]);

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
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
  };

  const handleStart = () => { startClock(); setPhase('tierIntro'); };

  useEffect(() => {
    if (phase !== 'tierIntro') return undefined;
    const tid = setTimeout(() => setPhase('playing'), 1800);
    return () => clearTimeout(tid);
  }, [phase]);

  const triggerShake = (id) => {
    setShakeId(id);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = setTimeout(() => setShakeId(null), 450);
  };

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

  const pushTrail = (label) => {
    setCamp((prev) => ({ ...prev, trail: [...prev.trail, label] }));
  };

  /* ------------------------- Bracket distribution ------------------------- */

  const handleTapBracket = (block) => {
    setCamp((prev) => ({ ...prev, active: { blockId: block.id, kind: 'tile' } }));
  };

  const handleTapNestedInner = (block) => {
    setCamp((prev) => ({ ...prev, active: { blockId: block.id, kind: 'nestedInner' } }));
  };

  const handleTapNestedOuter = (block) => {
    setCamp((prev) => ({ ...prev, active: { blockId: block.id, kind: 'nestedOuter' } }));
  };

  const handleTileSelect = (blockId, tileIdx, kind, opt) => {
    setCamp((prev) => {
      const blocks = prev.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const tilesKey = kind === 'nestedInner' ? 'innerTiles' : (kind === 'nestedOuter' ? 'outerTiles' : 'tiles');
        const tiles = b[tilesKey].map((tile, i) => {
          if (i !== tileIdx) return tile;
          const wasFirstTry = tile.status === null;
          if (opt.isCorrect) {
            applySuccess(wasFirstTry);
            return { ...tile, filled: opt.label, status: 'correct' };
          }
          registerMistake('tileError');
          triggerShake(b.id);
          return { ...tile, filled: opt.label, status: 'wrong' };
        });
        return { ...b, [tilesKey]: tiles };
      });
      // Deliberately keep `active` pointing at this block: the panel's
      // visibility is derived from the first not-yet-correct tile, so it
      // naturally advances to the next tile after a correct pick, stays on
      // the same tile for an immediate retry after a wrong pick, and
      // disappears on its own once every tile in the block is correct
      // (or once the block is replaced by its resolved terms).
      return { ...prev, blocks };
    });
  };

  // After tiles change, resolve brackets/nested stages that are fully correct.
  useEffect(() => {
    const allTilesCorrect = (tiles) => tiles.every((tl) => tl.status === 'correct');

    let changed = false;
    const nextBlocks = [];
    let trailAdd = null;

    camp.blocks.forEach((b) => {
      if (b.type === 'bracket' && !b.opened && allTilesCorrect(b.tiles)) {
        changed = true;
        b.tiles.forEach((tile) => {
          nextBlocks.push({ id: nextId(), type: 'term', coef: tile.correctTerm.coef, xExp: tile.correctTerm.xExp, yExp: tile.correctTerm.yExp });
        });
        const innerText = b.inner.map((tm, i) => (i === 0 ? fmtTerm(tm.coef, tm.xExp, tm.yExp) : fmtSigned(tm.coef, tm.xExp, tm.yExp, false))).join(' ');
        const rawLabel = `${b.leadingSign === '-' ? '\u2212' : ''}${fmtTerm(b.mult.coef, b.mult.xExp, b.mult.yExp)}(${innerText})`;
        trailAdd = `Distributed ${rawLabel}`;
        return;
      }
      if (b.type === 'nested' && b.stage === 'inner' && allTilesCorrect(b.innerTiles)) {
        changed = true;
        const outerTiles = [...b.innerTiles.map((tile) => tile.correctTerm), b.extra].map((inner) => {
          const built = buildTileOptions(b.outerMult, inner, '+');
          return { correctLabel: built.correctLabel, correctTerm: built.correctTerm, options: built.options, filled: null, status: null };
        });
        nextBlocks.push({ ...b, stage: 'outer', outerTiles });
        trailAdd = 'Resolved the inner bracket';
        return;
      }
      if (b.type === 'nested' && b.stage === 'outer' && allTilesCorrect(b.outerTiles)) {
        changed = true;
        b.outerTiles.forEach((tile) => {
          nextBlocks.push({ id: nextId(), type: 'term', coef: tile.correctTerm.coef, xExp: tile.correctTerm.xExp, yExp: tile.correctTerm.yExp });
        });
        trailAdd = 'Distributed the outer bracket';
        return;
      }
      nextBlocks.push(b);
    });

    if (changed) {
      setCamp((prev) => ({ ...prev, blocks: nextBlocks }));
      if (trailAdd) pushTrail(trailAdd);
    }
  }, [camp.blocks]);

  /* ------------------------------- Combine -------------------------------- */

  const handleTapTerm = (block) => {
    const k = varKey(block.xExp, block.yExp);
    const groupIds = camp.blocks.filter((b) => b.type === 'term' && varKey(b.xExp, b.yExp) === k).map((b) => b.id);

    if (groupIds.length < 2) {
      const hasUnopenedBracket = camp.blocks.some((b) => (b.type === 'bracket' && !b.opened) || (b.type === 'nested' && b.stage !== 'resolved'));
      if (hasUnopenedBracket) {
        registerMistake('premature');
        setCamp((prev) => ({ ...prev, feedback: { tone: 'error', message: MSG_BRACKET_FIRST } }));
        triggerShake(block.id);
      }
      return;
    }

    setCamp((prev) => {
      const already = prev.selectedForCombine;
      if (already.includes(block.id)) {
        return { ...prev, selectedForCombine: already.filter((id) => id !== block.id) };
      }
      const nextSel = [...already, block.id].slice(-2);
      if (nextSel.length === 2) {
        const [idA, idB] = nextSel;
        const a = prev.blocks.find((b) => b.id === idA);
        const bb = prev.blocks.find((b) => b.id === idB);
        if (a && bb && varKey(a.xExp, a.yExp) === varKey(bb.xExp, bb.yExp)) {
          const built = buildCombineOptions(a, bb);
          return { ...prev, selectedForCombine: nextSel, combineOptions: built, feedback: null };
        }
      }
      return { ...prev, selectedForCombine: nextSel, feedback: null };
    });
  };

  const [combineAttempts, setCombineAttempts] = useState(0);

  const handleCombineSelect = (opt) => {
    const wasFirstTry = combineAttempts === 0;
    if (!opt.isCorrect) {
      setCombineAttempts((c) => c + 1);
      registerMistake('combineError');
      const activeId = camp.selectedForCombine[0];
      triggerShake(activeId);
      setCamp((prev) => ({ ...prev, feedback: { tone: 'error', message: MSG_COMBINE_WRONG } }));
      return;
    }
    applySuccess(wasFirstTry);
    setCombineAttempts(0);
    setCamp((prev) => {
      const [idA, idB] = prev.selectedForCombine;
      const a = prev.blocks.find((b) => b.id === idA);
      const bb = prev.blocks.find((b) => b.id === idB);
      const combinedLabel = `${fmtStandalone(a.coef, a.xExp, a.yExp)} ${bb.coef < 0 ? '\u2212' : '+'} ${fmtTerm(Math.abs(bb.coef), bb.xExp, bb.yExp)} \u2192 ${opt.label}`;
      const blocks = prev.blocks
        .filter((b) => b.id !== idB)
        .map((b) => (b.id === idA
          ? { ...b, coef: prev.combineOptions.correctTerm.coef, xExp: prev.combineOptions.correctTerm.xExp, yExp: prev.combineOptions.correctTerm.yExp }
          : b));
      return {
        ...prev, blocks, selectedForCombine: [], combineOptions: null, feedback: null,
        trail: [...prev.trail, `Combined ${combinedLabel}`],
      };
    });
  };

  /* -------------------------------- Factor --------------------------------- */

  const factorEligible = phase === 'playing' && isFullySimplified(camp) && camp.selectedForCombine.length === 0;

  const handleTapFactorArea = () => {
    if (!level.factor) {
      setSoftFlags((prev) => ({ ...prev, unnecessaryOperation: prev.unnecessaryOperation + 1 }));
      setCamp((prev) => ({ ...prev, feedback: { tone: 'nudge', message: MSG_ALREADY_SIMPLE } }));
      return;
    }
    setCamp((prev) => ({ ...prev, factorActive: true, feedback: null }));
  };

  const handleGcfSelect = (v) => setCamp((prev) => ({ ...prev, gcfValue: v, gcfFeedback: null }));
  const handlePSelect = (v) => setCamp((prev) => ({ ...prev, p: v, trinomialFeedback: null }));
  const handleQSelect = (v) => setCamp((prev) => ({ ...prev, q: v, trinomialFeedback: null }));

  const handleTestFactor = () => {
    if (camp.factorStage === 'gcf') {
      if (camp.gcfValue == null) return;
      const result = evaluateGcf(level.factor, camp.gcfValue);
      if (result.status === 'correct') {
        applySuccess(camp.gcfAttempts === 0);
        pushTrail(`Factored out ${camp.gcfValue}`);
        setCamp((prev) => ({ ...prev, factorStage: 'trinomial', gcfFeedback: { tone: 'correct' } }));
        return;
      }
      if (result.status === 'nonmax') {
        setSoftFlags((prev) => ({ ...prev, nonMaximal: prev.nonMaximal + 1 }));
        setCamp((prev) => ({ ...prev, gcfAttempts: prev.gcfAttempts + 1, gcfFeedback: { tone: 'nudge', message: MSG_NON_MAXIMAL } }));
        return;
      }
      registerMistake('invalidFactor');
      setCamp((prev) => ({ ...prev, gcfAttempts: prev.gcfAttempts + 1, gcfFeedback: { tone: 'error', message: MSG_INVALID_FACTOR } }));
      return;
    }
    if (camp.factorStage === 'trinomial') {
      if (camp.p == null || camp.q == null) return;
      const result = evaluateTrinomial(level.factor, camp.p, camp.q);
      if (result.status === 'correct') {
        applySuccess(camp.trinomialAttempts === 0);
        pushTrail(`Factored \u2192 ${level.finalExpression}`);
        setCamp((prev) => ({ ...prev, factorStage: 'resolved', factorResolved: true, trinomialFeedback: { tone: 'correct' } }));
        return;
      }
      if (result.status === 'multiplyConfusion') {
        registerMistake('multiplyConfusion');
        setCamp((prev) => ({ ...prev, trinomialAttempts: prev.trinomialAttempts + 1, trinomialFeedback: { tone: 'multiply', message: MSG_MULTIPLY_CONFUSION } }));
        return;
      }
      if (result.status === 'signError') {
        registerMistake('signError');
        setCamp((prev) => ({ ...prev, trinomialAttempts: prev.trinomialAttempts + 1, trinomialFeedback: { tone: 'sign', message: MSG_SIGN_ERROR } }));
        return;
      }
      registerMistake('other');
      setCamp((prev) => ({ ...prev, trinomialAttempts: prev.trinomialAttempts + 1, trinomialFeedback: { tone: 'mismatch', message: MSG_GENERIC_MISMATCH } }));
    }
  };

  /* ----------------------------- Declare Done ------------------------------ */

  const hasPerformedAnyAction = totalActions > tierSnapshotRef.current.actions || camp.trail.length > 0;

  const handleDeclareDone = () => {
    const hasUnopenedBracket = camp.blocks.some((b) => (b.type === 'bracket' && !b.opened) || (b.type === 'nested' && b.stage !== 'resolved'));
    if (hasUnopenedBracket) {
      registerMistake('declaredEarly');
      setCamp((prev) => ({ ...prev, feedback: { tone: 'error', message: MSG_NOT_YET_DONE_BRACKET } }));
      return;
    }
    const pair = findCombinablePair(camp);
    if (pair) {
      registerMistake('declaredEarly');
      setCamp((prev) => ({ ...prev, feedback: { tone: 'error', message: MSG_NOT_YET_DONE_COMBINE } }));
      return;
    }
    if (level.factor && !camp.factorResolved) {
      registerMistake('declaredEarly');
      setCamp((prev) => ({ ...prev, feedback: { tone: 'error', message: MSG_NOT_YET_DONE_FACTOR } }));
      return;
    }
    setPhase('campComplete');
    if (level.tier === 'hard') setHardestTrail(camp.trail);
  };

  /* --------------------------- Camp / tier advance -------------------------- */

  const finishGame = (finalScore, finalMistakes, finalCorrectFirstTry, finalTime, finalMistakesByTier, finalMistakesByType, finalSoft, finalTotalActions) => {
    stopClock();
    const accuracyDenominator = finalTotalActions + finalMistakes;
    const accuracy = accuracyDenominator > 0 ? Math.round((finalTotalActions / accuracyDenominator) * 100) : 100;
    const stars = calcStarsQuiz(finalCorrectFirstTry, TOTAL_ACTIONS);
    const rewardPoints = calcRewardPoints(stars, 35);
    const badgeUnlocked = stars === 3 ? 'Master Mathematician' : null;

    const result = buildGameResult({
      moduleId,
      gameId: 'algebra-summit',
      score: finalScore,
      accuracy,
      mistakes: finalMistakes,
      completionTime: finalTime,
      stars,
      rewardPoints,
      badgeUnlocked,
      extraData: {
        campsCompleted: LEVELS.length,
        mistakesByTier: finalMistakesByTier,
        mistakesByType: finalMistakesByType,
        softFlags: finalSoft,
        correctFirstTry: finalCorrectFirstTry,
        totalActions: finalTotalActions,
        hardestCampTrail: hardestTrail,
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
      tierLabel: finishedTier[0].toUpperCase() + finishedTier.slice(1),
      score: tierScoreGained,
      accuracy: tierAccuracy,
      mistakes: tierMistakesCount,
    });
    tierSnapshotRef.current = { score, actions: totalActions, mistakes: totalMistakes };
    setPhase('tierSummary');
  };

  useEffect(() => {
    if (phase !== 'campComplete') return undefined;
    const tid = setTimeout(() => {
      const nextIdx = levelIdx + 1;
      if (nextIdx >= LEVELS.length) {
        finishGame(score, totalMistakes, correctFirstTry, elapsedTime, mistakesByTier, mistakesByType, softFlags, totalActions);
        return;
      }
      const nextLevel = LEVELS[nextIdx];
      if (nextLevel.tier !== level.tier) {
        showTierSummary(level.tier);
        setLevelIdx(nextIdx);
        setCamp(prepareCamp(nextLevel));
        return;
      }
      setLevelIdx(nextIdx);
      setCamp(prepareCamp(nextLevel));
      setPhase('playing');
    }, 2000);
    return () => clearTimeout(tid);
  }, [phase]);

  const handleTierSummaryContinue = () => setPhase('tierIntro');

  const handleReplay = () => {
    stopClock();
    setLevelIdx(0);
    setCamp(prepareCamp(LEVELS[0]));
    setScore(0);
    setTotalMistakes(0);
    setSoftFlags({ nonMaximal: 0, unnecessaryOperation: 0 });
    setMistakesByTier({ easy: 0, medium: 0, hard: 0 });
    setMistakesByType({ premature: 0, tileError: 0, combineError: 0, invalidFactor: 0, signError: 0, multiplyConfusion: 0, other: 0, declaredEarly: 0 });
    setCorrectFirstTry(0);
    setTotalActions(0);
    setElapsedTime(0);
    setSummaryData(null);
    setTierSummaryData(null);
    setHardestTrail([]);
    tierSnapshotRef.current = { score: 0, actions: 0, mistakes: 0 };
    setPhase('intro');
  };

  // Summary never auto-advances; onComplete fires only from the final CTA.
  const handleBackToDashboard = () => {
    if (typeof onComplete === 'function' && summaryData) onComplete(summaryData);
  };

  /* ------------------------------- RENDER ---------------------------------- */

  if (phase === 'intro') {
    return (
      <div className="as-game">
        <div className="as-intro">
          <div className="as-intro-icon" aria-hidden="true">&#127956;</div>
          <h1 className="as-intro-title">Algebra Summit</h1>
          <p className="as-intro-subtitle">
            No pre-built structure this time. The full expression is live on screen \u2014 find what can be
            acted on right now, choose the right technique, and climb to the top.
          </p>
          <div className="as-intro-rules">
            <div className="as-rule">
              <span className="as-rule-icon" aria-hidden="true">&#128072;</span>
              <span>Tap a bracket to distribute it, or two matching terms to combine them.</span>
            </div>
            <div className="as-rule">
              <span className="as-rule-icon" aria-hidden="true">&#128274;</span>
              <span>Some parts aren&rsquo;t ready yet &mdash; the game will tell you exactly why.</span>
            </div>
            <div className="as-rule">
              <span className="as-rule-icon" aria-hidden="true">&#127937;</span>
              <span>When you believe the climb is finished, tap <strong>Declare Done</strong> yourself.</span>
            </div>
          </div>
          <div className="as-intro-tiers">
            <div className="as-intro-tier">
              <span className="as-intro-tier-icon" aria-hidden="true">{TIER_META.easy.icon}</span>
              <span>Easy &middot; 3 camps &middot; one bracket, one combine</span>
            </div>
            <div className="as-intro-tier">
              <span className="as-intro-tier-icon" aria-hidden="true">{TIER_META.medium.icon}</span>
              <span>Medium &middot; 4 camps &middot; two brackets, chained steps</span>
            </div>
            <div className="as-intro-tier">
              <span className="as-intro-tier-icon" aria-hidden="true">{TIER_META.hard.icon}</span>
              <span>Hard &middot; 3 camps &middot; nested brackets &amp; factoring</span>
            </div>
          </div>
          <button type="button" className="as-btn as-btn--primary as-btn--large" onClick={handleStart}>
            Begin the Climb
          </button>
          {typeof onExit === 'function' && (
            <button type="button" className="as-btn as-btn--ghost" onClick={onExit}>
              &larr; Back to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'tierIntro') {
    const meta = TIER_META[level.tier];
    return (
      <div className="as-game">
        <div className="as-tier-intro">
          <div className="as-tier-intro-icon" aria-hidden="true">{meta.icon}</div>
          <h2 className="as-tier-intro-heading">{meta.heading}</h2>
          <p className="as-tier-intro-text">{meta.instructions}</p>
        </div>
      </div>
    );
  }

  if (phase === 'tierSummary' && tierSummaryData) {
    return (
      <div className="as-game">
        <div className="as-tier-summary">
          <div className="as-tier-summary-icon" aria-hidden="true">{TIER_META[tierSummaryData.tier].icon}</div>
          <h2 className="as-tier-summary-title">{tierSummaryData.tierLabel} Camps Cleared</h2>
          <div className="as-tier-summary-grid">
            <div className="as-summary-stat">
              <span className="as-summary-stat-label">Score</span>
              <span className="as-summary-stat-value">+{tierSummaryData.score}</span>
            </div>
            <div className="as-summary-stat">
              <span className="as-summary-stat-label">Accuracy</span>
              <span className="as-summary-stat-value">{tierSummaryData.accuracy}%</span>
            </div>
            <div className="as-summary-stat">
              <span className="as-summary-stat-label">Mistakes</span>
              <span className="as-summary-stat-value">{tierSummaryData.mistakes}</span>
            </div>
          </div>
          <button type="button" className="as-btn as-btn--primary" onClick={handleTierSummaryContinue}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'summary' && summaryData) {
    const { mistakesByType: mt, softFlags: sf } = summaryData.extraData;
    return (
      <div className="as-game">
        <div className="as-summary">
          <div className="as-summary-icon" aria-hidden="true">&#127942;</div>
          <h1 className="as-summary-title">Summit Reached</h1>
          <p className="as-summary-flavor">Every camp cleared. You worked the whole climb yourself \u2014 that&rsquo;s Module 5.</p>

          <StarsRow stars={summaryData.stars} />

          <div className="as-summary-grid">
            <div className="as-summary-stat">
              <span className="as-summary-stat-label">Score</span>
              <span className="as-summary-stat-value">{summaryData.score}</span>
            </div>
            <div className="as-summary-stat">
              <span className="as-summary-stat-label">Accuracy</span>
              <span className="as-summary-stat-value">{summaryData.accuracy}%</span>
            </div>
            <div className="as-summary-stat">
              <span className="as-summary-stat-label">Mistakes</span>
              <span className="as-summary-stat-value">{summaryData.mistakes}</span>
            </div>
            <div className="as-summary-stat">
              <span className="as-summary-stat-label">Time</span>
              <span className="as-summary-stat-value">{formatTime(summaryData.completionTime)}</span>
            </div>
          </div>

          <div className="as-summary-breakdown">
            <div className="as-summary-breakdown-title">Mistakes by type</div>
            <div className="as-summary-breakdown-row"><span>Premature taps</span><span>{mt.premature}</span></div>
            <div className="as-summary-breakdown-row"><span>Distribute errors</span><span>{mt.tileError}</span></div>
            <div className="as-summary-breakdown-row"><span>Combine errors</span><span>{mt.combineError}</span></div>
            <div className="as-summary-breakdown-row"><span>Invalid common factor</span><span>{mt.invalidFactor}</span></div>
            <div className="as-summary-breakdown-row"><span>Sign errors</span><span>{mt.signError}</span></div>
            <div className="as-summary-breakdown-row"><span>Multiply/factor mix-ups</span><span>{mt.multiplyConfusion}</span></div>
            <div className="as-summary-breakdown-row"><span>Declared done too early</span><span>{mt.declaredEarly}</span></div>
            <div className="as-summary-breakdown-row"><span>Other mismatches</span><span>{mt.other}</span></div>
            <div className="as-summary-breakdown-row as-summary-breakdown-row--soft">
              <span>Non-maximal factor (not an error)</span><span>{sf.nonMaximal}</span>
            </div>
            <div className="as-summary-breakdown-row as-summary-breakdown-row--soft">
              <span>Unnecessary operation (not an error)</span><span>{sf.unnecessaryOperation}</span>
            </div>
          </div>

          {hardestTrail.length > 0 && (
            <div className="as-summary-trail">
              <div className="as-summary-trail-title">Your path up the hardest camp</div>
              <AscentTrailStrip trail={hardestTrail} />
            </div>
          )}

          <div className="as-summary-reward">
            <span className="as-summary-reward-icon" aria-hidden="true">&#128142;</span>
            <span>+{summaryData.rewardPoints} reward points</span>
          </div>

          {summaryData.badgeUnlocked && (
            <div className="as-summary-badge">
              <span className="as-summary-badge-icon" aria-hidden="true">&#127942;</span>
              <span>Badge unlocked: {summaryData.badgeUnlocked}</span>
            </div>
          )}

          <div className="as-summary-actions">
            <button type="button" className="as-btn as-btn--primary" onClick={handleReplay}>
              Play Again
            </button>
            {typeof onExit === 'function' && (
              <button type="button" className="as-btn as-btn--ghost" onClick={handleBackToDashboard}>
                Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------- RENDER: PLAYING / CAMP COMPLETE ------------------- */

  const activeBlock = camp.active ? camp.blocks.find((b) => b.id === camp.active.blockId) : null;
  const activeTiles = activeBlock
    ? (camp.active.kind === 'tile' ? activeBlock.tiles
      : camp.active.kind === 'nestedInner' ? activeBlock.innerTiles
        : activeBlock.outerTiles)
    : null;
  const firstUnfilledTileIdx = activeTiles ? activeTiles.findIndex((tl) => tl.status !== 'correct') : -1;

  return (
    <div className="as-game">
      <div className="as-hud">
        <div className="as-hud-stat">
          <span className="as-hud-label">Score</span>
          <span className="as-hud-value">{score}</span>
        </div>
        <div className="as-hud-stat">
          <span className="as-hud-label">Mistakes</span>
          <span className="as-hud-value">{totalMistakes}</span>
        </div>
        <div className="as-hud-stat">
          <span className="as-hud-label">Time</span>
          <span className="as-hud-value">{formatTime(elapsedTime)}</span>
        </div>
        {typeof onExit === 'function' && (
          <button type="button" className="as-hud-exit" onClick={onExit} aria-label="Exit game">
            &#10005;
          </button>
        )}
      </div>

      <CampProgress campIdx={levelIdx} totalCamps={LEVELS.length} tierIcon={TIER_META[level.tier].icon} />

      <div className="as-camp-badge">
        <span className="as-camp-badge-icon" aria-hidden="true">{TIER_META[level.tier].icon}</span>
        <span>{level.tierLabel}</span>
        <span className="as-camp-badge-prompt">{level.prompt}</span>
      </div>

      <AscentTrailStrip trail={camp.trail} />

      {phase === 'campComplete' && (
        <div className="as-camp-complete-banner">
          <div className="as-summit-flag" aria-hidden="true">
            <span className="as-summit-flag-pole" />
            <span className="as-summit-flag-cloth">&#127937;</span>
          </div>
          <span>Camp reached: {level.finalExpression}</span>
        </div>
      )}

      {phase === 'playing' && (
        <>
          <ExpressionBoard
            level={level}
            camp={camp}
            shakeId={shakeId}
            factorEligible={factorEligible}
            factorActive={camp.factorActive}
            onTapBracket={handleTapBracket}
            onTapNestedInner={handleTapNestedInner}
            onTapNestedOuter={handleTapNestedOuter}
            onTapTerm={handleTapTerm}
            onTapFactorArea={handleTapFactorArea}
          />

          {camp.feedback && (
            <div className={`as-feedback as-feedback--${camp.feedback.tone}`}>{camp.feedback.message}</div>
          )}

          {activeBlock && activeTiles && firstUnfilledTileIdx >= 0 && (
            <OptionsPanel
              options={activeTiles[firstUnfilledTileIdx].options}
              heading={`Tile ${firstUnfilledTileIdx + 1} of ${activeTiles.length}`}
              onSelect={(opt) => handleTileSelect(activeBlock.id, firstUnfilledTileIdx, camp.active.kind, opt)}
            />
          )}

          {camp.combineOptions && (
            <OptionsPanel
              options={camp.combineOptions.options}
              heading="These are like terms \u2014 combine them!"
              onSelect={handleCombineSelect}
            />
          )}

          {camp.factorActive && camp.factorStage === 'gcf' && (
            <>
              <div className="as-factor-instructions">Find the greatest common factor shared by every term.</div>
              <NumberPalette options={GCF_PALETTE} selected={camp.gcfValue} heading="Choose the shared factor" onSelect={handleGcfSelect} />
              {camp.gcfFeedback && camp.gcfFeedback.message && (
                <div className={`as-feedback as-feedback--${camp.gcfFeedback.tone}`}>{camp.gcfFeedback.message}</div>
              )}
              <div className="as-test-btn-row">
                <button type="button" className="as-btn as-btn--primary" disabled={camp.gcfValue == null} onClick={handleTestFactor}>
                  Test Factors
                </button>
              </div>
            </>
          )}

          {camp.factorActive && camp.factorStage === 'trinomial' && (
            <>
              <div className="as-factor-instructions">Find the two numbers that multiply to the constant and add to the middle coefficient.</div>
              <NumberPalette options={SIGNED_PALETTE} selected={camp.p} heading="Choose the first factor" onSelect={handlePSelect} />
              <NumberPalette options={SIGNED_PALETTE} selected={camp.q} heading="Choose the second factor" onSelect={handleQSelect} />
              {camp.trinomialFeedback && camp.trinomialFeedback.message && (
                <div className={`as-feedback as-feedback--${camp.trinomialFeedback.tone}`}>{camp.trinomialFeedback.message}</div>
              )}
              <div className="as-test-btn-row">
                <button type="button" className="as-btn as-btn--primary" disabled={camp.p == null || camp.q == null} onClick={handleTestFactor}>
                  Test Factors
                </button>
              </div>
            </>
          )}

          <div className="as-declare-row">
            <button
              type="button"
              className="as-btn as-btn--declare"
              disabled={!hasPerformedAnyAction && camp.trail.length === 0}
              onClick={handleDeclareDone}
            >
              &#127937; Declare Done
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Module5Game;