import React from "react";

export default function Tabs({ tabs, activeTab, onChange, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-100/80 p-1.5 dark:border-slate-800 dark:bg-slate-900/80 ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? "bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-slate-100"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
            }`}
          >
            {Icon && <Icon size={14} className={isActive ? "text-blue-600 dark:text-blue-400" : "opacity-70"} />}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
