// frontend/src/pages/Dashboard.jsx
import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import ModuleCard from "../components/common/ModuleCard";
import { getGameStatSummary } from "../utils/GameMatrics";
import "./Dashboard.css";

// ─── Module IDs ────────────────────────────────────────────────────────────────
const MODULE_IDS = [1, 2, 3, 4, 5];

// ─── Placeholder for unbuilt modules ──────────────────────────────────────────
const createPlaceholderModule = (id) => ({
  module_title: `Module ${id}`,
  module_description: "This module is coming soon. Stay tuned for new content!",
  total_screens: 5,
  screens: [],
  module_rewards: {
    completion_badge: `Module ${id} Master`,
    completion_points: 100,
  },
  final_challenge: { title: "Coming Soon", description: "" },
  _placeholder: true,
});

// ─── Progress storage helpers ─────────────────────────────────────────────────
const getProgressKey = (userId, moduleId) =>
  `mq_progress_u${userId}_m${moduleId}`;

const loadProgress = (userId, moduleId) => {
  try {
    const raw = localStorage.getItem(getProgressKey(userId, moduleId));
    return raw ? JSON.parse(raw) : { completedScreens: 0, totalPoints: 0 };
  } catch {
    return { completedScreens: 0, totalPoints: 0 };
  }
};

// ─── Hero Stats Bar ───────────────────────────────────────────────────────────
const HeroStats = ({ modules, progressMap, gameStats }) => {
  const totalXP = Object.values(progressMap).reduce(
    (sum, p) => sum + (p.totalPoints || 0),
    0
  );
  const gameXP = Object.values(gameStats).reduce(
    (sum, g) => sum + (g?.rewardPoints || 0),
    0
  );
  const allXP = totalXP + gameXP;

  const completedModules = modules.filter((m) => {
    const p = progressMap[m.id] || {};
    const total = m.data.total_screens || 0;
    return total > 0 && (p.completedScreens || 0) >= total;
  }).length;

  const totalScreensAll = modules.reduce(
    (sum, m) => sum + (m.data.total_screens || 0),
    0
  );
  const completedScreensAll = Object.values(progressMap).reduce(
    (sum, p) => sum + (p.completedScreens || 0),
    0
  );
  const overallPct =
    totalScreensAll > 0
      ? Math.round((completedScreensAll / totalScreensAll) * 100)
      : 0;

  const totalGameStars = Object.values(gameStats).reduce(
    (sum, g) => sum + (g?.stars || 0),
    0
  );

  return (
    <div className="db-hero-stats">
      <div className="db-hero-stat">
        <span className="db-hero-stat-val">{allXP.toLocaleString()}</span>
        <span className="db-hero-stat-lbl">Total XP</span>
      </div>
      <div className="db-hero-stat-div" aria-hidden="true" />
      <div className="db-hero-stat">
        <span className="db-hero-stat-val">
          {completedModules}/{modules.length}
        </span>
        <span className="db-hero-stat-lbl">Modules Done</span>
      </div>
      <div className="db-hero-stat-div" aria-hidden="true" />
      <div className="db-hero-stat">
        <span className="db-hero-stat-val">{overallPct}%</span>
        <span className="db-hero-stat-lbl">Progress</span>
      </div>
      <div className="db-hero-stat-div" aria-hidden="true" />
      <div className="db-hero-stat">
        <span className="db-hero-stat-val">
          {totalGameStars > 0 ? `${totalGameStars}★` : "—"}
        </span>
        <span className="db-hero-stat-lbl">Game Stars</span>
      </div>
    </div>
  );
};

