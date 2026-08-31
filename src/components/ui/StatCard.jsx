import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'cyan', onClick }) {
  const glowMap = {
    cyan: 'border-cyan-500/20 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] text-cyan-300',
    emerald: 'border-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.25)] text-emerald-300',
    amber: 'border-amber-500/20 hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] text-amber-300',
    purple: 'border-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)] text-purple-300',
    rose: 'border-rose-500/20 hover:border-rose-400/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)] text-rose-300'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border bg-slate-900/40 backdrop-blur-xl transition-all duration-300 cursor-pointer flex items-center justify-between hover:scale-[1.02] ${glowMap[color] || glowMap.cyan}`}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <h3 className="text-2xl font-black text-white mt-1 drop-shadow-md">{value}</h3>
        {sub && <p className="text-[10px] text-slate-400/80 mt-0.5">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}