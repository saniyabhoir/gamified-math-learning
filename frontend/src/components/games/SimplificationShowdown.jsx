// // frontend/src/components/games/SimplificationShowdown.jsx
// // Module 2 · Simplification Showdown · Priya's Fruit Shop Quiz Arena
// // Standalone, dashboard-launchable, GamePage-compatible

// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { Routes, Route, Navigate, useParams } from "react-router-dom";
// import {
//   getModuleGames as getGameForModule,
//   moduleHasGame as isGameAvailable,
// } from '../../utils/GameRegistry';
// import './SimplificationShowdown.css';
// import { useNavigate } from "react-router-dom";

// // ─── Question Bank (15 questions: 6 easy, 6 medium, 3 hard) ─────────────────
// const QUESTION_BANK = {
//   easy: [
//     {
//       id: 'e1',
//       expression: '3x + 5x',
//       options: ['8x', '15x', '8', '35x'],
//       correctIndex: 0,
//       explanation: '3 + 5 = 8. Keep the variable: → 8x',
//       difficulty: 'easy',
//     },
//     {
//       id: 'e2',
//       expression: '7y − 3y',
//       options: ['4y', '10y', '4', '21y'],
//       correctIndex: 0,
//       explanation: '7 − 3 = 4. Variable stays: → 4y',
//       difficulty: 'easy',
//     },
//     {
//       id: 'e3',
//       expression: '4a + 2a',
//       options: ['42a', '6a', '6', '8a'],
//       correctIndex: 1,
//       explanation: '4 + 2 = 6. Keep the variable: → 6a',
//       difficulty: 'easy',
//     },
//     {
//       id: 'e4',
//       expression: '6x − x',
//       options: ['6', '5', '5x', '6x − 1'],
//       correctIndex: 2,
//       explanation: 'x alone means 1x. So 6x − 1x = 5x',
//       difficulty: 'easy',
//     },
//     {
//       id: 'e5',
//       expression: '2b + 8b + b',
//       options: ['10b', '11b', '11', '2b + 9b'],
//       correctIndex: 1,
//       explanation: 'b alone = 1b. So 2 + 8 + 1 = 11 → 11b',
//       difficulty: 'easy',
//     },
//     {
//       id: 'e6',
//       expression: '9m − 4m',
//       options: ['13m', '5', '94m', '5m'],
//       correctIndex: 3,
//       explanation: '9 − 4 = 5. Keep the variable: → 5m',
//       difficulty: 'easy',
//     },
//   ],
//   medium: [
//     {
//       id: 'm1',
//       expression: '4a + 2b + 3a − b',
//       options: ['7a + 3b', '7a + b', '9a − b', '7ab'],
//       correctIndex: 1,
//       explanation: 'a terms: 4a + 3a = 7a. b terms: 2b − b = b. → 7a + b',
//       difficulty: 'medium',
//     },
//     {
//       id: 'm2',
//       expression: '5x + 3y − 2x + y',
//       options: ['7x + 4y', '3x + 4y', '3x + 2y', '8xy'],
//       correctIndex: 1,
//       explanation: 'x: 5x − 2x = 3x. y: 3y + y = 4y. → 3x + 4y',
//       difficulty: 'medium',
//     },
//     {
//       id: 'm3',
//       expression: '6p − 2q + p + 3q',
//       options: ['5p + q', '7p − q', '7p + q', '7p + 5q'],
//       correctIndex: 2,
//       explanation: 'p: 6p + p = 7p. q: −2q + 3q = +q. → 7p + q',
//       difficulty: 'medium',
//     },
//     {
//       id: 'm4',
//       expression: '2a + 3b − a + 4b',
//       options: ['3a + 7b', 'a + 7b', 'a − 7b', '5ab'],
//       correctIndex: 1,
//       explanation: 'a: 2a − a = a. b: 3b + 4b = 7b. → a + 7b',
//       difficulty: 'medium',
//     },
//     {
//       id: 'm5',
//       expression: '3x + 2y + 4x − 3y',
//       options: ['7x + 5y', '7x + y', '7x − y', '9xy'],
//       correctIndex: 2,
//       explanation: 'x: 3x + 4x = 7x. y: 2y − 3y = −y. → 7x − y',
//       difficulty: 'medium',
//     },
//     {
//       id: 'm6',
//       expression: '8m − 3n + 2m + 5n',
//       options: ['6m + 2n', '10m − 2n', '10mn', '10m + 2n'],
//       correctIndex: 3,
//       explanation: 'm: 8m + 2m = 10m. n: −3n + 5n = 2n. → 10m + 2n',
//       difficulty: 'medium',
//     },
//   ],
//   hard: [
//     {
//       id: 'h1',
//       expression: '3x² + 2x + x² − 5x + 4',
//       options: ['4x² + 3x + 4', '4x² − 3x − 4', '3x² − 3x + 4', '4x² − 3x + 4'],
//       correctIndex: 3,
//       explanation: 'x²: 3+1=4x². x: 2−5=−3x. Constant stays 4. → 4x² − 3x + 4',
//       difficulty: 'hard',
//     },
//     {
//       id: 'h2',
//       expression: '2x² + 5x − x² + 3x − 2',
//       options: ['x² + 2x − 2', 'x² + 8x − 2', '3x² + 8x − 2', 'x² + 8x + 2'],
//       correctIndex: 1,
//       explanation: 'x²: 2−1=x². x: 5+3=8x. Constant: −2. → x² + 8x − 2',
//       difficulty: 'hard',
//     },
//     {
//       id: 'h3',
//       expression: '4a² + 3a − 2a² + a − 5',
//       options: ['2a² − 4a − 5', '6a² + 4a − 5', '2a² + 4a + 5', '2a² + 4a − 5'],
//       correctIndex: 3,
//       explanation: 'a²: 4−2=2a². a: 3+1=4a. Constant: −5. → 2a² + 4a − 5',
//       difficulty: 'hard',
//     },
//   ],
// };

