import { useEffect, useState } from "react";
import { get, post, put } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { dateOnly, humanStatus } from "../../../shared/utils/format";
import Badge from "../../../shared/components/ui/Badge";
import { useToast } from "../../../shared/components/ui/Toast";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const emptyForm = () => ({
  name: "",
  startDate: "",
  endDate: "",
  weeklyHolidays: ["SUNDAY"],
});

export default function AcademicYears() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const { pushToast } = useToast();

  async function load() {
    try {
      setError(null);
      setRows((await get("/academic-years")).data || []);
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function toggleDay(day) {
    setForm((f) => ({
      ...f,
      weeklyHolidays: f.weeklyHolidays.includes(day)
        ? f.weeklyHolidays.filter((x) => x !== day)
        : [...f.weeklyHolidays, day],
    }));
  }

  async function create(e) {
    e.preventDefault();
    if (form.weeklyHolidays.length > 7) return;
    setSaving(true);
    try {
      const year = await post("/academic-years", {
        name: form.name,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
      });

      const yearId = year?.data?.id || year?.id;
      if (yearId) {
        await put("/weekly-holidays/" + yearId, { weekdays: form.weeklyHolidays });
      }

      setModal(false);
      setForm(emptyForm());
      pushToast("Academic year created successfully!", "success");
      await load();
    } catch (e) {
      pushToast(e.message || "Failed to create academic year", "error");
    } finally {
      setSaving(false);
    }
  }

  async function transition(id, action) {
    try {
      await post(`/academic-years/${id}/${action}`);
      pushToast(`Academic year ${action}d successfully.`, "success");
      await load();
    } catch (e) {
      pushToast(e.message || `Failed to ${action} academic year`, "error");
    }
  }

  if (!rows) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Academic Years"
        description="Define academic-year boundaries and recurring weekly holidays used by timetable and attendance generation."
        action={
          <button className="button primary" onClick={() => setModal(true)}>
            + New academic year
          </button>
        }
      />

      {rows.length === 0 ? (
        <Empty />
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              label: "Academic year",
              render: (r) => <strong>{r.name}</strong>,
            },
            { key: "startDate", label: "Start", render: (r) => dateOnly(r.startDate) },
            { key: "endDate", label: "End", render: (r) => dateOnly(r.endDate) },
            {
              key: "status",
              label: "Status",
              render: (r) => <Badge status={r.status} label={humanStatus(r.status)} size="xs" />,
            },
            {
              key: "actions",
              label: "Actions",
              render: (r) => (
                <div className="row-actions">
                  {r.status === "DRAFT" && (
                    <button
                      onClick={() => transition(r.id, "activate")}
                      className="text-button text-blue-600 dark:text-blue-400 font-semibold"
                    >
                      Activate
                    </button>
                  )}
                  {r.status === "ACTIVE" && (
                    <button
                      onClick={() => transition(r.id, "complete")}
                      className="text-button text-slate-600 dark:text-slate-300 font-semibold"
                    >
                      Complete
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      )}

      {modal && (
        <Modal title="Create academic year" onClose={() => setModal(false)}>
          <form className="form" onSubmit={create}>
            <label>
              Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="2026–2027"
                required
              />
            </label>

            <div className="form-grid">
              <label>
                Start date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="settings-section">
              <div className="settings-title">Weekly holidays</div>
              <p className="muted small">
                These are recurring weekly holidays for this academic year. They prevent default timetable generation.
              </p>
              <div className="weekday-grid">
                {DAYS.map((day) => (
                  <label className="check-card" key={day}>
                    <input
                      type="checkbox"
                      checked={form.weeklyHolidays.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    <span>{day[0] + day.slice(1).toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="callout">
              Weekly holidays are flexible: custom timetable exceptions can still be created for exceptional working days.
            </div>

            <div className="modal-actions">
              <button type="button" className="button" onClick={() => setModal(false)}>
                Cancel
              </button>
              <button className="button primary" disabled={saving}>
                {saving ? "Creating…" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
