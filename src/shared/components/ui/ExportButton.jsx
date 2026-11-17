import React from "react";
import { Download } from "lucide-react";

export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) return;

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map((h) => escapeCSV(h.label || h.key)).join(",");
  const dataRows = rows.map((row) =>
    headers
      .map((h) => {
        const val = typeof h.accessor === "function" ? h.accessor(row) : row[h.key];
        return escapeCSV(val);
      })
      .join(",")
  );

  const csvContent = "data:text/csv;charset=utf-8," + [headerRow, ...dataRows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ExportButton({
  filename = "Export",
  headers = [],
  data = [],
  label = "Export CSV",
  className = "",
}) {
  const handleExport = () => {
    exportToCSV(filename, headers, data);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!data || data.length === 0}
      className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      <Download size={14} className="text-slate-500 dark:text-slate-400" />
      <span>{label}</span>
    </button>
  );
}
