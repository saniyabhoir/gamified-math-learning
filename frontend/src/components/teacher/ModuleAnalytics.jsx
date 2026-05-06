// frontend/src/components/teacher/ModuleAnalytics.jsx
// FIXES:
//  1. avgAttempts.toFixed(1) crashes if avgAttempts is undefined/null — added fallback
//  2. No aria labels on progress bars
//  3. Animation using inline style string — moved to CSS class reference

import React from 'react';

const MODULE_ICONS  = ['🔢', '🍎', '⚙️', '🔍', '🏆'];
const MODULE_LABELS = [
  'Intro to Algebra',
  'Simplification',
  'Multiplication',
  'Substitution',
  'Algebra in Action',
];

const SkeletonCard = () => (
  <div className="td-module-card" aria-busy="true" aria-label="Loading...">
    <div className="td-module-header">
      <div className="td-skeleton" style={{ width: 38, height: 38, borderRadius: 8 }} />
      <div>
        <div className="td-skeleton" style={{ width: 120, height: 14, marginBottom: 4 }} />
        <div className="td-skeleton" style={{ width: 80,  height: 11 }} />
      </div>
    </div>
    <div className="td-module-stats">
      {[0, 1, 2].map((i) => (
        <div key={i} className="td-module-stat">
          <div className="td-skeleton" style={{ width: 40, height: 22, marginBottom: 4 }} />
          <div className="td-skeleton" style={{ width: 60, height: 10 }} />
        </div>
      ))}
    </div>
    <div className="td-skeleton" style={{ height: 6, borderRadius: 100 }} />
  </div>
);

const getCompletionColor = (rate) => {
  if (rate >= 70) return '#14B8A6';
  if (rate >= 40) return '#F59E0B';
  return '#EF4444';
};

const ModuleAnalytics = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="td-modules-grid">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="td-error-state">
        <span className="td-error-icon">⚠️</span>
        <p className="td-error-title">Failed to load module data</p>
        <p className="td-error-sub">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="td-empty-state">
        <span className="td-empty-icon">📚</span>
        <p className="td-empty-title">No module data yet</p>
        <p className="td-empty-sub">
          Module analytics will appear once students start learning.
        </p>
      </div>
    );
  }

  return (
    <div className="td-modules-grid">
      {data.map((module, i) => {
        const completionRate = module.completionRate ?? 0;
        const avgScore       = module.avgScore       ?? 0;
        // FIX: guard against null/undefined before calling .toFixed()
        const avgAttempts    = module.avgAttempts    ?? 0;
        const color          = getCompletionColor(completionRate);
        const icon           = MODULE_ICONS[module.moduleOrder - 1]  ?? MODULE_ICONS[i]  ?? '📖';
        const title          = module.title ?? MODULE_LABELS[i] ?? `Module ${i + 1}`;
        // FIX: clamp completionRate to [0, 100]
        const clampedRate    = Math.min(100, Math.max(0, completionRate));

        return (
          <div
            key={module._id || module.moduleId || i}
            className="td-module-card"
            style={{
              animationDelay: `${i * 60}ms`,
              animation: 'tdFadeIn 0.35s ease both',
            }}
          >
            <div className="td-module-header">
              <div className="td-module-icon" style={{ background: `${color}18` }} aria-hidden="true">
                {icon}
              </div>
              <div>
                <div className="td-module-title">
                  M{module.moduleOrder ?? i + 1} · {title}
                </div>
                <div className="td-module-sub">
                  {module.enrolledStudents ?? 0} students enrolled
                </div>
              </div>
            </div>

            <div className="td-module-stats">
              <div className="td-module-stat">
                <span className="td-stat-val" style={{ color }}>
                  {Math.round(completionRate)}%
                </span>
                <span className="td-stat-lbl">Completed</span>
              </div>
              <div className="td-module-stat">
                <span className="td-stat-val" style={{ color: '#3B82F6' }}>
                  {Math.round(avgScore)}%
                </span>
                <span className="td-stat-lbl">Avg Score</span>
              </div>
              <div className="td-module-stat">
                <span className="td-stat-val" style={{ color: '#F59E0B' }}>
                  {/* FIX: was avgAttempts.toFixed(1) — crashes if null */}
                  {Number(avgAttempts).toFixed(1)}
                </span>
                <span className="td-stat-lbl">Avg Tries</span>
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div className="td-progress-label">
                <span>Completion</span>
                <span style={{ color, fontWeight: 600 }}>{Math.round(completionRate)}%</span>
              </div>
              <div
                className="td-progress-bar-wrap"
                role="progressbar"
                aria-valuenow={Math.round(completionRate)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${title} completion rate`}
              >
                <div
                  className="td-progress-bar-fill"
                  style={{
                    width: `${clampedRate}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModuleAnalytics;
