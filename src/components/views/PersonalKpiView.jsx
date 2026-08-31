import React, { useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, fmtPeriodRange, startOfDay } from '../../utils/formatters';
import { UserCheck, CheckCircle2, AlertTriangle, Sparkles, Award } from 'lucide-react';
import StatCard from '../ui/StatCard';

export default function PersonalKpiView({ data, user, period }) {
  const currentUsername = String(user?.USER || user?.username || 'guest').trim().toLowerCase();

  const userStats = useMemo(() => {
    let good = 0, reject = 0, replace = 0, totalJob = 0;
    const records = [];

    PROD_KEYS.forEach((key) => {
      const cfg = SHEETS[key];
      const rows = data[key] || [];

      rows.forEach((r) => {
        const idVal = cell(r, cfg.i.id).trim();
        const opVal = cell(r, cfg.i.op).trim().toLowerCase();
        if (!idVal || (currentUsername !== 'guest' && !opVal.includes(currentUsername))) return;

        const d = parseDateVal(r[cfg.i.date]);
        if (d && period?.from && period?.to) {
          const from = startOfDay(period.from).getTime();
          const to = new Date(period.to).setHours(23, 59, 59, 999);
          if (d.getTime() < from || d.getTime() > to) return;
        }

        const g = num(r[cfg.i.baik]);
        const rj = num(r[cfg.i.rusak]);
        const rp = num(r[cfg.i.ganti]);

        good += g;
        reject += rj;
        replace += rp;
        totalJob += 1;

        records.push({
          key,
          process: cfg.label,
          job: cell(r, cfg.i.jop) || cell(r, cfg.i.nojop),
          date: r[cfg.i.date],
          good: g,
          reject: rj
        });
      });
    });

    const output = good + reject;
    const lossRate = output > 0 ? (reject / output) * 100 : 0;
    const score = output > 0 ? Math.max(0, Math.round(100 - lossRate * 10)) : 100;

    return { good, reject, replace, output, lossRate, score, totalJob, records };
  }, [data, currentUsername, period]);

  return (
    <div className="space-y-5 anim-in">
      {/* Profile Card Header */}
      <div className="card p-6 bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900/60 border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 border border-cyan-400/40 flex items-center justify-center text-white font-black text-xl shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            {currentUsername.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-cyan-500/20 text-cyan-300 border-cyan-400/30">OPERATOR DASHBOARD</span>
              <span className="text-xs text-slate-400">{fmtPeriodRange(period?.from, period?.to)}</span>
            </div>
            <h2 className="font-display font-black text-2xl text-white mt-1 capitalize">{currentUsername}</h2>
            <p className="text-xs text-slate-300">Ringkasan produktivitas personal & kontrol kualitas Anda</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-mono">Performance Index</span>
          <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-300">
            {userStats.score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Good Output" value={userStats.good.toLocaleString('id-ID')} icon={CheckCircle2} color="emerald" />
        <StatCard label="Total Reject" value={userStats.reject.toLocaleString('id-ID')} icon={AlertTriangle} color="rose" />
        <StatCard label="Personal Loss Rate" value={`${userStats.lossRate.toFixed(1)}%`} sub="Target: ≤ 1.0%" icon={Award} color="cyan" />
        <StatCard label="Total Transaksi" value={userStats.totalJob.toLocaleString('id-ID')} icon={UserCheck} color="purple" />
      </div>

      {/* Riwayat Pekerjaan Terakhir */}
      <div className="card p-5 space-y-3">
        <h3 className="card-title flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Riwayat Kontribusi Pekerjaan Anda
        </h3>
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Lini</th>
                <th className="py-2.5 px-3">JOP / Pekerjaan</th>
                <th className="py-2.5 px-3">Good</th>
                <th className="py-2.5 px-3">Reject</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {userStats.records.map((r, i) => (
                <tr key={i} className="hover:bg-white/5 transition">
                  <td className="py-2 px-3 text-cyan-300 font-semibold">{r.process}</td>
                  <td className="py-2 px-3 text-slate-200">{r.job || '-'}</td>
                  <td className="py-2 px-3 text-emerald-400">{r.good}</td>
                  <td className="py-2 px-3 text-rose-400">{r.reject}</td>
                </tr>
              ))}
              {userStats.records.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500">Tidak ada riwayat pekerjaan tercatat pada periode ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}