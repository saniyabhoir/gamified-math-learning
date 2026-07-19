// frontend/src/components/teacher/InsightsPanel.jsx
// NEW — "Teacher Insights" card: plain-language observations auto-generated
// from data the dashboard already has (overview/students/modules/weakTopics).
// See utils/studentAnalytics.js#generateInsights for the derivation logic;
// this component is purely presentational.

import React, { useMemo } from 'react';
import { generateInsights } from '../../utils/studentAnalytics';

const InsightsPanel = ({ students, modules, weakTopics, loading }) => {
  const insights = useMemo(
    () => generateInsights({ students: students || [], modules: modules || [], weakTopics: weakTopics || [] }),
    [students, modules, weakTopics]
  );

  if (loading) {
    return (
      <div className="td-insights-card" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="td-insight-row">
            <div className="td-skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
            <div className="td-skeleton" style={{ flex: 1, height: 14 }} />
          </div>
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="td-empty-state">
        <span className="td-empty-icon">🧠</span>
        <p className="td-empty-title">No insights yet</p>
        <p className="td-empty-sub">Insights appear automatically once students start generating data.</p>
      </div>
    );
  }

  return (
    <div className="td-insights-card">
      {insights.map((insight, i) => (
        <div
          key={i}
          className="td-insight-row"
          style={{ animationDelay: `${i * 60}ms`, animation: 'tdFadeIn 0.35s ease both' }}
        >
          <span className="td-insight-icon" aria-hidden="true">{insight.icon}</span>
          <span className="td-insight-text">{insight.text}</span>
        </div>
      ))}
    </div>
  );
};

export default InsightsPanel;
