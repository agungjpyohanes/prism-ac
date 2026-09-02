import React, { useState } from 'react';
import { MENUS, hasMenuAccess } from '../../constants/navigation';
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
  const userRole = String(user?.ROLE || user?.role || 'tamu').toLowerCase().trim();

  // Filter 5 menu utama sesuai matriks role permissions
  const availableMenus = MENUS.filter((m) => hasMenuAccess(userRole, m.id));

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
                <img
                  src="/prism-logo.png"
                  alt="PRISM Logo"
                  className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="font-display font-black text-base tracking-wider text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-300 dark:to-indigo-300">
                      PRISM
                    </h2>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-400/30">
                      V2.5
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-blue-600 dark:text-cyan-400 font-bold truncate">
                    Integrated System
                  </p>
                </div>
              </div>
            ) : (
              <img
                src="/prism-logo.png"
                alt="PRISM Logo"
                className="w-9 h-9 mx-auto object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
              />
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

          {/* Menu Items (5 Menu Utama yang Tersaring) */}
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
                <p className="text-[10px] font-mono text-blue-600 dark:text-cyan-300 font-bold uppercase">{user?.ROLE || user?.role || 'tamu'}</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={onLogout}
            title="Keluar / Logout"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30 shrink-0 ml-auto"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  );
}