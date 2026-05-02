// frontend/src/pages/Dashboard.jsx
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import ModuleCard from "../components/common/ModuleCard";
import "./Dashboard.css";

// ─── Lazy module loader ────────────────────────────────────────────────────
// Dynamically imports module JSON. Falls back gracefully if file doesn't exist.
const MODULE_IDS = [1, 2, 3, 4, 5];

// Placeholder module data for modules without a JSON file yet
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

// ─── Progress storage helpers ──────────────────────────────────────────────
const getProgressKey = (userId, moduleId) => `mq_progress_u${userId}_m${moduleId}`;

const loadProgress = (userId, moduleId) => {
  try {
    const raw = localStorage.getItem(getProgressKey(userId, moduleId));
    return raw ? JSON.parse(raw) : { completedScreens: 0, totalPoints: 0 };
  } catch {
    return { completedScreens: 0, totalPoints: 0 };
  }
};

// ─── Stats summary bar ─────────────────────────────────────────────────────
const HeroStats = ({ modules, progressMap }) => {
  const totalXP = Object.values(progressMap).reduce(
    (sum, p) => sum + (p.totalPoints || 0),
    0
  );
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

  return (
    <div className="db-hero-stats">
      <div className="db-hero-stat">
        <span className="db-hero-stat-val">{totalXP.toLocaleString()}</span>
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
        <span className="db-hero-stat-lbl">Overall Progress</span>
      </div>
    </div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Load modules dynamically
  useEffect(() => {
    const loadModules = async () => {
      const results = [];
      for (const id of MODULE_IDS) {
        try {
          // Dynamic import — works with CRA's code splitting
          const data = await import(`../data/modules/module${id}.json`);
          results.push({ id, data: data.default || data });
        } catch {
          // Module JSON doesn't exist yet — use placeholder
          if (id === 1) {
            // Module 1 must exist; log a warning
            console.warn(`module${id}.json not found — using placeholder`);
          }
          results.push({ id, data: createPlaceholderModule(id) });
        }
      }
      setModules(results);
      setLoading(false);
    };

    loadModules();
  }, []);

  // Load progress for each module
  useEffect(() => {
    if (!user || modules.length === 0) return;
    const map = {};
    modules.forEach(({ id }) => {
      map[id] = loadProgress(user.id, id);
    });
    setProgressMap(map);
  }, [user, modules]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="db-root">
      {/* ── Animated background ── */}
      <div className="db-bg-fx" aria-hidden="true">
        <div className="db-orb db-orb-1" />
        <div className="db-orb db-orb-2" />
        <div className="db-orb db-orb-3" />
        <div className="db-grid-lines" />
      </div>

      {/* ── Navbar ── */}
      <nav className="db-nav" role="navigation" aria-label="Main navigation">
        <div className="db-nav-brand">
          <span className="db-nav-logo">⚡</span>
          <span className="db-nav-name">MathQuest</span>
        </div>

        <div className="db-nav-center" aria-hidden="true">
          <span className="db-nav-breadcrumb">Dashboard</span>
        </div>

        <div className="db-nav-right">
          <div className="db-nav-user" onClick={() => setMenuOpen((p) => !p)}>
            <span className="db-nav-avatar">{user?.avatar || "🧙"}</span>
            <span className="db-nav-username">{user?.displayName}</span>
            <span className="db-nav-chevron">{menuOpen ? "▴" : "▾"}</span>
          </div>

          {menuOpen && (
            <div className="db-nav-dropdown">
              <button
                className="db-nav-drop-item"
                onClick={handleLogout}
              >
                <span>🚪</span> Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ── Main content ── */}
      <main className="db-main" role="main">
        {/* Hero section */}
        <header className="db-hero">
          <div className="db-hero-text">
            <p className="db-hello">{greeting}, {user?.displayName} 👋</p>
            <h1 className="db-hero-title">Your Learning Dashboard</h1>
            <p className="db-hero-sub">
              Track your progress, master new concepts, and level up your math skills
            </p>
          </div>

          {modules.length > 0 && (
            <HeroStats modules={modules} progressMap={progressMap} />
          )}
        </header>

        {/* Section header */}
        <div className="db-section-header">
          <div>
            <h2 className="db-section-title">Available Modules</h2>
            <p className="db-section-sub">
              {modules.filter((m) => !m.data._placeholder).length} modules available
            </p>
          </div>
          <div className="db-filter-chips">
            <span className="db-chip db-chip--active">All</span>
            <span className="db-chip">In Progress</span>
            <span className="db-chip">Completed</span>
          </div>
        </div>

        {/* Module cards grid */}
        {loading ? (
          <div className="db-loading" role="status" aria-live="polite">
            <div className="db-loading-spinner" />
            <p>Loading your modules…</p>
          </div>
        ) : (
          <div className="db-cards-grid">
            {modules.map(({ id, data }, idx) => (
              <div
                key={id}
                className="db-card-wrapper"
                style={{ animationDelay: `${idx * 0.07}s` }}
              >
                <ModuleCard
                  moduleData={data}
                  moduleId={id}
                  progressData={progressMap[id] || {}}
                />
                {data._placeholder && (
                  <div className="db-card-locked-overlay" aria-label="Module coming soon">
                    <span className="db-card-lock-icon">🔐</span>
                    <span className="db-card-lock-text">Coming Soon</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="db-footer" role="contentinfo">
        <span>MathQuest © {new Date().getFullYear()}</span>
        <span className="db-footer-sep">·</span>
        <span>Gamified Learning Platform</span>
      </footer>
    </div>
  );
};

export default Dashboard;
