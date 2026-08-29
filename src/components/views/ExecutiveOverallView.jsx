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
      // Toleransi max 1.0%
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
        desc: 'Seluruh lini produksi CTCP, CTP, Screen, Flexo, dan Etching memenuhi target mutu (Loss Rate &le; 1.0%).',
        rows: []
      });
    }

    return res;
  }, [summaryByProcess]);

  return (
    <div className="space-y-4 anim-in">
      {/* Header Panel */}
      <div className="card p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-amber-400/20 text-amber-300 font-bold">MANAGEMENT OVERALL</span>
            <span className="text-xs text-slate-400">· Manager & Developer View</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl mt-1.5">Executive Prepress Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Ringkasan makro performa lintas divisi, perbandingan efisiensi 5 lini proses, dan deteksi anomali operasional. Klik card, grafik, atau notifikasi alert untuk membuka detail transaksi.
          </p>
        </div>
        <div className="text-right">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Rentang Periode</div>
          <div className="font-bold text-sm text-amber-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
        </div>
      </div>

      {/* Grand Total KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        <div className="card p-4 bg-white border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL OUTPUT PABRIK</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-slate-800">{grandTotal.output.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Gabungan 5 Lini Proses</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL GOOD</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-emerald-600">{grandTotal.good.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Siap Cetak / QC Passed</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">TOTAL REJECT</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 font-display font-extrabold text-2xl text-rose-600">{grandTotal.reject.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total Afval / Rusak</div>
        </div>

        <div className="card p-4 bg-white border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">OVERALL LOSS RATE</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`mt-2 font-display font-extrabold text-2xl ${grandTotal.lossRate > 1.0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {grandTotal.lossRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Toleransi Target: &le; 1.0%</div>
        </div>
      </div>

      {/* Grafik Perbandingan Lintas Proses */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="card-title mb-1">Perbandingan Output per Lini Proses</h3>
          <p className="text-xs text-slate-500 mb-3">Klik batang grafik untuk melihat seluruh transaksi lini</p>
          <div className="h-64">
            <Bar
              data={{
                labels: summaryByProcess.map(p => p.label),
                datasets: [
                  { label: 'Good', data: summaryByProcess.map(p => p.good), backgroundColor: '#10b981', borderRadius: 4 },
                  { label: 'Reject', data: summaryByProcess.map(p => p.reject), backgroundColor: '#f43f5e', borderRadius: 4 }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                scales: { x: { stacked: true }, y: { stacked: true } },
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
          <p className="text-xs text-slate-500 mb-3">Klik batang untuk melihat daftar reject pada lini terkait</p>
          <div className="h-64">
            <Bar
              data={{
                labels: summaryByProcess.map(p => p.label),
                datasets: [
                  {
                    label: 'Loss Rate (%)',
                    data: summaryByProcess.map(p => p.lossRate),
                    backgroundColor: summaryByProcess.map(p => p.lossRate > 1.0 ? '#f43f5e' : '#10b981'),
                    borderRadius: 4
                  }
                ]
              }}
              options={{
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
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

      {/* Alert Center Panel (Dapat Di-klik untuk Membuka Data) */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
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
              className={`p-3 rounded-xl border flex items-start gap-3 transition ${
                al.rows && al.rows.length > 0 ? 'cursor-pointer hover:shadow-md' : ''
              } ${
                al.level === 'CRITICAL'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <Activity className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>{al.title}</span>
                  {al.rows && al.rows.length > 0 && <span className="text-[11px] underline font-semibold">Lihat Detail →</span>}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">{al.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}