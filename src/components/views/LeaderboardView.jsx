import React, { useMemo, useState } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, startOfDay, fmtPeriodRange } from '../../utils/formatters';
import { Trophy, Medal, Flame, Search, Crown } from 'lucide-react';

export default function LeaderboardView({ data, period }) {
  const [search, setSearch] = useState('');
  const [selectedProcess, setSelectedProcess] = useState('ALL');

  const targetKeys = selectedProcess === 'ALL' ? PROD_KEYS : [selectedProcess];

  const rankings = useMemo(() => {
    const map = new Map();

    targetKeys.forEach((key) => {
      const cfg = SHEETS[key];
      const rows = data[key] || [];

      rows.forEach((r) => {
        const idVal = cell(r, cfg.i.id).trim();
        if (!idVal) return;

        const d = parseDateVal(r[cfg.i.date]);
        if (d && period?.from && period?.to) {
          const from = startOfDay(period.from).getTime();
          const to = new Date(period.to).setHours(23, 59, 59, 999);
          if (d.getTime() < from || d.getTime() > to) return;
        }

        const op = cell(r, cfg.i.op).trim() || 'Unassigned';
        const e = map.get(op) || { name: op, good: 0, reject: 0, replace: 0 };
        e.good += num(r[cfg.i.baik]);
        e.reject += num(r[cfg.i.rusak]);
        e.replace += num(r[cfg.i.ganti]);
        map.set(op, e);
      });
    });

    return [...map.values()]
      .map((item) => {
        const total = item.good + item.reject;
        const lossRate = total > 0 ? (item.reject / total) * 100 : 0;
        const score = total > 0 ? Math.max(0, Math.round(100 - lossRate * 8 + item.good * 0.05)) : 0;
        return { ...item, total, lossRate, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [data, targetKeys, period]);

  const filtered = rankings.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const topThree = filtered.slice(0, 3);

  return (
    <div className="space-y-6 anim-in">
      {/* Header Panel */}
      <div className="card p-6 bg-gradient-to-r from-purple-950/40 via-indigo-950/40 to-slate-900/60 border-purple-500/20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-purple-500/20 text-purple-300 border-purple-400/30">STAR RANKING</span>
            <span className="text-xs text-slate-400">Periode: {fmtPeriodRange(period?.from, period?.to)}</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-200 to-cyan-300 mt-1">
            Cosmic KPI Leaderboard
          </h2>
          <p className="text-xs text-slate-300">Peringkat performa operator berdasarkan efisiensi output dan rasio reject terendah</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="inp text-xs"
          >
            <option value="ALL">Semua Lini Proses</option>
            {PROD_KEYS.map((k) => (
              <option key={k} value={k}>{SHEETS[k].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Podium Top 3 */}
      {topThree.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4">
          {topThree.map((item, idx) => {
            const podiumStyles = [
              'from-amber-500/20 via-yellow-500/5 to-transparent border-amber-400/40 shadow-[0_0_25px_rgba(245,158,11,0.15)] order-1 md:order-2 md:-translate-y-2',
              'from-slate-400/20 via-slate-500/5 to-transparent border-slate-400/40 shadow-[0_0_20px_rgba(148,163,184,0.1)] order-2 md:order-1',
              'from-amber-700/20 via-amber-800/5 to-transparent border-amber-600/40 shadow-[0_0_20px_rgba(180,83,9,0.1)] order-3'
            ];
            const badges = ['Champion #1', 'Runner Up #2', 'Third Place #3'];

            return (
              <div
                key={item.name}
                className={`card p-5 bg-gradient-to-b ${podiumStyles[idx]} relative flex flex-col items-center text-center`}
              >
                <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-white/20 flex items-center justify-center mb-2 shadow-inner">
                  {idx === 0 ? <Crown className="w-6 h-6 text-amber-400" /> : <Medal className="w-6 h-6 text-cyan-400" />}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">{badges[idx]}</span>
                <h3 className="font-display font-black text-lg text-white mt-0.5 truncate max-w-full">{item.name}</h3>
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-200 mt-2">
                  {item.score} <span className="text-xs text-slate-400 font-normal">pts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Good Output</span>
                    <p className="font-bold text-emerald-400">{item.good.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Loss Rate</span>
                    <p className={`font-bold ${item.lossRate > 1.0 ? 'text-rose-400' : 'text-cyan-400'}`}>{item.lossRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="card-title flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" /> Seluruh Peringkat Operator
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="inp !pl-9 text-xs w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3">Good</th>
                <th className="py-3 px-3">Reject</th>
                <th className="py-3 px-3">Loss Rate</th>
                <th className="py-3 px-3 text-right">Skor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((item, idx) => (
                <tr key={item.name} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{item.name}</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-medium">{item.good.toLocaleString('id-ID')}</td>
                  <td className="py-2.5 px-3 text-rose-400 font-medium">{item.reject.toLocaleString('id-ID')}</td>
                  <td className="py-2.5 px-3">
                    <span className={`badge ${item.lossRate > 1.0 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'}`}>
                      {item.lossRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-cyan-300">{item.score}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Tidak ada data peringkat ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}