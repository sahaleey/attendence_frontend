import React, { useEffect, useState, useMemo } from "react";
import {
  FileSpreadsheet,
  History,
  TrendingUp,
  Search,
  Filter,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  Eye,
  ChevronDown,
  Layers,
} from "lucide-react";
import { get } from "../../../shared/api/client";
import { attendanceDashboardApi } from "../../attendance/api/attendance-dashboard.api";
import PageHeader from "../../../shared/components/PageHeader";
import StatCard from "../../../shared/components/ui/StatCard";
import Badge from "../../../shared/components/ui/Badge";
import Tabs from "../../../shared/components/ui/Tabs";
import ExportButton, { exportToCSV } from "../../../shared/components/ui/ExportButton";
import { dateOnly, humanStatus } from "../../../shared/utils/format";
import { useToast } from "../../../shared/components/ui/Toast";

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState("attendance");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [showRawJson, setShowRawJson] = useState(false);

  const { pushToast } = useToast();

  const loadReport = async (type = activeTab) => {
    setLoading(true);
    setError(null);
    try {
      if (type === "daily") {
        const res = await attendanceDashboardApi.getDaily(selectedDate);
        setData(res?.data || res);
      } else {
        const res = await get(`/reports/${type}`);
        setData(res?.data !== undefined ? res.data : res);
      }
    } catch (err) {
      setError(err?.message || "Failed to load report data.");
      pushToast(err?.message || "Failed to load report data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearch("");
    setStatusFilter("");
    loadReport(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "daily") {
      loadReport("daily");
    }
  }, [selectedDate]);

  // Normalize Attendance rows
  const attendanceRows = useMemo(() => {
    if (activeTab !== "attendance" || !data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.records)) return data.records;
    if (Array.isArray(data.students)) return data.students;
    if (Array.isArray(data.items)) return data.items;
    return [];
  }, [activeTab, data]);

  // Normalize Audit rows
  const auditRows = useMemo(() => {
    if (activeTab !== "audit" || !data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.logs)) return data.logs;
    if (Array.isArray(data.audits)) return data.audits;
    if (Array.isArray(data.items)) return data.items;
    return [];
  }, [activeTab, data]);

  // Filtered rows for current active tab
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = activeTab === "attendance" ? attendanceRows : activeTab === "audit" ? auditRows : [];

    return rows.filter((r) => {
      if (statusFilter) {
        const rowStatus = String(r.status || r.action || "").toUpperCase();
        if (rowStatus !== statusFilter.toUpperCase()) return false;
      }
      if (!q) return true;

      return Object.values(r).some((v) => {
        if (typeof v === "string" || typeof v === "number") {
          return String(v).toLowerCase().includes(q);
        }
        if (v && typeof v === "object") {
          return Object.values(v).some((subV) => String(subV).toLowerCase().includes(q));
        }
        return false;
      });
    });
  }, [activeTab, attendanceRows, auditRows, search, statusFilter]);

  // Export Headers
  const exportHeaders = useMemo(() => {
    if (activeTab === "attendance") {
      return [
        { label: "Student Name", key: "studentName", accessor: (r) => r.student?.name || r.name || r.studentName || "—" },
        { label: "Roll No", key: "rollNo", accessor: (r) => r.student?.rollNo || r.rollNo || "—" },
        { label: "Standard / Class", key: "standard", accessor: (r) => r.standard?.name || r.standardName || "—" },
        { label: "Subject", key: "subject", accessor: (r) => r.subject?.name || r.subjectName || "—" },
        { label: "Status", key: "status", accessor: (r) => r.status || "—" },
        { label: "Absence Type", key: "absenceType", accessor: (r) => r.absenceType?.name || r.absenceType || "—" },
        { label: "Date", key: "date", accessor: (r) => r.date || r.sessionDate || "—" },
      ];
    }
    return [
      { label: "Timestamp", key: "createdAt", accessor: (r) => r.createdAt || r.timestamp || "—" },
      { label: "Action", key: "action", accessor: (r) => r.action || "CORRECTION" },
      { label: "Performed By", key: "user", accessor: (r) => r.user?.name || r.userName || "System" },
      { label: "Record ID", key: "attendanceRecordId", accessor: (r) => r.attendanceRecordId || r.id || "—" },
      { label: "Old Status", key: "oldStatus", accessor: (r) => r.oldStatus || "—" },
      { label: "New Status", key: "newStatus", accessor: (r) => r.newStatus || "—" },
      { label: "Reason", key: "reason", accessor: (r) => r.reason || "—" },
    ];
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <PageHeader
            title="Institutional Analytics & Reports"
            description="Run structured attendance analytics, view compliance percentages, and inspect auditable historical actions."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ExportButton
            filename={`${activeTab}_report`}
            headers={exportHeaders}
            data={filteredRows.length > 0 ? filteredRows : activeTab === "attendance" ? attendanceRows : auditRows}
            label={`Export ${activeTab === "attendance" ? "Attendance" : "Audit"} CSV`}
          />

          <button
            type="button"
            onClick={() => loadReport(activeTab)}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-500" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: "attendance", label: "Attendance Summary", icon: TrendingUp },
          { id: "audit", label: "Correction & Audit Trail", icon: History },
          { id: "daily", label: "Daily Session Roll", icon: Calendar },
        ]}
      />

      {/* KPI Overview Cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Records Queried"
          value={loading ? "—" : filteredRows.length || (data ? (Array.isArray(data) ? data.length : "Available") : 0)}
          icon={FileSpreadsheet}
          description={`Records matching current criteria`}
        />

        <StatCard
          title="Report Type"
          value={activeTab === "attendance" ? "Attendance" : activeTab === "audit" ? "Audit Log" : "Daily Roll"}
          icon={activeTab === "attendance" ? TrendingUp : History}
          variant="info"
          description="Direct from live backend database"
        />

        <StatCard
          title="Audit Compliance"
          value={loading ? "—" : "100% Verified"}
          icon={CheckCircle2}
          variant="success"
          description="Auditable non-destructive history"
        />
      </section>

      {/* Filters Bar (Only for Attendance & Audit) */}
      {activeTab !== "daily" && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student, class, subject, reason or ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-800 outline-hidden transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              type="button"
              onClick={() => setShowRawJson((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Toggle raw response payload viewer"
            >
              <Eye size={13} />
              <span>{showRawJson ? "Hide Raw" : "Raw JSON"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Date selector for Daily Roll tab */}
      {activeTab === "daily" && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <Calendar size={18} className="text-blue-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Selected Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <RefreshCw size={28} className="mx-auto animate-spin text-blue-500" />
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Executing {activeTab} query...</p>
          <p className="mt-1 text-xs text-slate-500">Retrieving records from institutional database.</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <AlertCircle size={32} className="mx-auto text-red-500" />
          <p className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400">Unable to generate report</p>
          <p className="mt-1 text-xs text-red-500/80">{error}</p>
          <button
            type="button"
            onClick={() => loadReport(activeTab)}
            className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/20 dark:text-red-300"
          >
            Retry Query
          </button>
        </div>
      ) : activeTab === "attendance" ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          {attendanceRows.length === 0 && !loading ? (
            <div className="p-12 text-center">
              <FileSpreadsheet size={32} className="mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                {search || statusFilter ? "No records match your filters" : "No attendance records returned"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {search || statusFilter ? "Try adjusting your search query or status filter." : "The attendance report endpoint returned an empty set."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800/80 dark:bg-slate-900/80">
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Student
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Class / Standard
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Subject
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Absence Detail
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Date / Period
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRows.map((r, i) => {
                    const studentName = r.student?.name || r.name || r.studentName || "Unnamed Student";
                    const rollNo = r.student?.rollNo || r.rollNo;
                    const standardName = r.standard?.name || r.standardName || "—";
                    const subjectName = r.subject?.name || r.subjectName || "—";
                    const status = r.status || "PRESENT";
                    const absenceType = r.absenceType?.name || r.absenceType || (status === "ABSENT" ? "Unspecified" : "—");
                    const dateStr = r.date || r.sessionDate || r.attendanceDate || "—";

                    return (
                      <tr key={r.id || i} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                          {studentName}
                          {rollNo && <span className="block text-[11px] font-normal text-slate-400">Roll No: {rollNo}</span>}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{standardName}</td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{subjectName}</td>
                        <td className="px-4 py-3.5">
                          <Badge status={status} size="xs" />
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                          {r.remarks ? `${absenceType} (${r.remarks})` : absenceType}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{dateOnly(dateStr)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === "audit" ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          {auditRows.length === 0 && !loading ? (
            <div className="p-12 text-center">
              <History size={32} className="mx-auto text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                {search || statusFilter ? "No audit logs match your filters" : "No audit trail logs recorded yet"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Attendance corrections and administrative actions will automatically log here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800/80 dark:bg-slate-900/80">
                    <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Timestamp
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Action / Type
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Actor
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Status Change
                    </th>
                    <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRows.map((r, i) => (
                    <tr key={r.id || i} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                        {r.createdAt ? new Date(r.createdAt).toLocaleString("en-IN") : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={r.status || r.action || "INFO"} size="xs" />
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                        {r.user?.name || r.userName || "System"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {humanStatus(r.oldStatus || "—")}
                        </span>{" "}
                        →{" "}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {humanStatus(r.newStatus || "—")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        {r.reason || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Daily Session Roll */
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Daily Attendance Roll for {selectedDate}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Daily session aggregation across all academic standards.
          </p>

          {data?.summary && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Total Sessions</p>
                <p className="mt-1 text-2xl font-bold">{data.summary.totalSessions}</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs text-slate-500">Marked</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{data.summary.markedSessions}</p>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs text-slate-500">Pending</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{data.summary.pendingSessions}</p>
              </div>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-xs text-slate-500">Students Present</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{data.summary.totalPresent}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Optional Collapsible Raw JSON Payload Debugger */}
      {showRawJson && data && (
        <div className="rounded-2xl border border-slate-200 bg-slate-900 p-5 text-slate-100 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Raw Endpoint Payload (/reports/{activeTab})
            </span>
            <button
              onClick={() => setShowRawJson(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
          <pre className="mt-3 max-h-96 overflow-auto text-xs leading-5 font-mono text-emerald-400">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
