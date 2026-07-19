// frontend/src/components/teacher/RecentActivity.jsx
// NEW — Teacher Dashboard Analytics Implementation.
//
// Implements "Recent Student Activity". Every completed module attempt is
// stored with a real `playedAt` timestamp (Progress.modules[].playedAt, set
// in progressController.saveModuleProgress). This flattens every student's
// module attempts into a single feed sorted by recency.
//
// Derived entirely from the `modules` arrays already embedded in the
// `students` response from GET /analytics/students — no additional
// network request.

import React, { useMemo } from 'react';
import { getScoreColor } from '../../utils/analyticsHelpers.jsx';

const MAX_ROWS = 8;

const formatRelativeTime = (date) => {
  if (!date) return '';
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const SkeletonRow = () => (
  <div className="td-activity-row" aria-hidden="true">
    <div className="td-skeleton" style={{ width: 34, height: 34, borderRadius: 8 }} />
    <div style={{ flex: 1 }}>
      <div className="td-skeleton" style={{ width: 180, height: 13, marginBottom: 6 }} />
      <div className="td-skeleton" style={{ width: 90, height: 10 }} />
    </div>
  </div>
);

const RecentActivity = ({ data, loading, error }) => {
  const feed = useMemo(() => {
    if (!data) return [];
    return data
      .flatMap((student) =>
        (student.modules || [])
          .filter((m) => m.completed && m.playedAt)
          .map((m) => ({
            studentName: student.name,
            moduleTitle: m.moduleTitle || `Module ${m.moduleId}`,
            score: m.score ?? 0,
            stars: m.stars ?? 0,
            playedAt: m.playedAt,
          }))
      )
      .sort((a, b) => new Date(b.playedAt) - new Date(a.playedAt))
      .slice(0, MAX_ROWS);
  }, [data]);

  if (loading) {
    return (
      <div className="td-activity-list">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="td-error-state">
        <span className="td-error-icon">⚠️</span>
        <p className="td-error-title">Failed to load activity</p>
        <p className="td-error-sub">{error}</p>
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="td-empty-state">
        <span className="td-empty-icon">📭</span>
        <p className="td-empty-title">No recent activity</p>
        <p className="td-empty-sub">Activity will appear here as students complete modules.</p>
      </div>
    );
  }

  return (
    <div className="td-activity-list">
      {feed.map((item, i) => {
        const score = Math.round(item.score);
        return (
          <div
            key={`${item.studentName}-${item.playedAt}-${i}`}
            className="td-activity-row"
            style={{ animationDelay: `${i * 50}ms`, animation: 'tdFadeIn 0.35s ease both' }}
          >
            <div className="td-activity-icon" aria-hidden="true">
              {item.stars >= 3 ? '🌟' : '📘'}
            </div>
            <div className="td-activity-info">
              <div className="td-activity-text">
                <strong>{item.studentName}</strong> completed <em>{item.moduleTitle}</em>
              </div>
              <div className="td-activity-time">{formatRelativeTime(item.playedAt)}</div>
            </div>
            <span className="td-activity-score" style={{ color: getScoreColor(score) }}>
              {score}%
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RecentActivity;
