import React, { useMemo, useState } from 'react';
import { SHEETS, PROD_KEYS, JOP_CATS } from '../../constants/schema';
import { parseDateVal, num, cell, jopCat, fmtPeriodRange, startOfDay, getChartTheme } from '../../utils/formatters';
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
import { CheckCircle2, AlertTriangle, RotateCcw, Layers, Percent, Award, Search, Users, Briefcase } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function ProcessAnalyticsView({ tabKey, onTabChange, data, period, onOpenList }) {
  const activeKey = tabKey || 'rec_ctcp';
  const cfg = SHEETS[activeKey] || SHEETS.rec_ctcp;
  const rawRows = data[activeKey] || [];
  
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState('OP');
  const [searchQuery, setSearchQuery] = useState('');

  const rows = useMemo(() => {
    return rawRows.filter(r => {
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
  }, [rawRows, cfg, period]);

  const kpi = useMemo(() => {
    let good = 0, reject = 0, replace = 0;
    rows.forEach(r => {
      good += num(r[cfg.i.baik]);
      reject += num(r[cfg.i.rusak]);
      replace += num(r[cfg.i.ganti]);
    });
    const output = good + reject;
    const lossRate = output > 0 ? (reject / output) * 100 : 0;
    const perfScore = Math.max(0, 100 - lossRate * 5);
    return { good, reject, replace, output, lossRate, perfScore };
  }, [rows, cfg]);

  const paramData = useMemo(() => {
    const colIdx = cfg.i.mesin ?? -1;
    if (colIdx === -1) return { label: 'Data Mesin', labels: [], good: [], reject: [] };

    const map = new Map();
    rows.forEach(r => {
      const m = cell(r, colIdx).trim() || 'N/A';
      const e = map.get(m) || { good: 0, reject: 0 };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      map.set(m, e);
    });

    const labels = [...map.keys()].sort();
    return {
      colIdx,
      label: cfg.headers[colIdx]?.replace(/_/g, ' ') || 'Parameter Mesin',
      labels,
      good: labels.map(l => map.get(l).good),
      reject: labels.map(l => map.get(l).reject)
    };
  }, [rows, cfg]);

  const secondaryParamData = useMemo(() => {
    if (activeKey === 'rec_screen') {
      const colIdx = cfg.i.mesh ?? -1;
      if (colIdx === -1) return null;
      const map = new Map();
      rows.forEach(r => {
        const mesh = cell(r, colIdx).trim() || 'Tanpa Mesh';
        const e = map.get(mesh) || { good: 0, reject: 0 };
        e.good += num(r[cfg.i.baik]);
        e.reject += num(r[cfg.i.rusak]);
        map.set(mesh, e);
      });
      const labels = [...map.keys()].sort();
      return { colIdx, title: 'Breakdown Tipe Mesh', labels, good: labels.map(l => map.get(l).good), reject: labels.map(l => map.get(l).reject) };
    }
    if (activeKey === 'rec_flexo') {
      const colIdx = cfg.i.tebal ?? -1;
      if (colIdx === -1) return null;
      const map = new Map();
      rows.forEach(r => {
        const t = cell(r, colIdx).trim() || 'Tanpa Info';
        const e = map.get(t) || { good: 0, reject: 0 };
        e.good += num(r[cfg.i.baik]);
        e.reject += num(r[cfg.i.rusak]);
        map.set(t, e);
      });
      const labels = [...map.keys()];
      return { colIdx, title: 'Breakdown Tebal Plate', labels, good: labels.map(l => map.get(l).good), reject: labels.map(l => map.get(l).reject) };
    }
    return null;
  }, [rows, activeKey, cfg]);

  const jopData = useMemo(() => {
    const order = JOP_CATS.map(x => x[1]).concat(['Lainnya']);
    const map = new Map(order.map(o => [o, { good: 0, reject: 0 }]));

    rows.forEach(r => {
      const cat = jopCat(cell(r, cfg.i.nojop));
      const e = map.get(cat) || { good: 0, reject: 0 };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      map.set(cat, e);
    });

    const labels = [], good = [], reject = [];
    order.forEach(o => {
      const val = map.get(o);
      if (val && (val.good > 0 || val.reject > 0)) {
        labels.push(o);
        good.push(val.good);
        reject.push(val.reject);
      }
    });

    return { labels, good, reject };
  }, [rows, cfg]);

  const shiftData = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      let sh = cell(r, cfg.i.shift).toUpperCase().trim();
      if (!sh || sh === '-' || sh === 'UNDEFINED') sh = 'NON-SHIFT';
      const e = map.get(sh) || { good: 0, reject: 0 };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      map.set(sh, e);
    });

    const labels = [...map.keys()].sort();
    return {
      labels,
      good: labels.map(l => map.get(l).good),
      reject: labels.map(l => map.get(l).reject)
    };
  }, [rows, cfg]);

  const opRanking = useMemo(() => {
    const map = new Map();
    rows.forEach(r => {
      const op = cell(r, cfg.i.op).trim() || 'Unassigned';
      const e = map.get(op) || { name: op, good: 0, reject: 0, replace: 0, rowList: [] };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      e.replace += num(r[cfg.i.ganti]);
      e.rowList.push(r);
      map.set(op, e);
    });

    return [...map.values()]
      .map(o => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [rows, cfg]);

  const poRanking = useMemo(() => {
    const map = new Map();
    const poCol = cfg.i.po_helper ?? -1;

    rows.forEach(r => {
      const po = (poCol !== -1 && cell(r, poCol).trim()) || 'Tanpa PO';
      const e = map.get(po) || { name: po, good: 0, reject: 0, replace: 0, rowList: [] };
      e.good += num(r[cfg.i.baik]);
      e.reject += num(r[cfg.i.rusak]);
      e.replace += num(r[cfg.i.ganti]);
      e.rowList.push(r);
      map.set(po, e);
    });

    return [...map.values()]
      .map(o => {
        const output = o.good + o.reject;
        const lossRate = output > 0 ? (o.reject / output) * 100 : 0;
        return { ...o, output, lossRate };
      })
      .sort((a, b) => b.output - a.output);
  }, [rows, cfg]);

  const activeLeaderboardData = activeLeaderboardTab === 'OP' ? opRanking : poRanking;

  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return activeLeaderboardData;
    const q = searchQuery.toLowerCase();
    return activeLeaderboardData.filter(o => o.name.toLowerCase().includes(q));
  }, [activeLeaderboardData, searchQuery]);

  return (
    <div className="space-y-4 anim-in">
      {/* Pill Selector Sub-Tabs */}
      {onTabChange && (
        <div className="card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-slate-200 dark:border-slate-800" style={{ WebkitOverflowScrolling: 'touch' }}>
            {PROD_KEYS.map((k) => {
              const itemCfg = SHEETS[k];
              const isActive = activeKey === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onTabChange(k)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm dark:bg-gradient-to-r dark:from-cyan-500 dark:to-blue-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800'
                  }`}
                >
                  {itemCfg.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="card p-5 bg-blue-50/70 dark:bg-gradient-to-r dark:from-slate-900 dark:via-[#0e172e] dark:to-slate-900 text-slate-900 dark:text-white flex flex-wrap items-center justify-between gap-4 border border-blue-200 dark:border-cyan-500/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge bg-blue-100 text-blue-800 border-blue-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40 font-bold">ANALITIK PROSES PREPRESS</span>
            <span className="text-xs text-slate-600 dark:text-slate-300">&bull; {cfg.label} Focus Mode</span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl mt-1.5 text-slate-900 dark:text-white tracking-wide">{cfg.label} Performance & Parameter Control</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
            Audit mendalam efisiensi mesin expose/cetak, kategori JOP, performa shift, dan evaluasi performa individu Operator vs PO. Klik elemen kartu atau grafik untuk melihat detail transaksi.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider font-semibold">Rentang Periode</div>
          <div className="font-bold text-sm text-blue-600 dark:text-cyan-300 mt-0.5">{fmtPeriodRange(period?.from, period?.to)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rows.length.toLocaleString('id-ID')} Transaksi Teranalisis</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
        <button
          type="button"
          onClick={() => onOpenList?.(`Total Output ${cfg.label}`, activeKey, rows)}
          className="card p-4 border-l-4 border-l-blue-600 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">TOTAL OUTPUT</span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-slate-900 dark:text-white">{kpi.output.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{cfg.unit} diproses</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Good Output ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.baik]) > 0))}
          className="card p-4 border-l-4 border-l-emerald-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">GOOD</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-emerald-400">{kpi.good.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} lolos QC</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Reject / Rusak ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.rusak]) > 0))}
          className="card p-4 border-l-4 border-l-rose-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">REJECT</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-rose-400">{kpi.reject.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} rusak / loss</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Replace / Ganti ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.ganti]) > 0))}
          className="card p-4 border-l-4 border-l-amber-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">REPLACE</span>
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-amber-400">{kpi.replace.toLocaleString('id-ID')}</div>
          <div className="text-[10px] text-slate-400 mt-1">{cfg.unit} diproduksi ulang</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Audit Loss Rate ${cfg.label}`, activeKey, rows.filter(r => num(r[cfg.i.rusak]) > 0))}
          className="card p-4 border-l-4 border-l-purple-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">LOSS RATE</span>
            <Percent className="w-4 h-4 text-purple-400" />
          </div>
          <div className={`mt-2 font-display font-black text-2xl ${kpi.lossRate > 1.0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {kpi.lossRate.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Toleransi Max &le; 1.0%</div>
        </button>

        <button
          type="button"
          onClick={() => onOpenList?.(`Semua Data ${cfg.label}`, activeKey, rows)}
          className="card p-4 border-l-4 border-l-cyan-500 text-left cursor-pointer hover:scale-[1.02] transition"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">SCORE</span>
            <Award className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 font-display font-black text-2xl text-cyan-300">{kpi.perfScore.toFixed(0)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Indeks Kinerja (0-100)</div>
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="card-title text-slate-900 dark:text-white">Breakdown: {paramData.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Klik batang grafik untuk melihat detail transaksi</p>
            </div>
            <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 font-semibold">{paramData.labels.length} Kategori</span>
          </div>
          <div className="h-64">
            {(() => {
              const ct = getChartTheme();
              return (
                <Bar
                  data={{
                    labels: paramData.labels,
                    datasets: [
                      { label: 'Good Output', data: paramData.good, backgroundColor: ct.goodColor, borderRadius: 4 },
                      { label: 'Reject / Defect', data: paramData.reject, backgroundColor: ct.defectColor, borderRadius: 4 }
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
                      if (!els.length || paramData.colIdx === -1) return;
                      const cat = paramData.labels[els[0].index];
                      onOpenList?.(`${paramData.label}: ${cat}`, activeKey, rows.filter(r => cell(r, paramData.colIdx) === cat));
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="card-title text-slate-900 dark:text-white">Evaluasi Kategori JOP</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Klik batang grafik untuk melihat rincian pekerjaan</p>
            </div>
          </div>
          <div className="h-64">
            {(() => {
              const ct = getChartTheme();
              return (
                <Bar
                  data={{
                    labels: jopData.labels,
                    datasets: [
                      { label: 'Good Output', data: jopData.good, backgroundColor: ct.isLight ? '#4f46e5' : '#6366f1', borderRadius: 4 },
                      { label: 'Reject / Defect', data: jopData.reject, backgroundColor: ct.defectColor, borderRadius: 4 }
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
                      const cat = jopData.labels[els[0].index];
                      onOpenList?.(`Kategori JOP: ${cat}`, activeKey, rows.filter(r => jopCat(cell(r, cfg.i.nojop)) === cat));
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>

        {secondaryParamData && (
          <div className="card p-5">
            <h3 className="card-title mb-1 text-slate-900 dark:text-white">{secondaryParamData.title}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Klik batang grafik untuk melihat daftar record</p>
            <div className="h-64">
              {(() => {
                const ct = getChartTheme();
                return (
                  <Bar
                    data={{
                      labels: secondaryParamData.labels,
                      datasets: [
                        { label: 'Good Output', data: secondaryParamData.good, backgroundColor: ct.totalColor, borderRadius: 4 },
                        { label: 'Reject / Defect', data: secondaryParamData.reject, backgroundColor: ct.defectColor, borderRadius: 4 }
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
                        const cat = secondaryParamData.labels[els[0].index];
                        onOpenList?.(`${secondaryParamData.title}: ${cat}`, activeKey, rows.filter(r => cell(r, secondaryParamData.colIdx) === cat));
                      }
                    }}
                  />
                );
              })()}
            </div>
          </div>
        )}

        <div className={`card p-5 ${secondaryParamData ? '' : 'md:col-span-2'}`}>
          <h3 className="card-title mb-1 text-slate-900 dark:text-white">Performa Shift</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Klik segmen donat untuk melihat detail transaksi per shift</p>
          <div className="h-64 flex items-center justify-center">
            {(() => {
              const ct = getChartTheme();
              return (
                <Doughnut
                  data={{
                    labels: shiftData.labels,
                    datasets: [
                      {
                        data: shiftData.good,
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
                    },
                    onClick: (e, els) => {
                      if (!els.length) return;
                      const sh = shiftData.labels[els[0].index];
                      onOpenList?.(`Detail Shift: ${sh}`, activeKey, rows.filter(r => {
                        let s = cell(r, cfg.i.shift).toUpperCase().trim();
                        if (!s || s === '-' || s === 'UNDEFINED') s = 'NON-SHIFT';
                        return s === sh;
                      }));
                    }
                  }}
                />
              );
            })()}
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {activeLeaderboardTab === 'OP' ? (
                <Users className="w-5 h-5 text-cyan-400" />
              ) : (
                <Briefcase className="w-5 h-5 text-amber-400" />
              )}
              <h3 className="card-title">
                {activeLeaderboardTab === 'OP' ? 'Leaderboard Performa Operator' : 'Leaderboard Performa PO (Customer)'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">Klik baris nama untuk melihat detail seluruh transaksi individu</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => { setActiveLeaderboardTab('OP'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeLeaderboardTab === 'OP' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Operator
              </button>
              <button
                type="button"
                onClick={() => { setActiveLeaderboardTab('PO'); setSearchQuery(''); }}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeLeaderboardTab === 'PO' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                PO
              </button>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeLeaderboardTab === 'OP' ? 'Cari Operator...' : 'Cari PO...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="inp !pl-9 text-xs py-1.5 w-full"
              />
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="tbl min-w-[650px]">
            <thead>
              <tr>
                <th>Rank</th>
                <th>{activeLeaderboardTab === 'OP' ? 'Nama Operator' : 'Nama PO'}</th>
                <th>Total Output</th>
                <th>Good</th>
                <th>Reject</th>
                <th>Replace</th>
                <th>Loss Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.map((o, idx) => (
                <tr
                  key={o.name}
                  onClick={() => onOpenList?.(`Rekap Transaksi: ${o.name}`, activeKey, o.rowList)}
                  className="cursor-pointer"
                >
                  <td className="font-mono font-bold text-slate-400">#{idx + 1}</td>
                  <td className="font-semibold text-slate-100 flex items-center gap-1.5">
                    {o.name}
                    <span className="text-[10px] text-cyan-400">→</span>
                  </td>
                  <td className="font-bold text-white">{o.output.toLocaleString('id-ID')}</td>
                  <td className="text-emerald-400 font-semibold">{o.good.toLocaleString('id-ID')}</td>
                  <td className="text-rose-400 font-semibold">{o.reject.toLocaleString('id-ID')}</td>
                  <td className="text-amber-400">{o.replace.toLocaleString('id-ID')}</td>
                  <td className={`font-bold ${o.lossRate > 1.0 ? 'text-rose-400' : 'text-cyan-300'}`}>{o.lossRate.toFixed(1)}%</td>
                </tr>
              ))}
              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
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