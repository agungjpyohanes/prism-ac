import React, { useState, useMemo } from 'react';
import { SHEETS, PROD_KEYS } from '../../constants/schema';
import { parseDateVal, num, cell, startOfDay, getChartTheme } from '../../utils/formatters';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Users, Clock, Search, Filter, Briefcase } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function OperatorShiftView({ data, period }) {
  const [selectedProcess, setSelectedProcess] = useState('ALL');
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('OP');
  const [searchQuery, setSearchQuery] = useState('');

  const targetKeys = selectedProcess === 'ALL' ? PROD_KEYS : [selectedProcess];

  // Ekstraksi seluruh baris dengan indeks kolom dinamis
  const allRows = useMemo(() => {
    const res = [];
    targetKeys.forEach(key => {
      const cfg = SHEETS[key];
      const raw = data[key] || [];
      const poCol = cfg?.i?.po ?? -1;

      raw.forEach(r => {
        const idVal = cell(r, cfg.i.id).trim();
        const jopVal = cell(r, cfg.i.jop).trim();
        const noJopVal = cell(r, cfg.i.nojop).trim();
        if (!idVal || (!jopVal && !noJopVal)) return;

        const d = parseDateVal(r[cfg.i.date]);
        if (d) {
          const from = period?.from ? startOfDay(period.from).getTime() : null;
          const to = period?.to ? new Date(period.to).setHours(23, 59, 59, 999) : null;
          if (from && d.getTime() < from) return;
          if (to && d.getTime() > to) return;
        }

        res.push({
          key,
          process: cfg.label,
          good: num(r[cfg.i.baik]),
          reject: num(r[cfg.i.rusak]),
          replace: num(r[cfg.i.ganti]),
          operator: cell(r, cfg.i.op).trim() || 'Unassigned',
          shift: cell(r, cfg.i.shift).toUpperCase().trim() || 'NON-SHIFT',
          po: (poCol !== -1 && cell(r, poCol).trim()) || 'Tanpa PO'
        });
      });
    });
    return res;
  }, [data, targetKeys, period]);

  // Agregasi Terpisah: Operator
  const operatorStats = useMemo(() => {
    const map = new Map();
    allRows.forEach(r => {
      const e = map.get(r.operator) || { name: r.operator, good: 0, reject: 0, replace: 0, process: r.process };
      e.good += r.good;
      e.reject += r.reject;
      e.replace += r.replace;
      map.set(r.operator, e);
    });

    return [...map.values()]
      .map(o => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [allRows]);

  // Agregasi Terpisah: PO (Customer)
  const poStats = useMemo(() => {
    const map = new Map();
    allRows.forEach(r => {
      const e = map.get(r.po) || { name: r.po, good: 0, reject: 0, replace: 0, process: r.process };
      e.good += r.good;
      e.reject += r.reject;
      e.replace += r.replace;
      map.set(r.po, e);
    });

    return [...map.values()]
      .map(o => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [allRows]);

  const activeData = activeLeaderboardTab === 'OP' ? operatorStats : poStats;

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return activeData;
    const q = searchQuery.toLowerCase();
    return activeData.filter(o => o.name.toLowerCase().includes(q));
  }, [activeData, searchQuery]);

  // Agregasi Shift
  const shiftStats = useMemo(() => {
    const map = new Map();
    allRows.forEach(r => {
      const e = map.get(r.shift) || { good: 0, reject: 0, replace: 0 };
      e.good += r.good;
      e.reject += r.reject;
      e.replace += r.replace;
      map.set(r.shift, e);
    });

    const labels = [...map.keys()].sort();
    return {
      labels,
      good: labels.map(l => map.get(l).good),
      reject: labels.map(l => map.get(l).reject)
    };
  }, [allRows]);

  return (
    <div className="space-y-4 anim-in">
      {/* Header & Filter Lini */}
      <div className="card p-5 flex flex-wrap items-center justify-between gap-4 bg-blue-50/70 dark:bg-gradient-to-r dark:from-slate-900 dark:via-[#0e172e] dark:to-slate-900 text-slate-900 dark:text-white border border-blue-200 dark:border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 dark:bg-cyan-500/10 dark:text-cyan-300 border border-blue-200 dark:border-cyan-400/30 grid place-items-center">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">Evaluasi Performa Operator, PO & Shift</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">Analisis produktivitas tim, rasio afval/reject, dan efisiensi lini</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
          <select
            value={selectedProcess}
            onChange={e => setSelectedProcess(e.target.value)}
            className="inp text-xs !py-1.5 font-semibold w-full sm:w-auto"
          >
            <option value="ALL">Semua Lini Proses (Gabungan)</option>
            {PROD_KEYS.map(k => (
              <option key={k} value={k}>{SHEETS[k].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Shift Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="card-title text-slate-900 dark:text-white">Performa Output per Shift</h3>
          </div>
          <div className="h-64">
            {(() => {
              const ct = getChartTheme();
              return (
                <Bar
                  data={{
                    labels: shiftStats.labels,
                    datasets: [
                      { label: 'Good Output', data: shiftStats.good, backgroundColor: ct.goodColor, borderRadius: 4 },
                      { label: 'Defect / Reject', data: shiftStats.reject, backgroundColor: ct.defectColor, borderRadius: 4 }
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
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="card-title mb-3 text-slate-900 dark:text-white">Porsi Good Output Antar Shift</h3>
          <div className="h-64 flex items-center justify-center">
            {(() => {
              const ct = getChartTheme();
              return (
                <Doughnut
                  data={{
                    labels: shiftStats.labels,
                    datasets: [
                      {
                        data: shiftStats.good,
                        backgroundColor: ['#0284c7', '#059669', '#d97706', '#6366f1', '#64748b'],
                        borderColor: ct.isLight ? '#ffffff' : '#0f172a',
                        borderWidth: 2
                      }
                    ]
                  }}
                  options={{
                    maintainAspectRatio: false,
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

      {/* Tabel Leaderboard Terpisah (Operator vs PO) */}
      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {activeLeaderboardTab === 'OP' ? (
                <Users className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              ) : (
                <Briefcase className="w-5 h-5 text-amber-500" />
              )}
              <h3 className="card-title text-slate-900 dark:text-white">
                {activeLeaderboardTab === 'OP' ? 'Ranking Produktivitas Operator' : 'Ranking Produktivitas PO (Customer)'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Daftar peringkat berdasarkan volume output dan rasio reject terkecil</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* iOS-style Segmented Control Toggle Switch */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1 h-9">
              <button
                type="button"
                onClick={() => { setActiveLeaderboardTab('OP'); setSearchQuery(''); }}
                className={`h-7 px-4 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                  activeLeaderboardTab === 'OP'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => { setActiveLeaderboardTab('PO'); setSearchQuery(''); }}
                className={`h-7 px-4 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center ${
                  activeLeaderboardTab === 'PO'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                PO
              </button>
            </div>

            {/* Search Input with matching h-9 height */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeLeaderboardTab === 'OP' ? 'Cari Operator...' : 'Cari PO...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="inp !pl-9 text-xs h-9 w-full"
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="tbl min-w-[700px]">
            <thead>
              <tr>
                <th>Rank</th>
                <th>{activeLeaderboardTab === 'OP' ? 'Nama Operator' : 'Nama PO'}</th>
                <th>Lini Terakhir</th>
                <th>Total Output</th>
                <th>Good</th>
                <th>Reject</th>
                <th>Replace</th>
                <th>Loss Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((o, idx) => (
                <tr key={o.name} className="cursor-pointer">
                  <td className="font-mono font-bold text-slate-500 dark:text-slate-400">#{idx + 1}</td>
                  <td className="font-semibold text-slate-900 dark:text-slate-100">{o.name}</td>
                  <td className="text-slate-600 dark:text-slate-400">{o.process}</td>
                  <td className="font-bold text-slate-900 dark:text-white">{o.output.toLocaleString('id-ID')}</td>
                  <td className="text-emerald-600 dark:text-emerald-400 font-semibold">{o.good.toLocaleString('id-ID')}</td>
                  <td className="text-rose-600 dark:text-rose-400 font-semibold">{o.reject.toLocaleString('id-ID')}</td>
                  <td className="text-amber-600 dark:text-amber-400">{o.replace.toLocaleString('id-ID')}</td>
                  <td>
                    <span className={`badge ${o.lossRate > 1.0 ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40' : 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'} font-bold`}>
                      {o.lossRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}