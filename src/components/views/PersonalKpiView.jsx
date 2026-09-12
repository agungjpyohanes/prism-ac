import React, { useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, fmtPeriodRange, startOfDay, formatYMD, getRowQtyGood, getRowQtyDefect, getRowQtyReplace } from '../../utils/formatters';
import { UserCheck, CheckCircle2, AlertTriangle, Sparkles, Award } from 'lucide-react';
import StatCard from '../ui/StatCard';

export default function PersonalKpiView({ data, user, period }) {
  const currentUsername = String(user?.USER || user?.username || 'guest').trim().toLowerCase();

  const userStats = useMemo(() => {
    const fromStr = period?.from ? formatYMD(period.from) : '';
    const toStr = period?.to ? formatYMD(period.to) : '';
    let good = 0, reject = 0, replace = 0, totalJob = 0;
    const records = [];

    PROD_KEYS.forEach((key) => {
      const cfg = SHEETS[key];
      const rows = data[key] || [];

      (rows || []).forEach((r) => {
        if (!r) return;
        const idVal = cell(r, cfg?.i?.id, '').trim();
        const opVal = cell(r, cfg?.i?.op, '').trim().toLowerCase();
        if (!idVal || idVal === '-' || (currentUsername !== 'guest' && !opVal.includes(currentUsername))) return;

        const dateVal = cell(r, cfg?.i?.date, '');
        if (fromStr && toStr) {
          const itemDate = formatYMD(dateVal);
          if (itemDate && (itemDate < fromStr || itemDate > toStr)) return;
        }

        const g = getRowQtyGood(r, cfg);
        const rj = getRowQtyDefect(r, cfg);
        const rp = getRowQtyReplace(r, cfg);

        good += g;
        reject += rj;
        replace += rp;
        totalJob += 1;

        records.push({
          key,
          process: cfg?.label || key,
          job: cell(r, cfg?.i?.jop) || cell(r, cfg?.i?.nojop),
          date: dateVal,
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
      <div className="card p-5 sm:p-6 bg-blue-50/70 dark:bg-gradient-to-r dark:from-indigo-950/60 dark:via-purple-950/60 dark:to-slate-900 border border-blue-200 dark:border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 text-slate-900 dark:text-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-600 dark:bg-gradient-to-tr dark:from-cyan-500 dark:to-indigo-600 border border-blue-500 dark:border-cyan-400/40 flex items-center justify-center text-white font-black text-xl shadow-sm dark:shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
            {currentUsername.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-blue-100 text-blue-800 border-blue-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40 font-bold">OPERATOR DASHBOARD</span>
              <span className="text-xs text-slate-600 dark:text-slate-300">Periode: {fmtPeriodRange(period?.from, period?.to)}</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-slate-900 dark:text-white mt-1 capitalize tracking-wide">{currentUsername}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">Ringkasan produktivitas personal & kontrol kualitas Anda</p>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider font-semibold">Performance Index</span>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-cyan-300">
            {userStats.score} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ 100</span>
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
        <h3 className="card-title flex items-center gap-2 text-slate-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" /> Riwayat Kontribusi Pekerjaan Anda
        </h3>
        <div className="table-responsive max-h-80">
          <table className="tbl min-w-[450px]">
            <thead>
              <tr>
                <th>Lini</th>
                <th>JOP / Pekerjaan</th>
                <th>Good</th>
                <th>Reject</th>
              </tr>
            </thead>
            <tbody>
              {userStats.records.map((r, i) => (
                <tr key={i} className="cursor-pointer">
                  <td className="text-blue-600 dark:text-cyan-300 font-semibold">{r.process}</td>
                  <td className="text-slate-900 dark:text-slate-100 font-medium">{r.job || '-'}</td>
                  <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{r.good}</td>
                  <td className="text-rose-600 dark:text-rose-400 font-semibold">{r.reject}</td>
                </tr>
              ))}
              {userStats.records.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500 dark:text-slate-400">Tidak ada riwayat pekerjaan tercatat pada periode ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}