// // ─── Session builder: 4 easy + 4 medium + 2 hard, shuffled ──────────────────
// const buildSession = () => {
//   const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
//   const easy   = shuffle(QUESTION_BANK.easy).slice(0, 4);
//   const medium = shuffle(QUESTION_BANK.medium).slice(0, 4);
//   const hard   = shuffle(QUESTION_BANK.hard).slice(0, 2);
//   return shuffle([...easy, ...medium, ...hard]);
// };

// // ─── Config constants ─────────────────────────────────────────────────────────
// const TIMER_DURATION    = 20;   // seconds per question
// const TOTAL_QUESTIONS   = 10;
// const CORRECT_POINTS    = 30;
// const FIRST_ATTEMPT_BONUS = 10;
// const WRONG_PENALTY     = 10;
// const OPTION_LABELS     = ['A', 'B', 'C', 'D'];
// const DIFFICULTY_META   = {
//   easy:   { label: 'Easy',   color: '#4ade80', dot: '🟢' },
//   medium: { label: 'Medium', color: '#f4a435', dot: '🟡' },
//   hard:   { label: 'Hard',   color: '#f87171', dot: '🔴' },
// };

// const calcStars = (correct) => {
//   if (correct >= 8) return 3;
//   if (correct >= 6) return 2;
//   return 1;
// };

// // ─── Priya's mid-session tip ──────────────────────────────────────────────────
// const PRIYA_TIP = {
//   heading: "Priya's Pro Tip! 📝",
//   body: "Group like terms first — same variable, same family! Unlike terms with different variables can NEVER combine. Half way there — stay focused!",
// };

// // ─────────────────────────────────────────────────────────────────────────────
// //  Main Component
// // ─────────────────────────────────────────────────────────────────────────────
// const SimplificationShowdown = ({ onComplete }) => {
//   const navigate = useNavigate();

//   // ── Stable session ─────────────────────────────────────────────────────────
//   const [session]       = useState(() => buildSession());
//   const [phase, setPhase] = useState('intro'); // intro | playing | feedback | tip | summary

