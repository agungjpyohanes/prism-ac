import React from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import {
  Gauge,
  Layers,
  GitCompare,
  Table,
  BarChart2,
  Users,
  Trophy,
  ShieldAlert,
  UserCheck,
  FileText,
  LogOut,
  X,
  Sun,
  Moon
} from 'lucide-react';

export default function Sidebar({
  view,
  onViewChange,
  user,
  onLogout,
  isOpen,
  onClose,
  theme,
  onToggleTheme
}) {
  const currentView = view || 'overview';
  const userRole = String(user?.ROLE || 'guest').toLowerCase().trim();
  const hasFullAccess = ['developer', 'manager', 'prepress', 'guest'].includes(userRole);

  const handleNav = (v) => {
    onViewChange(v);
    if (onClose) onClose();
  };

  const navItemClass = (isActive) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
      isActive
        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border-r-2 border-indigo-500'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 flex-1 overflow-y-auto space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-600 text-white flex items-center justify-center font-display font-extrabold text-sm shadow-md">
                P
              </div>
              <div>
                <div className="font-display font-extrabold text-slate-800 dark:text-white text-sm tracking-wide">
                  PRISM
                </div>
                <div className="text-[10px] text-slate-400 font-semibold">PREPRESS SYSTEM</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div>
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2">
              Operasional Lini (1-5)
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNav('overview')}
                className={`w-full ${navItemClass(currentView === 'overview')}`}
              >
                <Gauge className="w-4 h-4 text-emerald-500" />
                <span>1. Dashboard Overview</span>
              </button>

              {PROD_KEYS.map((k) => (
                <button
                  key={`prod-${k}`}
                  onClick={() => handleNav(`prod:${k}`)}
                  className={`w-full ${navItemClass(currentView === `prod:${k}`)}`}
                >
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span>2. {SHEETS[k]?.label || k}</span>
                </button>
              ))}

              <button
                onClick={() => handleNav('compare')}
                className={`w-full ${navItemClass(currentView === 'compare')}`}
              >
                <GitCompare className="w-4 h-4 text-amber-500" />
                <span>3. Dashboard Komparasi</span>
              </button>

              {PROD_KEYS.map((k) => (
                <button
                  key={`data-${k}`}
                  onClick={() => handleNav(`data:${k}`)}
                  className={`w-full ${navItemClass(currentView === `data:${k}`)}`}
                >
                  <Table className="w-4 h-4 text-slate-400" />
                  <span>4. Data {SHEETS[k]?.label || k}</span>
                </button>
              ))}

              {PROD_KEYS.map((k) => (
                <button
                  key={`analytics-${k}`}
                  onClick={() => handleNav(`analytics:${k}`)}
                  className={`w-full ${navItemClass(currentView === `analytics:${k}`)}`}
                >
                  <BarChart2 className="w-4 h-4 text-cyan-500" />
                  <span>5. Analitik {SHEETS[k]?.label || k}</span>
                </button>
              ))}
            </div>
          </div>

          {hasFullAccess && (
            <div>
              <div className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider px-3 mb-2">
                Executive & Tim (6-10)
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleNav('team_shift')}
                  className={`w-full ${navItemClass(currentView === 'team_shift')}`}
                >
                  <Users className="w-4 h-4 text-indigo-500" />
                  <span>6. Pengawasan Tim</span>
                </button>

                <button
                  onClick={() => handleNav('leaderboard')}
                  className={`w-full ${navItemClass(currentView === 'leaderboard')}`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>7. KPI Leaderboard</span>
                </button>

                <button
                  onClick={() => handleNav('executive_overall')}
                  className={`w-full ${navItemClass(currentView === 'executive_overall')}`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>8. Management Executive</span>
                </button>

                <button
                  onClick={() => handleNav('kpi_personal')}
                  className={`w-full ${navItemClass(currentView === 'kpi_personal')}`}
                >
                  <UserCheck className="w-4 h-4 text-teal-500" />
                  <span>9. KPI Personal</span>
                </button>

                <button
                  onClick={() => handleNav('forms')}
                  className={`w-full ${navItemClass(currentView === 'forms')}`}
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  <span>10. Form & Permintaan</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onToggleTheme}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white grid place-items-center font-bold text-xs shrink-0">
                {(user?.USER || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800 dark:text-white truncate">
                  {user?.USER || 'User'}
                </div>
                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                  {userRole}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}