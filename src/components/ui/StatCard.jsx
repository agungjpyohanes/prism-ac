import React from 'react';

export default function StatCard({ icon: Icon, label, value, sub, color = 'cyan', onClick }) {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-400',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400',
    rose: 'from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-400',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400'
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl border bg-gradient-to-br ${colorMap[color] || colorMap.cyan} flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02]`}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <h3 className="text-2xl font-black text-white mt-0.5">{value}</h3>
        {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
      </div>
      {Icon && (
        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}