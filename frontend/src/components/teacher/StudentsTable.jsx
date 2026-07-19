// frontend/src/components/teacher/StudentsTable.jsx
// FIXES:
//  1. No debounce on search input — caused re-filter on every keystroke with large data
//  2. 'activeThisWeek' filter not guarded — if field is undefined, could show wrong results
//  3. Missing key prop warning on SkeletonRow (was using index correctly, but tbody
//     needs unique keys per row — kept index but added aria)
//  4. onStudentClick not guarded against undefined (was using optional chaining ✓ already)
//  5. Score bar width could exceed 100% if score > 100 — clamped

import React, { useState, useMemo, useCallback } from 'react';
import { rankStudents, medalFor, TOTAL_MODULES } from '../../utils/studentAnalytics';
import { formatMinutes } from '../../utils/formatTime';

const COLUMNS = [
  { key: 'rank',             label: 'Rank',         sortable: false },
  { key: 'name',             label: 'Student',      sortable: true  },
  { key: 'modulesCompleted', label: 'Modules Done', sortable: true  },
  { key: 'averageScore',     label: 'Avg Score',    sortable: true  },
  { key: 'timeSpent',        label: 'Time Spent',   sortable: true  },
  { key: 'avgStars',         label: 'Stars',        sortable: true  },
  { key: 'weakTopic',        label: 'Weak Topic',   sortable: false },
];

const PERFORMANCE_OPTIONS = [
  { value: 'all',    label: 'All Performance'            },
  { value: 'atRisk', label: 'Needs Attention (<50%)'     },
  { value: 'strong', label: 'High Performers (>80%)'     },
  { value: 'active', label: 'Active This Week'            },
];

const COMPLETION_OPTIONS = [
  { value: 'all',      label: 'Any Completion'      },
  { value: 'all-done', label: `Completed All (${TOTAL_MODULES}/${TOTAL_MODULES})` },
  { value: 'partial',  label: 'Partially Completed'  },
  { value: 'none',     label: 'Not Started'          },
];

const SORT_PRESETS = [
  { value: 'score-desc', label: 'Highest Score',  key: 'averageScore', dir: 'desc' },
  { value: 'score-asc',  label: 'Lowest Score',    key: 'averageScore', dir: 'asc'  },
  { value: 'time-desc',  label: 'Time Spent',      key: 'timeSpent',    dir: 'desc' },
  { value: 'stars-desc', label: 'Stars',           key: 'avgStars',     dir: 'desc' },
  { value: 'name-asc',   label: 'Alphabetically',  key: 'name',         dir: 'asc'  },
];

const getScoreColor = (score) => {
  if (score >= 80) return '#10B981';
  if (score >= 60) return '#F59E0B';
  return '#EF4444';
};

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
};

const SkeletonRow = () => (
  <tr aria-hidden="true">
    {COLUMNS.map((c) => (
      <td key={c.key} style={{ padding: '0.9rem 1.25rem' }}>
        <div className="td-skeleton" style={{ height: 14, width: c.key === 'name' ? 140 : 80 }} />
      </td>
    ))}
  </tr>
);

// FIX: simple debounce hook to avoid filtering on every keystroke
const useDebounce = (value, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
};