// ─── Deck pagination dots ──────────────────────────────────────────────────────
const DeckDots = ({ total, active }) => (
  <div className="db-deck-dots">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`db-deck-dot ${i === active ? "db-deck-dot--active" : ""}`}
      />
    ))}
  </div>
);

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [gameStats, setGameStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const deckRef = useRef(null);

  // ── Load all modules ─────────────────────────────────────────────────────
  useEffect(() => {
    const loadModules = async () => {
      const results = [];
      for (const id of MODULE_IDS) {
        try {
          const data = await import(`../data/modules/module${id}.json`);
          results.push({ id, data: data.default || data });
        } catch {
          results.push({ id, data: createPlaceholderModule(id) });
        }
      }
      setModules(results);
      setLoading(false);
    };
    loadModules();
  }, []);

  // ── Load progress + game stats ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || modules.length === 0) return;
    const pm = {};
    const gm = {};
    for (const m of modules) {
      pm[m.id] = loadProgress(user.id, m.id);
      gm[m.id] = getGameStatSummary(user.id, m.id);
    }
    setProgressMap(pm);
    setGameStats(gm);
  }, [modules, user]);

  // ── Track active card via scroll ──────────────────────────────────────────
  useEffect(() => {
    const deck = deckRef.current;
    if (!deck) return;
    const handleScroll = () => {
      const children = deck.querySelectorAll(".mc-card");
      let closest = 0;
      let minDist = Infinity;
      const deckCenter = deck.scrollLeft + deck.clientWidth / 2;
      children.forEach((child, i) => {
        const cardCenter = child.offsetLeft + child.offsetWidth / 2;
        const dist = Math.abs(deckCenter - cardCenter);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveCard(closest);
    };
    deck.addEventListener("scroll", handleScroll, { passive: true });
    return () => deck.removeEventListener("scroll", handleScroll);
  }, [modules]);

  // ── Close menu on outside click ───────────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => setMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  // ── Memoised user initials ────────────────────────────────────────────────
  const userInitial = useMemo(
    () => (user?.username || user?.name || "S")[0].toUpperCase(),
    [user]
  );
  const userName = user?.username || user?.name || "Student";

  if (loading) {
    return (
      <div className="db-root">
        <div className="db-bg-fx">
          <div className="db-orb db-orb-1" />
          <div className="db-orb db-orb-2" />
          <div className="db-orb db-orb-3" />
          <div className="db-grid-lines" />
        </div>
        <div className="db-loader">
          <div className="db-loader-spinner" />
          <p className="db-loader-text">Loading your academy…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="db-root" onClick={() => setMenuOpen(false)}>
      {/* ── Background ── */}
      <div className="db-bg-fx" aria-hidden="true">
        <div className="db-orb db-orb-1" />
        <div className="db-orb db-orb-2" />
        <div className="db-orb db-orb-3" />
        <div className="db-grid-lines" />
      </div>

      {/* ── Navbar ── */}
      <nav className="db-nav">
        <div className="db-nav-brand">
          <span className="db-nav-logo">🧮</span>
          <span className="db-nav-name">MathQuest</span>
        </div>
        <div className="db-nav-center">
          <span className="db-nav-breadcrumb">Academy Dashboard</span>
        </div>
        <div className="db-nav-right" onClick={(e) => e.stopPropagation()}>
          <button
            className="db-nav-user"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <span className="db-nav-avatar">👤</span>
            <span className="db-nav-username">{userName}</span>
            <span className="db-nav-chevron">{menuOpen ? "▲" : "▼"}</span>
          </button>
          {menuOpen && (
            <div className="db-nav-dropdown">
              <div className="db-nav-dropdown-user">
                <div className="db-nav-dropdown-avatar">{userInitial}</div>
                <div className="db-nav-dropdown-info">
                  <span className="db-nav-dropdown-name">{userName}</span>
                  <span className="db-nav-dropdown-role">Student</span>
                </div>
              </div>
              <div className="db-nav-dropdown-divider" />
              <button
                className="db-nav-dropdown-item db-nav-dropdown-item--danger"
                onClick={logout}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="db-main">
        {/* Welcome section */}
        <div className="db-welcome">
          <div className="db-welcome-text">
            <h1 className="db-welcome-title">
              Welcome back, <span className="db-welcome-name">{userName}</span>
            </h1>
            <p className="db-welcome-sub">
              Class 8 Algebra Academy · {modules.length} modules available
            </p>
          </div>
          <HeroStats
            modules={modules}
            progressMap={progressMap}
            gameStats={gameStats}
          />
        </div>

        {/* Section header */}
        <div className="db-section-header">
          <h2 className="db-section-title">Your Modules</h2>
          <p className="db-section-sub">
            {activeCard + 1} of {modules.length} · Scroll or swipe to explore
          </p>
        </div>

        {/* ── Card deck ── */}
        <div className="db-deck-wrapper">
          <div className="db-deck" ref={deckRef}>
            {modules.map((m) => (
              <ModuleCard
                key={m.id}
                moduleId={m.id}
                moduleData={m.data}
                progressData={progressMap[m.id] || {}}
              />
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <DeckDots total={modules.length} active={activeCard} />

        {/* Footer hint */}
        <p className="db-deck-hint">
          ← Scroll to explore all modules →
        </p>
      </main>
    </div>
  );
};

export default Dashboard;
