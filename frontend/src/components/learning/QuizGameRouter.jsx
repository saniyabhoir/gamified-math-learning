// frontend/src/components/learning/QuizGameRouter.jsx
//
// Drop-in replacement for <QuizCard />. Same three props in, same two
// callbacks out — this file just decides *which* themed mini-game renders
// the current screen's quiz_questions, based on moduleId.
//
// To roll out a new module's game: import it below and add one line to
// GAME_COMPONENTS. Any module not listed here still renders the original
// QuizCard, so partial rollout is always safe.
//
// Props (identical to QuizCard):
//   moduleId       — number, e.g. 2  (NEW — this is the only prop ModulePage.jsx needs to start passing)
//   screenData     — the current screen object (contains quiz_questions, reward, etc.)
//   onComplete(score, totalPossiblePoints)
//   onAnswerLogged(answerData)

import React from "react";
import QuizCard from "./QuizCard";
import TermGroveHarvest from "../games/TermGroveHarvest";

const GAME_COMPONENTS = {
  2: TermGroveHarvest,
  // 1: KeySlingshot,        // not built yet — falls back to QuizCard
  // 3: GridForge,           // not built yet — falls back to QuizCard
  // 4: FormulaCauldron,     // not built yet — falls back to QuizCard
  // 5: MissionRelayRun,     // not built yet — falls back to QuizCard
};

const QuizGameRouter = ({ moduleId, screenData, onComplete, onAnswerLogged }) => {
  const GameComponent = GAME_COMPONENTS[Number(moduleId)] || QuizCard;

  return (
    <GameComponent
      screenData={screenData}
      onComplete={onComplete}
      onAnswerLogged={onAnswerLogged}
    />
  );
};

export default QuizGameRouter;
