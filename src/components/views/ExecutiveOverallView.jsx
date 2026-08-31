import React, { useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, fmtPeriodRange, startOfDay } from '../../utils/formatters';
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
      <div className="card p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge">MANAGEMENT OVERALL</span>
            <span className="text-xs text-slate-300">Executive Strategic Overview[cite: 3]</span>
          </div>
          <h2 className="font-display font-black text-2xl mt-1 text-white">Executive Prepress Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Ringkasan makro performa lintas divisi, perbandingan efisiensi 5 lini proses, dan deteksi anomali operasional[cite: 1, 2].
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Rentang Periode</div>
          <div className="font-bold text-sm text-cyan-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}[cite: 1, 2]</div>
        </div>
      </div>

      {/* 4 Grand Total Cards Sesuai Slide 9 PDF */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Output Pabrik</span>
            <div className="mt-1 font-display font-black text-3xl text-cyan-300 drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
              {grandTotal.output.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Gabungan 5 Lini Proses</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Good</span>
            <div className="mt-1 font-display font-black text-3xl text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">
              {grandTotal.good.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Siap Cetak / QC Passed</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Reject</span>
            <div className="mt-1 font-display font-black text-3xl text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">
              {grandTotal.reject.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Total Afval / Rusak</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-400/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overall Loss Rate</span>
            <div className={`mt-1 font-display font-black text-3xl ${grandTotal.lossRate > 1.0 ? 'text-rose-400' : 'text-cyan-300'} drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]`}>
              {grandTotal.lossRate.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Toleransi Target: ≤ 1.0%</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Chart Perbandingan Lintas Proses Cosmic */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="card-title mb-1">Perbandingan Output per Lini Proses</h3>
          <p className="text-xs text-slate-400 mb-3">Klik batang grafik untuk melihat seluruh transaksi lini</p>
          <div className="h-64">
            <Bar
              data={{
                labels: summaryByProcess.map(p => p.label),
                datasets: [
                  { label: 'Good', data: summaryByProcess.map(p => p.good), backgroundColor: '#10b981', borderRadius: 8 },
                  { label: 'Reject', data: summaryByProcess.map(p => p.reject), backgroundColor: '#f43f5e', borderRadius: 8 }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                scales: {
                  x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: {
                  legend: { labels: { color: '#e2e8f0' } }
                },
                onClick: (e, els) => {
                  if (!els.length) return;
                  const item = summaryByProcess[els[0].index];
                  onOpenList?.(`Semua Transaksi ${item.label}`, item.key, item.rows);
                }
              }}
            />
          </div>
        </div>

        <div className="card p-5">
          <h3 className="card-title mb-1">Perbandingan Loss Rate (%) per Lini</h3>
          <p className="text-xs text-slate-400 mb-3">Klik batang untuk melihat daftar reject pada lini terkait</p>
          <div className="h-64">
            <Bar
              data={{
                labels: summaryByProcess.map(p => p.label),
                datasets: [
                  {
                    label: 'Loss Rate (%)',
                    data: summaryByProcess.map(p => p.lossRate),
                    backgroundColor: summaryByProcess.map(p => p.lossRate > 1.0 ? '#f43f5e' : '#06b6d4'),
                    borderRadius: 8
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                scales: {
                  x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                  y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                },
                plugins: {
                  legend: { labels: { color: '#e2e8f0' } }
                },
                onClick: (e, els) => {
                  if (!els.length) return;
                  const item = summaryByProcess[els[0].index];
                  onOpenList?.(`Reject Record ${item.label}`, item.key, item.rows.filter(r => num(r[SHEETS[item.key].i.rusak]) > 0));
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Alert Center Panel Cosmic */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h3 className="card-title">Alert Center & Deteksi Penyimpangan</h3>
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
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              }`}
            >
              <Activity className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{al.title}</span>
                  {al.rows && al.rows.length > 0 && <span className="text-[11px] text-cyan-300 underline font-semibold">Lihat Detail →</span>}
                </div>
                <div className="text-[11px] opacity-80 mt-1">{al.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}