//   // ── Rendering state ────────────────────────────────────────────────────────
//   const [qIndex, setQIndex]       = useState(0);
//   const [selectedIdx, setSelectedIdx] = useState(null);
//   const [wasCorrect, setWasCorrect]   = useState(null);
//   const [timerPct, setTimerPct]       = useState(100);
//   const [displayScore, setDisplayScore] = useState(0);
//   const [displayCorrect, setDisplayCorrect] = useState(0);
//   const [summaryData, setSummaryData] = useState(null);
//   const [cardAnim, setCardAnim]     = useState(false);

//   // ── Metrics ref (avoids stale-closure bugs on final computation) ───────────
//   const metricsRef = useRef({
//     score:        0,
//     correct:      0,
//     totalMistakes: 0,
//     mistakesByDiff: { easy: 0, medium: 0, hard: 0 },
//   });
//  const sessionStartRef = useRef(null);
// const questionStartRef = useRef(null);

// useEffect(() => {
//   sessionStartRef.current = Date.now();
//   questionStartRef.current = Date.now();
// }, []);
//   const timerRef         = useRef(null);

//   const currentQ = session[qIndex];

  
//   // ── Answer logic (internal, uses refs to avoid stale closures) ────────────
//   const handleAnswerInternal = useCallback((idx, timedOut = false) => {
//     stopTimer();
//     const q = session[qIndex];
//     const isCorrect = !timedOut && idx === q.correctIndex;

//     // Update metrics ref
//     if (isCorrect) {
//       metricsRef.current.score   += CORRECT_POINTS + FIRST_ATTEMPT_BONUS;
//       metricsRef.current.correct += 1;
//     } else {
//       metricsRef.current.score         = Math.max(0, metricsRef.current.score - WRONG_PENALTY);
//       metricsRef.current.totalMistakes += 1;
//       metricsRef.current.mistakesByDiff[q.difficulty] += 1;
//     }

//     // Update display state
//     setDisplayScore(metricsRef.current.score);
//     setDisplayCorrect(metricsRef.current.correct);
//     setSelectedIdx(timedOut ? -1 : idx);
//     setWasCorrect(isCorrect);
//     setPhase('feedback');
//   }, [session, qIndex, stopTimer]);


//   // ── Finish game (MOVE HERE BEFORE EFFECTS) ──
// const handleFinish = useCallback(() => {
//   const { score, correct, totalMistakes, mistakesByDiff } = metricsRef.current;

//   const completionTimeSeconds = Math.round(
//     (Date.now() - sessionStartRef.current) / 1000
//   );

//   const accuracy = Math.round((correct / TOTAL_QUESTIONS) * 100);
//   const earnedStars = calcStars(correct);
//   const rewardPoints = earnedStars * 30;
//   const badgeUnlocked = earnedStars === 3 ? 'Simplification Champion' : null;

//   const result = {
//     module: 2,
//     gameId: 'simplification-showdown',
//     score,
//     accuracy,
//     correct,
//     mistakes: totalMistakes,
//     mistakesByDifficulty: mistakesByDiff,
//     completionTimeSeconds,
//     starsEarned: earnedStars,
//     rewardPoints,
//     badgeUnlocked,
//     timestamp: new Date().toISOString(),
//   };

//   setSummaryData(result);
//   setPhase('summary');

//   if (typeof onComplete === 'function') {
//     setTimeout(() => onComplete(result), 100);
//   }
// }, [onComplete]);

//   // ── Timer ──────────────────────────────────────────────────────────────────
//   const stopTimer = useCallback(() => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//   }, []);

//   const startTimer = useCallback(() => {
//     stopTimer();
//     questionStartRef.current = Date.now();
//     setTimerPct(100);
//     timerRef.current = setInterval(() => {
//       const elapsed  = (Date.now() - questionStartRef.current) / 1000;
//       const fraction = Math.max(0, 1 - elapsed / TIMER_DURATION);
//       setTimerPct(fraction * 100);
//       if (fraction <= 0) {
//         stopTimer();
//         // Time's up — mark as wrong (pass -1 as timed-out sentinel)
//         handleAnswerInternal(null, true);
//       }
//     }, 60);
// }, [stopTimer, handleAnswerInternal]);// eslint-disable-line react-hooks/exhaustive-deps


//   // Public wrapper used by option buttons
//   const handleAnswer = useCallback((idx) => {
//     if (phase !== 'playing') return;
//     handleAnswerInternal(idx, false);
//   }, [phase, handleAnswerInternal]);

