import { useEffect, useRef, useState, useMemo } from "react";
import { CheckCheck, CheckCircle2, CalendarOff, Users, UserCheck, X, Search, Sparkles } from "lucide-react";
import { ConfirmLeaveDialog } from "./ConfirmLeaveDialog";
import { ConfirmSubmitDialog } from "./ConfirmSubmitDialog ";
import StatusBadge from "./StatusBadge";
import StatusToggle from "../../../shared/components/StatusToggle";

export default function AttendanceDrawer({
  detail,
  absenceTypes,
  busy,
  confirmOpen,
  onClose,
  onUpdateStudent,
  onMarkAllPresent,
  onRequestSubmit,
  onCancelConfirm,
  onConfirmSubmit,
  leaveConfirmOpen,
  leaveBusy,
  leaveReason,
  onRequestLeave,
  onCancelLeaveConfirm,
  onConfirmLeave,
  onLeaveReasonChange,
}) {
  const closeButtonRef = useRef(null);
  const [search, setSearch] = useState("");

  // Normalize: support both flat shape and { session, students } shape
  const session = detail?.session ?? detail;
  const students = detail?.students ?? [];

  useEffect(() => {
    if (!session) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !confirmOpen && !leaveConfirmOpen) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [session, confirmOpen, leaveConfirmOpen, onClose]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter((s) => {
      const name = String(s.name || s.studentName || "").toLowerCase();
      const roll = String(s.rollNo ?? s.rollNumber ?? "");
      const adm = String(s.admissionNo || "").toLowerCase();
      return name.includes(q) || roll.includes(q) || adm.includes(q);
    });
  }, [students, search]);

  if (!session) return null;

  const sessionStatus = String(session.sessionStatus || "PENDING").toUpperCase();
  const isEditable = sessionStatus === "PENDING";
  const isStaffLeave = sessionStatus === "STAFF_LEAVE";

  const presentCount = students.filter(
    (student) => String(student.status || "PRESENT").toUpperCase() === "PRESENT"
  ).length;

  const absentCount = students.filter(
    (student) => String(student.status || "PRESENT").toUpperCase() === "ABSENT"
  ).length;

  const totalCount = students.length;
  const presentPercent = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 mb-3 bg-black/60 backdrop-blur-sm pb-3 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-drawer-title"
    >
      <div
        className="absolute inset-x-0 bottom-0 mx-auto flex h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:inset-y-4 sm:bottom-auto sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Live Attendance Room
            </span>

            <h2
              id="attendance-drawer-title"
              className="mt-0.5 truncate text-lg font-bold text-slate-100"
            >
              {session.subject?.name || session.subjectName || "Attendance Session"}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">{session.standard?.name || session.standardName || "—"}</span>
              <span>•</span>
              <span>Period {session.period?.periodIndex ?? session.periodIndex ?? "—"}</span>
              {(session.period?.startTime || session.startTime) && (
                <>
                  <span>•</span>
                  <span>
                    {session.period?.startTime || session.startTime} –{" "}
                    {session.period?.endTime || session.endTime || "—"}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close attendance drawer"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* LIVE METRICS PROGRESS BAR */}
        <div className="border-b border-slate-800/80 bg-slate-900/30 px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={sessionStatus} />

            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="text-emerald-400">{presentCount} present ({presentPercent}%)</span>
              <span className="text-red-400">{absentCount} absent</span>
              <span className="text-slate-400">{totalCount} total</span>
            </div>
          </div>

          {/* Dual-tone Progress Bar */}
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${presentPercent}%` }}
            />
          </div>

          {/* Actions Bar & Quick Search */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find student by name or roll..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-1.5 pl-8 pr-3 text-xs text-slate-200 outline-hidden transition focus:border-slate-600"
              />
            </div>

            {isEditable && students.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onMarkAllPresent}
                  disabled={busy || leaveBusy}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <CheckCheck size={14} />
                  <span>Mark All Present</span>
                </button>

                <button
                  type="button"
                  onClick={onRequestLeave}
                  disabled={busy || leaveBusy}
                  className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20 disabled:opacity-50"
                >
                  <CalendarOff size={13} />
                  <span>Staff Leave</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* BODY (STUDENTS LIST) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {!isEditable && !isStaffLeave && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">
                    Attendance is finalized for this session
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    This attendance session is locked and preserved for audit purposes. Use the correction workflow if an adjustment is required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isStaffLeave && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
              <div className="flex gap-3">
                <CalendarOff size={18} className="mt-0.5 shrink-0 text-purple-300" />
                <div>
                  <p className="text-sm font-semibold text-purple-200">Staff is on leave</p>
                  <p className="mt-1 text-xs text-purple-300/80">
                    This session is flagged as staff leave. Substitute staff or an administrator can record attendance.
                  </p>
                </div>
              </div>
            </div>
          )}

          {filteredStudents.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
              <Users size={28} className="mx-auto text-slate-600" />
              <p className="mt-2 text-sm font-medium text-slate-300">
                {search ? "No students match your search" : "No students found in this class"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {search ? "Clear your search term to see all students." : "Check standard enrollment configuration."}
              </p>
            </div>
          ) : (
            filteredStudents.map((student, index) => {
              const status = String(student.status || "PRESENT").toUpperCase();
              const isAbsent = status === "ABSENT";
              const missingAbsenceType = isAbsent && !student.absenceTypeId;

              return (
                <div
                  key={student.id}
                  className={`rounded-2xl border p-4 transition-all duration-200 ${
                    isAbsent
                      ? "border-red-500/30 bg-red-500/5 shadow-xs"
                      : "border-slate-800/90 bg-slate-900/40 hover:border-slate-700/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-bold text-slate-400">
                        {student.rollNo ?? student.rollNumber ?? index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {student.name || student.studentName || "Unnamed student"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {student.admissionNo && <span>Adm: {student.admissionNo}</span>}
                          {student.rollNo !== undefined && <span>• Roll: {student.rollNo}</span>}
                        </div>
                      </div>
                    </div>

                    <StatusToggle
                      disabled={!isEditable}
                      value={student.status || "PRESENT"}
                      label={student.name || student.studentName || "student"}
                      onChange={(nextStatus) =>
                        onUpdateStudent(student.id, {
                          status: nextStatus,
                          ...(nextStatus === "PRESENT" ? { absenceTypeId: null, remarks: "" } : {}),
                        })
                      }
                    />
                  </div>

                  {/* Absence Category Selector (Animated expansion when absent) */}
                  {isAbsent && (
                    <div className="mt-3.5 pt-3 border-t border-red-500/20 grid gap-2 sm:grid-cols-2">
                      <div>
                        <select
                          disabled={!isEditable}
                          value={student.absenceTypeId || ""}
                          aria-label="Absence category"
                          onChange={(e) =>
                            onUpdateStudent(student.id, {
                              absenceTypeId: e.target.value || null,
                            })
                          }
                          className={`w-full rounded-xl border bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 outline-hidden transition ${
                            missingAbsenceType ? "border-red-500 ring-1 ring-red-500/30" : "border-slate-800 focus:border-slate-600"
                          }`}
                        >
                          <option value="">Select absence reason *</option>
                          {absenceTypes.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          disabled={!isEditable}
                          value={student.remarks || ""}
                          placeholder="Optional notes or remarks..."
                          onChange={(e) =>
                            onUpdateStudent(student.id, {
                              remarks: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-hidden focus:border-slate-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        {isEditable && (
          <div className="border-t border-slate-800 bg-slate-950 px-6 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-400">
                {absentCount > 0 ? (
                  <span className="text-amber-400 font-medium">
                    {absentCount} student{absentCount === 1 ? "" : "s"} marked absent
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">
                    All students marked present
                  </span>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy || leaveBusy}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 hover:bg-slate-900 hover:text-slate-200 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={busy || leaveBusy || students.length === 0}
                  onClick={onRequestSubmit}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <UserCheck size={16} />
                  <span>{busy ? "Submitting..." : "Submit Attendance"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmOpen && (
        <ConfirmSubmitDialog
          presentCount={presentCount}
          absentCount={absentCount}
          busy={busy}
          onCancel={onCancelConfirm}
          onConfirm={onConfirmSubmit}
        />
      )}

      {leaveConfirmOpen && (
        <ConfirmLeaveDialog
          busy={leaveBusy}
          reason={leaveReason}
          onReasonChange={onLeaveReasonChange}
          onCancel={onCancelLeaveConfirm}
          onConfirm={onConfirmLeave}
        />
      )}
    </div>
  );
}
