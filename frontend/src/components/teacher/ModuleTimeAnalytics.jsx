// frontend/src/components/teacher/ModuleTimeAnalytics.jsx
// ─── Module Learning Time Analytics (research metric) ─────────────────────────
// NOT the game timer. Renders GET /analytics/module-time — aggregates of the
// dedicated `moduleTime` field (time from module entry to successful
// completion: story, examples, quizzes, feedback, navigation).
//
// This component only *displays* data; no statistics (Pearson/Spearman/etc.)
// are computed here — that's left to future researchers using the raw
// `correlationData` this endpoint also returns.

import React from 'react';

// ── Time formatting (minutes and seconds, per the spec) ────────────────────────
const formatMinSec = (totalSeconds) => {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${String(rem).padStart(2, '0')}s`;
};

const SkeletonBlock = ({ height = 100 }) => (
  <div className="td-skeleton" style={{ height, borderRadius: 12 }} />
);

// ── Tiny inline SVG scatter plot — no charting library required ────────────────
const ScatterMini = ({ title, points, yLabel, yMax = 100, accent = '#3ecfcf' }) => {
  const width = 320;
  const height = 180;
  const pad = 32;

  const xs = points.map((p) => p.x);
  const xMax = Math.max(1, ...xs);

  return (
    <div className="mta-scatter-card">
      <div className="mta-scatter-title">{title}</div>
      {points.length === 0 ? (
        <div className="mta-scatter-empty">Not enough data yet</div>
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} className="mta-scatter-svg" role="img" aria-label={title}>
          {/* axes */}
          <line x1={pad} y1={height - pad} x2={width - 10} y2={height - pad} stroke="var(--td-border-strong)" strokeWidth="1" />
          <line x1={pad} y1={10} x2={pad} y2={height - pad} stroke="var(--td-border-strong)" strokeWidth="1" />
          <text x={pad} y={height - 10} fontSize="9" fill="var(--td-text-dim)">0</text>
          <text x={width - 40} y={height - 10} fontSize="9" fill="var(--td-text-dim)">{formatMinSec(xMax)}</text>
          <text x={4} y={16} fontSize="9" fill="var(--td-text-dim)">{yLabel}</text>

          {points.map((p, i) => {
            const cx = pad + (p.x / xMax) * (width - pad - 20);
            const cy = height - pad - (Math.min(p.y, yMax) / yMax) * (height - pad - 20);
            return <circle key={i} cx={cx} cy={cy} r="3.5" fill={accent} fillOpacity="0.75" />;
          })}
        </svg>
      )}
    </div>
  );
};

const ModuleTimeAnalytics = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="mta-grid">
        {Array.from({ length: 3 }).map((_, i) => <SkeletonBlock key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="td-error-state">
        <span className="td-error-icon">⚠️</span>
        <p className="td-error-title">Failed to load module time data</p>
        <p className="td-error-sub">{error}</p>
      </div>
    );
  }

  if (!data || data.totalTimedAttempts === 0) {
    return (
      <div className="td-empty-state">
        <span className="td-empty-icon">⏱</span>
        <p className="td-empty-title">No module time data yet</p>
        <p className="td-empty-sub">
          Module learning time will appear once students complete modules.
        </p>
      </div>
    );
  }

  const { overallAvgModuleTime, fastestModule, slowestModule, perModule, perStudent, correlationData } = data;

  const timeVsAccuracy = correlationData.map((d) => ({ x: d.moduleTime, y: d.accuracy }));
  const timeVsScore = correlationData.map((d) => ({ x: d.moduleTime, y: d.score }));
  const timeVsHints = correlationData.map((d) => ({ x: d.moduleTime, y: d.hintsUsed }));
  const maxHints = Math.max(1, ...correlationData.map((d) => d.hintsUsed));

  return (
    <div className="mta-root">
      {/* ── Summary cards ── */}
      <div className="mta-summary-grid">
        <div className="td-overview-card" style={{ '--card-accent': '#8B5CF6' }}>
          <div className="td-overview-card-header">
            <span className="td-overview-label">Average Module Time</span>
            <span className="td-overview-icon" style={{ background: 'rgba(139,92,246,0.1)' }} aria-hidden="true">⏱</span>
          </div>
          <span className="td-overview-value">{formatMinSec(overallAvgModuleTime)}</span>
          <span className="td-overview-delta">Across {data.totalTimedAttempts} timed attempt{data.totalTimedAttempts !== 1 ? 's' : ''}</span>
        </div>

        <div className="td-overview-card" style={{ '--card-accent': '#4ADE80' }}>
          <div className="td-overview-card-header">
            <span className="td-overview-label">Fastest Module</span>
            <span className="td-overview-icon" style={{ background: 'rgba(74,222,128,0.1)' }} aria-hidden="true">⚡</span>
          </div>
          <span className="td-overview-value" style={{ fontSize: '1.1rem' }}>
            {fastestModule ? fastestModule.title : '—'}
          </span>
          <span className="td-overview-delta">
            {fastestModule ? `Avg ${formatMinSec(fastestModule.avgModuleTime)}` : 'Not enough data yet'}
          </span>
        </div>

        <div className="td-overview-card" style={{ '--card-accent': '#F59E0B' }}>
          <div className="td-overview-card-header">
            <span className="td-overview-label">Slowest Module</span>
            <span className="td-overview-icon" style={{ background: 'rgba(245,158,11,0.1)' }} aria-hidden="true">🐢</span>
          </div>
          <span className="td-overview-value" style={{ fontSize: '1.1rem' }}>
            {slowestModule ? slowestModule.title : '—'}
          </span>
          <span className="td-overview-delta">
            {slowestModule ? `Avg ${formatMinSec(slowestModule.avgModuleTime)}` : 'Not enough data yet'}
          </span>
        </div>
      </div>

      {/* ── Average Module Time per Module ── */}
      <div className="mta-section-title">Average Module Time per Module</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="td-table" aria-label="Average module time per module">
          <thead>
            <tr>
              <th>Module</th>
              <th>Avg Time</th>
              <th>Fastest</th>
              <th>Slowest</th>
              <th>Avg Accuracy</th>
              <th>Avg Score</th>
              <th>Avg Hints Used</th>
            </tr>
          </thead>
          <tbody>
            {perModule.map((m) => (
              <tr key={m.moduleId}>
                <td style={{ fontWeight: 600 }}>{m.title}</td>
                <td>{m.dataPoints > 0 ? formatMinSec(m.avgModuleTime) : '—'}</td>
                <td>{m.dataPoints > 0 ? formatMinSec(m.fastestTime) : '—'}</td>
                <td>{m.dataPoints > 0 ? formatMinSec(m.slowestTime) : '—'}</td>
                <td>{m.dataPoints > 0 ? `${m.avgAccuracy}%` : '—'}</td>
                <td>{m.dataPoints > 0 ? `${m.avgScore}%` : '—'}</td>
                <td>{m.dataPoints > 0 ? m.avgHintsUsed : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Average Module Time per Student ── */}
      <div className="mta-section-title">Average Module Time per Student</div>
      <div style={{ overflowX: 'auto' }}>
        <table className="td-table" aria-label="Average module time per student">
          <thead>
            <tr>
              <th>Student</th>
              <th>Modules Timed</th>
              <th>Avg Module Time</th>
              <th>Total Learning Time</th>
            </tr>
          </thead>
          <tbody>
            {perStudent.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--td-text-dim)' }}>
                  No student data available yet.
                </td>
              </tr>
            ) : (
              perStudent.map((s) => (
                <tr key={s.studentId}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td>{s.modulesTimed}</td>
                  <td>{formatMinSec(s.avgModuleTime)}</td>
                  <td>{formatMinSec(s.totalModuleTime)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Time vs performance scatter views ── */}
      {/* <div className="mta-section-title">Module Time vs Performance</div> */}
      {/* <p className="td-page-subtitle" style={{ margin: '0 0 1rem' }}>
        Each point is one completed module attempt. For statistical relationships
        (Pearson/Spearman correlation, etc.), researchers can use the raw
        per-attempt data behind GET /analytics/module-time (correlationData).
      </p> */}
      {/* <div className="mta-scatter-grid">
        <ScatterMini title="Time vs Quiz Accuracy" points={timeVsAccuracy} yLabel="Accuracy %" yMax={100} accent="#3ecfcf" />
        <ScatterMini title="Time vs Final Score" points={timeVsScore} yLabel="Score %" yMax={100} accent="#e8a838" />
        <ScatterMini title="Time vs Hints Used" points={timeVsHints} yLabel="Hints" yMax={maxHints} accent="#a855f7" />
      </div> */}
    </div>
  );
};

export default ModuleTimeAnalytics;
