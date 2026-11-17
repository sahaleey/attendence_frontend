import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { get, post } from "../../../shared/api/client";
import Badge from "../../../shared/components/ui/Badge";
import { useToast } from "../../../shared/components/ui/Toast";

export default function AttendanceCorrection() {
  const navigate = useNavigate();
  const { attendanceRecordId } = useParams();
  const { pushToast } = useToast();

  const [absenceTypes, setAbsenceTypes] = useState([]);
  const [oldStatus, setOldStatus] = useState("ABSENT");
  const [newStatus, setNewStatus] = useState("PRESENT");
  const [absenceTypeId, setAbsenceTypeId] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    get("/absence-types")
      .then((res) => setAbsenceTypes(res?.data || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) {
      pushToast("Please explain the reason for the correction", "error");
      return;
    }

    setBusy(true);
    try {
      await post("/attendance/corrections", {
        attendanceRecordId,
        oldStatus,
        newStatus,
        newAbsenceTypeId: newStatus === "ABSENT" ? absenceTypeId || undefined : undefined,
        reason: reason.trim(),
      });
      setSubmitted(true);
      pushToast("Attendance correction request submitted to queue!", "success");
      setTimeout(() => {
        navigate("/attendance/corrections", { replace: true });
      }, 1500);
    } catch (err) {
      pushToast(err.message || "Failed to submit correction", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6 animate-in fade-in duration-300">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          Attendance Audit Workflow
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Request Attendance Correction
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit an auditable correction request for record{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
            {attendanceRecordId}
          </code>
        </p>
      </div>

      {submitted ? (
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
          <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
          <h2 className="mt-3 text-base font-bold text-emerald-700 dark:text-emerald-300">
            Correction Request Registered
          </h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Redirecting to the correction queue...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Original Status
              </label>
              <select
                value={oldStatus}
                onChange={(e) => setOldStatus(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                New Corrected Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
              </select>
            </div>
          </div>

          {newStatus === "ABSENT" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Absence Type
              </label>
              <select
                value={absenceTypeId}
                onChange={(e) => setAbsenceTypeId(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="">Select Absence Reason</option>
                {absenceTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Correction *
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Detail why this student's recorded attendance requires adjustment..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-hidden transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            />
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-700 dark:text-amber-300">
            Audit note: Original records are never permanently overwritten. Every correction generates an auditable event with your account timestamp.
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
            >
              {busy ? "Submitting..." : "Submit to Approval Queue"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
