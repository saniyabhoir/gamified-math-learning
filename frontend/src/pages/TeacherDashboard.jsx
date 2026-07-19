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

const MODULE_LABELS = [
  "Intro to Algebra",
  "Simplification",
  "Multiplication",
  "Substitution",
  "Algebra in Action",
];

const StudentModal = ({ student, onClose }) => {
  if (!student) return null;

  const scoreColor = (s) => (s >= 80 ? "#10B981" : s >= 60 ? "#F59E0B" : "#EF4444");

  return (
    <div className="td-modal-backdrop" onClick={onClose}>
      <div className="td-modal" onClick={(e) => e.stopPropagation()}>
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
                {student.timeSpent != null ? `${Math.round(student.timeSpent)}m` : "—"}
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

          {student.weakTopic && (
            <>
              <h4 className="td-modal-section-title">Weak Area</h4>
              <p style={{ fontSize: "0.875rem", color: "#EF4444", marginBottom: "1.5rem" }}>
                ⚠️ {student.weakTopic}
              </p>
            </>
          )}

          {/* Per-module scores if available */}
          {student.moduleScores && student.moduleScores.length > 0 && (
            <>
              <h4 className="td-modal-section-title">Module Scores</h4>
              <div className="td-module-score-list">
                {student.moduleScores.map((ms, i) => (
                  <div key={i} className="td-module-score-row">
                    <span className="td-module-score-label">
                      {MODULE_LABELS[i] ?? `Module ${i + 1}`}
                    </span>
                    <div className="td-module-score-bar-wrap">
                      <div
                        className="td-module-score-bar-fill"
                        style={{
                          width: `${ms.score}%`,
                          background: scoreColor(ms.score),
                        }}
                      />
                    </div>
                    <span className="td-module-score-val">{Math.round(ms.score)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
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

          {/* ── Overview ── */}
          {(activeNav === "overview") && (
            <section>
              <div className="td-section-header">
                <h2 className="td-section-title">Class Overview</h2>
              </div>
              <OverviewCards data={overview} loading={loading} error={error} />
            </section>
          )}

          {/* ── Requiring Attention + Recent Activity (Overview only) ── */}
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
                    <h2 className="td-section-title">Recent Activity</h2>
                  </div>
                  <RecentActivity
                    data={students}
                    loading={loading}
                    error={students.length === 0 && error ? error : null}
                  />
                </div>
              </div>
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
      {selectedStudent && (
        <StudentModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
