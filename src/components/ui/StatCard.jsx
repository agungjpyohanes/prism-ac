import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'cyan', onClick }) {
  const glowMap = {
    cyan: 'border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] text-cyan-300',
    emerald: 'border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.3)] text-emerald-300',
    amber: 'border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] text-amber-300',
    purple: 'border-purple-500/30 hover:border-purple-400 hover:shadow-[0_0_25px_rgba(168,85,247,0.3)] text-purple-300',
    rose: 'border-rose-500/30 hover:border-rose-400 hover:shadow-[0_0_25px_rgba(244,63,94,0.3)] text-rose-300',
    blue: 'border-blue-500/30 hover:border-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)] text-blue-300'
  };

  return (
    <div
      onClick={onClick}
      className={`card p-5 cursor-pointer flex items-center justify-between hover:scale-[1.02] ${glowMap[color] || glowMap.cyan}`}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <h3 className="text-2xl font-black text-white mt-1 drop-shadow-md">{value}</h3>
        {sub && <p className="text-[10px] text-slate-400/90 mt-0.5">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/15 flex items-center justify-center shadow-inner">
          <Icon className="w-6 h-6 drop-shadow-[0_0_8px_currentColor]" />
        </div>
      )}
    </div>
  );
}