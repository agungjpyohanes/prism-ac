import React, { useMemo, useState } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, startOfDay, fmtPeriodRange } from '../../utils/formatters';
import { Medal, Flame, Search, Crown } from 'lucide-react';

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
      <div className="card p-5 sm:p-6 bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-900 text-white border border-purple-500/30 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-purple-500/20 text-purple-300 border-purple-400/40 font-bold">STAR RANKING</span>
            <span className="text-xs text-slate-300">Periode: {fmtPeriodRange(period?.from, period?.to)}</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white mt-1.5 tracking-wide">
            Prepress KPI Leaderboard
          </h2>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">Peringkat performa operator berdasarkan efisiensi output dan rasio reject terendah</p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="inp text-xs w-full sm:w-auto"
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
              'border-amber-400/60 bg-gradient-to-b from-amber-950/50 via-slate-900 to-slate-900 shadow-[0_0_30px_rgba(245,158,11,0.25)] order-1 md:order-2 md:-translate-y-2',
              'border-slate-400/60 bg-gradient-to-b from-slate-800/50 via-slate-900 to-slate-900 shadow-[0_0_25px_rgba(148,163,184,0.2)] order-2 md:order-1',
              'border-amber-700/60 bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-900 shadow-[0_0_25px_rgba(180,83,9,0.2)] order-3'
            ];
            const badges = ['Champion #1', 'Runner Up #2', 'Third Place #3'];

            return (
              <div
                key={item.name}
                className={`card p-5 ${podiumStyles[idx]} relative flex flex-col items-center text-center`}
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center mb-2 shadow-inner">
                  {idx === 0 ? <Crown className="w-6 h-6 text-amber-400" /> : <Medal className="w-6 h-6 text-cyan-400" />}
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">{badges[idx]}</span>
                <h3 className="font-display font-black text-lg text-white mt-0.5 truncate max-w-full">{item.name}</h3>
                <div className="text-3xl font-black text-cyan-300 mt-2 tracking-tight">
                  {item.score} <span className="text-xs text-slate-400 font-normal">pts</span>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full mt-4 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Good Output</span>
                    <p className="font-bold text-emerald-400 mt-0.5">{item.good.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Loss Rate</span>
                    <p className={`font-bold mt-0.5 ${item.lossRate > 1.0 ? 'text-rose-400' : 'text-cyan-300'}`}>{item.lossRate.toFixed(1)}%</p>
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
            <Flame className="w-4 h-4 text-amber-400" /> Seluruh Peringkat Operator
          </h3>
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari Operator..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="inp !pl-9 text-xs w-full sm:w-56"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="tbl min-w-[550px]">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Operator</th>
                <th>Good</th>
                <th>Reject</th>
                <th>Loss Rate</th>
                <th className="text-right">Skor Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => (
                <tr key={item.name} className="cursor-pointer">
                  <td className="font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="font-semibold text-white">{item.name}</td>
                  <td className="text-emerald-400 font-semibold">{item.good.toLocaleString('id-ID')}</td>
                  <td className="text-rose-400 font-semibold">{item.reject.toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`badge ${item.lossRate > 1.0 ? 'badge-danger' : 'badge-info'}`}>
                      {item.lossRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right font-black text-cyan-300 text-sm">{item.score}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400">Tidak ada data peringkat ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}