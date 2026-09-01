import React, { useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, fmtPeriodRange, startOfDay, getChartTheme } from '../../utils/formatters';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { ShieldAlert, CheckCircle2, AlertTriangle, Layers, Percent, Activity } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ExecutiveOverallView({ data, period, onOpenList }) {
  const summaryByProcess = useMemo(() => {
    return PROD_KEYS.map(k => {
      const cfg = SHEETS[k];
      const raw = data[k] || [];

      const rows = raw.filter(r => {
        const idVal = cell(r, cfg.i.id).trim();
        const jopVal = cell(r, cfg.i.jop).trim();
        const noJopVal = cell(r, cfg.i.nojop).trim();
        if (!idVal || (!jopVal && !noJopVal)) return false;

        const d = parseDateVal(r[cfg.i.date]);
        if (!d) return true;
        const from = period?.from ? startOfDay(period.from).getTime() : null;
        const to = period?.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
        if (from && d.getTime() < from) return false;
        if (to && d.getTime() > to) return false;
        return true;
      });

      let good = 0, reject = 0, replace = 0;
      rows.forEach(r => {
        good += num(r[cfg.i.baik]);
        reject += num(r[cfg.i.rusak]);
        replace += num(r[cfg.i.ganti]);
      });

      const output = good + reject;
      const lossRate = output > 0 ? (reject / output) * 100 : 0;

      return {
        key: k,
        label: cfg.label,
        color: cfg.color,
        unit: cfg.unit,
        output,
        good,
        reject,
        replace,
        lossRate,
        rows
      };
    });
  }, [data, period]);

  const grandTotal = useMemo(() => {
    let output = 0, good = 0, reject = 0, replace = 0;
    summaryByProcess.forEach(p => {
      output += p.output;
      good += p.good;
      reject += p.reject;
      replace += p.replace;
    });
    const lossRate = output > 0 ? (reject / output) * 100 : 0;
    return { output, good, reject, replace, lossRate };
  }, [summaryByProcess]);

  const alerts = useMemo(() => {
    const res = [];
    summaryByProcess.forEach(p => {
      if (p.lossRate > 1.0) {
        res.push({
          level: 'CRITICAL',
          key: p.key,
          label: p.label,
          title: `Tingkat Loss ${p.label} Tinggi (${p.lossRate.toFixed(1)}%)`,
          desc: `Lini ${p.label} melebihi batas toleransi target 1.0% dengan ${p.reject} unit reject. Klik untuk audit data.`,
          rows: p.rows.filter(r => num(r[SHEETS[p.key].i.rusak]) > 0)
        });
      }
    });

    if (res.length === 0) {
      res.push({
        level: 'NORMAL',
        title: 'Semua Lini Berada Dalam Batas Normal',
        desc: 'Seluruh lini produksi CTCP, CTP, Screen, Flexo, dan Etching memenuhi target mutu (Loss Rate ≤ 1.0%).',
        rows: []
      });
    }

    return res;
  }, [summaryByProcess]);

  return (
    <div className="space-y-6 anim-in">
      {/* Header Panel */}
      <div className="card p-6 flex flex-wrap items-center justify-between gap-4 bg-blue-50/70 dark:bg-gradient-to-r dark:from-slate-900 dark:via-[#0e172e] dark:to-slate-900 text-slate-900 dark:text-white border border-blue-200 dark:border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-blue-100 text-blue-800 border-blue-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40 font-bold">MANAGEMENT OVERALL</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">&bull; Executive Strategic Overview</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl mt-1 text-slate-900 dark:text-white tracking-wide">Executive Prepress Dashboard</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Ringkasan makro performa lintas divisi, perbandingan efisiensi 5 lini proses, dan deteksi anomali operasional.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider font-semibold">Rentang Periode</div>
          <div className="font-bold text-sm text-blue-600 dark:text-cyan-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
        </div>
      </div>

      {/* 4 Grand Total Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-4 sm:p-5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">Total Output Pabrik</span>
            <div className="mt-1 font-display font-black text-2xl sm:text-3xl text-blue-600 dark:text-cyan-300">
              {grandTotal.output.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Gabungan 5 Lini Proses</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-400/30 flex items-center justify-center text-blue-600 dark:text-cyan-300 shrink-0">
            <Layers className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">Total Good</span>
            <div className="mt-1 font-display font-black text-2xl sm:text-3xl text-emerald-600 dark:text-emerald-400">
              {grandTotal.good.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Siap Cetak / QC Passed</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">Total Reject</span>
            <div className="mt-1 font-display font-black text-2xl sm:text-3xl text-rose-600 dark:text-rose-400">
              {grandTotal.reject.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Total Afval / Rusak</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-400/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        <div className="card p-4 sm:p-5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate block">Overall Loss Rate</span>
            <div className={`mt-1 font-display font-black text-2xl sm:text-3xl ${grandTotal.lossRate > 1.0 ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-cyan-300'}`}>
              {grandTotal.lossRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Toleransi Target: &le; 1.0%</div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-400/30 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0">
            <Percent className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Chart Perbandingan Lintas Proses */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="card-title mb-1 text-slate-900 dark:text-white">Perbandingan Output per Lini Proses</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Klik batang grafik untuk melihat seluruh transaksi lini</p>
          <div className="h-64">
            {(() => {
              const ct = getChartTheme();
              return (
                <Bar
                  data={{
                    labels: summaryByProcess.map(p => p.label),
                    datasets: [
                      { label: 'Good Output', data: summaryByProcess.map(p => p.good), backgroundColor: ct.goodColor, borderRadius: 8 },
                      { label: 'Reject / Defect', data: summaryByProcess.map(p => p.reject), backgroundColor: ct.defectColor, borderRadius: 8 }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      x: { stacked: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } },
                      y: { stacked: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } }
                    },
                    plugins: {
                      legend: { labels: { color: ct.legendColor, font: { size: 11, weight: 'bold' } } },
                      tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#f8fafc',
                        padding: 10,
                        cornerRadius: 8
                      }
                    },
                    onClick: (e, els) => {
                      if (!els.length) return;
                      const item = summaryByProcess[els[0].index];
                      onOpenList?.(`Semua Transaksi ${item.label}`, item.key, item.rows);
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="card-title mb-1 text-slate-900 dark:text-white">Perbandingan Loss Rate (%) per Lini</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Klik batang untuk melihat daftar reject pada lini terkait</p>
          <div className="h-64">
            {(() => {
              const ct = getChartTheme();
              return (
                <Bar
                  data={{
                    labels: summaryByProcess.map(p => p.label),
                    datasets: [
                      {
                        label: 'Loss Rate (%)',
                        data: summaryByProcess.map(p => p.lossRate),
                        backgroundColor: summaryByProcess.map(p => p.lossRate > 1.0 ? ct.defectColor : ct.totalColor),
                        borderRadius: 8
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
                    scales: {
                      x: { ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } },
                      y: { beginAtZero: true, ticks: { color: ct.tickColor }, grid: { color: ct.gridColor } }
                    },
                    plugins: {
                      legend: { labels: { color: ct.legendColor, font: { size: 11, weight: 'bold' } } },
                      tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#ffffff',
                        bodyColor: '#f8fafc',
                        padding: 10,
                        cornerRadius: 8
                      }
                    },
                    onClick: (e, els) => {
                      if (!els.length) return;
                      const item = summaryByProcess[els[0].index];
                      onOpenList?.(`Reject Record ${item.label}`, item.key, item.rows.filter(r => num(r[SHEETS[item.key].i.rusak]) > 0));
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>
      </div>

      {/* Alert Center Panel */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <h3 className="card-title text-slate-900 dark:text-white">Alert Center & Deteksi Penyimpangan</h3>
        </div>
        <div className="space-y-2">
          {alerts.map((al, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (al.rows && al.rows.length > 0) {
                  onOpenList?.(`Audit Loss: ${al.label}`, al.key, al.rows);
                }
              }}
              className={`p-4 rounded-2xl border flex items-start gap-3.5 transition ${
                al.rows && al.rows.length > 0 ? 'cursor-pointer hover:scale-[1.01]' : ''
              } ${
                al.level === 'CRITICAL'
                  ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/60 dark:border-rose-500/50 dark:text-rose-200'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-500/50 dark:text-emerald-200'
              }`}
            >
              <Activity className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs sm:text-sm flex items-center justify-between gap-2">
                  <span className="truncate">{al.title}</span>
                  {al.rows && al.rows.length > 0 && <span className="text-[11px] text-blue-600 dark:text-cyan-300 underline font-semibold shrink-0">Lihat Detail &rarr;</span>}
                </div>
                <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1">{al.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}