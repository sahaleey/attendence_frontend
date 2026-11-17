import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Filter,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { get, post } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { dateOnly, humanStatus } from "../../../shared/utils/format";
import Badge from "../../../shared/components/ui/Badge";
import Tabs from "../../../shared/components/ui/Tabs";
import ConfirmModal from "../../../shared/components/ui/ConfirmModal";
import { useToast } from "../../../shared/components/ui/Toast";
import StatCard from "../../../shared/components/ui/StatCard";

export default function Corrections() {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [rows, setRows] = useState(null);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form state for creating a new correction request
  const [form, setForm] = useState({
    attendanceRecordId: "",
    oldStatus: "ABSENT",
    newStatus: "PRESENT",
    oldAbsenceTypeId: "",
    newAbsenceTypeId: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Confirmation modal for approve / reject
  const [actionConfirm, setActionConfirm] = useState(null); // { id, action: "approve" | "reject" }
  const [actionBusy, setActionBusy] = useState(false);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [r, t] = await Promise.all([
        get("/attendance/corrections").catch(() => ({ data: [] })),
        get("/absence-types").catch(() => ({ data: [] })),
      ]);
      setRows(r.data || []);
      setTypes(t.data || []);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitCorrection(e) {
    e.preventDefault();
    if (!form.attendanceRecordId.trim()) {
      pushToast("Please provide the Attendance Record ID", "error");
      return;
    }
    if (!form.reason.trim()) {
      pushToast("Please enter an explanation for the correction", "error");
      return;
    }

    setSubmitting(true);
    try {
      await post("/attendance/corrections", {
        attendanceRecordId: form.attendanceRecordId.trim(),
        oldStatus: form.oldStatus,
        newStatus: form.newStatus,
        oldAbsenceTypeId: form.oldStatus === "ABSENT" ? form.oldAbsenceTypeId || undefined : undefined,
        newAbsenceTypeId: form.newStatus === "ABSENT" ? form.newAbsenceTypeId || undefined : undefined,
        reason: form.reason.trim(),
      });
      pushToast("Correction request submitted successfully!", "success");
      setForm({
        attendanceRecordId: "",
        oldStatus: "ABSENT",
        newStatus: "PRESENT",
        oldAbsenceTypeId: "",
        newAbsenceTypeId: "",
        reason: "",
      });
      setShowModal(false);
      await load();
    } catch (err) {
      pushToast(err.message || "Failed to submit correction request", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmReview() {
    if (!actionConfirm) return;
    const { id, action } = actionConfirm;
    setActionBusy(true);
    try {
      await post(`/attendance/corrections/${id}/${action}`);
      pushToast(`Correction request ${action}d successfully.`, "success");
      setActionConfirm(null);
      await load();
    } catch (err) {
      pushToast(err.message || `Failed to ${action} request`, "error");
    } finally {
      setActionBusy(false);
    }
  }

  const metrics = useMemo(() => {
    if (!rows) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      total: rows.length,
      pending: rows.filter((r) => r.status === "PENDING").length,
      approved: rows.filter((r) => r.status === "APPROVED").length,
      rejected: rows.filter((r) => r.status === "REJECTED").length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (activeTab !== "ALL" && r.status !== activeTab) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        String(r.attendanceRecordId || "").toLowerCase().includes(q) ||
        String(r.reason || "").toLowerCase().includes(q) ||
        String(r.status || "").toLowerCase().includes(q)
      );
    });
  }, [rows, activeTab, search]);

  if (loading && !rows) return <Loading />;
  if (error && !rows) return <ErrorState error={error} onRetry={load} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Attendance Corrections & Audit"
          description="Corrections are separate from the original attendance fact. Full audit history and reviews are maintained."
        />
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
        >
          <PlusCircle size={15} />
          <span>New Correction Request</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Requests"
          value={metrics.total}
          icon={RotateCcw}
          description="All correction submissions"
        />
        <StatCard
          title="Pending Review"
          value={metrics.pending}
          icon={Clock3}
          variant={metrics.pending > 0 ? "warning" : "default"}
          description="Requires managerial decision"
          onClick={() => setActiveTab("PENDING")}
        />
        <StatCard
          title="Approved Changes"
          value={metrics.approved}
          icon={CheckCircle2}
          variant="success"
          description="Applied to official roll"
          onClick={() => setActiveTab("APPROVED")}
        />
        <StatCard
          title="Rejected Requests"
          value={metrics.rejected}
          icon={XCircle}
          variant={metrics.rejected > 0 ? "danger" : "default"}
          description="Dismissed with reason"
          onClick={() => setActiveTab("REJECTED")}
        />
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: "ALL", label: "All Requests", count: metrics.total },
            { id: "PENDING", label: "Pending", count: metrics.pending },
            { id: "APPROVED", label: "Approved", count: metrics.approved },
            { id: "REJECTED", label: "Rejected", count: metrics.rejected },
          ]}
        />

        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by record ID or reason..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 outline-hidden transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <RotateCcw size={32} className="mx-auto text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
              No correction requests found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {search ? "No records match your search criteria." : "There are currently no requests in this status."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 dark:border-slate-800/80 dark:bg-slate-900/80">
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Record ID
                  </th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Proposed Change
                  </th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Explanation / Reason
                  </th>
                  <th className="px-4 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">
                    Review Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      {r.attendanceRecordId}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">
                          {humanStatus(r.oldStatus)}
                        </span>
                        <ArrowRight size={13} className="text-slate-400" />
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {humanStatus(r.newStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-300">
                      {r.reason || "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge status={r.status} size="xs" />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {r.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setActionConfirm({ id: r.id, action: "approve" })}
                            className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionConfirm({ id: r.id, action: "reject" })}
                            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/20 dark:text-red-400"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Correction Request Modal */}
      {showModal && (
        <Modal title="Submit Attendance Correction" onClose={() => setShowModal(false)}>
          <form className="space-y-4" onSubmit={submitCorrection}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Attendance Record ID *
              </label>
              <input
                type="text"
                value={form.attendanceRecordId}
                onChange={(e) => setForm({ ...form, attendanceRecordId: e.target.value })}
                placeholder="Paste the attendance record UUID (e.g. from session students list)"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-hidden transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                required
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Found under the student record in attendance session details.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current / Old Status
                </label>
                <select
                  value={form.oldStatus}
                  onChange={(e) => setForm({ ...form, oldStatus: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New / Corrected Status
                </label>
                <select
                  value={form.newStatus}
                  onChange={(e) => setForm({ ...form, newStatus: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                </select>
              </div>
            </div>

            {form.newStatus === "ABSENT" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Absence Category
                </label>
                <select
                  value={form.newAbsenceTypeId}
                  onChange={(e) => setForm({ ...form, newAbsenceTypeId: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="">None / Unspecified</option>
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Correction Justification *
              </label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Explain why this student's attendance record requires correction..."
                rows={4}
                required
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-hidden transition focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Correction Request"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Action Confirmation Modal */}
      {actionConfirm && (
        <ConfirmModal
          isOpen={Boolean(actionConfirm)}
          title={`${actionConfirm.action === "approve" ? "Approve" : "Reject"} Correction`}
          description={`Are you sure you want to ${actionConfirm.action} this attendance correction request? Once processed, the decision is audited.`}
          confirmText={actionConfirm.action === "approve" ? "Approve Correction" : "Reject Request"}
          variant={actionConfirm.action === "approve" ? "primary" : "danger"}
          busy={actionBusy}
          onConfirm={handleConfirmReview}
          onCancel={() => setActionConfirm(null)}
        />
      )}
    </div>
  );
}
