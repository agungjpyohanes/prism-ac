import React from 'react';
import { MENUS } from '../../constants/navigation';
import { LogOut, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Sidebar({
  currentMenu,
  onMenuChange,
  user,
  onLogout,
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile
}) {
  const userRole = String(user?.ROLE || user?.role || 'guest').toLowerCase().trim();
  const LOGO_URL = "https://drive.google.com/thumbnail?id=1A7Ws0vZZtO7nc-k8lNTzt4tlLt0xqODx&sz=w500";

  const availableMenus = MENUS.filter((m) => {
    if (!m.roles || m.roles.length === 0) return true;
    if (userRole === 'admin' || userRole === 'manager' || userRole === 'manajemen') return true;
    return m.roles.includes(userRole);
  });

  const handleMenuClick = (id) => {
    onMenuChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden transition-opacity"
          style={{
            WebkitBackdropFilter: 'blur(8px)',
            backdropFilter: 'blur(8px)'
          }}
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed top-0 left-0 h-full z-50 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between
          ${mobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Branding */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-[#090d16]">
            {(!collapsed || mobileOpen) ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/40 p-1.5 flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0 overflow-hidden">
                  <img
                    src={LOGO_URL}
                    alt="PRISM Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-black text-base tracking-wider text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-300 dark:via-sky-200 dark:to-indigo-300">
                    PRISM
                  </h2>
                  <p className="text-[9px] font-mono text-blue-600 dark:text-cyan-400 font-bold truncate">
                    Integrated System & Monitoring
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 mx-auto rounded-2xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/40 p-1.5 flex items-center justify-center shadow-sm dark:shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0 overflow-hidden">
                <img
                  src={LOGO_URL}
                  alt="PRISM Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* Mobile Close Button & Desktop Toggle */}
            <div className="flex items-center">
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 lg:hidden"
                title="Tutup Menu"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onToggle}
                className="hidden lg:flex p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-300 hover:border-blue-400/50 dark:hover:border-cyan-400/50 transition ml-auto"
                title={collapsed ? "Buka Sidebar" : "Kecilkan Sidebar"}
              >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="p-3 space-y-1.5 overflow-y-auto flex-1">
            {availableMenus.map((m) => {
              const Icon = m.icon;
              const active = currentMenu === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleMenuClick(m.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 text-left ${
                    active
                      ? 'bg-blue-50 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-300 border-l-[3px] border-blue-600 dark:border-cyan-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 border-l-[3px] border-transparent'
                  }`}
                  title={collapsed && !mobileOpen ? m.label : ''}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600 dark:text-cyan-300' : 'text-slate-400 dark:text-slate-500'}`} />
                  {(!collapsed || mobileOpen) && <span className="truncate">{m.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-[#090d16]">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-gradient-to-br dark:from-indigo-500/40 dark:to-cyan-500/40 border border-blue-500 dark:border-cyan-400/50 text-white dark:text-cyan-200 flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                {String(user?.USER || user?.username || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.USER || user?.username || 'User'}</p>
                <p className="text-[10px] font-mono text-blue-600 dark:text-cyan-300 font-bold uppercase">{user?.ROLE || user?.role || 'OPERATOR'}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            title="Keluar / Logout"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition shrink-0 ml-auto border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}