//   // ── Timer start/stop on phase change ──────────────────────────────────────
//  useEffect(() => {
//   if (phase !== 'playing') {
//     stopTimer();
//     return;
//   }

//   startTimer();

//   const id = requestAnimationFrame(() => {
//     setCardAnim(true);
//   });

//   return () => {
//     cancelAnimationFrame(id);
//     stopTimer();
//   };
// }, [phase, qIndex, startTimer, stopTimer]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Auto-advance after feedback (2 seconds) ───────────────────────────────
//   useEffect(() => {
//     if (phase !== 'feedback') return;
//     const tid = setTimeout(() => {
//       const nextIndex = qIndex + 1;
//       if (nextIndex >= TOTAL_QUESTIONS) {
//         handleFinish();
//       } else if (nextIndex === 5) {
//         // Show Priya's tip before Q6
//         setQIndex(nextIndex);
//         setSelectedIdx(null);
//         setWasCorrect(null);
//         setPhase('tip');
//       } else {
//         setQIndex(nextIndex);
//         setSelectedIdx(null);
//         setWasCorrect(null);
//         setPhase('playing');
//       }
//     }, 2000);
//     return () => clearTimeout(tid);
//   }, [phase, qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Tip auto-dismiss (3 seconds) ─────────────────────────────────────────
//   useEffect(() => {
//     if (phase !== 'tip') return;
//     const tid = setTimeout(() => {
//       setSelectedIdx(null);
//       setWasCorrect(null);
//       setPhase('playing');
//     }, 3000);
//     return () => clearTimeout(tid);
//   }, [phase]);

//   // ── Finish game ────────────────────────────────────────────────────────────
//   const handleFinish = useCallback(() => {
//     const { score, correct, totalMistakes, mistakesByDiff } = metricsRef.current;
//     const completionTimeSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
//     const accuracy      = Math.round((correct / TOTAL_QUESTIONS) * 100);
//     const earnedStars   = calcStars(correct);
//     const rewardPoints  = earnedStars * 30;
//     const badgeUnlocked = earnedStars === 3 ? 'Simplification Champion' : null;

//     const result = {
//       module:           2,
//       gameId:           'simplification-showdown',
//       score,
//       accuracy,
//       correct,
//       mistakes:         totalMistakes,
//       mistakesByDifficulty: mistakesByDiff,
//       completionTimeSeconds,
//       starsEarned:      earnedStars,
//       rewardPoints,
//       badgeUnlocked,
//       zoneBreakdown:    null,
//       timestamp:        new Date().toISOString(),
//     };

//     // Increment replay count if re-playing
//     try {
//       const prev = JSON.parse(localStorage.getItem('mod2_result') || '{}');
//       result.replayCount = (prev.replayCount || 0) + 1;
//     } catch {
//       result.replayCount = 1;
//     }

//     // Save via registry util (also writes raw to mod2_result key)
//     saveGameResult('simplification-showdown', result);

//     setSummaryData(result);
//     setPhase('summary');

//     if (typeof onComplete === 'function') {
//       setTimeout(() => onComplete(result), 100);
//     }
//   }, [onComplete]);

//   // ── Navigation helpers ─────────────────────────────────────────────────────
//   const handleBack = () => {
//     try { navigate('/dashboard'); } catch { window.history.back(); }
//   };

//   const handleReplay = () => {
//     // Reset all state for a clean replay
//     metricsRef.current = { score: 0, correct: 0, totalMistakes: 0, mistakesByDiff: { easy: 0, medium: 0, hard: 0 } };
//     sessionStartRef.current = Date.now();
//     setDisplayScore(0);
//     setDisplayCorrect(0);
//     setQIndex(0);
//     setSelectedIdx(null);
//     setWasCorrect(null);
//     setTimerPct(100);
//     setSummaryData(null);
//     setPhase('playing');
//   };