const StudentsTable = ({ data, loading, error, onStudentClick }) => {
  const [sortKey, setSortKey]   = useState('averageScore');
  const [sortDir, setSortDir]   = useState('desc');
  const [sortPreset, setSortPreset] = useState('score-desc');
  const [search,  setSearch]    = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('all');
  const [moduleFilter, setModuleFilter]         = useState('all');
  const [weakTopicFilter, setWeakTopicFilter]   = useState('all');
  const [completionFilter, setCompletionFilter] = useState('all');

  // FIX: debounce search so filtering doesn't run on every keystroke
  const debouncedSearch = useDebounce(search, 250);

  // Rank every student (independent of the current filter/sort state) so the
  // Rank badge always reflects true class standing: Avg Score > Modules
  // Completed > Avg Stars.
  const ranked = useMemo(() => rankStudents(data || []), [data]);

  // Build dynamic filter option lists from whatever data is actually present.
  const moduleOptions = useMemo(() => {
    const titles = new Set();
    (data || []).forEach((s) => (s.modules || []).forEach((m) => {
      if (m.moduleTitle) titles.add(m.moduleTitle);
    }));
    return Array.from(titles);
  }, [data]);

  const weakTopicOptions = useMemo(() => {
    const topics = new Set();
    (data || []).forEach((s) => (s.weakTopics || []).forEach((t) => topics.add(t)));
    return Array.from(topics);
  }, [data]);

  const handleSort = useCallback((key) => {
    if (!COLUMNS.find((c) => c.key === key)?.sortable) return;
    setSortPreset(''); // manual column click overrides the preset dropdown
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('desc');
      return key;
    });
  }, []);

  const handleSortPreset = useCallback((value) => {
    setSortPreset(value);
    const preset = SORT_PRESETS.find((p) => p.value === value);
    if (preset) {
      setSortKey(preset.key);
      setSortDir(preset.dir);
    }
  }, []);

  const filtered = useMemo(() => {
    let rows = [...ranked];

    // Search by name / email / weakTopic
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.weakTopic?.toLowerCase().includes(q)
      );
    }

    // Performance filter presets
    if (performanceFilter === 'atRisk')  rows = rows.filter((r) => (r.averageScore ?? 0) < 50);
    if (performanceFilter === 'strong')  rows = rows.filter((r) => (r.averageScore ?? 0) >= 80);
    // FIX: guard against undefined activeThisWeek
    if (performanceFilter === 'active')  rows = rows.filter((r) => r.activeThisWeek === true);

    // Module filter — student has attempted/completed the selected module
    if (moduleFilter !== 'all') {
      rows = rows.filter((r) => (r.modules || []).some((m) => m.moduleTitle === moduleFilter));
    }

    // Weak topic filter
    if (weakTopicFilter !== 'all') {
      rows = rows.filter((r) => (r.weakTopics || []).includes(weakTopicFilter));
    }

    // Completed modules filter
    if (completionFilter === 'all-done') {
      rows = rows.filter((r) => (r.modulesCompleted ?? 0) >= TOTAL_MODULES);
    } else if (completionFilter === 'partial') {
      rows = rows.filter((r) => (r.modulesCompleted ?? 0) > 0 && (r.modulesCompleted ?? 0) < TOTAL_MODULES);
    } else if (completionFilter === 'none') {
      rows = rows.filter((r) => (r.modulesCompleted ?? 0) === 0);
    }

    // Sort
    rows.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp =
        typeof av === 'string'
          ? av.localeCompare(bv)
          : av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return rows;
  }, [ranked, debouncedSearch, performanceFilter, moduleFilter, weakTopicFilter, completionFilter, sortKey, sortDir]);

  const filtersActive =
    performanceFilter !== 'all' || moduleFilter !== 'all' ||
    weakTopicFilter !== 'all' || completionFilter !== 'all';

  const SortIcon = ({ col }) => {
    if (!col.sortable) return null;
    const isActive = sortKey === col.key;
    return (
      <span className={`td-sort-icon ${isActive ? 'active' : ''}`} aria-hidden="true">
        {isActive ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );
  };

  if (error) {
    return (
      <div className="td-error-state">
        <span className="td-error-icon">⚠️</span>
        <p className="td-error-title">Failed to load student data</p>
        <p className="td-error-sub">{error}</p>
      </div>
    );
  }

  return (
    <div className="td-table-wrapper">
      {/* Toolbar */}
      <div className="td-table-toolbar">
        <div className="td-search-box">
          <span className="td-search-icon" aria-hidden="true">🔍</span>
          <input
            className="td-search-input"
            type="search"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search students"
          />
        </div>

        <select
          className="td-filter-select"
          value={performanceFilter}
          onChange={(e) => setPerformanceFilter(e.target.value)}
          aria-label="Filter by performance"
        >
          {PERFORMANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className="td-filter-select"
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          aria-label="Filter by module"
        >
          <option value="all">All Modules</option>
          {moduleOptions.map((title) => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>

        <select
          className="td-filter-select"
          value={completionFilter}
          onChange={(e) => setCompletionFilter(e.target.value)}
          aria-label="Filter by completed modules"
        >
          {COMPLETION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className="td-filter-select"
          value={weakTopicFilter}
          onChange={(e) => setWeakTopicFilter(e.target.value)}
          aria-label="Filter by weak topic"
          disabled={weakTopicOptions.length === 0}
        >
          <option value="all">All Weak Topics</option>
          {weakTopicOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          className="td-filter-select td-sort-select"
          value={sortPreset}
          onChange={(e) => handleSortPreset(e.target.value)}
          aria-label="Sort students"
        >
          <option value="">Sort by…</option>
          {SORT_PRESETS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <span className="td-table-count">
          {loading
            ? '—'
            : `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="td-table" aria-label="Students list">
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={sortKey === col.key ? 'sorted' : ''}
                  onClick={() => handleSort(col.key)}
                  aria-sort={
                    sortKey === col.key
                      ? sortDir === 'asc' ? 'ascending' : 'descending'
                      : 'none'
                  }
                  style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                >
                  {col.label}
                  <SortIcon col={col} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length}
                  style={{ padding: '2.5rem', textAlign: 'center', color: '#9CA3AF' }}
                >
                  {debouncedSearch || filtersActive
                    ? 'No students match the current filters.'
                    : 'No student data available yet.'}
                </td>
              </tr>
            ) : (
              filtered.map((student, i) => {
                const score = student.averageScore ?? 0;
                // FIX: clamp score to [0, 100] to prevent bar overflow
                const clampedScore = Math.min(100, Math.max(0, score));
                const color = getScoreColor(score);

                const medal = medalFor(student.rank);

                return (
                  <tr
                    key={student._id || student.id || i}
                    onClick={() => onStudentClick?.(student)}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onStudentClick?.(student)}
                  >
                    {/* Rank / medal */}
                    <td>
                      <span className={`td-rank-badge ${medal ? 'medal' : ''}`}>
                        {medal || `#${student.rank}`}
                      </span>
                    </td>

                    {/* Student name + avatar */}
                    <td>
                      <div className="td-student-cell">
                        <div className="td-student-avatar" aria-hidden="true">
                          {getInitials(student.name)}
                        </div>
                        <div>
                          <div className="td-student-name">{student.name}</div>
                          {student.email && (
                            <div className="td-student-email">{student.email}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Modules completed */}
                    <td>
                      <span style={{ fontWeight: 600 }}>{student.modulesCompleted ?? 0}</span>
                      <span style={{ color: '#9CA3AF', fontSize: '0.78rem' }}> / 5</span>
                    </td>

                    {/* Score + bar */}
                    <td>
                      <div className="td-score-cell">
                        <span style={{ fontWeight: 600, color, minWidth: 34 }}>
                          {Math.round(score)}%
                        </span>
                        <div className="td-score-bar-wrap" aria-hidden="true">
                          <div
                            className="td-score-bar-fill"
                            style={{ width: `${clampedScore}%`, background: color }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Time spent */}
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {student.timeSpent != null ? formatMinutes(student.timeSpent) : '—'}
                      </span>
                    </td>

                    {/* Stars */}
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--td-primary)' }}>
                        {student.avgStars != null ? `${Number(student.avgStars).toFixed(1)} ⭐` : '—'}
                      </span>
                    </td>

                    {/* Weak topic */}
                    <td>
                      {student.weakTopic ? (
                        <span className="td-weak-tag">{student.weakTopic}</span>
                      ) : (
                        <span className="td-weak-tag td-tag-success">No weak areas</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;
