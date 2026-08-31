import React, { useState, useMemo } from 'react';
import { PROD_KEYS, SHEETS } from '../../constants/schema';
import { parseDateVal, num, hexA, cell, fmtPeriodRange, iso } from '../../utils/formatters';
import { Bar } from 'react-chartjs-2';
import { Check, RotateCcw, GitCompare, Calendar } from 'lucide-react';

export default function CompareView({ data, onToast }) {
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
    const rows = (data[key] || []).filter((r) => {
      const idVal = cell(r, cfg.i.id).trim();
      if (!idVal) return false;
      const d = parseDateVal(r[cfg.i.date]);
      return d && d.getTime() >= from && d.getTime() <= to;
    });

    let baik = 0, rusak = 0, ganti = 0;
    rows.forEach((r) => {
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
    let color = 'text-slate-400 bg-white/5 border-white/10', label = 'TETAP';
    if (d.dir === 'up') {
      if (mode === 'normal') { color = 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40'; label = 'NAIK'; }
      else if (mode === 'invert') { color = 'text-rose-300 bg-rose-950/40 border-rose-500/40'; label = 'NAIK'; }
      else { color = 'text-orange-300 bg-orange-950/40 border-orange-500/40'; label = 'NAIK'; }
    } else if (d.dir === 'down') {
      if (mode === 'normal') { color = 'text-rose-300 bg-rose-950/40 border-rose-500/40'; label = 'TURUN'; }
      else { color = 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40'; label = 'TURUN'; }
    }
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${color}`}>
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
    onToast?.('Reset ke: Bulan Lalu vs Bulan Ini', 'info');
  };

  return (
    <div className="space-y-6 anim-in">
      {/* Control Filter Card */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <GitCompare className="w-6 h-6" />
          </span>
          <div>
            <h3 className="card-title text-base">Dashboard Komparasi</h3>
            <p className="text-xs text-slate-300">Bandingkan capaian antar periode untuk menganalisis tren produksi[cite: 1, 2]</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-cyan-300 mb-1.5 block">Jenis Capaian</label>
            <select value={key} onChange={(e) => setKey(e.target.value)} className="inp w-full">
              {PROD_KEYS.map((k) => (
                <option key={k} value={k}>{SHEETS[k].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-cyan-300 mb-1.5 block">Periode 1 (Pembanding)</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={periods.p1.from} onChange={(e) => setPeriods({ ...periods, p1: { ...periods.p1, from: e.target.value } })} className="inp w-full" />
              <input type="date" value={periods.p1.to} onChange={(e) => setPeriods({ ...periods, p1: { ...periods.p1, to: e.target.value } })} className="inp w-full" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-cyan-300 mb-1.5 block">Periode 2 (Dibandingkan)</label>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={periods.p2.from} onChange={(e) => setPeriods({ ...periods, p2: { ...periods.p2, from: e.target.value } })} className="inp w-full" />
              <input type="date" value={periods.p2.to} onChange={(e) => setPeriods({ ...periods, p2: { ...periods.p2, to: e.target.value } })} className="inp w-full" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 flex-wrap items-center pt-4 border-t border-white/10">
          <button
            onClick={() => onToast?.('Komparasi diperbarui', 'ok')}
            className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Terapkan Komparasi
          </button>
          
          <button
            onClick={handleSwap}
            className="btn-ghost flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Tukar Periode
          </button>
          
          <button
            onClick={handleLastMonth}
            className="btn-ghost flex items-center gap-2"
          >
            <Calendar className="w-3.5 h-3.5" /> Bulan Lalu vs Bulan Ini
          </button>
        </div>
      </div>

      {/* Metric Delta Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Hasil</span>
            {arrow(dHasil, 'normal')}
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400">Periode 1</div>
              <div className="font-display font-black text-2xl text-slate-200">{m1.pakai.toLocaleString('id-ID')}</div>
            </div>
            <div className="text-cyan-400 text-xl font-bold pb-1">→</div>
            <div>
              <div className="text-[10px] text-slate-400">Periode 2</div>
              <div className="font-display font-black text-2xl text-cyan-300">{m2.pakai.toLocaleString('id-ID')}</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Delta Capaian</span>
            <span className={`font-black ${dHasil.dir === 'up' ? 'text-emerald-400' : dHasil.dir === 'down' ? 'text-rose-400' : 'text-slate-300'}`}>
              {dHasil.pct > 0 ? '+' : ''}{dHasil.pct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Rusak</span>
            {arrow(dRusak, 'invert')}
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400">Periode 1</div>
              <div className="font-display font-black text-2xl text-rose-400">{m1.rusak.toLocaleString('id-ID')}</div>
            </div>
            <div className="text-rose-400 text-xl font-bold pb-1">→</div>
            <div>
              <div className="text-[10px] text-slate-400">Periode 2</div>
              <div className="font-display font-black text-2xl text-rose-400">{m2.rusak.toLocaleString('id-ID')}</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Delta Rusak</span>
            <span className={`font-black ${dRusak.dir === 'up' ? 'text-rose-400' : dRusak.dir === 'down' ? 'text-emerald-400' : 'text-slate-300'}`}>
              {dRusak.pct > 0 ? '+' : ''}{dRusak.pct.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Ganti</span>
            {arrow(dGanti, 'warning')}
          </div>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-[10px] text-slate-400">Periode 1</div>
              <div className="font-display font-black text-2xl text-amber-400">{m1.ganti.toLocaleString('id-ID')}</div>
            </div>
            <div className="text-amber-400 text-xl font-bold pb-1">→</div>
            <div>
              <div className="text-[10px] text-slate-400">Periode 2</div>
              <div className="font-display font-black text-2xl text-amber-300">{m2.ganti.toLocaleString('id-ID')}</div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Delta Ganti</span>
            <span className="font-black text-amber-300">{dGanti.pct > 0 ? '+' : ''}{dGanti.pct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Chart Komparasi */}
      <div className="card p-5">
        <h3 className="card-title mb-4">Grafik Komparasi — Hasil, Ganti & Rusak[cite: 1, 2]</h3>
        <div className="h-80">
          <Bar
            data={{
              labels: ['Total Hasil', 'Total Ganti', 'Total Rusak'],
              datasets: [
                {
                  label: 'Periode 1',
                  data: [m1.pakai, m1.ganti, m1.rusak],
                  backgroundColor: 'rgba(56, 189, 248, 0.4)',
                  borderColor: '#38bdf8',
                  borderWidth: 2,
                  borderRadius: 8
                },
                {
                  label: 'Periode 2',
                  data: [m2.pakai, m2.ganti, m2.rusak],
                  backgroundColor: 'rgba(168, 85, 247, 0.7)',
                  borderColor: '#a855f7',
                  borderWidth: 2,
                  borderRadius: 8
                }
              ]
            }}
            options={{
              maintainAspectRatio: false,
              scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { beginAtZero: true, ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
              },
              plugins: {
                legend: { labels: { color: '#e2e8f0' } }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}