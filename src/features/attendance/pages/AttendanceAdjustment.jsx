import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { get, post } from "../../../shared/api/client";
import { useToast } from "../../../shared/components/ui/Toast";

export default function AttendanceAdjustment() {
  const navigate = useNavigate();
  const { attendanceRecordId } = useParams();
  const { pushToast } = useToast();

  const [status, setStatus] = useState("PRESENT");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdjust(e) {
    e.preventDefault();
    if (!reason.trim()) {
      pushToast("Please provide an adjustment reason", "error");
      return;
    }

    setBusy(true);
    try {
      // Submits administrative direct adjustment via corrections API
      await post("/attendance/corrections", {
        attendanceRecordId,
        oldStatus: status === "PRESENT" ? "ABSENT" : "PRESENT",
        newStatus: status,
        reason: `[Direct Adjustment]: ${reason.trim()}`,
      });
      pushToast("Direct attendance adjustment submitted successfully!", "success");
      navigate("/attendance/corrections", { replace: true });
    } catch (err) {
      pushToast(err.message || "Failed to submit adjustment", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6 animate-in fade-in duration-300">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
          <ShieldCheck size={14} />
          Administrative Adjustment
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Adjust Attendance Record
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Applying managerial override to record: <code className="font-mono text-blue-600 dark:text-blue-400">{attendanceRecordId}</code>
        </p>
      </div>

      <form onSubmit={handleAdjust} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Adjusted Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Override Justification *
          </label>
          <textarea
            required
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Document administrative justification for adjusting this record..."
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-800 outline-hidden transition focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-700 disabled:opacity-50"
          >
            {busy ? "Applying..." : "Apply Adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}
