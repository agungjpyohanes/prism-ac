import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'cyan', onClick }) {
  const glowMap = {
    cyan: 'border-blue-200 dark:border-cyan-500/40 hover:border-blue-400 dark:hover:border-cyan-400 text-blue-600 dark:text-cyan-300',
    emerald: 'border-emerald-200 dark:border-emerald-500/40 hover:border-emerald-400 dark:hover:border-emerald-400 text-emerald-600 dark:text-emerald-300',
    amber: 'border-amber-200 dark:border-amber-500/40 hover:border-amber-400 dark:hover:border-amber-400 text-amber-600 dark:text-amber-300',
    purple: 'border-purple-200 dark:border-purple-500/40 hover:border-purple-400 dark:hover:border-purple-400 text-purple-600 dark:text-purple-300',
    rose: 'border-rose-200 dark:border-rose-500/40 hover:border-rose-400 dark:hover:border-rose-400 text-rose-600 dark:text-rose-300',
    blue: 'border-blue-200 dark:border-blue-500/40 hover:border-blue-400 dark:hover:border-blue-400 text-blue-600 dark:text-blue-300'
  };

  return (
    <div
      onClick={onClick}
      className={`card p-4 sm:p-5 cursor-pointer flex items-center justify-between hover:scale-[1.02] ${glowMap[color] || glowMap.cyan}`}
    >
      <div className="min-w-0 pr-2">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">{label}</p>
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{value}</h3>
        {sub && <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0 shadow-sm">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      )}
    </div>
  );
}