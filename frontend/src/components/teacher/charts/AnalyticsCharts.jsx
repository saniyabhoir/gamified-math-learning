// frontend/src/components/teacher/charts/AnalyticsCharts.jsx
// NEW — Analytics visualization layer for the Teacher Dashboard.
//
// Renders the four requested charts (Class Performance Distribution, Module
// Completion Rate, Weak Topic Distribution, Average Score per Module) using
// Recharts. All data is derived client-side from props already fetched by
// TeacherDashboard.jsx (students / modules / weakTopics) — no new API calls.
// Colors and card styling reuse the dashboard's existing CSS variables so
// the palette, typography and spacing stay untouched.

import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  computeScoreDistribution,
  computeModuleCompletion,
  computeWeakTopicDistribution,
  computeAvgScorePerModule,
} from '../../../utils/studentAnalytics';

const PIE_COLORS = ['#EF4444', '#F59E0B', '#8B5CF6', '#3B82F6', '#14B8A6', '#4ADE80', '#EC4899'];
const OTHER_SLICE_COLOR = '#4B5563';
const SCORE_COLORS = ['#EF4444', '#F59E0B', '#EAB308', '#3B82F6', '#4ADE80'];

const tooltipStyle = {
  background: '#131929',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  fontSize: 12,
  color: '#e8edf4',
};

const axisTick = { fill: '#7a8aaa', fontSize: 11, fontFamily: 'Nunito, sans-serif' };

const ChartEmptyState = ({ icon = '📊', title, sub }) => (
  <div className="td-chart-empty">
    <span className="td-empty-icon">{icon}</span>
    <p className="td-empty-title">{title}</p>
    {sub && <p className="td-empty-sub">{sub}</p>}
  </div>
);

const ChartCard = ({ title, subtitle, children, height = 260 }) => (
  <div className="td-chart-card">
    <div className="td-chart-card-header">
      <h3 className="td-chart-title">{title}</h3>
      {subtitle && <span className="td-chart-subtitle">{subtitle}</span>}
    </div>
    <div style={{ width: '100%', height }}>{children}</div>
  </div>
);

const ChartSkeleton = () => (
  <div className="td-chart-card" aria-busy="true">
    <div className="td-skeleton" style={{ width: 160, height: 14, marginBottom: 16 }} />
    <div className="td-skeleton" style={{ width: '100%', height: 200, borderRadius: 12 }} />
  </div>
);

const AnalyticsCharts = ({ students = [], modules = [], weakTopics = [], loading }) => {
  const scoreDistribution = useMemo(() => computeScoreDistribution(students), [students]);
  const moduleCompletion = useMemo(() => computeModuleCompletion(modules), [modules]);
  const weakTopicData = useMemo(() => computeWeakTopicDistribution(weakTopics), [weakTopics]);
  const avgScorePerModule = useMemo(() => computeAvgScorePerModule(modules), [modules]);

  const hasStudents = students.length > 0;
  const hasModules = modules.length > 0;
  const hasWeakTopics = weakTopicData.length > 0;

  if (loading) {
    return (
      <div className="td-charts-grid">
        {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="td-charts-grid">
      {/* A. Class Performance Distribution */}
      <ChartCard title="Class Performance Distribution" subtitle="Students by score range">
        {hasStudents ? (
          <ResponsiveContainer>
            <BarChart data={scoreDistribution} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="range" tick={axisTick} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(v) => [`${v} student${v !== 1 ? 's' : ''}`, 'Students']}
              />
              <Bar dataKey="students" radius={[8, 8, 0, 0]} maxBarSize={48}>
                {scoreDistribution.map((entry, i) => (
                  <Cell key={entry.range} fill={SCORE_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmptyState title="No student scores yet" sub="This chart fills in once students complete modules." />
        )}
      </ChartCard>

      {/* B. Module Completion Rate */}
      <ChartCard title="Module Completion Rate" subtitle="Completed vs remaining students">
        {hasModules ? (
          <ResponsiveContainer>
            <BarChart
              data={moduleCompletion}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} unit="%" />
              <YAxis
                type="category"
                dataKey="title"
                width={110}
                tick={{ ...axisTick, fontSize: 10.5 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name, props) => [
                  `${v}% (${props.payload.completedStudents} done · ${props.payload.remainingStudents} remaining)`,
                  'Completion',
                ]}
              />
              <Bar dataKey="completionRate" radius={[0, 8, 8, 0]} maxBarSize={22}>
                {moduleCompletion.map((m) => (
                  <Cell
                    key={m.title}
                    fill={m.completionRate >= 70 ? '#14B8A6' : m.completionRate >= 40 ? '#F59E0B' : '#EF4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmptyState title="No module data yet" sub="Completion rates appear as students start modules." />
        )}
      </ChartCard>

      {/* C. Weak Topic Distribution */}
      <ChartCard title="Weak Topic Distribution" subtitle="Where students struggle most" height={300}>
        {hasWeakTopics ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={weakTopicData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="42%"
                innerRadius={45}
                outerRadius={80}
                paddingAngle={2}
                label={({ percent }) => `${Math.round(percent * 100)}%`}
                labelLine={false}
              >
                {weakTopicData.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={entry.name.startsWith('Other') ? OTHER_SLICE_COLOR : PIE_COLORS[i % PIE_COLORS.length]}
                    stroke="#131929"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, name) => [`${v} student${v !== 1 ? 's' : ''}`, name]}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                layout="horizontal"
                height={56}
                iconSize={9}
                wrapperStyle={{
                  fontSize: 11,
                  color: '#7a8aaa',
                  lineHeight: '1.6',
                  overflowY: 'auto',
                  maxHeight: 56,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmptyState icon="🎉" title="No weak topics found" sub="All students are performing well, or no data yet." />
        )}
      </ChartCard>

      {/* D. Average Score per Module */}
      <ChartCard title="Average Score per Module" subtitle="Class average, per module">
        {hasModules ? (
          <ResponsiveContainer>
            <BarChart data={avgScorePerModule} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis
                dataKey="title"
                tick={{ ...axisTick, fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={54}
              />
              <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} unit="%" />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Avg Score']} />
              <Bar dataKey="avgScore" radius={[8, 8, 0, 0]} maxBarSize={44}>
                {avgScorePerModule.map((m) => (
                  <Cell key={m.title} fill={m.avgScore >= 80 ? '#10B981' : m.avgScore >= 60 ? '#F59E0B' : '#EF4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ChartEmptyState title="No scores yet" sub="Module averages appear once students submit results." />
        )}
      </ChartCard>
    </div>
  );
};

export default AnalyticsCharts;
