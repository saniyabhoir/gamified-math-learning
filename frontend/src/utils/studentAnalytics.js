// frontend/src/utils/studentAnalytics.js
// Client-side analytics helpers for the Teacher Dashboard "wow" features
// (charts, ranking, insights, exports). Everything here is derived purely
// from data the dashboard already fetches via GET /analytics/overview,
// /analytics/students, /analytics/modules and /analytics/weak-topics — no
// new endpoints, no invented metrics.

import { formatSeconds } from './formatTime';

export const TOTAL_MODULES = 5;

export const MODULE_LABELS = [
  'Intro to Algebra',
  'Simplification',
  'Multiplication',
  'Substitution',
  'Algebra in Action',
];

/* ────────────────────────────────────────────────────────────────────────
 * Ranking
 * Primary: Average Score · Secondary: Modules Completed · Third: Avg Stars
 * ──────────────────────────────────────────────────────────────────────── */
export const rankStudents = (students = []) => {
  return [...students]
    .sort((a, b) => {
      const score = (b.averageScore ?? 0) - (a.averageScore ?? 0);
      if (score !== 0) return score;
      const modules = (b.modulesCompleted ?? 0) - (a.modulesCompleted ?? 0);
      if (modules !== 0) return modules;
      return (b.avgStars ?? 0) - (a.avgStars ?? 0);
    })
    .map((s, i) => ({ ...s, rank: i + 1 }));
};

export const MEDALS = ['🥇', '🥈', '🥉'];
export const medalFor = (rank) => MEDALS[rank - 1] || null;

/* ────────────────────────────────────────────────────────────────────────
 * A. Class Performance Distribution — bucket students by averageScore
 * ──────────────────────────────────────────────────────────────────────── */
export const SCORE_BUCKETS = ['0-20', '21-40', '41-60', '61-80', '81-100'];

export const computeScoreDistribution = (students = []) => {
  const counts = SCORE_BUCKETS.reduce((acc, b) => ({ ...acc, [b]: 0 }), {});
  students.forEach((s) => {
    const score = Math.min(100, Math.max(0, s.averageScore ?? 0));
    if (score <= 20) counts['0-20']++;
    else if (score <= 40) counts['21-40']++;
    else if (score <= 60) counts['41-60']++;
    else if (score <= 80) counts['61-80']++;
    else counts['81-100']++;
  });
  return SCORE_BUCKETS.map((range) => ({ range, students: counts[range] }));
};

/* ────────────────────────────────────────────────────────────────────────
 * B. Module Completion Rate — completed vs remaining per module
 * ──────────────────────────────────────────────────────────────────────── */
export const computeModuleCompletion = (modules = []) => {
  return modules.map((m) => {
    const enrolled = m.enrolledStudents ?? 0;
    const rate = Math.min(100, Math.max(0, m.completionRate ?? 0));
    const completed = Math.round((rate / 100) * enrolled);
    return {
      title: m.title,
      moduleOrder: m.moduleOrder,
      completionRate: rate,
      completedStudents: completed,
      remainingStudents: Math.max(0, enrolled - completed),
      enrolledStudents: enrolled,
    };
  });
};

/* ────────────────────────────────────────────────────────────────────────
 * C. Weak Topic Distribution — pie chart shape
 * Raw topic taxonomies can run to 20-30+ distinct tags, which is unreadable
 * as a pie legend. Keep the top `maxSlices` topics (by student count) and
 * roll everything past that into a single "Other" slice so the chart and
 * its legend stay scannable regardless of how granular the backend tags are.
 * ──────────────────────────────────────────────────────────────────────── */
export const computeWeakTopicDistribution = (weakTopics = [], maxSlices = 7) => {
  const sorted = [...weakTopics]
    .map((t) => ({ name: t.topic, value: t.count ?? 0 }))
    .filter((t) => t.value > 0)
    .sort((a, b) => b.value - a.value);

  if (sorted.length <= maxSlices) return sorted;

  const top = sorted.slice(0, maxSlices);
  const rest = sorted.slice(maxSlices);
  const otherTotal = rest.reduce((sum, t) => sum + t.value, 0);

  return otherTotal > 0
    ? [...top, { name: `Other (${rest.length} topics)`, value: otherTotal }]
    : top;
};

/* ────────────────────────────────────────────────────────────────────────
 * D. Average Score per Module
 * ──────────────────────────────────────────────────────────────────────── */
export const computeAvgScorePerModule = (modules = []) => {
  return modules.map((m) => ({
    title: m.title,
    avgScore: Math.round(m.avgScore ?? 0),
  }));
};

/* ────────────────────────────────────────────────────────────────────────
 * Per-student richer statistics for the detail modal
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Compute a simple "current streak" — the number of consecutive calendar
 * days (counting back from today) that have at least one module
 * `playedAt` entry. Uses only data already present on each module record,
 * no new tracking is added.
 */
const computeStreak = (modules = []) => {
  const days = new Set(
    modules
      .filter((m) => m.playedAt)
      .map((m) => new Date(m.playedAt).toDateString())
  );
  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Today doesn't have to have activity for the streak to still count,
  // but the streak starts counting from the most recent active day.
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toDateString())) return 0;
  }

  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