//   // ─────────────────────────────────────────────────────────────────────────
//   //  RENDER: INTRO
//   // ─────────────────────────────────────────────────────────────────────────
//   if (phase === 'intro') {
//     return (
//       <div className="ss-root" role="main">
//         <div className="ss-bg-deco" aria-hidden="true">
//           <div className="ss-orb ss-orb-1" />
//           <div className="ss-orb ss-orb-2" />
//           <div className="ss-orb ss-orb-3" />
//           <div className="ss-grid-lines" />
//         </div>

//         <div className="ss-intro-card">
//           <div className="ss-intro-shop-banner">
//             <span className="ss-shop-fruits" aria-hidden="true">🍎 🍋 🍊 🍇</span>
//             <span className="ss-module-pill">Module 2 · Algebra</span>
//           </div>

//           <h1 className="ss-intro-title">
//             <span className="ss-title-line1">Simplification</span>
//             <span className="ss-title-line2">Showdown</span>
//           </h1>
//           <p className="ss-intro-subtitle">Priya's Fruit Shop · Quiz Arena</p>

//           <div className="ss-rules-board" role="list" aria-label="Game rules">
//             <div className="ss-rule-item" role="listitem">
//               <span className="ss-rule-icon" aria-hidden="true">⚡</span>
//               <span className="ss-rule-text">10 questions · 20 seconds each</span>
//             </div>
//             <div className="ss-rule-item" role="listitem">
//               <span className="ss-rule-icon" aria-hidden="true">✅</span>
//               <span className="ss-rule-text">+30 pts correct · +10 first-attempt bonus</span>
//             </div>
//             <div className="ss-rule-item" role="listitem">
//               <span className="ss-rule-icon" aria-hidden="true">❌</span>
//               <span className="ss-rule-text">−10 pts wrong · explanation shown instantly</span>
//             </div>
//             <div className="ss-rule-item" role="listitem">
//               <span className="ss-rule-icon" aria-hidden="true">🏆</span>
//               <span className="ss-rule-text">8+ correct = 3 Stars + Champion Badge!</span>
//             </div>
//           </div>

//           <div className="ss-difficulty-spread" aria-label="Question difficulty split">
//             <div className="ss-diff-chip ss-diff-chip--easy">
//               <span>🟢</span>
//               <span>4 Easy</span>
//             </div>
//             <div className="ss-diff-chip ss-diff-chip--medium">
//               <span>🟡</span>
//               <span>4 Medium</span>
//             </div>
//             <div className="ss-diff-chip ss-diff-chip--hard">
//               <span>🔴</span>
//               <span>2 Hard</span>
//             </div>
//           </div>

//           <button
//             className="ss-start-btn"
//             onClick={() => { sessionStartRef.current = Date.now(); setPhase('playing'); }}
//             aria-label="Start the Simplification Showdown"
//           >
//             Start Showdown ⚡
//           </button>

//           <button className="ss-back-link" onClick={handleBack} aria-label="Back to dashboard">
//             ← Back to Dashboard
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   //  RENDER: PRIYA'S TIP
//   // ─────────────────────────────────────────────────────────────────────────
//   if (phase === 'tip') {
//     return (
//       <div className="ss-root" role="main">
//         <div className="ss-bg-deco" aria-hidden="true">
//           <div className="ss-orb ss-orb-1" />
//           <div className="ss-orb ss-orb-2" />
//         </div>
//         <div className="ss-tip-card" role="status" aria-live="polite">
//           <div className="ss-tip-note-lines" aria-hidden="true" />
//           <div className="ss-tip-inner">
//             <span className="ss-tip-avatar" aria-hidden="true">👩‍🍳</span>
//             <h2 className="ss-tip-heading">{PRIYA_TIP.heading}</h2>
//             <p className="ss-tip-body">{PRIYA_TIP.body}</p>
//             <div className="ss-tip-progress-line">
//               <span className="ss-tip-prog-label">5 done</span>
//               <div className="ss-tip-prog-bar">
//                 <div className="ss-tip-prog-fill" style={{ width: '50%' }} />
//               </div>
//               <span className="ss-tip-prog-label">5 to go!</span>
//             </div>
//             <span className="ss-tip-autodismiss">Continuing in 3s…</span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   //  RENDER: PLAYING + FEEDBACK
//   // ─────────────────────────────────────────────────────────────────────────
//   if (phase === 'playing' || phase === 'feedback') {
//     const q = currentQ;
//     const diffMeta = DIFFICULTY_META[q.difficulty];

