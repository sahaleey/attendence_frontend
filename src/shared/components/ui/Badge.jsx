import React from "react";
import { CheckCircle2, AlertCircle, Clock3, CalendarOff, XCircle, Info } from "lucide-react";

const CONFIG = {
  PRESENT: {
    label: "Present",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
  },
  ACTIVE: {
    label: "Active",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
  },
  MARKED: {
    label: "Marked",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
  },
  SUBMITTED: {
    label: "Submitted",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
  },
  ABSENT: {
    label: "Absent",
    icon: XCircle,
    bg: "bg-red-500/10 text-red-500 border-red-500/20 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    bg: "bg-red-500/10 text-red-500 border-red-500/20 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: XCircle,
    bg: "bg-red-500/10 text-red-500 border-red-500/20 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20",
  },
  PENDING: {
    label: "Pending",
    icon: AlertCircle,
    bg: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20",
  },
  UNMARKED: {
    label: "Unmarked",
    icon: AlertCircle,
    bg: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20",
  },
  DRAFT: {
    label: "Draft",
    icon: Clock3,
    bg: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20",
  },
  CURRENT: {
    label: "Current",
    icon: Clock3,
    bg: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400 dark:bg-blue-400/10 dark:border-blue-400/20",
  },
  UPCOMING: {
    label: "Upcoming",
    icon: Clock3,
    bg: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400 dark:bg-slate-400/10 dark:border-slate-400/20",
  },
  STAFF_LEAVE: {
    label: "Staff Leave",
    icon: CalendarOff,
    bg: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400 dark:bg-purple-400/10 dark:border-purple-400/20",
  },
  CLOSED: {
    label: "Closed",
    icon: Clock3,
    bg: "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
  },
  INACTIVE: {
    label: "Inactive",
    icon: Info,
    bg: "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
  },
  ARCHIVED: {
    label: "Archived",
    icon: Info,
    bg: "bg-slate-500/10 text-slate-500 border-slate-500/20 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
  },
  NOT_GENERATED: {
    label: "Not Generated",
    icon: Info,
    bg: "bg-slate-500/10 text-slate-400 border-slate-300 dark:text-slate-500 dark:bg-slate-900 dark:border-slate-800",
  },
};

export default function Badge({ status, label, showIcon = true, size = "sm" }) {
  const normKey = String(status || "").toUpperCase();
  const conf = CONFIG[normKey] || {
    label: label || status || "Unknown",
    icon: Info,
    bg: "bg-slate-500/10 text-slate-500 border-slate-300 dark:text-slate-400 dark:bg-slate-800 dark:border-slate-700",
  };

  const Icon = conf.icon;
  const displayLabel = label || conf.label;

  const sizeClasses =
    size === "xs"
      ? "px-2 py-0.5 text-[10px]"
      : size === "md"
      ? "px-3 py-1.5 text-xs font-semibold"
      : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide transition-colors ${sizeClasses} ${conf.bg}`}
    >
      {showIcon && Icon && <Icon size={size === "xs" ? 11 : 13} className="shrink-0" />}
      <span>{displayLabel}</span>
    </span>
  );
}
