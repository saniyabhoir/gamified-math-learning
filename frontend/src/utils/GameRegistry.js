// frontend/src/utils/GameRegistry.js
// ─── Game Registry ─────────────────────────────────────────────────────────────
// Maps each module ID to its final game component and metadata.
// To add a new game: import the component + add an entry below. Nothing else changes.

import React, { lazy } from "react";

// ── Lazy-load games (code-split per module) ────────────────────────────────────
const LikeTermsMemoryMatch = lazy(() =>
  import("../components/games/LikeTermsMemoryMatch")
);

const Module2Game = lazy(() =>
  import("../components/games/Module2Game")
);

const Module3Game = lazy(() =>
  import("../components/games/Module3Game")
);

const Module4Game = lazy(() =>
  import("../components/games/Module4Game")
);

// ── Placeholder component for unbuilt games ────────────────────────────────────
const ComingSoonGame = ({ moduleId, onExit }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      gap: "1.5rem",
      textAlign: "center",
      color: "#e8edf4",
      fontFamily: "'Nunito', sans-serif",
    }}
  >
    <div style={{ fontSize: "4rem" }}>🚧</div>
    <h2
      style={{
        fontFamily: "'Cinzel', serif",
        fontSize: "1.8rem",
        color: "#e8a838",
      }}
    >
      Module {moduleId} Game
    </h2>
    <p style={{ color: "#6b7a99", maxWidth: 400, lineHeight: 1.6 }}>
      This game is coming soon! Check back after Module {moduleId - 1} is
      complete.
    </p>
    <button
      onClick={onExit}
      style={{
        padding: "0.8rem 2rem",
        background: "rgba(232,168,56,0.15)",
        border: "1px solid rgba(232,168,56,0.4)",
        borderRadius: "100px",
        color: "#e8a838",
        fontWeight: 700,
        fontSize: "0.9rem",
        cursor: "pointer",
      }}
    >
      ← Back to Dashboard
    </button>
  </div>
);

// ── Registry ───────────────────────────────────────────────────────────────────
// Each entry shape:
// {
//   component: React.ComponentType,   // receives { moduleId, onComplete, onExit }
//   gameId: string,                   // short unique key
//   title: string,                    // display name
//   description: string,
//   estimatedMinutes: number,
//   icon: string,                     // emoji
//   available: boolean,               // false = show Coming Soon
// }

export const GAME_REGISTRY = {
  1: {
    component: LikeTermsMemoryMatch,
    gameId: "like-terms-memory-match",
    title: "Like Terms Memory Match",
    description:
      "Flip cards to find matching like terms. Two rounds of increasing difficulty!",
    estimatedMinutes: 10,
    icon: "🍬",
    available: true,
  },
  2: {
    component: Module2Game,
    gameId: "module-2-game",
    title: "Expression Forge",
    description:
      "Repair the machine cell by cell: select like terms, then prove the simplified result yourself in the Forge Chamber. 10 curated levels, including interactive BODMAS and distribution.",
    estimatedMinutes: 12,
    icon: "🍎",
    available: true,
  },
  3: {
    component: Module3Game,
    gameId: "multiplication-arena",
    title: "Multiplication Arena",
    description:
      "Build blueprint grids tile by tile to master multiplying algebraic terms — from monomials to full binomial expansion.",
    estimatedMinutes: 12,
    icon: "🏗️",
    available: true,
  },
  4: {
    component: Module4Game,
    gameId: "blueprint-detective",
    title: "Blueprint Detective",
    description:
      "Reverse-engineer the factors behind a finished expression \u2014 crack common-factor and trinomial cases before the trail runs cold.",
    estimatedMinutes: 15,
    icon: "\uD83D\uDD0D",
    available: true,
  },
  5: {
    component: (props) => <ComingSoonGame {...props} moduleId={5} />,
    gameId: "bureau-grand-prix",
    title: "Bureau Grand Prix",
    description: "Multi-level capstone challenge — the ultimate algebra test.",
    estimatedMinutes: 20,
    icon: "🏆",
    available: false,
  },
};

// ── Lookup helpers ─────────────────────────────────────────────────────────────
export const getGameForModule = (moduleId) => {
  const id = parseInt(moduleId, 10);
  return GAME_REGISTRY[id] || null;
};

export const isGameAvailable = (moduleId) => {
  const entry = getGameForModule(moduleId);
  return entry?.available === true;
};