//     // Timer colour: green → amber → red
//     const timerColor =
//       timerPct > 50 ? '#2D8C4E' : timerPct > 25 ? '#F4A435' : '#e53935';

//     // Progress dots
//     const progressDots = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
//       if (i < qIndex) return 'done';
//       if (i === qIndex) return 'current';
//       return 'pending';
//     });

//     return (
//       <div className="ss-root" role="main">
//         <div className="ss-bg-deco" aria-hidden="true">
//           <div className="ss-orb ss-orb-1" />
//           <div className="ss-orb ss-orb-2" />
//           <div className="ss-orb ss-orb-3" />
//         </div>

//         {/* ── HUD ──────────────────────────────────────────────────────── */}
//         <header className="ss-hud" role="banner">
//           <div className="ss-hud-stat">
//             <span className="ss-hud-label">Score</span>
//             <span className="ss-hud-val" aria-live="polite" aria-label={`Score: ${displayScore}`}>
//               {displayScore}
//             </span>
//           </div>

//           <div className="ss-hud-center">
//             <span className="ss-hud-q-label" aria-label={`Question ${qIndex + 1} of ${TOTAL_QUESTIONS}`}>
//               Q {qIndex + 1} <span aria-hidden="true">/ {TOTAL_QUESTIONS}</span>
//             </span>
//             <div className="ss-progress-dots" role="list" aria-label="Question progress">
//               {progressDots.map((status, i) => (
//                 <span
//                   key={i}
//                   role="listitem"
//                   className={`ss-dot ss-dot--${status}`}
//                   aria-label={`Question ${i + 1}: ${status}`}
//                 />
//               ))}
//             </div>
//           </div>

//           <div className="ss-hud-stat">
//             <span className="ss-hud-label">Correct</span>
//             <span className="ss-hud-val" aria-live="polite" aria-label={`${displayCorrect} correct`}>
//               {displayCorrect} <span className="ss-hud-check" aria-hidden="true">✓</span>
//             </span>
//           </div>
//         </header>

//         {/* ── Timer bar ─────────────────────────────────────────────────── */}
//         <div
//           className="ss-timer-track"
//           role="progressbar"
//           aria-valuemin={0}
//           aria-valuemax={100}
//           aria-valuenow={Math.round(timerPct)}
//           aria-label="Time remaining"
//         >
//           <div
//             className="ss-timer-fill"
//             style={{
//               width: `${timerPct}%`,
//               background: timerColor,
//               boxShadow: `0 0 12px ${timerColor}80`,
//               transition: phase === 'playing'
//                 ? 'width 0.06s linear, background 0.4s ease, box-shadow 0.4s ease'
//                 : 'none',
//             }}
//           />
//         </div>

//         {/* ── Game area ────────────────────────────────────────────────── */}
//         <div className="ss-game-area">

//           {/* Question card */}
//           <div
//             className={[
//               'ss-question-card',
//               cardAnim ? 'ss-question-card--in' : '',
//               phase === 'feedback' && wasCorrect  ? 'ss-question-card--correct' : '',
//               phase === 'feedback' && !wasCorrect ? 'ss-question-card--wrong'   : '',
//             ].join(' ')}
//             aria-live="polite"
//           >
//             {/* Card meta row */}
//             <div className="ss-card-meta">
//               <span className="ss-chalk-tag" aria-hidden="true">Today's Challenge</span>
//               <span
//                 className="ss-difficulty-badge"
//                 style={{ color: diffMeta.color, borderColor: `${diffMeta.color}40` }}
//                 aria-label={`Difficulty: ${diffMeta.label}`}
//               >
//                 {diffMeta.dot} {diffMeta.label}
//               </span>
//             </div>

//             {/* Expression */}
//             <div className="ss-expression-block">
//               <span className="ss-simplify-prompt">Simplify:</span>
//               <div
//                 className="ss-expression"
//                 aria-label={`Simplify the expression: ${q.expression}`}
//               >
//                 {q.expression}
//               </div>
//             </div>

