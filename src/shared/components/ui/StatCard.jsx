import React from "react";
import { ChevronRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendLabel,
  onClick,
  variant = "default",
  className = "",
}) {
  const variantStyles = {
    default: "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700",
    success: "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/30 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:hover:border-emerald-500/30",
    warning: "border-amber-500/20 bg-amber-500/5 hover:border-amber-500/30 dark:border-amber-500/20 dark:bg-amber-950/20 dark:hover:border-amber-500/30",
    danger: "border-red-500/20 bg-red-500/5 hover:border-red-500/30 dark:border-red-500/20 dark:bg-red-950/20 dark:hover:border-red-500/30",
    info: "border-blue-500/20 bg-blue-500/5 hover:border-blue-500/30 dark:border-blue-500/20 dark:bg-blue-950/20 dark:hover:border-blue-500/30",
  };

  const iconBgStyles = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400",
    danger: "bg-red-500/10 text-red-600 dark:bg-red-400/10 dark:text-red-400",
    info: "bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400",
  };

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-5 text-left transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5" : ""
      } ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs ${iconBgStyles[variant] || iconBgStyles.default}`}>
          {Icon && <Icon size={20} strokeWidth={2} />}
        </div>
        {onClick && (
          <ChevronRight
            size={18}
            className="text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-600 dark:text-slate-600 dark:group-hover:text-slate-300"
          />
        )}
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          {value ?? "—"}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          {title}
        </p>
        {(description || trendLabel) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {trend && (
              <span
                className={`font-semibold ${
                  trend > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : trend < 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-slate-500"
                }`}
              >
                {trend > 0 ? `+${trend}%` : `${trend}%`}
              </span>
            )}
            {trendLabel && <span>{trendLabel}</span>}
            {description && !trendLabel && <span>{description}</span>}
          </div>
        )}
      </div>
    </Component>
  );
}
