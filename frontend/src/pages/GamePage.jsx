// frontend/src/pages/GamePage.jsx
import React, { Suspense, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../src/context/AuthContext";
import { getGameForModule } from "../utils/GameRegistry";
import { saveGameResult } from "../utils/GameMatrics";
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

  const handleExit = () => navigate("/dashboard");

  const handleComplete = (result) => {
    // Persist result via standardised utility
    if (user?.id && result) {
      saveGameResult(user.id, result);
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
            moduleId={parseInt(moduleId, 10)}
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
