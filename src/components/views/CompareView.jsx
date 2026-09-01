import React, { useState, useMemo } from 'react';
import { PROD_KEYS, SHEETS } from '../../constants/schema';
import { parseDateVal, num, hexA, cell, fmtPeriodRange, iso, getChartTheme } from '../../utils/formatters';
import { Bar } from 'react-chartjs-2';
import { Check, RotateCcw, GitCompare } from 'lucide-react';

export default function CompareView({ data = {}, onToast }) {
  const [key, setKey] = useState('rec_ctcp');
  const cfg = SHEETS[key] || SHEETS.rec_ctcp;

  const defaultPeriods = () => {
    const today = new Date();
    const p2To = today;
    const p2From = new Date(today.getFullYear(), today.getMonth(), 1);
    const p1To = new Date(today.getFullYear(), today.getMonth(), 0);
    const p1From = new Date(p1To.getFullYear(), p1To.getMonth(), 1);
    return { p1: { from: iso(p1From), to: iso(p1To) }, p2: { from: iso(p2From), to: iso(p2To) } };
  };

  const [periods, setPeriods] = useState(defaultPeriods);

  const getMetrics = (fromStr, toStr) => {
    const from = new Date(fromStr).setHours(0, 0, 0, 0);
    const to = new Date(toStr).setHours(23, 59, 59, 999);
    const rows = (data[key] || []).filter(r => {
      const idVal = cell(r, cfg.i.id).trim();
      if (!idVal || idVal === '-') return false;
      const d = parseDateVal(r[cfg.i.date]);
      return d && d.getTime() >= from && d.getTime() <= to;
    });

    let baik = 0, rusak = 0, ganti = 0;
    rows.forEach(r => {
      baik += num(r[cfg.i.baik]);
      rusak += num(r[cfg.i.rusak]);
      ganti += num(r[cfg.i.ganti]);
    });
    return { pakai: baik + rusak, rusak, ganti, rows };
  };

  const m1 = useMemo(() => getMetrics(periods.p1.from, periods.p1.to), [data, key, periods.p1]);
  const m2 = useMemo(() => getMetrics(periods.p2.from, periods.p2.to), [data, key, periods.p2]);

  const delta = (a, b) => {
    if (b === 0 && a === 0) return { pct: 0, dir: 'equal' };
    if (b === 0) return { pct: 100, dir: 'up' };
    const p = ((a - b) / b) * 100;
    return { pct: p, dir: p > 0.01 ? 'up' : (p < -0.01 ? 'down' : 'equal') };
  };

  const dHasil = delta(m2.pakai, m1.pakai);
  const dRusak = delta(m2.rusak, m1.rusak);
  const dGanti = delta(m2.ganti, m1.ganti);

  const arrow = (d, mode) => {
    let color = 'text-slate-300 bg-slate-800 border border-slate-700', label = 'TETAP';
    if (d.dir === 'up') {
      if (mode === 'normal') { color = 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/40'; label = 'NAIK'; }
      else if (mode === 'invert') { color = 'text-rose-300 bg-rose-950/60 border border-rose-500/40'; label = 'NAIK'; }
      else { color = 'text-amber-300 bg-amber-950/60 border border-amber-500/40'; label = 'NAIK'; }
    } else if (d.dir === 'down') {
      if (mode === 'normal') { color = 'text-rose-300 bg-rose-950/60 border border-rose-500/40'; label = 'TURUN'; }
      else { color = 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/40'; label = 'TURUN'; }
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${color}`}>
        {label}
      </span>
    );
  };

  const handleSwap = () => {
    setPeriods({ p1: periods.p2, p2: periods.p1 });
    onToast?.('Periode ditukar', 'info');
  };

  const handleLastMonth = () => {
    setPeriods(defaultPeriods());
    onToast?.('Preset: Bulan Lalu vs Bulan Ini', 'info');
  };

  const handleLast30Days = () => {
    const today = new Date();
    const p2To = today;
    const p2From = new Date(today);
    p2From.setDate(today.getDate() - 29);

    const p1To = new Date(today);
    p1To.setDate(today.getDate() - 30);
    const p1From = new Date(today);
    p1From.setDate(today.getDate() - 59);

    setPeriods({
      p1: { from: iso(p1From), to: iso(p1To) },
      p2: { from: iso(p2From), to: iso(p2To) }
    });
    onToast?.('Preset: 30 Hari Sebelumnya vs 30 Hari Terakhir', 'info');
  };

  const handleLast7Days = () => {
    const today = new Date();
    const p2To = today;
    const p2From = new Date(today);
    p2From.setDate(today.getDate() - 6);

    const p1To = new Date(today);
    p1To.setDate(today.getDate() - 7);
    const p1From = new Date(today);
    p1From.setDate(today.getDate() - 13);

    setPeriods({
      p1: { from: iso(p1From), to: iso(p1To) },
      p2: { from: iso(p2From), to: iso(p2To) }
    });
    onToast?.('Preset: 7 Hari Sebelumnya vs 7 Hari Terakhir', 'info');
  };

  return (
    <div className="space-y-4 anim-in">
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-11 h-11 rounded-2xl grid place-items-center bg-blue-50 dark:bg-indigo-500/20 text-blue-600 dark:text-cyan-300 border border-blue-200 dark:border-indigo-400/40 shadow-sm">
            <GitCompare className="w-5 h-5" />
          </span>
          <div>
            <h3 className="card-title text-base sm:text-lg text-slate-900 dark:text-white">Dashboard Komparasi Capaian</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bandingkan capaian antar periode untuk menganalisis tren efisiensi produksi</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Pilih Proses</label>
            <select value={key} onChange={e => setKey(e.target.value)} className="inp w-full">
              {PROD_KEYS.map(k => (
                <option key={k} value={k}>{SHEETS[k].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Periode 1 (Pembanding)</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input type="date" value={periods.p1.from} onChange={e => setPeriods({ ...periods, p1: { ...periods.p1, from: e.target.value } })} className="inp w-full" />
              <input type="date" value={periods.p1.to} onChange={e => setPeriods({ ...periods, p1: { ...periods.p1, to: e.target.value } })} className="inp w-full" />
            </div>
          </div>
          <div className="sm:col-span-2 md:col-span-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">Periode 2 (Dibandingkan)</label>
            <div className="grid grid-cols-2 gap-1.5">
              <input type="date" value={periods.p2.from} onChange={e => setPeriods({ ...periods, p2: { ...periods.p2, from: e.target.value } })} className="inp w-full" />
              <input type="date" value={periods.p2.to} onChange={e => setPeriods({ ...periods, p2: { ...periods.p2, to: e.target.value } })} className="inp w-full" />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap items-center">
          <button onClick={() => onToast?.('Komparasi diperbarui', 'ok')} className="btn-primary text-xs py-2 px-4 rounded-xl shadow-sm">
            <Check className="w-4 h-4 mr-1" /> Terapkan Komparasi
          </button>
          <button onClick={handleSwap} className="btn-secondary text-xs py-2 px-3 rounded-xl">
            <RotateCcw className="w-4 h-4 mr-1" /> Tukar Periode
          </button>
          <button onClick={handleLastMonth} className="btn-secondary text-xs py-2 px-3 rounded-xl">
            Bulan Lalu vs Bulan Ini
          </button>
          <button onClick={handleLast30Days} className="btn-secondary text-xs py-2 px-3 rounded-xl">
            30 Hari Lalu vs 30 Hari Ini
          </button>
          <button onClick={handleLast7Days} className="btn-secondary text-xs py-2 px-3 rounded-xl">
            7 Hari Lalu vs 7 Hari Ini
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 stagger">
        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-blue-600"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Total Hasil</span>
            {arrow(dHasil, 'normal')}
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 1</div>
              <div className="font-display font-extrabold text-2xl text-slate-900 dark:text-slate-200">{m1.pakai.toLocaleString('id-ID')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(periods.p1.from), new Date(periods.p1.to))}</div>
            </div>
            <div className="text-slate-400 text-xl pb-1">&rarr;</div>
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 2</div>
              <div className="font-display font-extrabold text-2xl text-blue-600 dark:text-cyan-300">{m2.pakai.toLocaleString('id-ID')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(periods.p2.from), new Date(periods.p2.to))}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Delta</span>
            <span className={`font-bold ${dHasil.dir === 'up' ? 'text-emerald-600 dark:text-emerald-400' : dHasil.dir === 'down' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
              {dHasil.pct > 0 ? '+' : ''}{dHasil.pct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-rose-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Total Rusak</span>
            {arrow(dRusak, 'invert')}
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 1</div>
              <div className="font-display font-extrabold text-2xl text-rose-600 dark:text-rose-400">{m1.rusak.toLocaleString('id-ID')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(periods.p1.from), new Date(periods.p1.to))}</div>
            </div>
            <div className="text-slate-400 text-xl pb-1">&rarr;</div>
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 2</div>
              <div className="font-display font-extrabold text-2xl text-rose-600 dark:text-rose-400">{m2.rusak.toLocaleString('id-ID')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(periods.p2.from), new Date(periods.p2.to))}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Delta</span>
            <span className={`font-bold ${dRusak.dir === 'up' ? 'text-rose-600 dark:text-rose-400' : dRusak.dir === 'down' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
              {dRusak.pct > 0 ? '+' : ''}{dRusak.pct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="card p-5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">Total Ganti</span>
            {arrow(dGanti, 'warning')}
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 1</div>
              <div className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-400">{m1.ganti.toLocaleString('id-ID')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(periods.p1.from), new Date(periods.p1.to))}</div>
            </div>
            <div className="text-slate-400 text-xl pb-1">&rarr;</div>
            <div className="flex-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Periode 2</div>
              <div className="font-display font-extrabold text-2xl text-amber-600 dark:text-amber-400">{m2.ganti.toLocaleString('id-ID')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{fmtPeriodRange(new Date(periods.p2.from), new Date(periods.p2.to))}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Delta</span>
            <span className="font-bold text-amber-600 dark:text-amber-300">{dGanti.pct > 0 ? '+' : ''}{dGanti.pct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="card-title mb-3">Grafik Komparasi — Total Hasil & Total Ganti</h3>
        <div className="h-80">
          {(() => {
            const ct = getChartTheme();
            return (
              <Bar
                data={{
                  labels: ['Total Hasil', 'Total Ganti', 'Total Rusak'],
                  datasets: [
                    { label: 'Periode 1', data: [m1.pakai, m1.ganti, m1.rusak], backgroundColor: hexA(cfg.color, 0.35), borderColor: cfg.color, borderWidth: 2, borderRadius: 6 },
                    { label: 'Periode 2', data: [m2.pakai, m2.ganti, m2.rusak], backgroundColor: hexA(cfg.color, 0.9), borderColor: cfg.color, borderWidth: 2, borderRadius: 6 }
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
                  }
                }}
              />
            );
          })()}
        </div>
      </div>
    </div>
  );
}