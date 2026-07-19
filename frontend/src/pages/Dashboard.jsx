// frontend/src/pages/Dashboard.jsx
import React, { useContext, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ModuleCard from "../components/common/ModuleCard";
import { getGameStatSummary } from "../utils/GameMatrics";
import { getMyProgress } from "../services/progressService";
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

// ─── Local progress cache (OPTIONAL, non-authoritative) ───────────────────────
// MongoDB (via GET /progress/student/:studentId) is now the single source of
// truth for the dashboard. ModulePage.jsx still mirrors its in-session state
// (current screen index, in-progress quiz accuracy, etc.) into this key so a
// student can resume mid-module on the SAME device — the backend Progress
// schema has no concept of "which screen am I on", only completed-module
// summaries. We only ever read this as a fallback for a module the backend
// doesn't have a record for yet; once the backend has an entry, it wins.
const getLocalProgressKey = (userId, moduleId) =>
  `mq_progress_u${userId}_m${moduleId}`;

const loadLocalProgressCache = (userId, moduleId) => {
  try {
    const raw = localStorage.getItem(getLocalProgressKey(userId, moduleId));
    return raw ? JSON.parse(raw) : { completedScreens: 0, totalPoints: 0 };
  } catch {
    return { completedScreens: 0, totalPoints: 0 };
  }
};

// ─── Offline-resilience cache for the last known backend progress ────────────
// Purely optional: if a fetch fails (e.g. flaky network), we show the last
// successful MongoDB response instead of an empty dashboard, clearly labelled
// as possibly-stale. This is never written to except right after a
// successful backend fetch, so it can never drift ahead of MongoDB.
const getBackendCacheKey = (userId) => `mq_backend_progress_cache_u${userId}`;

const saveBackendProgressCache = (userId, modules) => {
  try {
    localStorage.setItem(getBackendCacheKey(userId), JSON.stringify(modules));
  } catch {
    /* storage full or unavailable — non-critical */
  }
};

const loadBackendProgressCache = (userId) => {
  try {
    const raw = localStorage.getItem(getBackendCacheKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// ─── Hero Stats Bar ───────────────────────────────────────────────────────────
const HeroStats = ({ modules, progressMap, gameStats }) => {
  // Total XP comes entirely from MongoDB's per-module rewardPoints (see
  // progressMap above). The backend already folds Learning-flow and
  // Arcade-Game-flow rewards into that single field (taking the higher of
  // the two on save), so it must not be added to again here — doing so
  // would double-count XP for any module played both ways.
  const allXP = Object.values(progressMap).reduce(
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

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCard, setActiveCard] = useState(0);
  const deckRef = useRef(null);

  // ── Backend progress state (MongoDB is the source of truth) ─────────────
  // backendModules: the `modules` array from the Progress document, keyed
  //   later by moduleId. null until the first fetch resolves.
  // progressLoading: true while a fetch is in flight (initial load OR retry).
  // progressError: true if the most recent fetch failed.
  // usingCachedProgress: true if we're showing a previously-cached backend
  //   response because the live fetch failed (offline resilience only).
  const [backendModules, setBackendModules] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [progressError, setProgressError] = useState(false);
  const [usingCachedProgress, setUsingCachedProgress] = useState(false);

  // ── Fetch progress from MongoDB via the Progress API ─────────────────────
  const fetchProgress = useCallback(async () => {
    if (!user?.id) return;
    setProgressLoading(true);
    setProgressError(false);
    try {
      const data = await getMyProgress(user.id);
      const freshModules = data?.modules || [];
      setBackendModules(freshModules);
      setUsingCachedProgress(false);
      // Refresh the offline-resilience cache with this known-good response.
      saveBackendProgressCache(user.id, freshModules);
    } catch (err) {
      console.error("❌ Failed to load progress from backend:", err);
      // Fall back to the last successful response (if any) so the student
      // still sees something useful instead of a blank dashboard, while we
      // surface a retry banner so they know it may be out of date.
      const cached = loadBackendProgressCache(user.id);
      if (cached) {
        setBackendModules(cached);
        setUsingCachedProgress(true);
      }
      setProgressError(true);
    } finally {
      setProgressLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  // Re-sync whenever the student returns to this tab (e.g. after finishing
  // a module/game on another device, or the token refreshing after login).
  useEffect(() => {
    const handleFocus = () => fetchProgress();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchProgress]);

  // ── Merge backend progress with the optional local cache ─────────────────
  // For each module:
  //  - If MongoDB has a record, it always wins for completion/XP/accuracy.
  //  - completedScreens is only ever taken from MongoDB's `completed` flag
  //    (mapped to the full screen count) or, for a module MongoDB has no
  //    record of yet, from the local same-device "resume" cache — never the
  //    other way around, so a stale local cache can't override a real save.
  const progressMap = useMemo(() => {
    if (!user?.id || modules.length === 0 || backendModules === null) return {};
    const pm = {};
    for (const m of modules) {
      const totalScreens = m.data.total_screens || m.data.screens?.length || 0;
      const beMod = backendModules.find(
        (bm) => String(bm.moduleId) === String(m.id)
      );

      if (beMod) {
        pm[m.id] = {
          completedScreens: beMod.completed ? totalScreens : 0,
          totalPoints: beMod.rewardPoints || 0,
          quizAccuracy:
            typeof beMod.accuracy === "number" ? beMod.accuracy : null,
          mistakeLog: new Array(beMod.mistakes || 0).fill(null),
        };
      } else {
        // No backend record yet — fall back to the local same-device cache
        // purely so an in-progress (not-yet-completed) module still shows a
        // partial progress bar instead of resetting to 0.
        const local = loadLocalProgressCache(user.id, m.id);
        pm[m.id] = {
          completedScreens: Math.min(local.completedScreens || 0, totalScreens),
          totalPoints: local.totalPoints || 0,
          quizAccuracy: local.quizAccuracy ?? null,
          mistakeLog: local.mistakeLog || [],
        };
      }
    }
    return pm;
  }, [modules, user, backendModules]);

  // ── Game stats ─────────────────────────────────────────────────────────
  // NOTE (known limitation, see README): the backend Progress schema stores
  // one merged record per moduleId shared by both the Learning flow and the
  // Arcade Game flow, with no field distinguishing "this record came from a
  // game play". Game-specific display (stars/best score/badge) therefore
  // still reads the local per-device cache written by GamePage.jsx. This is
  // an intentional, documented cache — not a duplicate source of truth for
  // module completion/XP, which come entirely from MongoDB above.
  const gameStats = useMemo(() => {
    if (!user?.id || modules.length === 0) return {};
    const gm = {};
    for (const m of modules) {
      gm[m.id] = getGameStatSummary(user.id, m.id);
    }
    return gm;
  }, [modules, user]);

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

  // Show the full-page loader while modules load AND while the first
  // progress fetch is in flight (unless we already have a cached fallback
  // to show, in which case we render the dashboard with a stale-data banner
  // instead of blocking on the network).
  const initialProgressPending =
    progressLoading && backendModules === null;

  if (loading || initialProgressPending) {
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

      {/* ── Progress sync status ── */}
      {progressError && (
        <div className="db-progress-banner db-progress-banner--error">
          <span>
            ⚠️ Couldn't reach the server to load your latest progress
            {usingCachedProgress ? " — showing your last synced data." : "."}
          </span>
          <button
            className="db-progress-banner-retry"
            onClick={fetchProgress}
            disabled={progressLoading}
          >
            {progressLoading ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}
      {!progressError && usingCachedProgress && (
        <div className="db-progress-banner db-progress-banner--stale">
          <span>Showing cached progress from your last sync.</span>
          <button
            className="db-progress-banner-retry"
            onClick={fetchProgress}
            disabled={progressLoading}
          >
            {progressLoading ? "Syncing…" : "Sync now"}
          </button>
        </div>
      )}

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
