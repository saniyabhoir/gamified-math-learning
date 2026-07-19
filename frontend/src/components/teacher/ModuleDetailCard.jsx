// frontend/src/components/teacher/ModuleDetailCard.jsx
// NEW — Expandable module card for the Student Detail Modal.
//
// Replaces the old flat "progress bar per module" list with a richer,
// collapsible card per module showing completion status, stars, score,
// accuracy, mistakes, completion time, attempts, reward points and
// completed date. All fields already exist on Progress.modules (see
// backend/models/Progress.js) and are already returned as the raw
// `modules` array by GET /analytics/students — no backend changes needed.

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatSeconds, formatDate } from '../../utils/formatTime';

const MODULE_ICONS = ['🔢', '🍎', '⚙️', '🔍', '🏆'];

const getScoreColor = (score) => (score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444');

const ModuleDetailCard = ({ module, index }) => {
  const [open, setOpen] = useState(false);

  const score = module.score ?? 0;
  const color = getScoreColor(score);
  const stars = Math.min(3, Math.max(0, module.stars ?? 0));
  const icon = MODULE_ICONS[index] ?? '📖';

  return (
    <div className={`td-module-detail-card ${module.completed ? 'completed' : 'incomplete'}`}>
      <button
        className="td-module-detail-header"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="td-module-detail-icon" aria-hidden="true">{icon}</span>

        <div className="td-module-detail-main">
          <span className="td-module-detail-name">
            {module.moduleTitle || `Module ${module.moduleId ?? index + 1}`}
          </span>
          <span className={`td-module-status-pill ${module.completed ? 'done' : 'pending'}`}>
            {module.completed ? '✅ Completed' : '⏳ In Progress'}
          </span>
        </div>

        <div className="td-module-detail-glance">
          <span className="td-module-glance-stars" title="Stars earned">
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </span>
          <span className="td-module-glance-score" style={{ color }}>
            {Math.round(score)}%
          </span>
          <span className="td-module-glance-time">
            {formatSeconds(module.completionTime ?? 0, { compact: true })}
          </span>
        </div>

        <span className={`td-module-chevron ${open ? 'open' : ''}`} aria-hidden="true">▾</span>
      </button>

      {/* Mini progress bar always visible, matches original visual language */}
      <div className="td-progress-bar-wrap td-module-detail-bar" aria-hidden="true">
        <div
          className="td-progress-bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, score))}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        />
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="td-module-detail-grid">
              <div className="td-module-detail-stat">
                <span className="td-stat-val" style={{ color }}>{Math.round(score)}%</span>
                <span className="td-stat-lbl">Score</span>
              </div>
              <div className="td-module-detail-stat">
                <span className="td-stat-val" style={{ color: '#3B82F6' }}>{Math.round(module.accuracy ?? 0)}%</span>
                <span className="td-stat-lbl">Accuracy</span>
              </div>
              <div className="td-module-detail-stat">
                <span className="td-stat-val" style={{ color: '#EF4444' }}>{module.mistakes ?? 0}</span>
                <span className="td-stat-lbl">Mistakes</span>
              </div>
              <div className="td-module-detail-stat">
                <span className="td-stat-val" style={{ color: '#8B5CF6' }}>{formatSeconds(module.completionTime ?? 0)}</span>
                <span className="td-stat-lbl">Completion Time</span>
              </div>
              <div className="td-module-detail-stat">
                <span className="td-stat-val" style={{ color: '#F59E0B' }}>{module.attempts ?? 1}</span>
                <span className="td-stat-lbl">Attempts</span>
              </div>
              <div className="td-module-detail-stat">
                <span className="td-stat-val" style={{ color: 'var(--td-primary)' }}>{module.rewardPoints ?? 0}</span>
                <span className="td-stat-lbl">Reward Points</span>
              </div>
            </div>

            <div className="td-module-detail-footer">
              <span>Completed: {module.completed ? formatDate(module.playedAt) : '—'}</span>
              {module.weakTopics && module.weakTopics.length > 0 && (
                <span className="td-weak-tag" style={{ marginLeft: 'auto' }}>
                  ⚠️ {module.weakTopics[0]}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ModuleDetailCard;
