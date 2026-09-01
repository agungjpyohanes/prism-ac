import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'cyan', onClick }) {
  const glowMap = {
    cyan: 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] text-cyan-300',
    emerald: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] text-emerald-300',
    amber: 'border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] text-amber-300',
    purple: 'border-purple-500/40 hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.35)] text-purple-300',
    rose: 'border-rose-500/40 hover:border-rose-400 hover:shadow-[0_0_25px_rgba(244,63,94,0.35)] text-rose-300',
    blue: 'border-blue-500/40 hover:border-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.35)] text-blue-300'
  };

  return (
    <div
      onClick={onClick}
      className={`card p-4 sm:p-5 cursor-pointer flex items-center justify-between hover:scale-[1.02] ${glowMap[color] || glowMap.cyan}`}
      style={{
        WebkitBackdropFilter: 'blur(16px)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div className="min-w-0 pr-2">
        <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
        <h3 className="text-xl sm:text-2xl font-black text-white mt-1 drop-shadow-md tracking-tight">{value}</h3>
        {sub && <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-[0_0_8px_currentColor]" />
        </div>
      )}
    </div>
  );
}