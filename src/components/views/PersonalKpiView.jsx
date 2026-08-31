import React, { useState, useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, fmtPeriodRange, startOfDay } from '../../utils/formatters';
import { UserCheck, Filter } from 'lucide-react';

export default function PersonalKpiView({ data, period, user }) {
  const currentUsername = String(user?.USER || user?.username || 'guest').trim();
  const userRole = String(user?.ROLE || user?.role || 'operator').toLowerCase().trim();
  const isManagerOrAdmin = ['admin', 'manager', 'manajemen', 'supervisor'].includes(userRole);

  // Ambil seluruh daftar nama operator yang ada di database
  const operatorList = useMemo(() => {
    const set = new Set();
    PROD_KEYS.forEach(k => {
      const cfg = SHEETS[k];
      const rows = data[k] || [];
      rows.forEach(r => {
        const op = cell(r, cfg.i.operator).trim();
        if (op && op !== '-' && op.toLowerCase() !== 'unassigned') set.add(op);
      });
    });
    return Array.from(set).sort();
  }, [data]);

  const [selectedOperator, setSelectedOperator] = useState(() => {
    if (isManagerOrAdmin && operatorList.length > 0) return operatorList[0];
    return currentUsername;
  });

  const activeOpName = (isManagerOrAdmin && selectedOperator) ? selectedOperator : currentUsername;

  // Filter transaksi khusus operator yang dipilih
  const personalRecords = useMemo(() => {
    const list = [];
    PROD_KEYS.forEach(k => {
      const cfg = SHEETS[k];
      const rows = data[k] || [];

      rows.forEach(r => {
        const op = cell(r, cfg.i.operator).trim().toLowerCase();
        const targetOp = activeOpName.trim().toLowerCase();

        if (targetOp !== 'guest' && !op.includes(targetOp)) return;

        const d = parseDateVal(r[cfg.i.date]);
        if (d) {
          const from = period?.from ? startOfDay(period.from).getTime() : null;
          const to = period?.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
          if (from && d.getTime() < from) return;
          if (to && d.getTime() > to) return;
        }

        list.push({
          process: cfg.label,
          job: cell(r, cfg.i.jop),
          noJop: cell(r, cfg.i.nojop),
          date: r[cfg.i.date],
          good: num(r[cfg.i.baik]),
          defect: num(r[cfg.i.rusak]),
          replace: num(r[cfg.i.ganti]),
          defectReason: cell(r, cfg.i.defect_reason)
        });
      });
    });
    return list;
  }, [data, activeOpName, period]);

  const kpi = useMemo(() => {
    let good = 0, defect = 0, replace = 0;
    personalRecords.forEach(r => {
      good += r.good;
      defect += r.defect;
      replace += r.replace;
    });
    const total = good + defect;
    const defectRate = total > 0 ? (defect / total) * 100 : 0;
    return { good, defect, replace, total, defectRate, jobCount: personalRecords.length };
  }, [personalRecords]);

  return (
    <div className="space-y-4 anim-in">
      {/* Header Card */}
      <div className="card p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-400 grid place-items-center font-bold text-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge bg-cyan-500/20 text-cyan-300 font-bold">OPERATOR SELF-SERVICE</span>
              <span className="text-xs text-slate-400">· Operator: <b>{activeOpName}</b></span>
            </div>
            <h2 className="font-display font-extrabold text-2xl mt-1">Dashboard KPI Personal</h2>
            <p className="text-xs text-slate-300">Pantau produktivitas, rasio mutu kerja, dan riwayat tugas operator.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isManagerOrAdmin && operatorList.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-xl border border-slate-700">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">Pilih Operator:</span>
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="bg-slate-900 text-cyan-300 text-xs font-bold px-2 py-1 rounded-lg border border-slate-700 outline-none"
              >
                {operatorList.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          )}
          <div className="text-right">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Rentang Periode</div>
            <div className="font-bold text-sm text-cyan-400 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
          </div>
        </div>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 bg-white dark:bg-slate-900 border-l-4 border-l-blue-500">
          <span className="text-[11px] font-bold text-slate-400 uppercase">JOB DIKERJAKAN</span>
          <div className="mt-2 font-display font-extrabold text-2xl text-slate-800 dark:text-white">{kpi.jobCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total lembar tugas SPK</div>
        </div>
        <div className="card p-4 bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500">
          <span className="text-[11px] font-bold text-slate-400 uppercase">OUTPUT GOOD</span>
          <div className="mt-2 font-display font-extrabold text-2xl text-emerald-600">{kpi.good.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Produk lolos QC</div>
        </div>
        <div className="card p-4 bg-white dark:bg-slate-900 border-l-4 border-l-rose-500">
          <span className="text-[11px] font-bold text-slate-400 uppercase">TOTAL DEFECT</span>
          <div className="mt-2 font-display font-extrabold text-2xl text-rose-600">{kpi.defect.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Cacat / Rusak</div>
        </div>
        <div className="card p-4 bg-white dark:bg-slate-900 border-l-4 border-l-purple-500">
          <span className="text-[11px] font-bold text-slate-400 uppercase">DEFECT RATE PRIBADI</span>
          <div className={`mt-2 font-display font-extrabold text-2xl ${kpi.defectRate > 1.0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {kpi.defectRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Target mutu: &le; 1.0%</div>
        </div>
      </div>

      {/* Tabel Riwayat Pekerjaan */}
      <div className="card p-5">
        <h3 className="card-title mb-3">Riwayat Pekerjaan: <span className="text-cyan-600 dark:text-cyan-400">{activeOpName}</span></h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Lini</th>
                <th className="py-2.5 px-3">Nama Job</th>
                <th className="py-2.5 px-3">No JOP</th>
                <th className="py-2.5 px-3">Good</th>
                <th className="py-2.5 px-3">Defect</th>
                <th className="py-2.5 px-3">Alasan Cacat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {personalRecords.slice(0, 20).map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-2.5 px-3 font-semibold text-slate-500">{r.process}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200">{r.job}</td>
                  <td className="py-2.5 px-3 text-slate-500">{r.noJop}</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-bold">{r.good}</td>
                  <td className="py-2.5 px-3 text-rose-600 font-bold">{r.defect}</td>
                  <td className="py-2.5 px-3 text-slate-400">{r.defectReason || '-'}</td>
                </tr>
              ))}
              {personalRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Tidak ada riwayat pekerjaan untuk operator ini pada periode terpilih.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}