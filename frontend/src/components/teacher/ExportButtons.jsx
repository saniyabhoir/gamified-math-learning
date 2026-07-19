// frontend/src/components/teacher/ExportButtons.jsx
// NEW — Export the currently loaded analytics to CSV or PDF. Uses only
// data already fetched into TeacherDashboard state; PDF export lazy-loads
// jsPDF/autoTable so the cost isn't paid until a teacher actually exports.

import React, { useState } from 'react';
import { exportStudentsCSV, exportAnalyticsPDF } from '../../utils/studentAnalytics';

const ExportButtons = ({ overview, students, disabled }) => {
  const [exportingPdf, setExportingPdf] = useState(false);

  const handlePdf = async () => {
    setExportingPdf(true);
    try {
      await exportAnalyticsPDF({ overview, students });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="td-export-buttons">
      <button
        className="td-export-btn"
        onClick={() => exportStudentsCSV(students)}
        disabled={disabled || !students?.length}
        title="Export student analytics as CSV"
      >
        ⬇ CSV
      </button>
      <button
        className="td-export-btn"
        onClick={handlePdf}
        disabled={disabled || exportingPdf || !students?.length}
        title="Export analytics report as PDF"
      >
        {exportingPdf ? '…' : '⬇ PDF'}
      </button>
    </div>
  );
};

export default ExportButtons;
