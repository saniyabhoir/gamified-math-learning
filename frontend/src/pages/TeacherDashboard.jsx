// frontend/src/pages/TeacherDashboard.jsx
// FIXES:
//  1. Missing topbar (navbar) — added with user info + logout
//  2. Missing sidebar navigation
//  3. No refresh button — added with loading spinner
//  4. No weak-topics section — added
//  5. No student detail modal — added
//  6. fetchAnalytics called even without token check was incomplete — fixed
//  7. Error shown in all three panels simultaneously — fixed (only overview shows error)
//  8. Missing clock / live time display
//  9. analyticsHelpers.js was empty — logic inlined here
//
// ANALYTICS UPDATE (Teacher Dashboard Analytics Implementation):
//  10. Added Leaderboard (new nav section), Students Requiring Attention and
//      Recent Student Activity (Overview widgets), all derived client-side
//      from the `students` data already fetched here — no extra API calls.
//  11. Student detail modal now also shows Avg Stars (backed by the new
//      per-student `avgStars` field from GET /analytics/students).

import React, { useContext, useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../services/authService";
import OverviewCards   from "../components/teacher/OverviewCards";
import StudentsTable   from "../components/teacher/StudentsTable";
import ModuleAnalytics from "../components/teacher/ModuleAnalytics";
import Leaderboard      from "../components/teacher/Leaderboard";
import AttentionPanel   from "../components/teacher/AttentionPanel";
import RecentActivity   from "../components/teacher/RecentActivity";
import AnalyticsCharts  from "../components/teacher/charts/AnalyticsCharts";
import InsightsPanel    from "../components/teacher/InsightsPanel";
import ExportButtons    from "../components/teacher/ExportButtons";
import ModuleDetailCard from "../components/teacher/ModuleDetailCard";
import { computeStudentHighlights } from "../utils/studentAnalytics";
import { formatMinutes } from "../utils/formatTime";
import { motion, AnimatePresence } from "framer-motion";
import "./TeacherDashboard.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getInitials = (name) => {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
};

const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// ── Student Detail Modal ───────────────────────────────────────────────────────