//             {/* Feedback banner */}
//             {phase === 'feedback' && (
//               <div
//                 className={`ss-feedback-strip ${wasCorrect ? 'ss-feedback-strip--ok' : 'ss-feedback-strip--err'}`}
//                 role="status"
//                 aria-live="assertive"
//               >
//                 {wasCorrect ? (
//                   <span>✅ Correct! <strong>+{CORRECT_POINTS + FIRST_ATTEMPT_BONUS} pts</strong></span>
//                 ) : (
//                   <span>
//                     {selectedIdx === -1 ? "⏱ Time's up!" : '❌ Not quite!'}&nbsp;
//                     Answer: <strong>{q.options[q.correctIndex]}</strong>
//                   </span>
//                 )}
//               </div>
//             )}

//             {/* Explanation (wrong only) */}
//             {phase === 'feedback' && !wasCorrect && (
//               <div className="ss-explanation" aria-live="polite">
//                 <span className="ss-exp-icon" aria-hidden="true">💡</span>
//                 <span>{q.explanation}</span>
//               </div>
//             )}
//           </div>

//           {/* ── Options grid ─────────────────────────────────────────── */}
//           <div className="ss-options-grid" role="group" aria-label="Answer options">
//             {q.options.map((opt, i) => {
//               const isCorrectOpt  = i === q.correctIndex;
//               const isSelected    = i === selectedIdx;
//               const isDisabled    = phase === 'feedback';

//               let mod = '';
//               if (phase === 'feedback') {
//                 if (isCorrectOpt) mod = 'ss-opt--correct';
//                 else if (isSelected) mod = 'ss-opt--wrong';
//                 else mod = 'ss-opt--dim';
//               } else if (isSelected) {
//                 mod = 'ss-opt--selected';
//               }

//               return (
//                 <button
//                   key={i}
//                   className={`ss-option-btn ${mod}`}
//                   onClick={() => handleAnswer(i)}
//                   disabled={isDisabled}
//                   aria-label={`Option ${OPTION_LABELS[i]}: ${opt}${phase === 'feedback' && isCorrectOpt ? ' (correct answer)' : ''}`}
//                 >
//                   <span className="ss-opt-letter" aria-hidden="true">
//                     {OPTION_LABELS[i]}
//                   </span>
//                   <span className="ss-opt-text">{opt}</span>
//                   {phase === 'feedback' && isCorrectOpt && (
//                     <span className="ss-opt-tick" aria-hidden="true">✓</span>
//                   )}
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   //  RENDER: SUMMARY
//   // ─────────────────────────────────────────────────────────────────────────
//   if (phase === 'summary' && summaryData) {
//     const {
//       score, accuracy, correct, mistakes: totalMistakes,
//       mistakesByDifficulty, starsEarned, rewardPoints,
//       badgeUnlocked, completionTimeSeconds,
//     } = summaryData;

//     const mins    = Math.floor(completionTimeSeconds / 60);
//     const secs    = String(completionTimeSeconds % 60).padStart(2, '0');
//     const headline =
//       starsEarned === 3 ? '🏆 Champion!' :
//       starsEarned === 2 ? '⭐ Great Job!' : '💪 Keep Practising!';

//     return (
//       <div className="ss-root" role="main">
//         <div className="ss-bg-deco" aria-hidden="true">
//           <div className="ss-orb ss-orb-1" />
//           <div className="ss-orb ss-orb-2" />
//           <div className="ss-orb ss-orb-3" />
//         </div>

//         <div className="ss-summary-card" role="region" aria-label="Game summary">

//           {/* Header */}
//           <div className="ss-summary-header">
//             <span className="ss-module-pill">Module 2 Complete</span>
//             <h1 className="ss-summary-headline" aria-label={headline}>
//               {headline}
//             </h1>
//             <div className="ss-stars-row" aria-label={`${starsEarned} out of 3 stars earned`}>
//               {[1, 2, 3].map((s) => (
//                 <span
//                   key={s}
//                   className={`ss-star ${s <= starsEarned ? 'ss-star--lit' : 'ss-star--dim'}`}
//                   aria-hidden="true"
//                   style={{ animationDelay: `${(s - 1) * 0.15}s` }}
//                 >
//                   ★
//                 </span>
//               ))}
//             </div>
//           </div>

