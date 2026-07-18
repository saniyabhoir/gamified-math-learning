// frontend/src/pages/GamePage.jsx
import React, { Suspense, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../src/context/AuthContext";
import { getGameForModule } from "../utils/GameRegistry";
import { saveGameResult } from "../utils/GameMatrics";
import { saveProgressToBackend } from "../services/progressService";
import "./GamePage.css";

// ── Loading fallback ───────────────────────────────────────────────────────────
const GameLoader = () => (
  <div className="gp-loader">
    <div className="gp-loader-spinner" />
    <p className="gp-loader-text">Loading game…</p>
  </div>
);

// ── Not found screen ───────────────────────────────────────────────────────────
const GameNotFound = ({ moduleId, onBack }) => (
  <div className="gp-notfound">
    <span className="gp-notfound-icon">🎮</span>
    <h2 className="gp-notfound-title">No Game Found</h2>
    <p className="gp-notfound-sub">
      Module {moduleId} doesn't have a game available yet.
    </p>
    <button className="gp-back-btn" onClick={onBack}>
      ← Back to Dashboard
    </button>
  </div>
);

// ── Main GamePage ──────────────────────────────────────────────────────────────
const GamePage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const gameEntry = getGameForModule(moduleId);
  const parsedModuleId = parseInt(moduleId, 10);

  // Guard against duplicate MongoDB writes if onComplete somehow fires
  // more than once for the same play-through (e.g. a fast double-tap).
  const backendSavedRef = useRef(false);

  const handleExit = () => navigate("/dashboard");

  const handleComplete = async (result) => {
    // Local cache layer — fast dashboard reads, offline resilience.
    if (user?.id && result) {
      saveGameResult(user.id, result);
    }

    // FIX: previously the arcade-game flow never told the backend anything,
    // so MongoDB (and the Teacher Dashboard) had zero record of completed
    // games. Now it goes through the same saveProgressToBackend() call the
    // Learning flow uses, so there is one save path / one endpoint / one
    // MongoDB write shape for both flows — guarded so it fires at most once
    // per play-through.
    if (result && !backendSavedRef.current) {
      backendSavedRef.current = true;

      await saveProgressToBackend({
        moduleId: result.moduleId ?? parsedModuleId,
        moduleTitle: gameEntry?.title || `Module ${parsedModuleId}`,
        gameId: result.gameId || gameEntry?.gameId,
        score: result.score,
        accuracy: result.accuracy,
        mistakes: result.mistakes,
        completionTime: result.completionTime,
        stars: result.stars,
        rewardPoints: result.rewardPoints,
        completed: true,
        weakTopics: [],
        playedAt: result.completedAt || new Date(),
      });
    }

    // Brief delay then return to dashboard so result state settles
    setTimeout(() => navigate("/dashboard"), 300);
  };

  if (!gameEntry) {
    return (
      <div className="gp-root">
        <GameNotFound moduleId={moduleId} onBack={handleExit} />
      </div>
    );
  }

  const GameComponent = gameEntry.component;

  return (
    <div className="gp-root">
      {/* Minimal top bar */}
      <nav className="gp-nav">
        <button className="gp-nav-back" onClick={handleExit}>
          ← Dashboard
        </button>
        <div className="gp-nav-title">
          <span className="gp-nav-icon">{gameEntry.icon}</span>
          <span>{gameEntry.title}</span>
        </div>
        <div className="gp-nav-spacer" />
      </nav>

      {/* Game canvas */}
      <main className="gp-canvas">
        <Suspense fallback={<GameLoader />}>
          <GameComponent
            moduleId={parsedModuleId}
            userId={user?.id}
            onComplete={handleComplete}
            onExit={handleExit}
          />
        </Suspense>
      </main>
    </div>
  );
};

export default GamePage;