const StudentModal = ({ student, onClose }) => {
  if (!student) return null;

  // ANALYTICS UPDATE: richer, derived-from-real-data statistics (see
  // utils/studentAnalytics.js#computeStudentHighlights) — highest/lowest
  // module score, best/weakest module, longest session, total XP,
  // current streak (from playedAt dates), completion percentage.
  const highlights = computeStudentHighlights(student);
  const modules = student.modules || [];

  return (
    <div className="td-modal-backdrop" onClick={onClose}>
      <motion.div
        className="td-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="td-modal-header">
          <div className="td-modal-student-info">
            <div className="td-modal-avatar">{getInitials(student.name)}</div>
            <div>
              <h3 className="td-modal-student-name">{student.name}</h3>
              <p className="td-modal-student-meta">{student.email || "No email"}</p>
            </div>
          </div>
          <button className="td-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="td-modal-body">
          {/* ── Core stats (existing) ── */}
          <div className="td-modal-stats">
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">{student.modulesCompleted ?? 0}</span>
              <span className="td-modal-stat-lbl">Modules Done</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">{Math.round(student.averageScore ?? 0)}%</span>
              <span className="td-modal-stat-lbl">Avg Score</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">
                {student.timeSpent != null ? formatMinutes(student.timeSpent) : "—"}
              </span>
              <span className="td-modal-stat-lbl">Time Spent</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">
                {student.activeThisWeek ? "✅" : "❌"}
              </span>
              <span className="td-modal-stat-lbl">Active This Week</span>
            </div>
            {student.avgStars != null && (
              <div className="td-modal-stat">
                <span className="td-modal-stat-val">
                  {Number(student.avgStars).toFixed(1)} ⭐
                </span>
                <span className="td-modal-stat-lbl">Avg Stars</span>
              </div>
            )}
          </div>

          {/* ── ANALYTICS UPDATE: richer statistics ── */}
          <h4 className="td-modal-section-title">Deeper Analytics</h4>
          <div className="td-modal-stats" style={{ marginBottom: "1.5rem" }}>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">
                {highlights.highestModuleScore != null ? `${Math.round(highlights.highestModuleScore)}%` : "—"}
              </span>
              <span className="td-modal-stat-lbl">Highest Module Score</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">
                {highlights.lowestModuleScore != null ? `${Math.round(highlights.lowestModuleScore)}%` : "—"}
              </span>
              <span className="td-modal-stat-lbl">Lowest Module Score</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val" style={{ fontSize: "0.95rem" }}>
                {highlights.bestModuleTitle || "—"}
              </span>
              <span className="td-modal-stat-lbl">Best Module</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val" style={{ fontSize: "0.95rem" }}>
                {highlights.weakestModuleTitle || "—"}
              </span>
              <span className="td-modal-stat-lbl">Weakest Module</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">{highlights.longestSession}</span>
              <span className="td-modal-stat-lbl">Longest Session</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">{highlights.totalXP.toLocaleString()}</span>
              <span className="td-modal-stat-lbl">Total XP</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">
                {highlights.currentStreak > 0 ? `🔥 ${highlights.currentStreak}d` : "—"}
              </span>
              <span className="td-modal-stat-lbl">Current Streak</span>
            </div>
            <div className="td-modal-stat">
              <span className="td-modal-stat-val">{highlights.completionPercentage}%</span>
              <span className="td-modal-stat-lbl">Completion</span>
            </div>
          </div>

          {student.weakTopic && (
            <>
              <h4 className="td-modal-section-title">Weak Area</h4>
              <p style={{ fontSize: "0.875rem", color: "#EF4444", marginBottom: "1.5rem" }}>
                ⚠️ {student.weakTopic}
              </p>
            </>
          )}

          {/* ── ANALYTICS UPDATE: expandable module cards, replaces the flat
               progress-bar list. Each card shows completion status, stars,
               score, accuracy, mistakes, completion time, attempts, reward
               points and completed date — all sourced from the raw
               `modules` array already returned by GET /analytics/students. ── */}
          <h4 className="td-modal-section-title">Modules</h4>
          {modules.length > 0 ? (
            <div className="td-module-detail-list">
              {modules.map((m, i) => (
                <ModuleDetailCard key={m.moduleId ?? i} module={m} index={i} />
              ))}
            </div>
          ) : (
            <div className="td-empty-state" style={{ padding: "2rem 1.5rem" }}>
              <span className="td-empty-icon">📚</span>
              <p className="td-empty-title">No modules started yet</p>
              <p className="td-empty-sub">This student hasn't attempted any modules.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// ── Sidebar config ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "overview",    icon: "📊", label: "Overview"   },
  { id: "modules",     icon: "📚", label: "Modules"    },
  { id: "students",    icon: "👥", label: "Students"   },
  { id: "leaderboard", icon: "🏆", label: "Leaderboard"},
  { id: "topics",      icon: "🎯", label: "Weak Topics"},
];

// ── Main Component ────────────────────────────────────────────────────────────

const TeacherDashboard = () => {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const clock    = useClock();

  const [activeNav,    setActiveNav]    = useState("overview");
  const [overview,     setOverview]     = useState(null);
  const [students,     setStudents]     = useState([]);
  const [modules,      setModules]      = useState([]);
  const [weakTopics,   setWeakTopics]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (!token) return;
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      // Fetch all four endpoints in parallel
      const [overviewRes, studentsRes, modulesRes, weakRes] = await Promise.all([
        API.get("/analytics/overview"),
        API.get("/analytics/students"),
        API.get("/analytics/modules"),
        API.get("/analytics/weak-topics"),
      ]);

      setOverview(overviewRes.data.data);
      setStudents(studentsRes.data.data  || []);
      setModules(modulesRes.data.data    || []);
      setWeakTopics(weakRes.data.data    || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
      // FIX: handle 401 (token expired) gracefully
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      // FIX: handle 403 (wrong role)
      if (err.response?.status === 403) {
        setError("Access denied. This dashboard is for teachers only.");
        return;
      }
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, logout, navigate]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getWeakColor = (idx) => {
    const colors = ["#EF4444", "#F59E0B", "#8B5CF6", "#3B82F6", "#10B981"];
    return colors[idx % colors.length];
  };

  return (
    <div className="td-root">

      {/* ── Topbar ── */}
      <header className="td-topbar">
        <div className="td-topbar-brand">
          <div className="td-topbar-logo">⚡</div>
          <span className="td-topbar-name">MathQuest</span>
          <span className="td-topbar-badge">Teacher</span>
        </div>

        <div className="td-topbar-right">
          <span className="td-topbar-time">{clock}</span>

          <div style={{ position: "relative" }} ref={dropdownRef}>
            <button
              className="td-topbar-user"
              onClick={() => setDropdownOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
            >
              <div className="td-user-avatar">{getInitials(user?.name)}</div>
              <span className="td-user-name">{user?.name || "Teacher"}</span>
              <span className="td-user-chevron">▾</span>
            </button>

            {dropdownOpen && (
              <div className="td-user-dropdown">
                <button className="td-dropdown-item" onClick={handleLogout}>
                  🚪 Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Layout ── */}
      <div className="td-layout">

        {/* ── Sidebar ── */}
        <nav className="td-sidebar">
          <span className="td-sidebar-label">Navigation</span>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`td-sidebar-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="td-sidebar-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* ── Main Content ── */}
        <main className="td-content">

          {/* Page Header */}
          <div className="td-page-header">
            <div>
              <h1 className="td-page-title">
                {NAV_ITEMS.find((n) => n.id === activeNav)?.icon}{" "}
                {NAV_ITEMS.find((n) => n.id === activeNav)?.label}
              </h1>
              <p className="td-page-subtitle">
                Analytics for your students · {new Date().toLocaleDateString("en-IN", {
                  weekday: "long", year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
            <div className="td-page-header-actions">
              <ExportButtons overview={overview} students={students} disabled={loading} />
              <button
                className="td-refresh-btn"
                onClick={() => fetchAnalytics(true)}
                disabled={refreshing || loading}
                title="Refresh data"
              >
                <span className={`td-refresh-icon ${refreshing ? "spinning" : ""}`}>↻</span>
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>

          {/* ── Analytics Charts (top of dashboard) ── */}
          {(activeNav === "overview") && (
            <section>
              <div className="td-section-header">
                <h2 className="td-section-title">📈 Analytics</h2>
                <span className="td-section-action">Class-wide performance at a glance</span>
              </div>
              <AnalyticsCharts
                students={students}
                modules={modules}
                weakTopics={weakTopics}
                loading={loading}
              />
            </section>
          )}

          {/* ── Overview ── */}
          {(activeNav === "overview") && (
            <section>
              <div className="td-section-header">
                <h2 className="td-section-title">Class Overview</h2>
              </div>
              <OverviewCards data={overview} loading={loading} error={error} />
            </section>
          )}

          {/* ── Requiring Attention + Teacher Insights (Overview only) ── */}
          {(activeNav === "overview") && (
            <section>
              <div className="td-overview-split">
                <div>
                  <div className="td-section-header">
                    <h2 className="td-section-title">Students Requiring Attention</h2>
                  </div>
                  <AttentionPanel
                    data={students}
                    loading={loading}
                    error={students.length === 0 && error ? error : null}
                  />
                </div>
                <div>
                  <div className="td-section-header">
                    <h2 className="td-section-title">🧠 Teacher Insights</h2>
                  </div>
                  <InsightsPanel
                    students={students}
                    modules={modules}
                    weakTopics={weakTopics}
                    loading={loading}
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── Recent Activity (Overview only) ── */}
          {(activeNav === "overview") && (
            <section>
              <div className="td-section-header">
                <h2 className="td-section-title">Recent Activity</h2>
              </div>
              <RecentActivity
                data={students}
                loading={loading}
                error={students.length === 0 && error ? error : null}
              />
            </section>
          )}


          {/* ── Modules ── */}
          {(activeNav === "overview" || activeNav === "modules") && (
            <section className="td-section-modules">
              <div className="td-section-header">
                <h2 className="td-section-title">Module Analytics</h2>
              </div>
              <ModuleAnalytics
                data={modules}
                loading={loading}
                // FIX: Don't show global error in sub-panels; show empty state instead
                error={modules.length === 0 && error ? error : null}
              />
            </section>
          )}

          {/* ── Leaderboard ── */}
          {(activeNav === "overview" || activeNav === "leaderboard") && (
            <section>
              <div className="td-section-header">
                <h2 className="td-section-title">🏆 Student Leaderboard</h2>
                <span className="td-section-action">Ranked by reward points</span>
              </div>
              <Leaderboard
                data={students}
                loading={loading}
                error={students.length === 0 && error ? error : null}
              />
            </section>
          )}

          {/* ── Students ── */}
          {(activeNav === "overview" || activeNav === "students") && (
            <section>
              <div className="td-section-header">
                <h2 className="td-section-title">Students</h2>
              </div>
              <StudentsTable
                data={students}
                loading={loading}
                error={students.length === 0 && error ? error : null}
                onStudentClick={(s) => setSelectedStudent(s)}
              />
            </section>
          )}

          {/* ── Weak Topics ── */}
          {(activeNav === "overview" || activeNav === "topics") && (
            <section>
              <div className="td-section-header">
                <h2 className="td-section-title">Weak Topics</h2>
                <span className="td-section-action">Class-wide struggles</span>
              </div>

              {loading ? (
                <div className="td-weak-grid">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="td-weak-card">
                      <div className="td-skeleton" style={{ height: 14, width: "60%", marginBottom: 8 }} />
                      <div className="td-skeleton" style={{ height: 11, width: "40%" }} />
                    </div>
                  ))}
                </div>
              ) : weakTopics.length === 0 ? (
                <div className="td-empty-state">
                  <span className="td-empty-icon">🎉</span>
                  <p className="td-empty-title">No weak topics found</p>
                  <p className="td-empty-sub">All students are performing well, or no data available yet.</p>
                </div>
              ) : (
                <div className="td-weak-grid">
                  {weakTopics.slice(0, 8).map((t, i) => (
                    <div
                      key={t.topic}
                      className="td-weak-card"
                      style={{ "--weak-color": getWeakColor(i) }}
                    >
                      <div className="td-weak-card-top">
                        <span className="td-weak-topic-name">{t.topic}</span>
                        <span className="td-weak-badge">#{i + 1}</span>
                      </div>
                      <p className="td-weak-count">
                        {t.count} student{t.count !== 1 ? "s" : ""} struggling
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

        </main>
      </div>

      {/* ── Student Detail Modal ── */}
      <AnimatePresence>
        {selectedStudent && (
          <StudentModal
            key={selectedStudent._id || selectedStudent.name}
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeacherDashboard;
