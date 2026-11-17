import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Clock3,
  Users,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { get } from "../../../shared/api/client";
import { attendanceDashboardApi } from "../../attendance/api/attendance-dashboard.api";
import { useAuth } from "../../../shared/context/AuthContext";
import P from "../../../shared/access/permissions";
import { visibleNav } from "../../../shared/access/navigation";
import { dateOnly, humanStatus } from "../../../shared/utils/format";
import StatCard from "../../../shared/components/ui/StatCard";
import Badge from "../../../shared/components/ui/Badge";
import AttendanceSessionModal from "../../attendance/components/AttendanceSessionModal";

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function shiftDaysISO(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function Dashboard() {
  const { user, hasPermission, hasAny } = useAuth();
  const navigate = useNavigate();

  const canSeeYears = hasPermission(P.ACADEMIC_YEAR_VIEW);
  const canSeeAttendance = hasPermission(P.REPORTS_ATTENDANCE_VIEW);
  const canGenerate = hasPermission(P.ATTENDANCE_SESSION_GENERATE);
  const canCorrect = hasPermission(P.ATTENDANCE_CORRECT) || hasPermission(P.ATTENDANCE_APPROVE_CORRECTION);
  const canMark = hasPermission(P.ATTENDANCE_MARK);

  const [date, setDate] = useState(todayISO());
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState(null);

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);

  const [unmarked, setUnmarked] = useState([]);
  const [unmarkedLoading, setUnmarkedLoading] = useState(false);

  const [correctionsCount, setCorrectionsCount] = useState(0);

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load active academic year
  useEffect(() => {
    async function loadYears() {
      try {
        const res = await get("/academic-years");
        const list = res.data || [];
        setYears(list);
        const active = list.find((y) => y.status === "ACTIVE") || list[0] || null;
        setActiveYear(active);
      } catch (e) {
        console.error("Failed to load academic years:", e);
      }
    }
    loadYears();
  }, []);

  // Load Daily Attendance Report
  const loadDailyReport = useCallback(
    async (targetDate = date, isSilent = false) => {
      if (!canSeeAttendance) {
        setReportLoading(false);
        return;
      }

      if (isSilent) setRefreshing(true);
      else setReportLoading(true);
      setReportError(null);

      try {
        const response = await attendanceDashboardApi.getDaily(targetDate);
        setReport(response.data || null);
      } catch (err) {
        setReportError(err?.message || "Failed to load attendance report for selected date.");
      } finally {
        setReportLoading(false);
        setRefreshing(false);
      }
    },
    [canSeeAttendance, date]
  );

  // Load Unmarked Sessions + Pending Corrections
  const loadAuxiliaryData = useCallback(async () => {
    if (canSeeAttendance) {
      setUnmarkedLoading(true);
      try {
        const res = await attendanceDashboardApi.getUnmarked({
          from: shiftDaysISO(date, -7),
          to: date,
          pageSize: 6,
        });
        setUnmarked(res?.data?.sessions || []);
      } catch (e) {
        console.warn("Unmarked sessions not fetched:", e);
      } finally {
        setUnmarkedLoading(false);
      }
    }

    if (canCorrect) {
      try {
        const corrRes = await get("/attendance/corrections");
        const pending = (corrRes?.data || []).filter((c) => c.status === "PENDING");
        setCorrectionsCount(pending.length);
      } catch (e) {
        /* ignore */
      }
    }
  }, [canSeeAttendance, canCorrect, date]);

  useEffect(() => {
    loadDailyReport(date);
    loadAuxiliaryData();
  }, [date, loadDailyReport, loadAuxiliaryData]);

  // Derived Metrics
  const metrics = useMemo(() => {
    if (!report?.summary) {
      return {
        rate: 0,
        marked: 0,
        totalSessions: 0,
        pending: 0,
        present: 0,
        absent: 0,
        completion: 0,
      };
    }

    const { totalSessions, markedSessions, pendingSessions, totalPresent, totalAbsent } = report.summary;
    const totalAttendanceMarked = totalPresent + totalAbsent;
    const rate = totalAttendanceMarked > 0 ? Math.round((totalPresent / totalAttendanceMarked) * 100) : 0;
    const completion = totalSessions > 0 ? Math.round((markedSessions / totalSessions) * 100) : 0;

    return {
      rate,
      marked: markedSessions,
      totalSessions,
      pending: pendingSessions,
      present: totalPresent,
      absent: totalAbsent,
      completion,
    };
  }, [report]);

  const firstName = user?.name?.split(" ")[0] || "Administrator";
  const isToday = date === todayISO();

  // Navigation sections for permission-granted areas
  const navSections = visibleNav(hasAny)
    .map((section) => ({ ...section, items: section.items.filter((i) => i.to !== "/dashboard") }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ========================================================
          1. HEADER & MISSION CONTROL STATUS BAR
      ======================================================== */}
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-slate-100/50 p-6 shadow-xs dark:border-slate-800/80 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950/80 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <Sparkles size={13} />
              Attendance Command Centre
            </span>
            {activeYear && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                • {activeYear.name} ({dateOnly(activeYear.startDate)} – {dateOnly(activeYear.endDate)})
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            Real-time institutional attendance oversight and operational controls.
          </p>
        </div>

        {/* Date Selector & Refresh Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setDate((d) => shiftDaysISO(d, -1))}
              className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Previous day"
            >
              ←
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border-0 bg-transparent px-2 py-1 text-xs font-semibold text-slate-800 outline-hidden dark:text-slate-200"
            />
            <button
              type="button"
              onClick={() => setDate((d) => shiftDaysISO(d, 1))}
              className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Next day"
            >
              →
            </button>
          </div>

          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(todayISO())}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Today
            </button>
          )}

          <button
            type="button"
            onClick={() => loadDailyReport(date, true)}
            disabled={refreshing}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin text-blue-500" : ""} />
          </button>
        </div>
      </section>

      {/* ========================================================
          2. KEY INSTITUTIONAL KPI STAT CARDS
      ======================================================== */}
      {canSeeAttendance && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Attendance Rate"
            value={reportLoading ? "—" : `${metrics.rate}%`}
            icon={TrendingUp}
            variant={metrics.rate >= 80 ? "success" : metrics.rate >= 60 ? "warning" : "danger"}
            description={`${metrics.present} present out of ${metrics.present + metrics.absent} recorded`}
          />

          <StatCard
            title="Sessions Marked"
            value={reportLoading ? "—" : `${metrics.marked} / ${metrics.totalSessions}`}
            icon={ClipboardCheck}
            variant={metrics.completion === 100 ? "success" : "info"}
            description={`${metrics.completion}% completion rate today`}
            onClick={() => navigate("/attendance")}
          />

          <StatCard
            title="Absent Students"
            value={reportLoading ? "—" : metrics.absent}
            icon={Users}
            variant={metrics.absent > 0 ? "warning" : "default"}
            description={metrics.absent > 0 ? "Across all active classes today" : "Zero recorded absences"}
            onClick={() => navigate("/reports")}
          />

          <StatCard
            title="Pending Sessions"
            value={reportLoading ? "—" : metrics.pending}
            icon={AlertCircle}
            variant={metrics.pending > 0 ? "danger" : "success"}
            description={metrics.pending > 0 ? "Action needed: sessions unmarked" : "All scheduled sessions complete"}
            onClick={() => navigate("/attendance")}
          />
        </section>
      )}

      {/* ========================================================
          3. QUICK ACTION COMMAND LAUNCHPAD
      ======================================================== */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {canSeeAttendance && (
          <Link
            to="/attendance"
            className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-blue-500"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <ClipboardCheck size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Live Matrix</p>
              <p className="truncate text-[11px] text-slate-500">View daily schedule</p>
            </div>
            <ArrowRight size={14} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-500" />
          </Link>
        )}

        {canGenerate && (
          <Link
            to="/attendance/generate"
            className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-purple-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-purple-500"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400">
              <PlusCircle size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Generate</p>
              <p className="truncate text-[11px] text-slate-500">Create new sessions</p>
            </div>
            <ArrowRight size={14} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-purple-500" />
          </Link>
        )}

        {canCorrect && (
          <Link
            to="/attendance/corrections"
            className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-amber-500"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400">
              <RotateCcw size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Corrections</p>
                {correctionsCount > 0 && (
                  <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                    {correctionsCount}
                  </span>
                )}
              </div>
              <p className="truncate text-[11px] text-slate-500">Review requests</p>
            </div>
            <ArrowRight size={14} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-amber-500" />
          </Link>
        )}

        <Link
          to="/reports"
          className="group flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-emerald-500"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
            <FileSpreadsheet size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Reports</p>
            <p className="truncate text-[11px] text-slate-500">Analytics & audit</p>
          </div>
          <ArrowRight size={14} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-500" />
        </Link>
      </section>

      {/* ========================================================
          4. MAIN ATTENDANCE SESSION OVERVIEW & UNMARKED QUEUE
      ======================================================== */}
      {canSeeAttendance && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Daily Attendance Session Matrix Preview (2 cols) */}
          <div className="lg:col-span-2 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800/80">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Daily Attendance Matrix
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Showing sessions for {date} • Click any active period to inspect student breakdown
                </p>
              </div>

              <Link
                to="/attendance"
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Full Matrix <ArrowRight size={14} />
              </Link>
            </div>

            {reportLoading ? (
              <div className="p-12 text-center">
                <RefreshCw size={24} className="mx-auto animate-spin text-slate-400" />
                <p className="mt-3 text-xs text-slate-500">Loading daily attendance records...</p>
              </div>
            ) : reportError ? (
              <div className="p-8 text-center">
                <AlertCircle size={28} className="mx-auto text-red-500" />
                <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{reportError}</p>
                <button
                  type="button"
                  onClick={() => loadDailyReport(date)}
                  className="mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                >
                  Retry
                </button>
              </div>
            ) : !report?.periods || report.periods.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarDays size={32} className="mx-auto text-slate-400" />
                <p className="mt-3 text-sm font-medium text-slate-800 dark:text-slate-200">
                  No attendance sessions generated for this date
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Generate attendance sessions from the timetable configuration to activate attendance tracking.
                </p>
                {canGenerate && (
                  <Link
                    to="/attendance/generate"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                  >
                    <PlusCircle size={14} />
                    Generate Sessions for {date}
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800/80 dark:bg-slate-900/80">
                      <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Class / Standard
                      </th>
                      {report.periods.slice(0, 6).map((period) => (
                        <th
                          key={period.id}
                          className="px-3 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center"
                        >
                          P{period.periodIndex}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {report.standards.slice(0, 6).map((row) => (
                      <tr key={row.standard.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{row.standard.name}</p>
                          <p className="text-[11px] text-slate-400">{row.totalStudents} enrolled</p>
                        </td>

                        {row.cells.slice(0, 6).map((cell) => {
                          const status = !cell.hasSession ? "NOT_GENERATED" : cell.sessionStatus;
                          const clickable = cell.hasSession;

                          return (
                            <td key={cell.periodId} className="p-1.5 text-center">
                              <button
                                type="button"
                                disabled={!clickable}
                                onClick={() => clickable && setSelectedSessionId(cell.sessionId)}
                                className={`w-full rounded-xl border p-2 text-left transition-all ${
                                  !clickable
                                    ? "border-slate-100 bg-slate-50/50 opacity-40 dark:border-slate-800/40 dark:bg-slate-900/20"
                                    : status === "MARKED" || status === "SUBMITTED"
                                    ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 dark:bg-emerald-950/20"
                                    : "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 hover:bg-amber-500/10 dark:bg-amber-950/20"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <Badge status={status} size="xs" showIcon={false} />
                                </div>
                                {clickable && (
                                  <p className="mt-1 truncate text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                    {cell.subject?.name || "Subject"}
                                  </p>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Urgent Attention / Unmarked Queue (1 col) */}
          <div className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Requires Attention
                </h3>
              </div>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                {unmarked.length} unmarked
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Sessions past scheduled start without attendance submission.
            </p>

            <div className="mt-4 flex-1 space-y-2.5">
              {unmarkedLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Checking pending sessions...</div>
              ) : unmarked.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                  <CheckCircle2 size={28} className="text-emerald-500" />
                  <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">All caught up!</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">No overdue unmarked sessions detected.</p>
                </div>
              ) : (
                unmarked.slice(0, 5).map((item) => (
                  <button
                    key={item.sessionId}
                    type="button"
                    onClick={() => setSelectedSessionId(item.sessionId)}
                    className="group flex w-full items-center justify-between rounded-2xl border border-amber-500/15 bg-amber-500/5 p-3.5 text-left transition hover:border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          P{item.periodIndex}
                        </span>
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {item.subjectName}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {item.standardName} • {item.staffName || "Unassigned"} • {dateOnly(item.date)}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                  </button>
                ))
              )}
            </div>

            {unmarked.length > 5 && (
              <Link
                to="/attendance"
                className="mt-4 block text-center text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                View all {unmarked.length} unmarked sessions →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          5. ACADEMIC & INSTITUTIONAL SECTIONS SITEMAP
      ======================================================== */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Academic Management Modules
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navSections.map((section) => (
            <div
              key={section.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-semibold text-xs">
                  {section.items[0]?.icon || "▣"}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{section.label}</h3>
              </div>

              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800/60">
                {section.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex items-center justify-between py-2 text-xs font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={13} className="text-slate-300 opacity-0 transition group-hover:opacity-100 group-hover:translate-x-0.5 dark:text-slate-600" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          6. ATTENDANCE SESSION MODAL INSPECTOR
      ======================================================== */}
      {selectedSessionId && (
        <AttendanceSessionModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onSessionUpdated={() => loadDailyReport(date, true)}
        />
      )}
    </div>
  );
}