//           {/* Stats grid */}
//           <div className="ss-stats-grid" role="list" aria-label="Your statistics">
//             {[
//               { icon: '⚡', val: score,            lbl: 'Score',    accent: '#F4A435' },
//               { icon: '🎯', val: `${accuracy}%`,   lbl: 'Accuracy', accent: '#2D8C4E' },
//               { icon: '✅', val: `${correct}/${TOTAL_QUESTIONS}`, lbl: 'Correct', accent: '#4ade80' },
//               { icon: '⏱', val: `${mins}:${secs}`, lbl: 'Time',    accent: '#60a5fa' },
//             ].map(({ icon, val, lbl, accent }) => (
//               <div key={lbl} className="ss-sstat" role="listitem" style={{ '--accent': accent }}>
//                 <span className="ss-sstat-icon" aria-hidden="true">{icon}</span>
//                 <span className="ss-sstat-val" aria-label={`${lbl}: ${val}`}>{val}</span>
//                 <span className="ss-sstat-lbl">{lbl}</span>
//               </div>
//             ))}
//           </div>

//           {/* Reward points bar */}
//           <div className="ss-rp-banner" aria-label={`${rewardPoints} reward points earned`}>
//             <span className="ss-rp-label">Reward Points Earned</span>
//             <span className="ss-rp-val">+{rewardPoints} RP</span>
//           </div>

//           {/* Badge */}
//           {badgeUnlocked && (
//             <div className="ss-badge-row" role="region" aria-label="Badge unlocked">
//               <div className="ss-badge-icon-wrap">
//                 <span className="ss-badge-emoji" aria-hidden="true">🏆</span>
//                 <div className="ss-badge-glow" aria-hidden="true" />
//               </div>
//               <div className="ss-badge-text">
//                 <span className="ss-badge-acquired">Badge Unlocked!</span>
//                 <span className="ss-badge-name">{badgeUnlocked}</span>
//               </div>
//             </div>
//           )}

//           {/* Difficulty breakdown */}
//           <div className="ss-breakdown-section" role="region" aria-label="Performance by difficulty">
//             <h2 className="ss-breakdown-title">Performance by Difficulty</h2>
//             {[
//               { diff: 'easy',   label: 'Easy',   dot: '🟢', mistakes: mistakesByDifficulty?.easy   || 0 },
//               { diff: 'medium', label: 'Medium', dot: '🟡', mistakes: mistakesByDifficulty?.medium || 0 },
//               { diff: 'hard',   label: 'Hard',   dot: '🔴', mistakes: mistakesByDifficulty?.hard   || 0 },
//             ].map(({ diff, label, dot, mistakes: m }) => (
//               <div key={diff} className="ss-breakdown-row">
//                 <span className="ss-bd-label" aria-label={label}>{dot} {label}</span>
//                 <div className="ss-bd-bar-track">
//                   <div
//                     className="ss-bd-bar-fill"
//                     style={{
//                       width: m === 0 ? '100%' : `${Math.max(10, 100 - m * 25)}%`,
//                       background: m === 0 ? '#2D8C4E' : m <= 1 ? '#F4A435' : '#e53935',
//                     }}
//                     aria-hidden="true"
//                   />
//                 </div>
//                 <span className="ss-bd-mistakes" aria-label={`${m} mistake${m !== 1 ? 's' : ''}`}>
//                   {m === 0 ? '✓ Perfect' : `${m} mistake${m !== 1 ? 's' : ''}`}
//                 </span>
//               </div>
//             ))}
//           </div>

//           {/* Actions */}
//           <div className="ss-summary-actions">
//             <button className="ss-replay-btn" onClick={handleReplay} aria-label="Play again">
//               🔄 Play Again
//             </button>
//             <button className="ss-dash-btn" onClick={handleBack} aria-label="Return to dashboard">
//               🏠 Dashboard
//             </button>
//           </div>

//           <p className="ss-save-note" aria-hidden="true">
//             Progress saved · Performance logged for revision
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return null;
// };

// export default SimplificationShowdown;
