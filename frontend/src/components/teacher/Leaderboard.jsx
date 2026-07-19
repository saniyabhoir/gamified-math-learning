// frontend/src/components/teacher/Leaderboard.jsx
// NEW — Teacher Dashboard Analytics Implementation.
//
// Implements "Student Leaderboard", ranking students by total reward points
// earned (Progress.totalRewardPoints), a real field already written by
// saveModuleProgress on every completed module. Average score and average
// stars are shown as secondary context.
//
// Derived entirely from the `students` array already fetched by
// GET /analytics/students — no additional network request.

import React, { useMemo } from 'react';
import { getInitials } from '../../utils/analyticsHelpers.jsx';

const MEDALS = ['🥇', '🥈', '🥉'];
const MAX_ROWS = 8;

const SkeletonRow = () => (
  <div className="td-leaderboard-row" aria-hidden="true">
    <div className="td-skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
    <div className="td-skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
    <div style={{ flex: 1 }}>
      <div className="td-skeleton" style={{ width: 120, height: 13, marginBottom: 6 }} />
      <div className="td-skeleton" style={{ width: 80, height: 10 }} />
    </div>
    <div className="td-skeleton" style={{ width: 60, height: 22 }} />
  </div>
);

const Leaderboard = ({ data, loading, error }) => {
  const ranked = useMemo(() => {
    if (!data) return [];
    return [...data]
      // Only rank students who have actually earned something — a 0-point
      // tie for last place isn't a meaningful leaderboard entry.
      .filter((s) => (s.totalRewardPoints ?? 0) > 0)
      .sort((a, b) => {
        const points = (b.totalRewardPoints ?? 0) - (a.totalRewardPoints ?? 0);
        if (points !== 0) return points;
        return (b.averageScore ?? 0) - (a.averageScore ?? 0);
      })
      .slice(0, MAX_ROWS);
  }, [data]);

  if (loading) {
    return (
      <div className="td-leaderboard-wrapper">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="td-error-state">
        <span className="td-error-icon">⚠️</span>
        <p className="td-error-title">Failed to load leaderboard</p>
        <p className="td-error-sub">{error}</p>
      </div>
    );
  }

  if (ranked.length === 0) {
    return (
      <div className="td-empty-state">
        <span className="td-empty-icon">🏆</span>
        <p className="td-empty-title">No reward points earned yet</p>
        <p className="td-empty-sub">
          The leaderboard fills in as students complete modules and earn points.
        </p>
      </div>
    );
  }

  return (
    <div className="td-leaderboard-wrapper">
      {ranked.map((student, i) => (
        <div
          key={student._id || i}
          className={`td-leaderboard-row ${i < 3 ? 'top3' : ''}`}
          style={{ animationDelay: `${i * 50}ms`, animation: 'tdFadeIn 0.35s ease both' }}
        >
          <span className="td-leaderboard-rank" aria-hidden="true">
            {MEDALS[i] || `#${i + 1}`}
          </span>
          <div className="td-student-avatar" aria-hidden="true">
            {getInitials(student.name)}
          </div>
          <div className="td-leaderboard-info">
            <div className="td-student-name">{student.name}</div>
            <div className="td-leaderboard-meta">
              {Math.round(student.averageScore ?? 0)}% avg score
              {student.avgStars != null && (
                <> · {'⭐'.repeat(Math.round(student.avgStars)) || '—'} {Number(student.avgStars).toFixed(1)}</>
              )}
            </div>
          </div>
          <div className="td-leaderboard-points">
            <span className="td-leaderboard-points-val">
              {(student.totalRewardPoints ?? 0).toLocaleString()}
            </span>
            <span className="td-leaderboard-points-lbl">points</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Leaderboard;
