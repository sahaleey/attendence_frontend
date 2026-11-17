import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../shared/context/AuthContext";
import { visibleNav } from "../shared/access/navigation";
import { Menu, X, LogOut, Settings as SettingsIcon } from "lucide-react";

function Navigation({ hasAny, onItemClick }) {
  const sections = visibleNav(hasAny);
  return (
    <nav className="layout-nav overflow-y-auto flex-1">
      {sections.map((section) => {
        const visibleItems = section.items;

        return (
          <div className="nav-section my-3" key={section.label}>
            <div className="nav-label px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              {section.label}
            </div>
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onItemClick}
                className={({ isActive }) =>
                  `nav-item flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive ? "active bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <span className="nav-icon text-sm">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, logout, hasAny } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell admin-shell min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop fixed, Mobile off-canvas slide-out) */}
      <aside
        className={`sidebar fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-slate-900 p-4 text-slate-100 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="brand flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow-xs">
              CA
            </div>
            <div>
              <strong className="block text-sm font-bold text-white">College Attendance</strong>
              <span className="block text-[11px] text-slate-400">Admin Portal</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <Navigation hasAny={hasAny} onItemClick={() => setMobileMenuOpen(false)} />

        <div className="sidebar-footer mt-auto border-t border-slate-800 pt-3 space-y-2">
          <NavLink
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `nav-item flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                isActive ? "active bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <SettingsIcon size={16} />
            <span>Settings</span>
          </NavLink>

          <div className="user-mini flex items-center gap-3 rounded-xl bg-slate-800/60 p-2.5">
            <div className="avatar flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user?.name?.slice(0, 1)?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-xs font-semibold text-white">{user?.name}</strong>
              <span className="block truncate text-[10px] text-slate-400">
                {user?.roles?.length ? user.roles.join(", ") : "Custom access"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="ghost-button full flex items-center justify-center gap-2 w-full rounded-xl border border-slate-700 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main w-full min-h-screen transition-all">
        {/* Topbar */}
        <header className="topbar sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>

            <div>
              <span className="eyebrow hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:block">
                College Management System
              </span>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Attendance administration
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="topbar-user hidden text-xs font-medium text-slate-500 dark:text-slate-400 sm:block">
              {user?.email}
            </div>
          </div>
        </header>

        <div className="content p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
