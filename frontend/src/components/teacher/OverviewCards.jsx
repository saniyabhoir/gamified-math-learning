// frontend/src/components/teacher/OverviewCards.jsx
// FIXES:
//  1. 'modulesCompleted' formatted as % (correct) but label said "Modules Completed"
//     which is confusing — changed to "Completion Rate" for clarity
//  2. Skeleton used wrong prop name (accent was passed but not used)
//  3. No aria labels for accessibility
//
// ANALYTICS UPDATE (Teacher Dashboard Analytics Implementation):
//  - Added "Active Students" and "Avg Stars Earned" cards, backed by the new
//    `activeStudents` / `avgStars` fields returned by GET /analytics/overview.
//    Both are real, already-collected data (Progress.lastActiveAt and
//    Progress.modules[].stars) — no invented metrics.

import React from 'react';

const CARD_CONFIG = [
  {
    key: 'totalStudents',
    label: 'Total Students',
    icon: '👥',
    iconBg: 'rgba(20,184,166,0.1)',
    accent: '#14B8A6',
    // FIX: totalStudents is a raw number, not a percentage
    format: (v) => (v != null ? v.toLocaleString() : '—'),
  },
  {
    key: 'activeStudents',
    label: 'Active Students',
    icon: '🟢',
    iconBg: 'rgba(74,222,128,0.1)',
    accent: '#4ADE80',
    format: (v) => (v != null ? v.toLocaleString() : '—'),
  },
  {
    key: 'averageScore',
    label: 'Average Score',
    icon: '🎯',
    iconBg: 'rgba(59,130,246,0.1)',
    accent: '#3B82F6',
    format: (v) => (v != null ? `${Math.round(v)}` : '—'),
  },
  {
    key: 'modulesCompleted',
    // FIX: label clarified
    label: 'Completion Rate',
    icon: '📚',
    iconBg: 'rgba(245,158,11,0.1)',
    accent: '#F59E0B',
    format: (v) => (v != null ? `${Math.round(v)}%` : '—'),
  },
  {
    key: 'avgStars',
    label: 'Avg Stars Earned',
    icon: '⭐',
    iconBg: 'rgba(232,168,56,0.1)',
    accent: '#E8A838',
    format: (v) => (v != null ? `${Number(v).toFixed(1)} / 3` : '—'),
  },
  {
    key: 'avgTimeSpent',
    label: 'Avg Time Spent',
    icon: '⏱',
    iconBg: 'rgba(167,139,250,0.1)',
    accent: '#8B5CF6',
    format: (v) => (v != null ? `${Math.round(v)}m` : '—'),
  },
];

const SkeletonCard = ({ accent }) => (
  <div
    className="td-overview-card"
    style={{ '--card-accent': accent }}
    aria-busy="true"
    aria-label="Loading..."
  >
    <div className="td-overview-card-header">
      <div className="td-skeleton" style={{ width: 80, height: 12 }} />
      <div className="td-skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
    </div>
    <div className="td-skeleton" style={{ width: 100, height: 36 }} />
    <div className="td-skeleton" style={{ width: 120, height: 12 }} />
  </div>
);

const OverviewCards = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="td-overview-grid">
        {CARD_CONFIG.map((c) => (
          <SkeletonCard key={c.key} accent={c.accent} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="td-error-state">
        <span className="td-error-icon">⚠️</span>
        <p className="td-error-title">Unable to load overview</p>
        <p className="td-error-sub">{error}</p>
      </div>
    );
  }

  return (
    <div className="td-overview-grid">
      {CARD_CONFIG.map((card, i) => {
        const value = data?.[card.key];

        return (
          <div
            key={card.key}
            className="td-overview-card"
            style={{
              '--card-accent': card.accent,
              animationDelay: `${i * 80}ms`,
              animation: 'tdFadeIn 0.35s ease both',
            }}
          >
            <div className="td-overview-card-header">
              <span className="td-overview-label">{card.label}</span>
              <span
                className="td-overview-icon"
                style={{ background: card.iconBg }}
                aria-hidden="true"
              >
                {card.icon}
              </span>
            </div>

            <span className="td-overview-value">{card.format(value)}</span>

            <span className="td-overview-delta">
              {data?.lastUpdated
                ? `Updated ${new Date(data.lastUpdated).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}`
                : 'Live data'}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default OverviewCards;
