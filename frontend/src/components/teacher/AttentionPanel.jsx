// frontend/src/components/teacher/AttentionPanel.jsx
// NEW — Teacher Dashboard Analytics Implementation.
//
// Implements "Students Requiring Attention". StudentsTable already has an
// "atRisk" filter for low scorers; this panel surfaces the same idea as an
// at-a-glance overview widget with a *reason*, using three signals that are
// all real, already-collected fields:
//   - averageScore  (Progress.averageScore)   -> "Low average score"
//   - lastActiveAt   (Progress.lastActiveAt)   -> "Inactive 14+ days"
//   - modulesCompleted === 0                   -> "Not started yet"
//
// Derived entirely from the `students` array already fetched by
// GET /analytics/students — no additional network request.

import React, { useMemo } from 'react';
import { getInitials } from '../../utils/analyticsHelpers.jsx';

const LOW_SCORE_THRESHOLD = 50;
const INACTIVE_DAYS = 14;
const MAX_ROWS = 6;

const daysSince = (date) => {
  if (!date) return null;
  return Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000));
};

const flagStudent = (student) => {
  const completed = student.modulesCompleted ?? 0;

  if (completed === 0) {
    return { reason: 'Not started yet', severity: 'warning' };
  }

  const inactiveDays = daysSince(student.lastActiveAt);
  if (inactiveDays != null && inactiveDays >= INACTIVE_DAYS) {
    return { reason: `Inactive ${inactiveDays}d`, severity: 'danger' };
  }

  if ((student.averageScore ?? 0) < LOW_SCORE_THRESHOLD) {
    return { reason: 'Low average score', severity: 'danger' };
  }

  return null;
};

const SkeletonRow = () => (
  <div className="td-attention-row" aria-hidden="true">
    <div className="td-skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
    <div style={{ flex: 1 }}>
      <div className="td-skeleton" style={{ width: 110, height: 13, marginBottom: 6 }} />
      <div className="td-skeleton" style={{ width: 90, height: 10 }} />
    </div>
  </div>
);

const AttentionPanel = ({ data, loading, error }) => {
  const flagged = useMemo(() => {
    if (!data) return [];
    return data
      .map((s) => {
        const flag = flagStudent(s);
        return flag ? { ...s, ...flag } : null;
      })
      .filter(Boolean)
      // Worst first: lowest score surfaces to the top.
      .sort((a, b) => (a.averageScore ?? 0) - (b.averageScore ?? 0))
      .slice(0, MAX_ROWS);
  }, [data]);

  if (loading) {
    return (
      <div className="td-attention-list">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="td-error-state">
        <span className="td-error-icon">⚠️</span>
        <p className="td-error-title">Failed to load student data</p>
        <p className="td-error-sub">{error}</p>
      </div>
    );
  }

  if (flagged.length === 0) {
    return (
      <div className="td-empty-state">
        <span className="td-empty-icon">🎉</span>
        <p className="td-empty-title">Everyone's on track</p>
        <p className="td-empty-sub">No students currently need extra attention.</p>
      </div>
    );
  }

  return (
    <div className="td-attention-list">
      {flagged.map((student, i) => (
        <div
          key={student._id || i}
          className="td-attention-row"
          style={{ animationDelay: `${i * 50}ms`, animation: 'tdFadeIn 0.35s ease both' }}
        >
          <div className="td-student-avatar" aria-hidden="true">
            {getInitials(student.name)}
          </div>
          <div className="td-attention-info">
            <div className="td-student-name">{student.name}</div>
            <div className="td-attention-sub">
              {student.modulesCompleted ?? 0} modules done · {Math.round(student.averageScore ?? 0)}% avg
            </div>
          </div>
          <span className={`td-attention-reason ${student.severity}`}>
            {student.reason}
          </span>
        </div>
      ))}
    </div>
  );
};

export default AttentionPanel;
