// frontend/src/components/teacher/StudentsTable.jsx
// FIXES:
//  1. No debounce on search input — caused re-filter on every keystroke with large data
//  2. 'activeThisWeek' filter not guarded — if field is undefined, could show wrong results
//  3. Missing key prop warning on SkeletonRow (was using index correctly, but tbody
//     needs unique keys per row — kept index but added aria)
//  4. onStudentClick not guarded against undefined (was using optional chaining ✓ already)
//  5. Score bar width could exceed 100% if score > 100 — clamped

import React, { useState, useMemo, useCallback } from 'react';

const COLUMNS = [
  { key: 'name',             label: 'Student',      sortable: true  },
  { key: 'modulesCompleted', label: 'Modules Done', sortable: true  },
  { key: 'averageScore',     label: 'Avg Score',    sortable: true  },
  { key: 'timeSpent',        label: 'Time Spent',   sortable: true  },
  { key: 'weakTopic',        label: 'Weak Topic',   sortable: false },
];

const FILTER_OPTIONS = [
  { value: 'all',    label: 'All Students'              },
  { value: 'atRisk', label: 'Needs Attention (<50%)'    },
  { value: 'strong', label: 'High Performers (>80%)'    },
  { value: 'active', label: 'Active This Week'          },
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
  const [sortKey, setSortKey] = useState('averageScore');
  const [sortDir, setSortDir] = useState('desc');
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  // FIX: debounce search so filtering doesn't run on every keystroke
  const debouncedSearch = useDebounce(search, 250);

  const handleSort = useCallback((key) => {
    if (!COLUMNS.find((c) => c.key === key)?.sortable) return;
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('desc');
      return key;
    });
  }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let rows = [...data];

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

    // Filter presets
    if (filter === 'atRisk')  rows = rows.filter((r) => (r.averageScore ?? 0) < 50);
    if (filter === 'strong')  rows = rows.filter((r) => (r.averageScore ?? 0) >= 80);
    // FIX: guard against undefined activeThisWeek
    if (filter === 'active')  rows = rows.filter((r) => r.activeThisWeek === true);

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
  }, [data, debouncedSearch, filter, sortKey, sortDir]);

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
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter students"
        >
          {FILTER_OPTIONS.map((o) => (
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
                  {debouncedSearch || filter !== 'all'
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

                return (
                  <tr
                    key={student._id || student.id || i}
                    onClick={() => onStudentClick?.(student)}
                    style={{ cursor: 'pointer' }}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onStudentClick?.(student)}
                  >
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
                        {student.timeSpent != null ? `${Math.round(student.timeSpent)}m` : '—'}
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