export const computeStudentHighlights = (student) => {
  const modules = student?.modules || [];
  const completed = modules.filter((m) => m.completed);

  const highestModuleScore = completed.length
    ? Math.max(...completed.map((m) => m.score ?? 0))
    : null;
  const lowestModuleScore = completed.length
    ? Math.min(...completed.map((m) => m.score ?? 0))
    : null;

  const bestModule = completed.length
    ? completed.reduce((a, b) => ((b.score ?? 0) > (a.score ?? 0) ? b : a))
    : null;
  const weakestModule = completed.length
    ? completed.reduce((a, b) => ((b.score ?? 0) < (a.score ?? 0) ? b : a))
    : null;

  const longestSessionSeconds = modules.length
    ? Math.max(...modules.map((m) => m.completionTime ?? 0))
    : 0;

  const completionPercentage = Math.round(
    (Math.min(student?.modulesCompleted ?? 0, TOTAL_MODULES) / TOTAL_MODULES) * 100
  );

  return {
    highestModuleScore,
    lowestModuleScore,
    bestModuleTitle: bestModule?.moduleTitle || null,
    weakestModuleTitle: weakestModule?.moduleTitle || null,
    longestSession: formatSeconds(longestSessionSeconds),
    totalXP: student?.totalRewardPoints ?? 0,
    currentStreak: computeStreak(modules),
    completionPercentage,
  };
};

/* ────────────────────────────────────────────────────────────────────────
 * Teacher Insights — plain-language observations generated from data
 * already loaded into the dashboard (overview + students + modules +
 * weakTopics). Every sentence traces back to a real aggregate; nothing is
 * fabricated.
 * ──────────────────────────────────────────────────────────────────────── */
export const generateInsights = ({ students = [], modules = [], weakTopics = [] }) => {
  const insights = [];
  const totalStudents = students.length;

  // Top weak topic, expressed as a % of students.
  if (weakTopics.length > 0 && totalStudents > 0) {
    const top = weakTopics[0];
    const pct = Math.round((top.count / totalStudents) * 100);
    if (pct > 0) {
      insights.push({
        icon: '🎯',
        text: `${pct}% of students struggle with ${top.topic}.`,
      });
    }
  }

  // Modules with low completion — call out the module with fewest completions.
  modules.forEach((m) => {
    const enrolled = m.enrolledStudents ?? 0;
    if (enrolled === 0) return;
    const notCompleted = Math.round(enrolled - (m.completionRate / 100) * enrolled);
    if (notCompleted >= Math.max(2, Math.ceil(enrolled * 0.4))) {
      insights.push({
        icon: '📌',
        text: `${notCompleted} student${notCompleted !== 1 ? 's' : ''} ${notCompleted !== 1 ? 'have' : 'has'} not completed ${m.title}.`,
      });
    }
  });

  // Students at risk (low score) count.
  const atRisk = students.filter((s) => (s.averageScore ?? 0) < 50).length;
  if (atRisk > 0) {
    insights.push({
      icon: '⚠️',
      text: `${atRisk} student${atRisk !== 1 ? 's are' : ' is'} averaging below 50% and may need extra support.`,
    });
  }

  // Inactive students.
  const inactive = students.filter((s) => !s.activeThisWeek).length;
  if (inactive > 0) {
    insights.push({
      icon: '💤',
      text: `${inactive} student${inactive !== 1 ? 's have' : ' has'} not been active in the last 7 days.`,
    });
  }

  // Strongest module.
  const attempted = modules.filter((m) => (m.enrolledStudents ?? 0) > 0);
  if (attempted.length >= 2) {
    const strongest = attempted.reduce((a, b) => (b.avgScore > a.avgScore ? b : a));
    insights.push({
      icon: '🏆',
      text: `${strongest.title} is the class's strongest module at ${Math.round(strongest.avgScore)}% average.`,
    });
  }

  return insights.slice(0, 6);
};

/* ────────────────────────────────────────────────────────────────────────
 * Exports
 * ──────────────────────────────────────────────────────────────────────── */

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const exportStudentsCSV = (students = []) => {
  const header = [
    'Name', 'Email', 'Modules Completed', 'Average Score (%)',
    'Time Spent', 'Avg Stars', 'Total XP', 'Weak Topic', 'Active This Week',
  ];
  const rows = students.map((s) => [
    s.name ?? '',
    s.email ?? '',
    s.modulesCompleted ?? 0,
    Math.round(s.averageScore ?? 0),
    formatSeconds((s.timeSpent ?? 0) * 60, { compact: true }),
    (s.avgStars ?? 0).toFixed(1),
    s.totalRewardPoints ?? 0,
    s.weakTopic || 'None',
    s.activeThisWeek ? 'Yes' : 'No',
  ]);

  const escape = (val) => {
    const str = String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const csv = [header, ...rows].map((r) => r.map(escape).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), 'student-analytics.csv');
};

export const exportAnalyticsPDF = async ({ overview, students = [] }) => {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Teacher Analytics Report', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }), 14, 24);

  if (overview) {
    doc.setFontSize(11);
    doc.setTextColor(20);
    doc.text(
      `Students: ${overview.totalStudents ?? '—'}   Avg Score: ${overview.averageScore ?? '—'}%   ` +
      `Completion Rate: ${overview.modulesCompleted ?? '—'}%   Avg Stars: ${overview.avgStars ?? '—'}`,
      14,
      32
    );
  }

  autoTable(doc, {
    startY: 38,
    head: [['Rank', 'Name', 'Modules', 'Avg Score', 'Stars', 'XP', 'Weak Topic']],
    body: rankStudents(students).map((s) => [
      s.rank,
      s.name,
      s.modulesCompleted ?? 0,
      `${Math.round(s.averageScore ?? 0)}%`,
      (s.avgStars ?? 0).toFixed(1),
      s.totalRewardPoints ?? 0,
      s.weakTopic || '—',
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [232, 168, 56], textColor: [11, 15, 26] },
  });

  doc.save('teacher-analytics-report.pdf');
};
